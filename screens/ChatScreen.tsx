import * as React from 'react';
import {StackScreenProps} from '@react-navigation/stack';
import {
  View,
  Text,
  StyleSheet,
  SectionList,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Image,
} from 'react-native';
import tailwind, {getColor} from 'tailwind-rn';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';

import {
  Conversation,
  Customer,
  Message,
  RootStackParamList,
  User,
} from '../types';
import {useConversations} from '../components/ConversationsProvider';
import {
  getColorByUuid,
  getSenderIdentifier,
  getSenderProfilePhoto,
} from '../utils';
import {Icon} from 'react-native-elements/dist/icons/Icon';

dayjs.extend(utc);

const hasSameSender = (a: Message, b: Message) => {
  if (a.user_id && b.user_id) {
    return a.user_id === b.user_id;
  } else if (a.customer_id && b.customer_id) {
    return a.customer_id === b.customer_id;
  } else {
    return false;
  }
};

const groupMembersById = (messages: Array<Message>) => {
  return messages.reduce((acc, message) => {
    const {user, customer} = message;

    if (user && user.id) {
      return {...acc, [`user:${user.id}`]: user};
    } else if (customer && customer.id) {
      return {...acc, [`customer:${customer.id}`]: customer};
    } else {
      return acc;
    }
  }, {} as {[id: string]: User | Customer});
};

const getGroupMembers = (messages: Array<Message>) => {
  const grouped = groupMembersById(messages);

  return Object.keys(grouped).map((id) => {
    return grouped[id];
  });
};

const groupMessagesByDate = (messages: Array<Message>) => {
  return messages.reduce((acc, message) => {
    const {created_at: date} = message;
    const isToday = dayjs.utc(date).isAfter(dayjs().startOf('day'));

    if (isToday) {
      return {...acc, Today: (acc['Today'] || []).concat(message)};
    } else {
      const key = dayjs.utc(date).local().format('MMM D');

      return {...acc, [key]: (acc[key] || []).concat(message)};
    }
  }, {} as {[date: string]: Array<Message>});
};

const formatLastActiveAt = (date: dayjs.Dayjs) => {
  const today = dayjs();
  const yesterday = today.subtract(1, 'day');

  if (date.isAfter(today.startOf('day'))) {
    return 'Last seen today';
  } else if (
    date.isAfter(yesterday.startOf('day')) &&
    date.isBefore(yesterday.endOf('day'))
  ) {
    return 'Last seen yesterday';
  } else {
    const hours = today.diff(date, 'hours');
    const days = Math.floor(hours / 24);

    return `Last seen ${days}d ago`;
  }
};

const EmptyAvatar = ({style = {}}: {style?: any}) => {
  return (
    <View
      style={{
        ...tailwind(`mr-3 w-8 h-8 rounded-full items-center justify-center`),
        ...style,
      }}
    />
  );
};

