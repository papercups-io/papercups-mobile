import AsyncStorage from '@react-native-async-storage/async-storage';

export const CACHE_PREFIX = '@papercups';
export const AUTH_CACHE_KEY = `${CACHE_PREFIX}:auth`;

export const get = async (key: string) => {
  const result = await AsyncStorage.getItem(`${CACHE_PREFIX}${key}`);

  if (!result) {
    return null;
  }

  try {
    return JSON.parse(result);
  } catch (e) {
    return result;
  }
};

export const set = async (key: string, value: any) => {
  return AsyncStorage.setItem(`${CACHE_PREFIX}${key}`, JSON.stringify(value));
};

export const remove = async (key: string) => {
  return AsyncStorage.removeItem(`${CACHE_PREFIX}${key}`);
};

export const Storage = {
  get,
  set,
  remove,

  auth: {
    get: async () => get(AUTH_CACHE_KEY),
    set: async (value: any) => set(AUTH_CACHE_KEY, value),
    remove: async () => remove(AUTH_CACHE_KEY),
  },
};

export default Storage;
