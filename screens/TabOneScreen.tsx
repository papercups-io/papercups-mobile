import * as React from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import tailwind from "tailwind-rn";

export default function TabOneScreen() {
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");

  return (
    <SafeAreaView style={tailwind("h-full bg-white")}>
      <View style={tailwind("mt-24 items-center")}>
        <Image
          source={require("../assets/images/logo.png")}
          style={tailwind("w-24 h-24")}
          resizeMode={"contain"}
        />
      </View>
      <View style={tailwind("mt-8 items-center")}>
        <Text style={tailwind("text-3xl font-extralight mb-6")}>Papercups</Text>
        <TextInput
          style={{
            ...tailwind("w-72 h-12 px-4 rounded-xl border-gray-400 mb-4"),
            borderWidth: StyleSheet.hairlineWidth,
          }}
          placeholder="Email"
          onChangeText={setEmail}
          autoCapitalize={"none"}
          autoCompleteType="off"
          value={email}
        />
        <TextInput
          style={{
            ...tailwind("w-72 h-12 px-4 rounded-xl border-gray-400 mb-4"),
            borderWidth: StyleSheet.hairlineWidth,
          }}
          placeholder="Password"
          onChangeText={setPassword}
          autoCapitalize={"none"}
          autoCompleteType="off"
          secureTextEntry={true}
          value={password}
        />

        <TouchableOpacity
          style={tailwind("w-72 p-2 rounded-xl bg-blue-400 mt-5 items-center")}
          onPress={console.log}
        >
          <Text style={tailwind("text-white text-lg")}>Log In</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