const Avatar = ({style = {}, message}: {style?: any; message: Message}) => {
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

const ChatMessage = ({
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
  const {body, user_id: userId} = item;
  const isMe = userId && currentUser?.id == userId;

  if (isMe) {
    return (
      <View style={{...tailwind('mb-2 px-4 justify-end'), ...style}}>
        <View
          style={tailwind('py-2 px-3 bg-blue-500 ml-6 rounded-lg self-end')}
        >
          <Text style={tailwind('text-white text-base')}>{body}</Text>
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
          </View>
        </View>
      </View>
    </View>
  );
};

const ChatHeader = ({
  conversation,
  onPressBack,
}: {
  conversation: Conversation;
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
      </View>
    </View>
  );
};

const ChatFooter = ({
  onSendMessage,
}: {
  onSendMessage: (message: string) => void;
}) => {
  const [message, setNewMessage] = React.useState('');

  const handleSendMessage = () => {
    onSendMessage(message);
    setNewMessage('');
  };

  return (
    <View style={tailwind('px-4 pb-4 pt-3 flex-row items-end')}>
      <TextInput
        style={{
          ...tailwind('p-3 rounded-xl border-gray-200 bg-gray-50 flex-1'),
          borderWidth: StyleSheet.hairlineWidth,
        }}
        multiline
        placeholder="Send a message..."
        value={message}
        onChangeText={setNewMessage}
      />

      <TouchableOpacity
        style={{
          ...tailwind(
            'border ml-3 py-3 px-5 border-gray-100 rounded-xl items-center'
          ),
        }}
        activeOpacity={0.4}
        onPress={handleSendMessage}
      >
        <Text style={tailwind(`text-${message ? 'blue' : 'gray'}-500`)}>
          Send
        </Text>
      </TouchableOpacity>
    </View>
  );
};

type Props = StackScreenProps<RootStackParamList, 'Chat'> & {};

export default function ChatScreen({route, navigation}: Props) {
  const {
    currentUser,
    getConversationById,
    getMessagesByConversationId,
    markConversationAsRead,
    sendNewMessage,
  } = useConversations();
  const {conversationId} = route.params;
  const conversation = getConversationById(conversationId);
  const messages = getMessagesByConversationId(conversationId);
  const members = getGroupMembers(messages);
  const grouped = groupMessagesByDate(messages);
  const sections = Object.keys(grouped).map((date) => {
    return {date, data: grouped[date]};
  });

  React.useEffect(() => {
    const conversation = getConversationById(conversationId);
    const latest = messages[messages.length - 1];

    if (!conversation || !latest) {
      return;
    }

    if (!conversation.read && !!latest.customer) {
      return markConversationAsRead(conversationId);
    }
  }, [messages.length]);

  const handleSendMessage = (message: string) => {
    return sendNewMessage({body: message, conversation_id: conversationId});
  };

  const handlePressBack = () => {
    navigation.navigate('Conversations');
  };

  const renderItem = ({item, section, index}: any) => {
    const {data = []} = section;
    const next = data[index - 1];
    const prev = data[index + 1];
    const isPrevFromSameSender = !!prev && hasSameSender(item, prev);
    const isNextFromSameSender = !!next && hasSameSender(item, next);
    const isLastInGroup = !isNextFromSameSender;
    const isGroupChat = members.length > 2;

    return (
      <ChatMessage
        item={item}
        style={tailwind(isLastInGroup ? 'mb-4' : 'mb-2')}
        currentUser={currentUser}
        avatar={isLastInGroup ? <Avatar message={item} /> : <EmptyAvatar />}
        label={
          !isPrevFromSameSender && isGroupChat ? (
            <Text
              style={tailwind(
                `ml-1 mt-${index === 0 ? 0 : 3} mb-1 text-gray-400 text-xs`
              )}
            >
              {getSenderIdentifier(item)}
            </Text>
          ) : null
        }
      />
    );
  };

  return (
    <>
      {/* TODO: not sure the best way to have the top fill with the correct background... */}
      <SafeAreaView style={tailwind('flex-none bg-gray-50')}>
        <ChatHeader conversation={conversation} onPressBack={handlePressBack} />
      </SafeAreaView>
      <SafeAreaView style={tailwind('flex-1 bg-white')}>
        <View style={tailwind('flex-1')}>
          <SectionList
            // style={tailwind('py-3')}
            contentContainerStyle={tailwind('py-3')}
            keyboardShouldPersistTaps="never"
            scrollEventThrottle={16}
            inverted
            onEndReached={() => console.log('onEndReached')}
            onEndReachedThreshold={0.5}
            onMomentumScrollBegin={() => {
              console.log('onMomentumScrollBegin');
            }}
            sections={sections}
            keyExtractor={(item, index) => {
              return item.id;
            }}
            renderItem={renderItem}
            renderSectionFooter={({section: {date}}) => (
              <View style={tailwind('mt-3 mb-5 items-center')}>
                <Text style={tailwind('text-gray-500')}>{date}</Text>
              </View>
            )}
          />
        </View>

        <ChatFooter onSendMessage={handleSendMessage} />
      </SafeAreaView>
    </>
  );
}
