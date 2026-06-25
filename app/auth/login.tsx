import { View, Text, TextInput, Pressable, Alert, Platform } from "react-native";
import { useState } from "react";
import { router } from "expo-router";
import { supabase } from "@/lib/supabase";
import * as WebBrowser from "expo-web-browser";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) return;
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setLoading(false);
    if (error) {
      Alert.alert("Error", error.message);
    } else {
      router.replace("/(tabs)/home");
    }
  };

  const handleGoogleLogin = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: "hirefast://auth/callback",
        skipBrowserRedirect: true,
      },
    });
    if (error) {
      Alert.alert("Error", error.message);
      return;
    }
    if (data.url) {
      if (Platform.OS === "web") {
        window.location.href = data.url;
      } else {
        await WebBrowser.openAuthSessionAsync(data.url, "hirefast://auth/callback");
      }
    }
  };

  return (
    <View className="flex-1 bg-white px-6 justify-center">
      <Pressable className="mb-8" onPress={() => router.back()}>
        <Text className="text-primary text-base">← Back</Text>
      </Pressable>

      <Text className="text-3xl font-bold text-gray-900 mb-2">Welcome back</Text>
      <Text className="text-base text-gray-500 mb-8">
        Sign in to your account
      </Text>

      <TextInput
        className="border border-gray-300 rounded-xl px-4 py-3.5 text-base mb-3 bg-white text-gray-900"
        placeholder="Email"
        placeholderTextColor="#9CA3AF"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <TextInput
        className="border border-gray-300 rounded-xl px-4 py-3.5 text-base mb-6 bg-white text-gray-900"
        placeholder="Password"
        placeholderTextColor="#9CA3AF"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <Pressable
        className="bg-primary rounded-2xl py-4 items-center mb-4 active:bg-primary-dark"
        onPress={handleLogin}
        disabled={loading}
      >
        <Text className="text-white text-lg font-semibold">
          {loading ? "Signing in..." : "Sign in"}
        </Text>
      </Pressable>

      <View className="flex-row items-center my-4">
        <View className="flex-1 h-px bg-gray-200" />
        <Text className="mx-4 text-gray-400 text-sm">or</Text>
        <View className="flex-1 h-px bg-gray-200" />
      </View>

      <Pressable
        className="border border-gray-300 rounded-2xl py-4 items-center mb-6 active:bg-gray-50"
        onPress={handleGoogleLogin}
      >
        <Text className="text-gray-700 text-base font-medium">
          Continue with Google
        </Text>
      </Pressable>

      <Pressable onPress={() => router.replace("/auth/signup")}>
        <Text className="text-center text-gray-500">
          Don't have an account?{" "}
          <Text className="text-primary font-medium">Sign up</Text>
        </Text>
      </Pressable>
    </View>
  );
}
