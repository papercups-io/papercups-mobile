import * as React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  Image,
  ActivityIndicator,
} from 'react-native';
import tailwind from 'tailwind-rn';
import {useAuth} from '../components/AuthProvider';
import {formatServerError, sleep} from '../utils';

export default function LoginScreen() {
  const {login} = useAuth();
  const [pending, setPending] = React.useState(false);
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [error, setErrorMessage] = React.useState<string | null>(null);

  const handleLogIn = async () => {
    setPending(true);

    try {
      await login({email, password});

      console.log('Logged in!');
    } catch (err) {
      const formatted = formatServerError(err);
      console.error('Failed to login!', err);
      setErrorMessage(formatted);
      setPending(false);
    }
  };

  return (
    <SafeAreaView style={tailwind('h-full bg-white')}>
      <View style={tailwind('mt-24 items-center')}>
        <Image
          source={require('../assets/images/logo.png')}
          style={tailwind('w-24 h-24')}
          resizeMode={'contain'}
        />
      </View>
      <View style={tailwind('mt-8 items-center')}>
        <Text style={tailwind('text-3xl font-extralight mb-6')}>Papercups</Text>
        <TextInput
          style={{
            ...tailwind('w-72 h-12 px-4 rounded-lg border-gray-400 mb-4'),
            borderWidth: StyleSheet.hairlineWidth,
          }}
          placeholder="Email"
          onChangeText={setEmail}
          autoCapitalize={'none'}
          autoCompleteType="off"
          value={email}
        />
        <TextInput
          style={{
            ...tailwind('w-72 h-12 px-4 rounded-lg border-gray-400 mb-4'),
            borderWidth: StyleSheet.hairlineWidth,
          }}
          placeholder="Password"
          onChangeText={setPassword}
          autoCapitalize={'none'}
          autoCompleteType="off"
          secureTextEntry={true}
          value={password}
        />

        <TouchableOpacity
          style={tailwind(
            `w-72 p-2 rounded-lg bg-blue-400 mt-5 items-center ${
              pending ? 'bg-opacity-40' : ''
            }`
          )}
          activeOpacity={0.4}
          disabled={pending}
          onPress={handleLogIn}
        >
          {pending ? (
            <View style={tailwind('flex-row items-center justify-center')}>
              <ActivityIndicator color="white" />
              <Text style={tailwind('ml-2 text-white text-lg')}>
                Logging in...
              </Text>
            </View>
          ) : (
            <Text style={tailwind('text-white text-lg')}>Log in</Text>
          )}
        </TouchableOpacity>

        {error && (
          <View style={tailwind('mt-8')}>
            <Text style={tailwind('text-red-500')}>{error}</Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}
