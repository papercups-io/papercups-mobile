import request from 'superagent';
import qs from 'query-string';

import Storage, {AUTH_CACHE_KEY} from './storage';
import {
  Account,
  Conversation,
  ConversationPagination,
  Customer,
  CustomerNote,
  Tag,
  User,
  WidgetSettings,
} from './types';
import {host, isLocal} from './config';

const isHttp = isLocal(host);
const base = `${isHttp ? 'http://' : 'https://'}${host}`;
// const base = 'http://localhost:4000';

export type LoginParams = {
  email: string;
  password: string;
};

export type RegisterParams = LoginParams & {
  companyName?: string;
  inviteToken?: string;
  passwordConfirmation: string;
};

export type ResetPasswordParams = {
  password: string;
  passwordConfirmation: string;
};

export const getAccessToken = async (): Promise<string | null> => {
  const tokens = await Storage.get(AUTH_CACHE_KEY);

  return (tokens && tokens.token) || null;
};

export const getRefreshToken = async (): Promise<string | null> => {
  const tokens = await Storage.get(AUTH_CACHE_KEY);

  return (tokens && tokens.renew_token) || null;
};

export const me = async (key?: string): Promise<User> => {
  const token = key || (await getAccessToken());

  if (!token) {
    throw new Error('Invalid token!');
  }

  return request
    .get(`${base}/api/me`)
    .set('Authorization', token)
    .then((res) => res.body.data);
};

export const login = async ({email, password}: LoginParams) => {
  return request
    .post(`${base}/api/session`)
    .send({user: {email, password}})
    .then((res) => res.body.data);
};

export const logout = async () => {
  return request.delete(`${base}/api/session`).then((res) => res.body);
};

export const register = async ({
  companyName,
  inviteToken,
  email,
  password,
  passwordConfirmation,
}: RegisterParams) => {
  return request
    .post(`${base}/api/registration`)
    .send({
      user: {
        company_name: companyName,
        invite_token: inviteToken,
        email,
        password,
        password_confirmation: passwordConfirmation,
      },
    })
    .then((res) => res.body.data);
};

export const renew = async (key?: string) => {
  const token = key || (await getRefreshToken());

  if (!token) {
    throw new Error('Invalid token!');
  }

  return request
    .post(`${base}/api/session/renew`)
    .set('Authorization', token)
    .then((res) => res.body.data);
};

export const createNewCustomer = async (
  accountId: string,
  params: Partial<Customer>
) => {
  return request
    .post(`${base}/api/customers`)
    .send({
      customer: {
        ...params,
        account_id: accountId,
      },
    })
    .then((res) => res.body.data);
};

export const fetchCustomers = async (filters = {}, key?: string) => {
  const token = key || (await getAccessToken());

  if (!token) {
    throw new Error('Invalid token!');
  }

  return request
    .get(`${base}/api/customers`)
    .query(qs.stringify(filters, {arrayFormat: 'bracket'}))
    .set('Authorization', token)
    .then((res) => res.body);
};

export const fetchCustomer = async (
  id: string,
  query: {expand?: Array<string>} = {},
  key?: string
) => {
  const token = key || (await getAccessToken());

  if (!token) {
    throw new Error('Invalid token!');
  }

  const {expand = []} = query;

  return request
    .get(`${base}/api/customers/${id}`)
    .query(qs.stringify({expand}, {arrayFormat: 'bracket'}))
    .set('Authorization', token)
    .then((res) => res.body.data);
};

export const updateCustomer = async (
  id: string,
  updates: Record<string, any>,
  key?: string
) => {
  const token = key || (await getAccessToken());

  if (!token) {
    throw new Error('Invalid token!');
  }

  return request
    .put(`${base}/api/customers/${id}`)
    .set('Authorization', token)
    .send({
      customer: updates,
    })
    .then((res) => res.body.data);
};

export const createNewConversation = async (
  customerId: string,
  params?: Record<any, any>,
  key?: string
) => {
  const token = key || (await getAccessToken());

  if (!token) {
    throw new Error('Invalid token!');
  }

  return request
    .post(`${base}/api/conversations`)
    .set('Authorization', token)
    .send({
      conversation: {
        customer_id: customerId,
        ...params,
      },
    })
    .then((res) => res.body.data);
};

export const fetchAccountInfo = async (key?: string): Promise<Account> => {
  const token = key || (await getAccessToken());

  if (!token) {
    throw new Error('Invalid token!');
  }

  return request
    .get(`${base}/api/accounts/me`)
    .set('Authorization', token)
    .then((res) => res.body.data);
};

export const updateAccountInfo = async (
  updates: Record<string, any>,
  key?: string
) => {
  const token = key || (await getAccessToken());

  if (!token) {
    throw new Error('Invalid token!');
  }

  return request
    .put(`${base}/api/accounts/me`)
    .set('Authorization', token)
    .send({
      account: updates,
    })
    .then((res) => res.body.data);
};

