import * as React from 'react';
import {StackScreenProps} from '@react-navigation/stack';
import {
  ActivityIndicator,
  Dimensions,
  SafeAreaView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {SwipeListView} from 'react-native-swipe-list-view';
import {Icon} from 'react-native-elements/dist/icons/Icon';
import tailwind from 'tailwind-rn';

import {RootStackParamList} from '../types';
import ConversationItem from '../components/conversations/ConversationItem';
import {useConversations} from '../components/conversations/ConversationsProvider';
import {sleep} from '../utils';
import logger from '../logger';

type Props = StackScreenProps<RootStackParamList, 'Root'> & {};

export default function ConversationsScreen({navigation}: Props) {
  const [isRefreshing, setRefreshing] = React.useState(false);
  const {
    pagination,
    conversations = [],
    reconnect,
    fetchConversations,
    updateConversationById,
  } = useConversations();

  const handleSelectConversation = (item: any) => {
    const {id: conversationId, messages = []} = item;

    navigation.navigate('Chat', {conversationId, messages});
  };

  const handleRefreshConversations = async () => {
    setRefreshing(true);

    await fetchConversations({status: 'open'});
    await reconnect();
    await sleep(400);

    setRefreshing(false);
  };

  const closeConversation = async (id: string) => {
    try {
      await updateConversationById(id, {
        conversation: {status: 'closed'},
      });
    } catch (error) {
      logger.error('Failed to close conversation', error);
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
      <TouchableOpacity
        activeOpacity={0.5}
        onPress={() => closeConversation(item.id)}
        style={tailwind('h-full bg-green-400')}
      >
        <View
          style={[
            tailwind(
              'h-full bg-green-400 self-end justify-center items-center px-5'
            ),
            {width: 80},
          ]}
        >
          <Icon name="check" type="feather" color="white" />
        </View>
      </TouchableOpacity>
    );
  };

  // TODO: smooth this out? See:
  // https://github.com/jemise111/react-native-swipe-list-view/blob/master/SwipeListExample/examples/swipe_to_delete.js
  const handleSwipeValueChange = async (data: {
    key: string;
    value: number;
    direction: 'left' | 'right';
    isOpen: boolean;
  }) => {
    const {key: conversationId, value} = data;
    const swipeThreshold = -Dimensions.get('window').width;
    const isElementSwipedOffScreen = value < swipeThreshold;

    if (isElementSwipedOffScreen) {
      await closeConversation(conversationId);
    }
  };

  const displayed = conversations.filter((c) => c.status === 'open');

  return (
    <SafeAreaView style={tailwind('h-full bg-white')}>
      <View style={tailwind('p-4 items-center')}>
        <Text style={tailwind('font-bold text-lg')}>Conversations</Text>
      </View>

      <SwipeListView
        data={displayed}
        disableRightSwipe={true}
        keyboardShouldPersistTaps="handled"
        keyExtractor={(item, index) => {
          return item.id;
        }}
        onEndReached={handleLoadMoreConversations}
        onEndReachedThreshold={0.01}
        onMomentumScrollBegin={(...args) => {
          console.log('onMomentumScrollBegin');
        }}
        onRefresh={handleRefreshConversations}
        rightOpenValue={-96}
        refreshing={isRefreshing}
        renderHiddenItem={renderHiddenItem}
        renderItem={renderItem}
        useFlatList={true}
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
