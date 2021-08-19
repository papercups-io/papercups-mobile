/**
 * Learn more about deep linking with React Navigation
 * https://reactnavigation.org/docs/deep-linking
 * https://reactnavigation.org/docs/configuring-links
 */

import * as Linking from 'expo-linking';
import * as Notifications from 'expo-notifications';

const generateConversationUrl = (conversationId: string) => {
  return `${Linking.makeUrl('/')}messages/${conversationId}`;
};

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
    // First, you may want to do the default deep link handling
    // Check if app was opened from a deep link
    const initial = await Linking.getInitialURL();

    if (initial) {
      return initial;
    }

    // Handle URL from expo push notifications
    const response = await Notifications.getLastNotificationResponseAsync();
    const data = response?.notification.request.content.data;
    const conversationId = data && data.conversation_id;

    if (conversationId && typeof conversationId === 'string') {
      return generateConversationUrl(conversationId);
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

    // Listen to expo push notifications
    const subscription = Notifications.addNotificationResponseReceivedListener(
      (response: Notifications.NotificationResponse) => {
        // Any custom logic to see whether the URL needs to be handled
        // ...

        const data = response.notification.request.content.data;
        const conversationId = data && data.conversation_id;

        // Let React Navigation handle the URL
        if (conversationId && typeof conversationId === 'string') {
          const url = generateConversationUrl(conversationId);

          listener(url);
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
