import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import DashboardScreen from '../screens/DashboardScreen';
import BabyListScreen from '../screens/BabyListScreen';
import BabyDetailScreen from '../screens/BabyDetailScreen';
import SettingsScreen from '../screens/SettingsScreen';
import AddNutritionScreen from '../screens/AddNutritionScreen';
import CreateFeedTemplateScreen from '../screens/CreateFeedTemplateScreen';
import SetTargetValuesScreen from '../screens/SetTargetValuesScreen';
import AddBabyScreen from '../screens/AddBabyScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function BabyStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="BabyList" component={BabyListScreen} options={{ title: 'Babies' }} />
      <Stack.Screen name="BabyDetail" component={BabyDetailScreen} options={{ title: 'Baby Details' }} />
      <Stack.Screen name="AddNutrition" component={AddNutritionScreen} options={{ title: 'Add Nutrition Log' }} />
      <Stack.Screen name="AddBaby" component={AddBabyScreen} options={{ title: 'Add New Patient' }} />
    </Stack.Navigator>
  );
}

function SettingsStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="SettingsMain" component={SettingsScreen} options={{ title: 'Settings' }} />
      <Stack.Screen name="CreateFeedTemplate" component={CreateFeedTemplateScreen} options={{ title: 'Create Template' }} />
      <Stack.Screen name="SetTargetValues" component={SetTargetValuesScreen} options={{ title: 'Set Targets' }} />
    </Stack.Navigator>
  );
}

export default function MainNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#0056b3',
        tabBarInactiveTintColor: 'gray',
      }}
    >
      <Tab.Screen name="Home" component={DashboardScreen} />
      <Tab.Screen name="Babies" component={BabyStack} options={{ headerShown: false }} />
      <Tab.Screen name="Settings" component={SettingsStack} options={{ headerShown: false }} />
    </Tab.Navigator>
  );
}
