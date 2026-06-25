import { View, Text, Pressable, Alert, Platform } from "react-native";
import { router } from "expo-router";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";

export default function Settings() {
  const { profile } = useAuth();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.replace("/");
  };

  const confirmSignOut = () => {
    if (Platform.OS === "web") {
      if (window.confirm("Are you sure you want to sign out?")) {
        handleSignOut();
      }
    } else {
      Alert.alert("Sign out", "Are you sure?", [
        { text: "Cancel", style: "cancel" },
        { text: "Sign out", style: "destructive", onPress: handleSignOut },
      ]);
    }
  };

  return (
    <View className="flex-1 bg-white px-6 pt-16">
      <Text className="text-2xl font-bold text-gray-900 mb-8">Settings</Text>

      <View className="bg-surface rounded-xl p-4 mb-6">
        <Text className="text-sm text-gray-500 mb-1">Name</Text>
        <Text className="text-base text-gray-900 font-medium">
          {profile?.full_name ?? "—"}
        </Text>
        <View className="h-px bg-gray-200 my-3" />
        <Text className="text-sm text-gray-500 mb-1">Email</Text>
        <Text className="text-base text-gray-900 font-medium">
          {profile?.email ?? "—"}
        </Text>
      </View>

      <View className="bg-surface rounded-xl p-4 mb-6">
        <Text className="text-sm text-gray-500 mb-1">Subscription</Text>
        <Text className="text-base text-gray-900 font-semibold capitalize">
          {profile?.plan ?? "free"} plan
        </Text>
        {profile?.plan !== "pro" && (
          <Pressable
            className="mt-3 bg-primary rounded-lg py-2.5 items-center"
            onPress={() => router.push("/upgrade")}
          >
            <Text className="text-white font-semibold text-sm">
              Upgrade to Pro
            </Text>
          </Pressable>
        )}
        {profile?.plan === "pro" && (
          <Text className="text-sm text-gray-500 mt-1">
            Unlimited analyses enabled
          </Text>
        )}
      </View>

      <Pressable
        className="border border-red-200 rounded-xl py-3.5 items-center active:bg-red-50"
        onPress={confirmSignOut}
      >
        <Text className="text-danger font-semibold">Sign out</Text>
      </Pressable>
    </View>
  );
}
