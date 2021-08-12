// export const host = '95e5e8dd9265.ngrok.io';
// export const host = 'alex-papercups-staging.herokuapp.com';
export const host = 'app.papercups.io';

export const isDev = (hostname: string) => {
  return (
    hostname === 'localhost' ||
    // [::1] is the IPv6 localhost address.
    hostname === '[::1]' ||
    // 127.0.0.0/8 are considered localhost for IPv4.
    hostname.match(/^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/)
  );
};
