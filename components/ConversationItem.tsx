import React from 'react';
import {Image, Text, TouchableOpacity, View} from 'react-native';
import tailwind from 'tailwind-rn';
import {getColorByUuid} from '../utils';

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
  const body = message.body || '...';
  // const formatted = body.split('\n').join(' ');
  const formatted = body; // TODO
  const color = getColorByUuid(customerId);

  return (
    <TouchableOpacity
      activeOpacity={0.5}
      onPress={() => onSelectConversation(item)}
    >
      <View
        style={tailwind('flex-row p-3 border-b border-gray-100 items-center')}
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
            {formatted.length > 50
              ? formatted.slice(0, 40).concat('...')
              : formatted}
            {' · '}
            {'1d'}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}
