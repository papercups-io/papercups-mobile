import React, {useContext} from 'react';

import Storage, {AUTH_CACHE_KEY} from '../storage';
import * as API from '../api';
import logger from '../logger';

export const AuthContext = React.createContext<{
  isAuthenticated: boolean;
  tokens: any | null;
  loading: boolean;
  register: (params: any) => Promise<void>;
  login: (params: any) => Promise<void>;
  logout: () => Promise<void>;
  refresh: (token: string) => Promise<void>;
}>({
  isAuthenticated: false,
  tokens: null,
  loading: false,
  register: () => Promise.resolve(),
  login: () => Promise.resolve(),
  logout: () => Promise.resolve(),
  refresh: () => Promise.resolve(),
});

export const useAuth = () => useContext(AuthContext);

// Refresh every 20 mins
const AUTH_SESSION_TTL = 20 * 60 * 1000;

type Props = React.PropsWithChildren<{}>;
type State = {
  loading: boolean;
  tokens: any;
  isAuthenticated: boolean;
};

export class AuthProvider extends React.Component<Props, State> {
  timeout: any = null;

  constructor(props: Props) {
    super(props);

    this.state = {
      loading: true,
      isAuthenticated: false,
      tokens: null,
    };
  }

  async componentDidMount() {
    const tokens = await Storage.get(AUTH_CACHE_KEY);
    const refreshToken = tokens && tokens.renew_token;

    if (!refreshToken) {
      this.setState({loading: false});

      return;
    }

    // Attempt refresh auth session on load
    await this.refresh(refreshToken);

    this.setState({tokens, loading: false});
  }

  componentWillUnmount() {
    clearTimeout(this.timeout);

    this.timeout = null;
  }

  handleAuthSuccess = async (tokens: any) => {
    Storage.set(AUTH_CACHE_KEY, tokens);
    this.setState({tokens, isAuthenticated: true});
    const nextRefreshToken = tokens && tokens.renew_token;

    // Refresh the session every 20 mins to avoid the access token expiring
    // (By default, the session will expire after 30 mins)
    this.timeout = setTimeout(
      () => this.refresh(nextRefreshToken),
      AUTH_SESSION_TTL
    );

    return tokens;
  };

  handleClearAuth = () => {
    Storage.remove(AUTH_CACHE_KEY);

    this.setState({tokens: null, isAuthenticated: false});
  };

  refresh = async (refreshToken: string) => {
    return API.renew(refreshToken)
      .then((tokens) => this.handleAuthSuccess(tokens))
      .catch((err) => {
        logger.error('Invalid session:', err);
      });
  };

  register = async (params: API.RegisterParams): Promise<void> => {
    console.debug('Signing up!');
    // Set user, authenticated status, etc
    return API.register(params)
      .then((tokens) => this.handleAuthSuccess(tokens))
      .then(() => {
        console.debug('Successfully signed up!');
      });
  };

  login = async (params: API.LoginParams): Promise<void> => {
    console.debug('Logging in!');
    // Set user, authenticated status, etc
    return API.login(params)
      .then((tokens) => this.handleAuthSuccess(tokens))
      .then(() => {
        console.debug('Successfully logged in!');
      });
  };

  logout = async (): Promise<void> => {
    console.debug('Logging out!');
    // Set user, authenticated status, etc
    return API.logout()
      .then(() => this.handleClearAuth())
      .then(() => {
        console.debug('Successfully logged out!');
      });
  };

  render() {
    const {loading, isAuthenticated, tokens} = this.state;

    return (
      <AuthContext.Provider
        value={{
          isAuthenticated,
          tokens,
          loading,
          register: this.register,
          login: this.login,
          logout: this.logout,
          refresh: this.refresh,
        }}
      >
        {this.props.children}
      </AuthContext.Provider>
    );
  }
}