export const fetchUserProfile = async (key?: string) => {
  const token = key || (await getAccessToken());

  if (!token) {
    throw new Error('Invalid token!');
  }

  return request
    .get(`${base}/api/profile`)
    .set('Authorization', token)
    .then((res) => res.body.data);
};

export const updateUserProfile = async (
  updates: Record<string, any>,
  key?: string
) => {
  const token = key || (await getAccessToken());

  if (!token) {
    throw new Error('Invalid token!');
  }

  return request
    .put(`${base}/api/profile`)
    .set('Authorization', token)
    .send({
      user_profile: updates,
    })
    .then((res) => res.body.data);
};

export const fetchUserSettings = async (key?: string) => {
  const token = key || (await getAccessToken());

  if (!token) {
    throw new Error('Invalid token!');
  }

  return request
    .get(`${base}/api/user_settings`)
    .set('Authorization', token)
    .then((res) => res.body.data);
};

export const updateUserSettings = async (
  updates: Record<string, any>,
  key?: string
) => {
  const token = key || (await getAccessToken());

  if (!token) {
    throw new Error('Invalid token!');
  }

  return request
    .put(`${base}/api/user_settings`)
    .set('Authorization', token)
    .send({
      user_settings: updates,
    })
    .then((res) => res.body.data);
};

export type PaginationOptions = {
  limit?: number;
  next?: string | null;
  previous?: string | null;
  total?: number;
};

export type ConversationsListResponse = {
  data: Array<Conversation>;
} & ConversationPagination;

export const countUnreadConversations = async (key?: string): Promise<any> => {
  const token = key || (await getAccessToken());

  if (!token) {
    throw new Error('Invalid token!');
  }

  return request
    .get(`${base}/api/conversations/unread`)
    .set('Authorization', token)
    .then((res) => res.body.data);
};

export const fetchConversations = async (
  query = {},
  key?: string
): Promise<ConversationsListResponse> => {
  const token = key || (await getAccessToken());

  if (!token) {
    throw new Error('Invalid token!');
  }

  return request
    .get(`${base}/api/conversations`)
    .query(query)
    .set('Authorization', token)
    .then((res) => res.body);
};

export const fetchAllConversations = async (query = {}, key?: string) => {
  return fetchConversations({...query, status: 'open'}, key);
};

export const fetchMyConversations = async (
  userId?: number,
  query = {},
  key?: string
) => {
  return fetchConversations(
    {
      ...query,
      assignee_id: userId || 'me',
      status: 'open',
    },
    key
  );
};

export const fetchMentionedConversations = async (
  userId?: number,
  query = {},
  key?: string
) => {
  return fetchConversations(
    {
      ...query,
      mentioning: userId || 'me',
      status: 'open',
    },
    key
  );
};

export const fetchPriorityConversations = async (query = {}, key?: string) => {
  return fetchConversations(
    {
      ...query,
      priority: 'priority',
      status: 'open',
    },
    key
  );
};

export const fetchClosedConversations = async (query = {}, key?: string) => {
  return fetchConversations({...query, status: 'closed'}, key);
};

export const fetchUnreadConversations = async (query = {}, key?: string) => {
  return fetchConversations({...query, status: 'open', read: false}, key);
};

export const fetchUnassignedConversations = async (
  query = {},
  key?: string
) => {
  return fetchConversations(
    {
      ...query,
      status: 'open',
      assignee_id: null,
    },
    key
  );
};

export const fetchConversation = async (
  id: string,
  key?: string
): Promise<Conversation> => {
  const token = key || (await getAccessToken());

  if (!token) {
    throw new Error('Invalid token!');
  }

  return request
    .get(`${base}/api/conversations/${id}`)
    .set('Authorization', token)
    .then((res) => res.body.data);
};

export const fetchPreviousConversation = async (
  id: string,
  key?: string
): Promise<Conversation> => {
  const token = key || (await getAccessToken());

  if (!token) {
    throw new Error('Invalid token!');
  }

  return request
    .get(`${base}/api/conversations/${id}/previous`)
    .set('Authorization', token)
    .then((res) => res.body.data);
};

export const fetchRelatedConversations = async (
  id: string,
  key?: string
): Promise<Array<Conversation>> => {
  const token = key || (await getAccessToken());

  if (!token) {
    throw new Error('Invalid token!');
  }

  return request
    .get(`${base}/api/conversations/${id}/related`)
    .set('Authorization', token)
    .then((res) => res.body.data);
};

