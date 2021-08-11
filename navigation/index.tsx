/**
 * If you are not familiar with React Navigation, check out the "Fundamentals" guide:
 * https://reactnavigation.org/docs/getting-started
 *
 */
import {
  NavigationContainer,
  DefaultTheme,
  DarkTheme,
} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';
import * as React from 'react';
import {ColorSchemeName, KeyboardAvoidingView, Platform} from 'react-native';
import tailwind from 'tailwind-rn';

import {RootStackParamList} from '../types';
import * as API from '../api';
import NotFoundScreen from '../screens/NotFoundScreen';
import ChatScreen from '../screens/ChatScreen';
import LinkingConfiguration from './LinkingConfiguration';
import ConversationsScreen from '../screens/ConversationsScreen';
import LoginScreen from '../screens/LoginScreen';
import {useAuth} from '../components/AuthProvider';
import SocketProvider, {SocketContext} from '../components/SocketProvider';
import {ConversationsProvider} from '../components/conversations/ConversationsProvider';
import {AppState} from 'react-native';

export default function Navigation({
  colorScheme,
}: {
  colorScheme: ColorSchemeName;
}) {
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={tailwind('h-full')}
    >
      <NavigationContainer
        linking={LinkingConfiguration}
        theme={colorScheme === 'dark' ? DarkTheme : DefaultTheme}
      >
        <RootNavigator />
      </NavigationContainer>
    </KeyboardAvoidingView>
  );
}

// A root stack navigator is often used for displaying modals on top of all other content
// Read more here: https://reactnavigation.org/docs/modal
const Stack = createStackNavigator<RootStackParamList>();

function RootNavigator() {
  const auth = useAuth();

  // Attempt to auto-refresh the access token whenever the state becomes active again
  const onAppStateChange = async (state: string) => {
    if (state !== 'active') {
      return;
    }

    const token = await API.getRefreshToken();

    if (token) {
      await auth.refresh(token);
    }
  };

  React.useEffect(() => {
    AppState.addEventListener('change', onAppStateChange);

    return () => {
      AppState.removeEventListener('change', onAppStateChange);
    };
  }, []);

  if (auth.loading) {
    // TODO: fix splash screen
    return null;
  }

  if (!auth.isAuthenticated) {
    return (
      <Stack.Navigator screenOptions={{headerShown: false}}>
        <Stack.Screen name="Login" component={LoginScreen} />

        <Stack.Screen
          name="NotFound"
          component={NotFoundScreen}
          options={{title: 'Oops!'}}
        />
      </Stack.Navigator>
    );
  }

  return (
    <SocketProvider refresh={auth.refresh}>
      <SocketContext.Consumer>
        {({socket}) => {
          return (
            <ConversationsProvider socket={socket}>
              <Stack.Navigator screenOptions={{headerShown: false}}>
                <Stack.Screen
                  name="Conversations"
                  component={ConversationsScreen}
                />
                <Stack.Screen name="Chat" component={ChatScreen} />

                <Stack.Screen
                  name="NotFound"
                  component={NotFoundScreen}
                  options={{title: 'Oops!'}}
                />
              </Stack.Navigator>
            </ConversationsProvider>
          );
        }}
      </SocketContext.Consumer>
    </SocketProvider>
  );
}
