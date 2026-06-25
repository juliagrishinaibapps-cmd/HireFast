import "../global.css";
import { Stack } from "expo-router";
import { AuthProvider } from "@/lib/auth-context";
import { StatusBar } from "expo-status-bar";

export default function RootLayout() {
  return (
    <AuthProvider>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="auth/login" />
        <Stack.Screen name="auth/signup" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="analyse" />
        <Stack.Screen name="results/[id]" />
        <Stack.Screen name="upgrade" />
      </Stack>
    </AuthProvider>
  );
}
