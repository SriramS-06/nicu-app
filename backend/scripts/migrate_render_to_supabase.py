"""Copy data from an existing Postgres database into a new Supabase database.

Usage:
  python scripts/migrate_render_to_supabase.py --source "<RENDER_DATABASE_URL>" --target "<SUPABASE_DATABASE_URL>"

You can also set:
  SOURCE_DATABASE_URL
  TARGET_DATABASE_URL
"""

from __future__ import annotations

import argparse
import os
import sys
from pathlib import Path
from typing import Iterable

from sqlalchemy import create_engine, text
from sqlalchemy.engine import Engine
from sqlalchemy.exc import SQLAlchemyError

SCRIPT_DIR = Path(__file__).resolve().parent
BACKEND_DIR = SCRIPT_DIR.parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from app import models  # noqa: F401  # Ensure all ORM tables are registered on Base.metadata
from app.db import Base


TABLE_ORDER = [
    "users",
    "babies",
    "feed_templates",
    "target_settings",
    "nutrition_logs",
]

TABLE_NULL_DEFAULTS = {
    "target_settings": {
        "dha_per_kg": 0.0,
        "vitamin_e_per_kg": 0.0,
    },
    "feed_templates": {
        "dha": 0.0,
        "vitamin_e": 0.0,
    },
    "nutrition_logs": {
        "dha": 0.0,
        "vitamin_e": 0.0,
    },
}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Migrate Render Postgres data to Supabase.")
    parser.add_argument("--source", dest="source_database_url", help="Render Postgres DATABASE_URL")
    parser.add_argument("--target", dest="target_database_url", help="Supabase Postgres DATABASE_URL")
    return parser.parse_args()


def get_database_url(arg_value: str | None, env_name: str) -> str:
    value = arg_value or os.getenv(env_name)
    if not value:
        raise SystemExit(f"Missing {env_name}. Pass --{env_name.lower().replace('_database_url', '')} or set {env_name}.")
    return value


def create_pg_engine(database_url: str) -> Engine:
    return create_engine(database_url, future=True)


def truncate_target(engine: Engine) -> None:
    table_list = ", ".join(TABLE_ORDER)
    sql = f"TRUNCATE TABLE {table_list} RESTART IDENTITY CASCADE"
    with engine.begin() as conn:
        conn.execute(text(sql))


def copy_table(source: Engine, target: Engine, table_name: str) -> int:
    table = Base.metadata.tables[table_name]

    with source.connect() as source_conn:
        rows = source_conn.execute(table.select()).mappings().all()

    if not rows:
        return 0

    payload = []
    for row in rows:
        record = dict(row)
        for column_name, default_value in TABLE_NULL_DEFAULTS.get(table_name, {}).items():
            if record.get(column_name) is None:
                record[column_name] = default_value
        payload.append(record)
    with target.begin() as target_conn:
        target_conn.execute(table.insert(), payload)

    return len(payload)


def reset_identity(engine: Engine, table_name: str) -> None:
    with engine.begin() as conn:
        result = conn.execute(text(f"SELECT COALESCE(MAX(id), 0) FROM {table_name}"))
        max_id = result.scalar_one()

        sequence_name = conn.execute(
            text("SELECT pg_get_serial_sequence(:table_name, 'id')"),
            {"table_name": table_name},
        ).scalar_one()

        if sequence_name is None:
            return

        if max_id and max_id > 0:
            conn.execute(text("SELECT setval(:sequence_name, :next_value, true)"), {
                "sequence_name": sequence_name,
                "next_value": max_id,
            })
        else:
            conn.execute(text("SELECT setval(:sequence_name, 1, false)"), {
                "sequence_name": sequence_name,
            })


def row_counts(engine: Engine, table_names: Iterable[str]) -> dict[str, int]:
    counts: dict[str, int] = {}
    with engine.connect() as conn:
        for table_name in table_names:
            counts[table_name] = conn.execute(text(f"SELECT COUNT(*) FROM {table_name}")).scalar_one()
    return counts


def main() -> int:
    args = parse_args()
    source_url = get_database_url(args.source_database_url, "SOURCE_DATABASE_URL")
    target_url = get_database_url(args.target_database_url, "TARGET_DATABASE_URL")

    source_engine = create_pg_engine(source_url)
    target_engine = create_pg_engine(target_url)

    try:
        Base.metadata.create_all(bind=target_engine)

        print("Target tables ready.")
        print("Truncating target tables...")
        truncate_target(target_engine)

        print("Copying data...")
        for table_name in TABLE_ORDER:
            copied = copy_table(source_engine, target_engine, table_name)
            print(f"  {table_name}: {copied} rows")

        print("Resetting sequences...")
        for table_name in TABLE_ORDER:
            reset_identity(target_engine, table_name)

        print("Verifying counts...")
        source_counts = row_counts(source_engine, TABLE_ORDER)
        target_counts = row_counts(target_engine, TABLE_ORDER)

        print("Source counts:", source_counts)
        print("Target counts:", target_counts)

        if source_counts != target_counts:
            print("Counts do not match. Review the output before switching DATABASE_URL.", file=sys.stderr)
            return 2

        print("Migration completed successfully.")
        return 0
    except SQLAlchemyError as exc:
        print(f"Migration failed: {exc}", file=sys.stderr)
        return 1
    finally:
        source_engine.dispose()
        target_engine.dispose()


if __name__ == "__main__":
    raise SystemExit(main())
