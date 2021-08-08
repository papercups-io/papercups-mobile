/**
 * Learn more about createBottomTabNavigator:
 * https://reactnavigation.org/docs/bottom-tab-navigator
 */

import {Ionicons} from '@expo/vector-icons';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {createStackNavigator} from '@react-navigation/stack';
import * as React from 'react';

import Colors from '../constants/Colors';
import useColorScheme from '../hooks/useColorScheme';
import LoginScreen from '../screens/LoginScreen';
import ConversationsScreen from '../screens/ConversationsScreen';
import ChatScreen from '../screens/ChatScreen';
import {
  BottomTabParamList,
  LoginParamList,
  ConversationsParamList,
  ChatParamList,
} from '../types';

const BottomTab = createBottomTabNavigator<BottomTabParamList>();

export default function BottomTabNavigator() {
  const colorScheme = useColorScheme();

  return (
    <BottomTab.Navigator
      initialRouteName="Login"
      tabBarOptions={{activeTintColor: Colors[colorScheme].tint}}
    >
      <BottomTab.Screen
        name="Login"
        component={LoginNavigator}
        options={{
          tabBarIcon: ({color}) => <TabBarIcon name="ios-code" color={color} />,
        }}
      />
      <BottomTab.Screen
        name="Conversations"
        component={ConversationsNavigator}
        options={{
          tabBarIcon: ({color}) => <TabBarIcon name="ios-code" color={color} />,
        }}
      />
    </BottomTab.Navigator>
  );
}

// You can explore the built-in icon families and icons on the web at:
// https://icons.expo.fyi/
function TabBarIcon(props: {
  name: React.ComponentProps<typeof Ionicons>['name'];
  color: string;
}) {
  return <Ionicons size={30} style={{marginBottom: -3}} {...props} />;
}

// Each tab has its own navigation stack, you can read more about this pattern here:
// https://reactnavigation.org/docs/tab-based-navigation#a-stack-navigator-for-each-tab
const LoginStack = createStackNavigator<LoginParamList>();

function LoginNavigator() {
  return (
    <LoginStack.Navigator>
      <LoginStack.Screen
        name="LoginScreen"
        component={LoginScreen}
        options={{headerTitle: 'Log in'}}
      />
    </LoginStack.Navigator>
  );
}

const ConversationsStack = createStackNavigator<ConversationsParamList>();

function ConversationsNavigator() {
  return (
    <ConversationsStack.Navigator>
      <ConversationsStack.Screen
        name="ConversationsScreen"
        component={ConversationsScreen}
        options={{headerTitle: 'Conversations'}}
      />
    </ConversationsStack.Navigator>
  );
}
