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
  Image,
} from 'react-native';
import tailwind from 'tailwind-rn';

import {Message, RootStackParamList} from '../types';
import {useConversations} from '../components/ConversationsProvider';

// TODO: just copy fb messenger UI
const ChatMessage = ({item, currentUser}: any) => {
  const {body, customer_id: customerId, user_id: userId} = item;
  // TODO: user_id needs to match current user id
  const isMe = userId && currentUser?.id == userId;

  if (isMe) {
    return (
      <View style={tailwind('mb-3 px-3 justify-end')}>
        <View style={tailwind('p-3 bg-blue-400 ml-6 rounded-lg self-end')}>
          <Text style={tailwind('text-white')}>{body}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={tailwind('mb-3 px-3 justify-start')}>
      <View style={tailwind('p-3 bg-gray-100 mr-6 rounded-lg self-start')}>
        <Text>{body}</Text>
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
    <View style={tailwind('p-4 flex-row items-end')}>
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

export default function ChatScreen({route}: Props) {
  const {
    currentUser,
    getConversationById,
    getMessagesByConversationId,
    markConversationAsRead,
    sendNewMessage,
  } = useConversations();
  const {conversationId} = route.params;
  const messages = getMessagesByConversationId(conversationId);

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

  const renderItem = ({item}: any) => {
    return <ChatMessage item={item} currentUser={currentUser} />;
  };

  return (
    <SafeAreaView style={tailwind('h-full bg-white')}>
      <View style={tailwind('p-3 flex-1')}>
        <SectionList
          keyboardShouldPersistTaps="never"
          scrollEventThrottle={16}
          inverted
          onEndReached={() => console.log('onEndReached')}
          onEndReachedThreshold={0.5}
          onMomentumScrollBegin={() => {
            console.log('onMomentumScrollBegin');
          }}
          sections={[{date: 'Today', data: messages}]}
          keyExtractor={(item, index) => {
            return item.id;
          }}
          renderItem={renderItem}
        />
      </View>
      <ChatFooter onSendMessage={handleSendMessage} />
    </SafeAreaView>
  );
}
