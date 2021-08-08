import * as React from 'react';
import {StackScreenProps} from '@react-navigation/stack';
import {StyleSheet, FlatList, Text, SafeAreaView} from 'react-native';
import tailwind from 'tailwind-rn';

import * as API from '../api';
import ConversationItem from '../components/ConversationItem';
import {RootStackParamList} from '../types';
import {useConversations} from '../components/ConversationsProvider';

type Props = StackScreenProps<RootStackParamList, 'Root'> & {};

export default function ConversationsScreen({navigation}: Props) {
  const {conversations = []} = useConversations();

  const handleSelectConversation = (item: any) => {
    const {id: conversationId, messages = []} = item;

    navigation.navigate('Chat', {conversationId, messages});
  };

  const renderItem = ({item}: any) => {
    return (
      <ConversationItem
        item={item}
        onSelectConversation={handleSelectConversation}
      />
    );
  };

  return (
    <SafeAreaView style={tailwind('h-full bg-white')}>
      <FlatList
        keyboardShouldPersistTaps="handled"
        data={conversations}
        renderItem={renderItem}
        onEndReached={(...args) => console.log('onEndReached', ...args)}
        onEndReachedThreshold={0.01}
        onMomentumScrollBegin={(...args) => {
          console.log('onMomentumScrollBegin', ...args);
        }}
        keyExtractor={(item, index) => {
          return item.id;
        }}
      />
    </SafeAreaView>
  );
}
