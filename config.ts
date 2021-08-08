export const host = 'f6ea3b03400e.ngrok.io';

export const isDev = (hostname: string) => {
  return (
    hostname === 'localhost' ||
    // [::1] is the IPv6 localhost address.
    hostname === '[::1]' ||
    // 127.0.0.0/8 are considered localhost for IPv4.
    hostname.match(/^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/)
  );
};
