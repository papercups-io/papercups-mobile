import * as React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import tailwind from 'tailwind-rn';

export const ChatFooter = ({
  onSendMessage,
}: {
  onSendMessage: (message: string) => void;
}) => {
  const [message, setNewMessage] = React.useState('');

  const handleSendMessage = () => {
    onSendMessage(message);
    setNewMessage('');
  };

  return (
    <View style={tailwind('px-4 pb-4 pt-3 flex-row items-end')}>
      <TextInput
        style={{
          ...tailwind('p-3 rounded-xl border-gray-200 bg-gray-50 flex-1'),
          borderWidth: StyleSheet.hairlineWidth,
        }}
        multiline
        placeholder="Send a message..."
        value={message}
        onChangeText={setNewMessage}
      />

      <TouchableOpacity
        style={{
          ...tailwind(
            'border ml-3 py-3 px-5 border-gray-100 rounded-xl items-center'
          ),
        }}
        activeOpacity={0.4}
        onPress={handleSendMessage}
      >
        <Text style={tailwind(`text-${message ? 'blue' : 'gray'}-500`)}>
          Send
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default ChatFooter;
