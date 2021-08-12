import {Alert} from 'react-native';

const stringify = (data: any) => {
  if (data instanceof Error) {
    return data.toString();
  } else if (typeof data === 'object') {
    return JSON.stringify(data, null, 2);
  } else if (typeof data === 'string') {
    return data;
  }

  return String(data);
};

const alert = (prefix: string, args: Array<any>) => {
  const [first, ...rest] = args;

  if (typeof first === 'string' && rest.length > 0) {
    const title = `[${prefix}] ${first}`;

    Alert.alert(
      title,
      rest.map((arg: any) => stringify(arg)).join('\n'),
      [{text: 'Dismiss'}],
      {cancelable: true}
    );
  } else {
    Alert.alert(
      prefix,
      args.map((arg: any) => stringify(arg)).join('\n'),
      [{text: 'Dismiss'}],
      {cancelable: true}
    );
  }
};

const logger = {
  debug(...args: any) {
    console.debug(...args);
  },

  log(...args: any) {
    console.log(...args);
  },

  info(...args: any) {
    console.info(...args);
  },

  warn(...args: any) {
    console.warn(...args);
    // TODO: remove after testing
    alert('Warning', args);
  },

  error(...args: any) {
    // TODO: capture these errors in Sentry?
    console.error(...args);
    // TODO: remove after testing
    alert('Error', args);
  },
};

export default logger;
