import React, {useContext} from 'react';
import {Socket} from 'phoenix';
import * as API from '../api';
import {noop} from '../utils';

// TOOD: figure out why ngrok doesn't seem to work here?
// const SOCKET_URL = 'wss://localhost:4000/socket';
const SOCKET_URL = 'wss://alex-papercups-staging.herokuapp.com/socket';

export const SocketContext = React.createContext<{
  socket: Socket;
  hasConnectionError?: boolean;
}>({
  socket: new Socket(SOCKET_URL),
  hasConnectionError: false,
});

export const useSocket = () => useContext(SocketContext);

type Props = {
  url?: string;
  params?: Record<string, string>;
  options?: any;
  refresh: (token: string) => Promise<void>;
} & React.PropsWithChildren<{}>;

type State = {
  socket: Socket;
  history: Array<Socket>;
};

export class SocketProvider extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);

    const {url = SOCKET_URL, params = {}} = this.props;
    const socket = new Socket(url, {params});

    this.state = {
      socket,
      history: [],
    };
  }

  async componentDidMount() {
    const {url = SOCKET_URL} = this.props;
    const token = await API.getAccessToken();
    const socket = new Socket(url, {
      params: {token},
    });

    this.setState({socket, history: [socket]}, () => this.connect());
  }

  componentWillUnmount() {
    this.disconnect();
  }

  createNewSocket = () => {
    const {url = SOCKET_URL} = this.props;

    return new Socket(url, {params: {token: API.getAccessToken()}});
  };

  connect = () => {
    const {socket} = this.state;

    socket.connect();

    socket.onOpen(() => {
      console.debug(`Successfully connected to socket!`);
    });

    socket.onClose(() => {
      console.debug(`Socket successfully closed!`);
    });

    socket.onError(() => {
      console.error(
        `Error connecting to socket. Try refreshing the page.`,
        socket
      );
    });
  };

  reconnect = () => {
    this.disconnect(async () => {
      const token = await API.getRefreshToken();

      if (!token) {
        // Attempt connect again
        return this.connect();
      }

      await this.props.refresh(token);

      const socket = this.createNewSocket();

      this.setState({socket, history: [socket, ...this.state.history]}, () =>
        this.connect()
      );
    });
  };

  disconnect = (cb = noop) => {
    const {socket} = this.state;

    socket.disconnect(cb);
  };

  render() {
    return (
      <SocketContext.Provider value={{socket: this.state.socket}}>
        {this.props.children}
      </SocketContext.Provider>
    );
  }
}

export default SocketProvider;
