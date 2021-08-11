import * as React from 'react';
import {StackScreenProps} from '@react-navigation/stack';
import {
  Text,
  SafeAreaView,
  View,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import {SwipeListView} from 'react-native-swipe-list-view';
import {Icon} from 'react-native-elements/dist/icons/Icon';
import tailwind from 'tailwind-rn';

import {RootStackParamList} from '../types';
import ConversationItem from '../components/conversations/ConversationItem';
import {useConversations} from '../components/conversations/ConversationsProvider';
import {sleep} from '../utils';
import {updateConversation} from '../api';

type Props = StackScreenProps<RootStackParamList, 'Root'> & {};

export default function ConversationsScreen({navigation}: Props) {
  const [isRefreshing, setRefreshing] = React.useState(false);
  const {
    fetchConversations,
    pagination,
    conversations = [],
  } = useConversations();

  const handleSelectConversation = (item: any) => {
    const {id: conversationId, messages = []} = item;

    navigation.navigate('Chat', {conversationId, messages});
  };

  const handleRefreshConversations = async () => {
    setRefreshing(true);

    await fetchConversations({status: 'open'});
    await sleep(400);

    setRefreshing(false);
  };

  const handleCloseConversation = async (item: any) => {
    try {
      const {id: conversationId} = item;
      await updateConversation(conversationId, {
        conversation: {status: 'closed'},
      });
    } catch (error) {
      console.error('Failed to close conversation', error);
    }
  };

  const handleLoadMoreConversations = async () => {
    console.log('Loading more conversations:', pagination);

    if (pagination.next) {
      await fetchConversations({status: 'open', after: pagination.next});
    }
  };

  const renderItem = ({item}: any) => {
    return (
      <ConversationItem
        item={item}
        onSelectConversation={handleSelectConversation}
      />
    );
  };

  const renderHiddenItem = ({item}: any) => {
    return (
      <View style={tailwind('h-full')}>
        <TouchableOpacity
          activeOpacity={0.5}
          onPress={() => handleCloseConversation(item)}
          style={tailwind(
            'h-full bg-green-400 self-end justify-center items-center px-5'
          )}
        >
          <Icon name="check" type="feather" color="white" />
        </TouchableOpacity>
      </View>
    );
  };

  const displayed = conversations.filter((c) => c.status === 'open');

  return (
    <SafeAreaView style={tailwind('h-full bg-white')}>
      <View style={tailwind('p-4 items-center')}>
        <Text style={tailwind('font-bold text-lg')}>Conversations</Text>
      </View>

      <SwipeListView
        useFlatList={true}
        refreshing={isRefreshing}
        onRefresh={handleRefreshConversations}
        keyboardShouldPersistTaps="handled"
        data={displayed}
        renderItem={renderItem}
        renderHiddenItem={renderHiddenItem}
        rightOpenValue={-75}
        onEndReached={handleLoadMoreConversations}
        onEndReachedThreshold={0.01}
        onMomentumScrollBegin={(...args) => {
          console.log('onMomentumScrollBegin');
        }}
        keyExtractor={(item, index) => {
          return item.id;
        }}
        ListFooterComponent={
          displayed.length > 50 ? (
            <View style={tailwind('p-4 items-center')}>
              {pagination.next ? (
                <ActivityIndicator />
              ) : (
                <Text style={tailwind('my-6 text-gray-500')}>
                  All conversations loaded 🚀
                </Text>
              )}
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
}
