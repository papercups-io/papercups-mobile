import * as React from 'react';
import {StackScreenProps} from '@react-navigation/stack';
import {View, Text, SectionList, SafeAreaView} from 'react-native';
import tailwind from 'tailwind-rn';

import {RootStackParamList} from '../types';
import {useConversations} from '../components/conversations/ConversationsProvider';
import {
  getGroupMembers,
  getSenderIdentifier,
  groupMessagesByDate,
  hasSameSender,
} from '../components/chat/support';
import ChatHeader from '../components/chat/ChatHeader';
import {ChatMessage, Avatar, EmptyAvatar} from '../components/chat/ChatMessage';
import ChatFooter from '../components/chat/ChatFooter';
import {sleep} from '../utils';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

type Props = StackScreenProps<RootStackParamList, 'Chat'> & {};

export default function ChatScreen({route, navigation}: Props) {
  const {
    currentUser,
    reconnect,
    fetchConversations,
    getConversationById,
    getMessagesByConversationId,
    markConversationAsRead,
    sendNewMessage,
  } = useConversations();
  const insets = useSafeAreaInsets();
  const [isRefreshing, setRefreshing] = React.useState(false);
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

  const handleRefreshChat = async () => {
    setRefreshing(true);

    await fetchConversations({status: 'open'});
    await reconnect();
    await sleep(400);

    setRefreshing(false);
  };

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
      {conversation && (
        <SafeAreaView
          style={{
            ...tailwind('flex-none bg-gray-50'),
            paddingTop: insets.top,
            paddingBottom: insets.bottom,
          }}
        >
          <ChatHeader
            conversation={conversation}
            onPressBack={handlePressBack}
          />
        </SafeAreaView>
      )}
      <SafeAreaView style={tailwind('flex-1 bg-white')}>
        <View style={tailwind('flex-1')}>
          <SectionList
            refreshing={isRefreshing}
            onRefresh={handleRefreshChat}
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
