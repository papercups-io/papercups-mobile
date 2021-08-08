import * as React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  Image,
} from 'react-native';
import tailwind from 'tailwind-rn';
import {useAuth} from '../components/AuthProvider';

export default function LoginScreen() {
  const {login} = useAuth();
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');

  const handleLogIn = async () => {
    try {
      await login({email, password});

      console.log('Logged in!');
    } catch (err) {
      console.log('Failed to login!', err);
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
          style={tailwind('w-72 p-2 rounded-lg bg-blue-400 mt-5 items-center')}
          activeOpacity={0.4}
          onPress={handleLogIn}
        >
          <Text style={tailwind('text-white text-lg')}>Log In</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
