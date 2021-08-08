import React, {useContext} from 'react';
import {Channel, Socket} from 'phoenix';

import * as API from '../../api';
import {Conversation, ConversationPagination, Message, User} from '../../types';
import {mapConversationsById, mapMessagesByConversationId} from './support';

export const ConversationsContext = React.createContext<{
  loading?: boolean;
  conversations: Array<Conversation>;
  currentUser: User | null;
  pagination: ConversationPagination;
  fetchConversations: (
    query?: Record<string, any>
  ) => Promise<API.ConversationsListResponse>;
  getConversationById: (id: string) => Conversation;
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
  fetchConversations: () =>
    Promise.resolve({
      data: [],
      next: null,
      previous: null,
      limit: null,
      total: null,
    }),
  getConversationById: () => ({} as Conversation),
  getMessagesByConversationId: () => [],
  markConversationAsRead: () => null,
  sendNewMessage: () => null,
});

export const useConversations = () => useContext(ConversationsContext);

type Props = {socket: Socket} & React.PropsWithChildren<{}>;
type State = {
  loading: boolean;
  currentUser: User | null;
  conversationIds: Array<string>;
  conversationsById: {[id: string]: Conversation};
  messagesByConversationId: {[id: string]: Array<Message>};
  pagination: ConversationPagination;
};

export class ConversationsProvider extends React.Component<Props, State> {
  channel: Channel | null = null;

  constructor(props: Props) {
    super(props);

    this.state = {
      loading: true,
      currentUser: null,
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

  connect(accountId: string) {
    if (this.channel && this.channel.leave) {
      console.debug(
        'Channel already exists. Leaving channel before connecting',
        this.channel
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

    this.channel
      .join()
      .receive('ok', (res) => {
        console.debug('Joined channel successfully');
      })
      .receive('error', (err) => {
        console.error('Unable to join channel', err);
        // TODO: double check that this works (retries after 10s)
        setTimeout(() => this.connect(accountId), 10000);
      });
  }

  disconnect() {
    if (this.channel && this.channel.leave) {
      this.channel.leave();
    }
  }

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

  getConversationById = (conversationId: string): Conversation => {
    const conversation = this.state.conversationsById[conversationId];

    if (!conversation) {
      throw new Error(
        `Missing conversation in cache for id: ${conversationId}`
      );
    }

    return conversation;
  };

  getAllConversations = (): Array<Conversation> => {
    return this.state.conversationIds
      .map((id) => {
        const conversation = this.getConversationById(id);

        if (!conversation) {
          throw new Error(`Missing conversation for id ${id}`);
        }

        return conversation;
      })
      .sort((a: Conversation, b: Conversation) => {
        const x = a.last_activity_at || a.updated_at;
        const y = b.last_activity_at || b.updated_at;

        return +new Date(y) - +new Date(x);
      });
  };

  getMessagesByConversationId = (conversationId: string) => {
    const messages = this.state.messagesByConversationId[conversationId];

    if (!messages) {
      throw new Error(
        `Missing messages in cache for conversation: ${conversationId}`
      );
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

    this.setState({
      conversationsById: {
        ...this.state.conversationsById,
        [conversationId]: {
          ...existing,
          ...updates,
        },
      },
    });

    await this.fetchConversations({status: 'open'});
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
