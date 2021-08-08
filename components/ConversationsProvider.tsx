import React, {useContext} from 'react';
import {Channel, Socket} from 'phoenix';

import * as API from '../api';
import {Conversation, Message, User} from '../types';

const mapConversationsById = (conversations: Array<Conversation>) => {
  return conversations.reduce((acc, conversation) => {
    const {id} = conversation;

    return {...acc, [id]: conversation};
  }, {} as {[id: string]: Conversation});
};

const mapMessagesByConversationId = (conversations: Array<Conversation>) => {
  return conversations.reduce((acc, {id, messages = []}) => {
    return {
      ...acc,
      // TODO: move sorting logic to server?
      [id]: messages.sort(
        (a, b) => +new Date(b.created_at) - +new Date(a.created_at)
      ),
    };
  }, {} as {[id: string]: Array<Message>});
};

export const ConversationsContext = React.createContext<{
  loading?: boolean;
  conversations: Array<Conversation>;
  currentUser: User | null;
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
  fetchConversations: () =>
    Promise.resolve({data: [], next: null, previous: null}),
  getConversationById: () => null,
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
  pagination: any;
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
      pagination: {},
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

    this.setState({
      pagination,
      conversationIds: conversations.map((c) => c.id),
      conversationsById: mapConversationsById(conversations),
      messagesByConversationId: mapMessagesByConversationId(conversations),
    });

    return result;
  };

  getConversationById = (conversationId: string) => {
    return this.state.conversationsById[conversationId] || null;
  };

  getAllConversations = (): Array<Conversation> => {
    const {conversationIds = [], conversationsById = {}} = this.state;

    return conversationIds.map((id) => {
      const conversation = this.getConversationById(id);

      if (!conversation) {
        throw new Error(`Missing conversation for id ${id}`);
      }

      return conversation;
    });
  };

  getMessagesByConversationId = (conversationId: string) => {
    return this.state.messagesByConversationId[conversationId] || [];
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
    const {loading, currentUser} = this.state;
    const conversations = this.getAllConversations();

    return (
      <ConversationsContext.Provider
        value={{
          loading,
          currentUser,
          conversations,
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
