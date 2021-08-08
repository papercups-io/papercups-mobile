import {Account, Message, Conversation, User} from './types';

export const noop = () => {};

export const getColorByUuid = (uuid?: string | null) => {
  if (!uuid) {
    return 'blue';
  }

  const colorIndex = parseInt(uuid, 32) % 5;
  const color = ['red', 'yellow', 'green', 'purple', 'indigo'][colorIndex];

  return color;
};
