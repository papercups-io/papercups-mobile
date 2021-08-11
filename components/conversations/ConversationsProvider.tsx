import React, {useContext} from 'react';
import {Channel, Socket} from 'phoenix';
import * as Notifications from 'expo-notifications';

import * as API from '../../api';
import {Conversation, ConversationPagination, Message, User} from '../../types';
import {mapConversationsById, mapMessagesByConversationId} from './support';
import {registerForPushNotificationsAsync} from '../notifications/support';

export const ConversationsContext = React.createContext<{
  loading?: boolean;
  conversations: Array<Conversation>;
  currentUser: User | null;
  pagination: ConversationPagination;
  reconnect: () => Promise<void>;
  fetchConversations: (
    query?: Record<string, any>
  ) => Promise<API.ConversationsListResponse>;
  getConversationById: (id: string) => Conversation | null;
  getMessagesByConversationId: (id: string) => Array<Message>;
  markConversationAsRead: (id: string) => void;
  sendNewMessage: (message: Partial<Message>) => void;
}>({
  loading: false,
  conversations: [],
  currentUser: null,
  pagination: {
    previous: null,
    next: null,
    limit: null,
    total: null,
  },
  reconnect: () => Promise.resolve(),
  fetchConversations: () =>
    Promise.resolve({
      data: [],
      next: null,
      previous: null,
      limit: null,
      total: null,
    }),
  getConversationById: () => null,
  getMessagesByConversationId: () => [],
  markConversationAsRead: () => null,
  sendNewMessage: () => null,
});

export const useConversations = () => useContext(ConversationsContext);

type Props = {socket: Socket} & React.PropsWithChildren<{}>;
type State = {
  loading: boolean;
  connecting: boolean;
  currentUser: User | null;
  pushNotificationToken: string | null;
  conversationIds: Array<string>;
  conversationsById: {[id: string]: Conversation};
  messagesByConversationId: {[id: string]: Array<Message>};
  pagination: ConversationPagination;
};

export class ConversationsProvider extends React.Component<Props, State> {
  channel: Channel | null = null;
  subscriptions: Array<any> = [];

  constructor(props: Props) {
    super(props);

    this.state = {
      loading: true,
      connecting: false,
      currentUser: null,
      pushNotificationToken: null,
      conversationIds: [],
      conversationsById: {},
      messagesByConversationId: {},
      pagination: {
        previous: null,
        next: null,
        limit: null,
        total: null,
      },
    };
  }

  async componentDidMount() {
    await this.fetchConversations({status: 'open'});

    const me = await API.me();
    const {account_id: accountId} = me;

    this.setState(
      {
        currentUser: me,
        loading: false,
      },
      () => this.connect(accountId)
    );
  }

  componentWillUnmount() {
    this.disconnect();
  }

  connect = async (accountId: string) => {
    this.joinNotificationsChannel(accountId);

    await this.registerForPushNotifications();
  };

  reconnect = async () => {
    const {currentUser} = this.state;
    const accountId = currentUser?.account_id;

    if (accountId) {
      return this.connect(accountId);
    } else {
      console.error(
        'Cannot reconnect until current user is available:',
        this.state
      );
    }
  };

  disconnect() {
    this.leaveNotificationsChannel();
    this.removePushNotificationListeners();
  }

  registerForPushNotifications = async () => {
    console.debug('Registering push notifications...');
    const token = await registerForPushNotificationsAsync();
    console.debug('Expo push token:', token);

    if (token) {
      await API.updateUserSettings({expo_push_token: token});

      this.setState({pushNotificationToken: token});
      console.log('Successfully registered push notifications!', token);
      this.subscriptions = [
        ...this.subscriptions,
        // This listener is fired whenever a notification is received while the app is foregrounded
        Notifications.addNotificationReceivedListener((notification) => {
          // console.log('addNotificationReceivedListener', notification);
        }),
        // This listener is fired whenever a user taps on or interacts with a notification (works when app is foregrounded, backgrounded, or killed)
        Notifications.addNotificationResponseReceivedListener((response) => {
          // console.log('addNotificationResponseReceivedListener', response);
        }),
      ];
    }
  };

  removePushNotificationListeners = () => {
    console.log('removePushNotificationListeners');
    this.subscriptions.forEach((subscription) => {
      Notifications.removeNotificationSubscription(subscription);
    });
  };

  joinNotificationsChannel = (accountId: string) => {
    if (this.state.connecting) {
      console.debug('Alreading connecting to channel... Skipping for now.');

      return;
    }

    this.setState({connecting: true});

    if (this.channel && this.channel.leave) {
      console.debug(
        'Channel already exists. Leaving channel before connecting...'
      );
      this.channel.leave(); // TODO: what's the best practice here?
    }

    this.channel = this.props.socket.channel(`notification:${accountId}`, {});

    this.channel.on('shout', (payload) => this.handleIncomingMessage(payload));
    // TODO: fix race condition between this event and `shout` above
    this.channel.on('conversation:created', ({id}) =>
      this.handleNewConversation(id)
    );

    this.channel.on('conversation:updated', ({id, updates}) =>
      this.handleConversationUpdated(id, updates)
    );

    this.channel.onError(() => {
      console.error('Error connecting to notification channel.');
      console.error('Attempting reconnect after 5s...');

      setTimeout(() => this.connect(accountId), 5000);
    });

    this.channel
      .join()
      .receive('ok', (data) => {
        console.debug('Joined channel successfully:', data);

        this.setState({connecting: false});
      })
      .receive('error', (err) => {
        console.error('Unable to join channel:', err);
        console.error('Attempting reconnect after 5s...');
        // TODO: double check that this works (retries after 5s)
        setTimeout(() => this.connect(accountId), 5000);

        this.setState({connecting: false});
      })
      .receive('timeout', (data) => {
        console.error('Connection to channel timed out:', data);

        this.setState({connecting: false});
      });
  };

