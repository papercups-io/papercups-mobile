import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import React from 'react';
import {Text, View, Button, Platform} from 'react-native';

export const init = () => {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
};

export const Debugger = ({
  token,
  notification,
}: {
  token: string;
  notification: any;
}) => {
  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'space-around',
      }}
    >
      <Text>Your expo push token: {token}</Text>
      <View style={{alignItems: 'center', justifyContent: 'center'}}>
        <Text>
          Title: {notification && notification.request.content.title}{' '}
        </Text>
        <Text>Body: {notification && notification.request.content.body}</Text>
        <Text>
          Data:{' '}
          {notification && JSON.stringify(notification.request.content.data)}
        </Text>
      </View>
      <Button
        title="Press to Send Notification"
        onPress={async () => {
          await sendPushNotification(token);
        }}
      />
    </View>
  );
};

type ExpoNotificationMessage = {
  to?: string;
  sound?: string;
  title?: string;
  body?: string;
  data?: Record<string, any>;
};

// Can use this function below, OR use Expo's Push Notification Tool-> https://expo.dev/notifications
export async function sendPushNotification(
  token: string,
  message: ExpoNotificationMessage = {}
) {
  // TODO: replace with actual implementation (this is just for demo)
  const payload = {
    to: token,
    sound: message.sound || 'default',
    title: message.title || 'Demo title',
    body: message.body || 'Hello world!',
    data: message.data || {extra: 'goes here'},
  };
  console.log('Sending push notification:', payload);
  return fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Accept-encoding': 'gzip, deflate',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })
    .then((res) => res.json())
    .then((result) => console.log('Push notification result:', result))
    .catch((error) => console.error('Push notification error:', error));
}

export async function hasNotificationsPermission() {
  const {status: existingStatus} = await Notifications.getPermissionsAsync();

  if (existingStatus === 'granted') {
    return true;
  }

  const {status: requestedStatus} =
    await Notifications.requestPermissionsAsync();

  return requestedStatus === 'granted';
}

export async function registerForPushNotificationsAsync(): Promise<
  string | null
> {
  let token = null;

  if (Constants.isDevice) {
    const hasPermission = await hasNotificationsPermission();

    if (!hasPermission) {
      console.warn('Failed to get push token for push notification!');

      return null;
    }

    token = (await Notifications.getExpoPushTokenAsync()).data;
  } else {
    console.warn('Must use physical device for push notifications');
  }

  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  return token;
}
