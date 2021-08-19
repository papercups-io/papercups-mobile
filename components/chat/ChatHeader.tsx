import * as React from 'react';
import {View, Text, TouchableOpacity, Image} from 'react-native';
import tailwind, {getColor} from 'tailwind-rn';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';

import {Conversation} from '../../types';
import {getColorByUuid} from '../../utils';
import {Icon} from 'react-native-elements/dist/icons/Icon';
import {formatLastActiveAt} from '../chat/support';

dayjs.extend(utc);

export const ChatHeader = ({
  conversation,
  onPressCustomer,
  onPressBack,
}: {
  conversation: Conversation;
  onPressCustomer: () => void;
  onPressBack: () => void;
}) => {
  const {customer, messages = []} = conversation;
  const {name, email, id: customerId, profile_photo_url: avatarUrl} = customer;
  const [message] = messages;
  const display = name || email || 'Anonymous User';
  const color = getColorByUuid(customerId);
  const lastSeenAt = dayjs(customer.last_seen_at);
  const messageCreatedAt = dayjs.utc(message.created_at).local();
  const lastActiveAt = messageCreatedAt.isAfter(lastSeenAt)
    ? formatLastActiveAt(messageCreatedAt)
    : formatLastActiveAt(lastSeenAt);

  return (
    <View style={tailwind('p-4 flex-row')}>
      <View style={tailwind('flex-row items-center')}>
        <TouchableOpacity style={tailwind('pr-2')} onPress={onPressBack}>
          <Icon
            name="chevron-left"
            type="feather"
            color={getColor('blue-500')}
            onPress={onPressBack}
          />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onPressCustomer}
          style={tailwind('flex-row')}
        >
          {avatarUrl ? (
            <Image
              style={{
                ...tailwind(
                  'mr-3 w-10 h-10 rounded-full items-center justify-center'
                ),
              }}
              source={{
                uri: avatarUrl,
              }}
            />
          ) : (
            <View
              style={{
                ...tailwind(
                  `mr-3 w-10 h-10 bg-${color}-500 rounded-full items-center justify-center`
                ),
              }}
            >
              <Text style={tailwind('text-white text-base')}>
                {display.slice(0, 1).toUpperCase()}
              </Text>
            </View>
          )}

          <View>
            <Text style={tailwind('text-base font-medium')}>{display}</Text>
            <Text style={tailwind('text-gray-500')}>{lastActiveAt}</Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default ChatHeader;