export const fetchSlackConversationThreads = async (
  conversationId: string,
  key?: string
): Promise<Array<Conversation>> => {
  const token = key || (await getAccessToken());

  if (!token) {
    throw new Error('Invalid token!');
  }

  return request
    .get(`${base}/api/slack_conversation_threads`)
    .query({conversation_id: conversationId})
    .set('Authorization', token)
    .then((res) => res.body.data);
};

export const generateShareConversationToken = async (
  conversationId: string,
  key?: string
) => {
  const token = key || (await getAccessToken());

  if (!token) {
    throw new Error('Invalid token!');
  }

  return request
    .post(`${base}/api/conversations/${conversationId}/share`)
    .set('Authorization', token)
    .then((res) => res.body.data);
};

export const fetchSharedConversation = async (
  id: string,
  key?: string
): Promise<Conversation> => {
  const token = key || (await getAccessToken());

  if (!token) {
    throw new Error('Access denied!');
  }

  return request
    .get(`${base}/api/conversations/shared`)
    .query({token, conversation_id: id})
    .then((res) => res.body.data);
};

export const updateConversation = async (
  conversationId: string,
  updates: Record<string, any>,
  key?: string
) => {
  const token = key || (await getAccessToken());

  if (!token) {
    throw new Error('Invalid token!');
  }

  return request
    .put(`${base}/api/conversations/${conversationId}`)
    .set('Authorization', token)
    .send(updates)
    .then((res) => res.body.data);
};

export const deleteConversation = async (
  conversationId: string,
  key?: string
) => {
  const token = key || (await getAccessToken());

  if (!token) {
    throw new Error('Invalid token!');
  }

  return request
    .delete(`${base}/api/conversations/${conversationId}`)
    .set('Authorization', token)
    .then((res) => res.body);
};

export const archiveConversation = async (
  conversationId: string,
  key?: string
) => {
  const token = key || (await getAccessToken());

  if (!token) {
    throw new Error('Invalid token!');
  }

  return request
    .post(`${base}/api/conversations/${conversationId}/archive`)
    .set('Authorization', token)
    .then((res) => res.body);
};

export const createNewMessage = async (
  conversationId: string,
  message: any,
  key?: string
) => {
  const token = key || (await getAccessToken());

  if (!token) {
    throw new Error('Invalid token!');
  }

  return request
    .post(`${base}/api/messages`)
    .set('Authorization', token)
    .send({
      message: {
        conversation_id: conversationId,
        sent_at: new Date().toISOString(),
        ...message,
      },
    })
    .then((res) => res.body.data);
};

export const countMessages = async (key?: string) => {
  const token = key || (await getAccessToken());

  if (!token) {
    throw new Error('Invalid token!');
  }

  return request
    .get(`${base}/api/messages/count`)
    .set('Authorization', token)
    .then((res) => res.body.data);
};

export const fetchCustomerConversations = async (
  customerId: string,
  accountId: string
) => {
  return request
    .get(`${base}/api/conversations/customer`)
    .query({customer_id: customerId, account_id: accountId})
    .then((res) => res.body.data);
};

export const sendSlackNotification = async (
  params: {
    text: string;
    type?: 'reply' | 'support';
    channel?: string;
  },
  key?: string
) => {
  const token = key || (await getAccessToken());

  if (!token) {
    throw new Error('Invalid token!');
  }

  return request
    .post(`${base}/api/slack/notify`)
    .send(params)
    .set('Authorization', token)
    .then((res) => res.body.data);
};

export const sendTwilioSms = async (
  params: {to: string; body: string},
  key?: string
) => {
  const token = key || (await getAccessToken());

  if (!token) {
    throw new Error('Invalid token!');
  }

  return request
    .post(`${base}/api/twilio/send`)
    .send(params)
    .set('Authorization', token)
    .then((res) => res.body.data);
};

export const fetchGithubRepos = async (key?: string) => {
  const token = key || (await getAccessToken());

  if (!token) {
    throw new Error('Invalid token!');
  }

  return request
    .get(`${base}/api/github/repos`)
    .set('Authorization', token)
    .then((res) => res.body.data);
};

export const findGithubIssues = async (
  query: {
    url?: string;
    owner?: string;
    repo?: string;
  },
  key?: string
) => {
  const token = key || (await getAccessToken());

  if (!token) {
    throw new Error('Invalid token!');
  }

  return request
    .get(`${base}/api/github/issues`)
    .query(query)
    .set('Authorization', token)
    .then((res) => res.body.data);
};

export type EmailParams = {
  recipient: string;
  subject: string;
  message: string;
};

export const sendGmailNotification = async (
  {recipient, subject, message}: EmailParams,
  key?: string
) => {
  const token = key || (await getAccessToken());

  if (!token) {
    throw new Error('Invalid token!');
  }

  return request
    .post(`${base}/api/gmail/send`)
    .send({recipient, subject, message})
    .set('Authorization', token)
    .then((res) => res.body.data);
};