  leaveNotificationsChannel = () => {
    if (this.channel && this.channel.leave) {
      this.channel.leave();
    }
  };

  fetchConversations = async (
    query: Record<string, any> = {status: 'open'}
  ) => {
    const result = await API.fetchConversations(query);
    const {data: conversations = [], ...pagination} = result;
    const {
      conversationIds = [],
      conversationsById = {},
      messagesByConversationId = {},
    } = this.state;

    this.setState({
      pagination,
      conversationIds: [
        ...new Set([...conversationIds, ...conversations.map((c) => c.id)]),
      ],
      conversationsById: {
        ...conversationsById,
        ...mapConversationsById(conversations),
      },
      messagesByConversationId: {
        ...messagesByConversationId,
        ...mapMessagesByConversationId(conversations),
      },
    });

    return result;
  };

  getConversationById = (conversationId: string): Conversation | null => {
    const conversation = this.state.conversationsById[conversationId];

    if (!conversation) {
      // TODO: figure out the best way to avoid this... probably needs to be
      // handled on the server where we handle emitting events via channels)
      console.warn(`Missing conversation in cache for id: ${conversationId}`);

      return null;
    }

    return conversation;
  };

  getAllConversations = (): Array<Conversation> => {
    return this.state.conversationIds
      .map((id) => this.getConversationById(id))
      .filter(
        (conversation: Conversation | null): conversation is Conversation =>
          !!conversation
      )
      .filter(({messages = []}) => messages && messages.length > 0)
      .sort((a: Conversation, b: Conversation) => {
        const x = a.last_activity_at || a.updated_at;
        const y = b.last_activity_at || b.updated_at;

        return +new Date(y) - +new Date(x);
      });
  };

  getMessagesByConversationId = (conversationId: string) => {
    const messages = this.state.messagesByConversationId[conversationId];

    if (!messages) {
      // TODO: figure out the best way to avoid this... probably needs to be
      // handled on the server where we handle emitting events via channels)
      console.warn(
        `Missing messages in cache for conversation: ${conversationId}`
      );

      return [];
    }

    return messages;
  };

  addMessagesByConversationId = (
    conversationId: string,
    messages: Array<Message>
  ) => {
    return {
      ...this.state.messagesByConversationId,
      [conversationId]: [
        ...this.getMessagesByConversationId(conversationId),
        ...messages,
      ],
    };
  };

  handleIncomingMessage = (message: Message) => {
    const {conversation_id: conversationId} = message;

    this.setState({
      messagesByConversationId: {
        ...this.state.messagesByConversationId,
        [conversationId]: [
          message,
          ...this.getMessagesByConversationId(conversationId),
        ],
      },
    });
  };

  handleNewConversation = async (conversationId: string) => {
    await this.fetchConversations({status: 'open'});
  };

  handleConversationUpdated = async (
    conversationId: string,
    updates: Record<any, any>
  ) => {
    const existing = this.getConversationById(conversationId);

    if (!existing) {
      return this.fetchConversations({status: 'open'});
    }

    this.setState({
      conversationsById: {
        ...this.state.conversationsById,
        [conversationId]: {
          ...existing,
          ...updates,
        },
      },
    });

    return this.fetchConversations({status: 'open'});
  };

  markConversationAsRead = (conversationId?: string) => {
    if (!conversationId) {
      return;
    }

    this.channel
      ?.push('read', {
        conversation_id: conversationId,
      })
      .receive('ok', (response) => {
        console.debug('Marked as read!', {response, conversationId});

        this.handleConversationUpdated(conversationId, {read: true});
      });
  };

  sendNewMessage = (message: Partial<Message>) => {
    if (!message || !message.conversation_id) {
      throw new Error(
        `Invalid message ${message} - a \`conversation_id\` is required.`
      );
    }

    const {body} = message;
    const hasEmptyBody = !body || body.trim().length === 0;

    if (!this.channel || hasEmptyBody) {
      return;
    }

    console.log('Attempting to send message to channel', message);

    this.channel.push('shout', {
      ...message,
      // TODO: figure out what to do here
      sent_at: new Date().toISOString(),
    });
  };

  render() {
    const {loading, currentUser, pagination} = this.state;
    const conversations = this.getAllConversations();

    return (
      <ConversationsContext.Provider
        value={{
          loading,
          currentUser,
          conversations,
          pagination,
          reconnect: this.reconnect,
          fetchConversations: this.fetchConversations,
          markConversationAsRead: this.markConversationAsRead,
          getConversationById: this.getConversationById,
          getMessagesByConversationId: this.getMessagesByConversationId,
          sendNewMessage: this.sendNewMessage,
        }}
      >
        {this.props.children}
      </ConversationsContext.Provider>
    );
  }
}
