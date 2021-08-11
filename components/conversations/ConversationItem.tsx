import React from 'react';
import {
  Image,
  Text,
  TouchableOpacity,
  TouchableHighlight,
  View,
} from 'react-native';
import tailwind from 'tailwind-rn';

import {getColorByUuid} from '../../utils';
import {formatLastSentAt} from './support';

type Props = {
  item: any;
  onSelectConversation: (item: any) => void;
};

export default function ConversationItem({item, onSelectConversation}: Props) {
  const {read, customer = {}, messages = []} = item;
  const {id: customerId, name, email, profile_photo_url: avatarUrl} = customer;
  const display = name || email || 'Anonymous User';
  // We order messages in reverse, so the latest is first
  const [message] = messages;
  const {body, created_at: timestamp} = message;
  const text = body || '...';
  const lastSentAt = formatLastSentAt(timestamp);
  const formatted = text
    .split('\n')
    .map((str: string) => str.trim())
    .filter((str: string) => str.length > 0)
    .join(' ');
  const color = getColorByUuid(customerId);

  return (
    <TouchableHighlight onPress={() => onSelectConversation(item)}>
      <View
        style={tailwind(
          'flex-row p-3 border-b border-gray-100 items-center bg-white'
        )}
      >
        {avatarUrl ? (
          <Image
            style={tailwind(
              'mr-3 w-10 h-10 rounded-full items-center justify-center'
            )}
            source={{
              uri: avatarUrl,
            }}
          />
        ) : (
          <View
            style={tailwind(
              `mr-3 w-10 h-10 bg-${color}-500 rounded-full items-center justify-center`
            )}
          >
            <Text style={tailwind('text-white text-base')}>
              {display.slice(0, 1).toUpperCase()}
            </Text>
          </View>
        )}
        <View>
          <Text style={tailwind(`mb-1 text-base ${read ? '' : 'font-bold'}`)}>
            {display}
          </Text>
          <Text
            style={tailwind(read ? 'text-gray-500' : 'text-gray-700 font-bold')}
          >
            {formatted.length > 40
              ? formatted.slice(0, 32).concat('...')
              : formatted}
            {' · '}
            {lastSentAt}
          </Text>
        </View>
      </View>
    </TouchableHighlight>
  );
}