export const updateWidgetSettings = async (
  widgetSettingsParams: Partial<WidgetSettings>,
  key?: string
) => {
  const token = key || (await getAccessToken());

  if (!token) {
    throw new Error('Invalid token!');
  }

  return request
    .put(`${base}/api/widget_settings`)
    .send({widget_settings: widgetSettingsParams})
    .set('Authorization', token)
    .then((res) => res.body.data);
};

export const fetchAccountUsers = async (key?: string) => {
  const token = key || (await getAccessToken());

  if (!token) {
    throw new Error('Invalid token!');
  }

  return request
    .get(`${base}/api/users`)
    .set('Authorization', token)
    .then((res) => res.body.data);
};

export const fetchAccountUser = async (id: number, key?: string) => {
  const token = key || (await getAccessToken());

  if (!token) {
    throw new Error('Invalid token!');
  }

  return request
    .get(`${base}/api/users/${id}`)
    .set('Authorization', token)
    .then((res) => res.body.data);
};

export type CustomerNotesListResponse = {
  data: Array<CustomerNote>;
};

export const createCustomerNote = async (
  customerId: string,
  body: string,
  key?: string
) => {
  const token = key || (await getAccessToken());

  if (!token) {
    throw new Error('Invalid token!');
  }

  return request
    .post(`${base}/api/notes`)
    .set('Authorization', token)
    .send({
      note: {
        body,
        customer_id: customerId,
      },
    })
    .then((res) => res.body.data);
};

export const deleteCustomerNote = async (noteId: string, key?: string) => {
  const token = key || (await getAccessToken());

  if (!token) {
    throw new Error('Invalid token!');
  }

  return request
    .delete(`${base}/api/notes/${noteId}`)
    .set('Authorization', token);
};

export const fetchAllTags = async (key?: string) => {
  const token = key || (await getAccessToken());

  if (!token) {
    throw new Error('Invalid token!');
  }

  return request
    .get(`${base}/api/tags`)
    .set('Authorization', token)
    .then((res) => res.body.data);
};

export const fetchTagById = async (id: string, key?: string) => {
  const token = key || (await getAccessToken());

  if (!token) {
    throw new Error('Invalid token!');
  }

  return request
    .get(`${base}/api/tags/${id}`)
    .set('Authorization', token)
    .then((res) => res.body.data);
};

export const createTag = async (tag: Partial<Tag>, key?: string) => {
  const token = key || (await getAccessToken());

  if (!token) {
    throw new Error('Invalid token!');
  }

  return request
    .post(`${base}/api/tags`)
    .send({tag})
    .set('Authorization', token)
    .then((res) => res.body.data);
};

export const updateTag = async (
  id: string,
  tag: Partial<Tag>,
  key?: string
) => {
  const token = key || (await getAccessToken());

  if (!token) {
    throw new Error('Invalid token!');
  }

  return request
    .put(`${base}/api/tags/${id}`)
    .send({tag})
    .set('Authorization', token)
    .then((res) => res.body.data);
};

export const deleteTag = async (id: string, key?: string) => {
  const token = key || (await getAccessToken());

  if (!token) {
    throw new Error('Invalid token!');
  }

  return request
    .delete(`${base}/api/tags/${id}`)
    .set('Authorization', token)
    .then((res) => res.body);
};

export const addConversationTag = async (
  conversationId: string,
  tagId: string,
  key?: string
) => {
  const token = key || (await getAccessToken());

  if (!token) {
    throw new Error('Invalid token!');
  }

  return request
    .post(`${base}/api/conversations/${conversationId}/tags`)
    .send({tag_id: tagId})
    .set('Authorization', token)
    .then((res) => res.body.data);
};

export const removeConversationTag = async (
  conversationId: string,
  tagId: string,
  key?: string
) => {
  const token = key || (await getAccessToken());

  if (!token) {
    throw new Error('Invalid token!');
  }

  return request
    .delete(`${base}/api/conversations/${conversationId}/tags/${tagId}`)
    .set('Authorization', token)
    .then((res) => res.body.data);
};

export const addCustomerTag = async (
  customerId: string,
  tagId: string,
  key?: string
) => {
  const token = key || (await getAccessToken());

  if (!token) {
    throw new Error('Invalid token!');
  }

  return request
    .post(`${base}/api/customers/${customerId}/tags`)
    .send({tag_id: tagId})
    .set('Authorization', token)
    .then((res) => res.body.data);
};

export const removeCustomerTag = async (
  customerId: string,
  tagId: string,
  key?: string
) => {
  const token = key || (await getAccessToken());

  if (!token) {
    throw new Error('Invalid token!');
  }

  return request
    .delete(`${base}/api/customers/${customerId}/tags/${tagId}`)
    .set('Authorization', token)
    .then((res) => res.body.data);
};
