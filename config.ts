export const isDev = process?.env?.NODE_ENV === 'development';

// export const host = '95e5e8dd9265.ngrok.io';
export const host = isDev
  ? 'alex-papercups-staging.herokuapp.com'
  : 'app.papercups.io';

export const isLocal = (hostname: string) => {
  return (
    hostname === 'localhost' ||
    // [::1] is the IPv6 localhost address.
    hostname === '[::1]' ||
    // 127.0.0.0/8 are considered localhost for IPv4.
    hostname.match(/^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/)
  );
};
