@echo off
echo Starting Expo with Node polyfills using NODE_OPTIONS...
set NODE_OPTIONS=--require "./polyfill.js"
npx expo start --web
