/**
 * Learn more about deep linking with React Navigation
 * https://reactnavigation.org/docs/deep-linking
 * https://reactnavigation.org/docs/configuring-links
 */

import * as Linking from 'expo-linking';
import * as Notifications from 'expo-notifications';

export default {
  prefixes: [Linking.makeUrl('/')],
  config: {
    screens: {
      Login: 'login',
      Conversations: 'conversations',
      Chat: 'messages/:conversationId',
      NotFound: '*',
    },
  },
  async getInitialURL() {
    // Check if app was opened from a deep link
    const initial = await Linking.getInitialURL();

    if (initial) {
      return initial;
    }

    // Handle URL from Expo push notifications
    const response = await Notifications.getLastNotificationResponseAsync();
    const url = response?.notification.request.content.data.url;

    if (url && typeof url === 'string') {
      return Linking.makeUrl('/') + url;
    } else {
      return null;
    }
  },
  subscribe(listener: (url: string) => void) {
    const onReceiveURL = ({url}: {url: string}) => {
      return listener(url);
    };

    // Listen to incoming links from deep linking
    Linking.addEventListener('url', onReceiveURL);

    // Listen to Expo push notifications
    const subscription = Notifications.addNotificationResponseReceivedListener(
      (response: Notifications.NotificationResponse) => {
        const url = response.notification.request.content.data.url;

        if (url && typeof url === 'string') {
          const formatted = Linking.makeUrl('/') + url;

          listener(formatted);
        }
      }
    );

    return () => {
      // Clean up the event listeners
      Linking.removeEventListener('url', onReceiveURL);
      subscription.remove();
    };
  },
};
