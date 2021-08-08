import * as React from 'react';
import {StackScreenProps} from '@react-navigation/stack';
import {
  FlatList,
  Text,
  SafeAreaView,
  View,
  ActivityIndicator,
} from 'react-native';
import tailwind from 'tailwind-rn';

import ConversationItem from '../components/ConversationItem';
import {RootStackParamList} from '../types';
import {useConversations} from '../components/ConversationsProvider';

type Props = StackScreenProps<RootStackParamList, 'Root'> & {};

export default function ConversationsScreen({navigation}: Props) {
  const {
    fetchConversations,
    pagination,
    conversations = [],
  } = useConversations();

  const handleSelectConversation = (item: any) => {
    const {id: conversationId, messages = []} = item;

    navigation.navigate('Chat', {conversationId, messages});
  };

  const handleLoadMoreConversations = async () => {
    await fetchConversations({status: 'open', after: pagination.next});
  };

  const renderItem = ({item}: any) => {
    return (
      <ConversationItem
        item={item}
        onSelectConversation={handleSelectConversation}
      />
    );
  };

  console.log('Rendering conversations:', conversations.length);

  return (
    <SafeAreaView style={tailwind('h-full bg-white')}>
      <View style={tailwind('p-4 items-center')}>
        <Text style={tailwind('font-bold text-lg')}>Conversations</Text>
      </View>

      <FlatList
        keyboardShouldPersistTaps="handled"
        data={conversations}
        renderItem={renderItem}
        onEndReached={handleLoadMoreConversations}
        onEndReachedThreshold={0.01}
        onMomentumScrollBegin={(...args) => {
          console.log('onMomentumScrollBegin');
        }}
        keyExtractor={(item, index) => {
          return item.id;
        }}
        ListFooterComponent={
          <View style={tailwind('p-4')}>
            <ActivityIndicator />
          </View>
        }
      />
    </SafeAreaView>
  );
}
