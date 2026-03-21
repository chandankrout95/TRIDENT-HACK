import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import HomeScreen from '../features/home/HomeScreen';
import AppointmentScreen from '../features/appointments/AppointmentScreen';
import ConversationListScreen from '../features/chat/ConversationListScreen';
import ProfileScreen from '../features/profile/ProfileScreen';
import EarningsScreen from '../features/earnings/EarningsScreen';

const Tab = createBottomTabNavigator();

const BottomTabNavigator = () => {
  return (
    <Tab.Navigator 
      screenOptions={({ route }) => ({ 
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'Dashboard') iconName = focused ? 'view-dashboard' : 'view-dashboard-outline';
          else if (route.name === 'Appointments') iconName = focused ? 'calendar-check' : 'calendar-check-outline';
          else if (route.name === 'Earnings') iconName = focused ? 'wallet' : 'wallet-outline';
          else if (route.name === 'Messages') iconName = focused ? 'message-text' : 'message-text-outline';
          else if (route.name === 'Profile') iconName = focused ? 'account' : 'account-outline';
          
          try {
            return <Icon name={iconName} size={size + 4} color={color} />;
          } catch (e) {
            return null;
          }
        },
        tabBarActiveTintColor: '#10B981',
        tabBarInactiveTintColor: '#94A3B8',
        tabBarStyle: { 
          paddingBottom: 10, 
          height: 75,
          backgroundColor: '#FFF',
          borderTopWidth: 1,
          borderTopColor: '#F3F4F6',
          elevation: 0,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.05,
          shadowRadius: 10
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '700', marginBottom: 5 }
      })}
    >
      <Tab.Screen name="Dashboard" component={HomeScreen} />
      <Tab.Screen name="Appointments" component={AppointmentScreen} />
      <Tab.Screen name="Earnings" component={EarningsScreen} />
      <Tab.Screen name="Messages" component={ConversationListScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
};

export default BottomTabNavigator;
