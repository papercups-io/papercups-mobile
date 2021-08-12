import * as React from 'react';
import {View, Text, Image, Dimensions} from 'react-native';
import tailwind from 'tailwind-rn';

import {Attachment, Message, User} from '../../types';
import {getColorByUuid} from '../../utils';
import {getSenderIdentifier, getSenderProfilePhoto} from './support';

export const EmptyAvatar = ({style = {}}: {style?: any}) => {
  return (
    <View
      style={{
        ...tailwind(`mr-3 w-8 h-8 rounded-full items-center justify-center`),
        ...style,
      }}
    />
  );
};

export const Avatar = ({
  style = {},
  message,
}: {
  style?: any;
  message: Message;
}) => {
  const {customer_id: customerId} = message;
  const avatarUrl = getSenderProfilePhoto(message);
  const color = getColorByUuid(customerId);
  const display = getSenderIdentifier(message);

  if (avatarUrl) {
    return (
      <Image
        style={{
          ...tailwind(
            'mr-3 mb-1 w-8 h-8 rounded-full items-center justify-center'
          ),
          ...style,
        }}
        source={{
          uri: avatarUrl,
        }}
      />
    );
  }

  return (
    <View
      style={{
        ...tailwind(
          `mr-3 mb-1 w-8 h-8 bg-${color}-500 rounded-full items-center justify-center`
        ),
        ...style,
      }}
    >
      <Text style={tailwind('text-white text-base')}>
        {display.slice(0, 1).toUpperCase()}
      </Text>
    </View>
  );
};

const MessageAttachment = ({attachment}: {attachment: Attachment}) => {
  const {id, content_type: contentType, file_url: uri} = attachment;

  if (contentType.startsWith('image')) {
    // TODO: figure out best way to render image attachments
    // TODO: investigate https://github.com/huiseoul/react-native-fit-image
    return (
      <Image
        key={id}
        style={{
          ...tailwind('mt-2 bg-gray-100 rounded-lg'),
          ...{width: '80%', height: undefined, aspectRatio: 1},
        }}
        resizeMode="contain"
        source={{uri}}
      ></Image>
    );
  } else {
    // TODO: how should we render non-image attachments?

    return null;
  }
};

export const ChatMessage = ({
  item,
  currentUser,
  avatar,
  label,
  style = {},
}: {
  item: Message;
  currentUser: User | null;
  avatar: React.ReactElement;
  label?: React.ReactElement | null;
  style?: any;
}) => {
  const {body, user_id: userId, attachments = []} = item;
  const isMe = userId && currentUser?.id == userId;

  if (isMe) {
    return (
      <View style={{...tailwind('mb-2 px-4 justify-end'), ...style}}>
        <View
          style={tailwind('py-2 px-3 bg-blue-500 ml-6 rounded-lg self-end')}
        >
          <Text style={tailwind('text-white text-base')}>{body}</Text>

          {attachments.map((attachment) => (
            <MessageAttachment attachment={attachment} />
          ))}
        </View>
      </View>
    );
  }

  return (
    <View style={{...tailwind('mb-2 px-4 justify-start'), ...style}}>
      <View style={tailwind('flex-row items-end')}>
        {avatar}

        <View style={tailwind('mr-6')}>
          {label}

          <View
            style={tailwind('py-2 px-3 bg-gray-100 mr-6 rounded-lg self-start')}
          >
            <Text style={tailwind('text-base')}>{body}</Text>

            {attachments.map((attachment) => (
              <MessageAttachment attachment={attachment} />
            ))}
          </View>
        </View>
      </View>
    </View>
  );
};

export default ChatMessage;
