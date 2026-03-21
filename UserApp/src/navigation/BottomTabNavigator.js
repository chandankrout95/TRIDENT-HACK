import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/Ionicons';
import HomeScreen from '../features/home/HomeScreen';
import ConversationListScreen from '../features/chat/ConversationListScreen';
import PersonaSelectionScreen from '../features/chat/PersonaSelectionScreen';
import SessionsScreen from '../features/sessions/SessionsScreen';
import ExercisesScreen from '../features/exercises/ExercisesScreen';

const Tab = createBottomTabNavigator();

const BottomTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'Home') iconName = focused ? 'home' : 'home-outline';
          else if (route.name === 'Messages') iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
          else if (route.name === 'Sessions') iconName = focused ? 'calendar' : 'calendar-outline';
          else if (route.name === 'AI Bot') iconName = focused ? 'sparkles' : 'sparkles-outline';
          else if (route.name === 'Exercises') iconName = focused ? 'barbell' : 'barbell-outline';
          else if (route.name === 'Profile') iconName = focused ? 'person' : 'person-outline';
          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#2563EB',
        tabBarInactiveTintColor: '#6B7280',
        tabBarStyle: { paddingBottom: 5, height: 60 },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Messages" component={ConversationListScreen} />
      <Tab.Screen name="Sessions" component={SessionsScreen} />
      <Tab.Screen name="AI Bot" component={PersonaSelectionScreen} />
      <Tab.Screen name="Exercises" component={ExercisesScreen} />
    </Tab.Navigator>
  );
};

export default BottomTabNavigator;
