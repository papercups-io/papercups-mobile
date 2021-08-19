import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';

import {Account, Customer, Message, User} from '../../types';

dayjs.extend(utc);

export const hasSameSender = (a: Message, b: Message) => {
  if (a.user_id && b.user_id) {
    return a.user_id === b.user_id;
  } else if (a.customer_id && b.customer_id) {
    return a.customer_id === b.customer_id;
  } else {
    return false;
  }
};

export const groupMembersById = (messages: Array<Message>) => {
  return messages.reduce((acc, message) => {
    const {user, customer} = message;

    if (user && user.id) {
      return {...acc, [`user:${user.id}`]: user};
    } else if (customer && customer.id) {
      return {...acc, [`customer:${customer.id}`]: customer};
    } else {
      return acc;
    }
  }, {} as {[id: string]: User | Customer});
};

export const getGroupMembers = (messages: Array<Message>) => {
  const grouped = groupMembersById(messages);

  return Object.keys(grouped).map((id) => {
    return grouped[id];
  });
};

export const groupMessagesByDate = (messages: Array<Message>) => {
  return messages.reduce((acc, message) => {
    const {created_at: date} = message;
    const isToday = dayjs.utc(date).isAfter(dayjs().startOf('day'));

    if (isToday) {
      return {...acc, Today: (acc['Today'] || []).concat(message)};
    } else {
      const key = dayjs.utc(date).local().format('MMM D');

      return {...acc, [key]: (acc[key] || []).concat(message)};
    }
  }, {} as {[date: string]: Array<Message>});
};

export const formatLastActiveAt = (date: dayjs.Dayjs) => {
  const today = dayjs();
  const yesterday = today.subtract(1, 'day');

  if (date.isAfter(today.startOf('day'))) {
    return 'Last seen today';
  } else if (
    date.isAfter(yesterday.startOf('day')) &&
    date.isBefore(yesterday.endOf('day'))
  ) {
    return 'Last seen yesterday';
  } else {
    const hours = today.diff(date, 'hours');
    const days = Math.floor(hours / 24);

    return `Last seen ${days}d ago`;
  }
};

export const isBotMessage = (message: Message) => {
  return message.type === 'bot';
};

export const isAgentMessage = (message: Message) => {
  return !isBotMessage(message) && !!message.user_id;
};

export const getSenderIdentifier = (
  message: Message,
  account?: Account | null
) => {
  const {user, customer} = message;

  if (isBotMessage(message)) {
    return account?.company_name || 'Bot';
  }

  if (user) {
    const {display_name, full_name, email} = user;

    return display_name || full_name || email || 'Agent';
  } else if (customer) {
    const {name, email} = customer;

    return name || email || 'Anonymous User';
  } else {
    return 'Anonymous User';
  }
};

export const getSenderProfilePhoto = (
  message: Message,
  account?: Account | null
) => {
  const {user, customer} = message;

  if (isBotMessage(message)) {
    return account?.company_logo_url || null;
  }

  if (user) {
    return user.profile_photo_url || null;
  } else if (customer) {
    return customer.profile_photo_url || null;
  } else {
    return null;
  }
};
