import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';

import {Conversation, Message} from '../../types';

dayjs.extend(utc);

export const formatLastSentAt = (date: string) => {
  const d = dayjs.utc(date).local();
  const isSameDay = dayjs.utc(date).isAfter(dayjs().startOf('day'));
  const isWithinWeek = dayjs().diff(dayjs.utc(date), 'days') < 6;

  if (isSameDay) {
    return d.format('h:mm a');
  } else if (isWithinWeek) {
    return d.format('ddd');
  } else {
    return d.format('MMM D');
  }
};

export const mapConversationsById = (conversations: Array<Conversation>) => {
  return conversations.reduce((acc, conversation) => {
    const {id} = conversation;

    return {...acc, [id]: conversation};
  }, {} as {[id: string]: Conversation});
};

export const mapMessagesByConversationId = (
  conversations: Array<Conversation>
) => {
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
