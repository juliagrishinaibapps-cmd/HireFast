import { View, Text, Pressable, Platform, Alert } from "react-native";
import { router } from "expo-router";
import { createCheckoutSession } from "@/lib/api";
import { useState } from "react";
import * as WebBrowser from "expo-web-browser";

export default function Upgrade() {
  const [loading, setLoading] = useState(false);

  const handlePurchase = async (priceType: "monthly" | "annual") => {
    setLoading(true);
    try {
      if (Platform.OS === "web") {
        const url = await createCheckoutSession(priceType);
        window.location.href = url;
      } else {
        // Android: In production, use react-native-iap
        // For now, open Stripe checkout in browser
        const url = await createCheckoutSession(priceType);
        await WebBrowser.openBrowserAsync(url);
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Something went wrong";
      Alert.alert("Error", message);
    }
    setLoading(false);
  };

  return (
    <View className="flex-1 bg-white px-6 justify-center">
      <Pressable className="mb-8" onPress={() => router.back()}>
        <Text className="text-primary text-base">← Back</Text>
      </Pressable>

      <Text className="text-3xl font-bold text-gray-900 mb-2 text-center">
        Upgrade to Pro
      </Text>
      <Text className="text-base text-gray-500 text-center mb-8">
        Unlimited AI-powered job analyses
      </Text>

      <Pressable
        className="border-2 border-primary bg-blue-50 rounded-2xl p-5 mb-4"
        onPress={() => handlePurchase("annual")}
        disabled={loading}
      >
        <View className="flex-row justify-between items-center mb-2">
          <Text className="text-lg font-bold text-gray-900">Pro Annual</Text>
          <View className="bg-accent rounded-full px-3 py-1">
            <Text className="text-white text-xs font-bold">SAVE 34%</Text>
          </View>
        </View>
        <Text className="text-2xl font-bold text-primary">
          $149<Text className="text-sm font-normal text-gray-500">/year</Text>
        </Text>
        <View className="bg-amber-100 rounded-full px-3 py-1 self-start mt-2">
          <Text className="text-amber-800 text-xs font-semibold">
            🏆 Founding member — first 100 users
          </Text>
        </View>
      </Pressable>

      <Pressable
        className="border border-gray-200 rounded-2xl p-5 mb-8"
        onPress={() => handlePurchase("monthly")}
        disabled={loading}
      >
        <Text className="text-lg font-bold text-gray-900 mb-1">
          Pro Monthly
        </Text>
        <Text className="text-2xl font-bold text-gray-900">
          $19<Text className="text-sm font-normal text-gray-500">/month</Text>
        </Text>
        <View className="bg-amber-100 rounded-full px-3 py-1 self-start mt-2">
          <Text className="text-amber-800 text-xs font-semibold">
            🏆 Founding member — first 100 users
          </Text>
        </View>
      </Pressable>

      <View className="mb-6">
        <FeatureRow text="Unlimited job analyses" />
        <FeatureRow text="AI-rewritten CVs for every job" />
        <FeatureRow text="Personalised cover letters" />
        <FeatureRow text="Interview prep with 10 questions" />
        <FeatureRow text="PDF exports" />
        <FeatureRow text="All future features included" />
      </View>

      {loading && (
        <Text className="text-center text-gray-400 text-sm">
          Preparing checkout...
        </Text>
      )}
    </View>
  );
}

function FeatureRow({ text }: { text: string }) {
  return (
    <View className="flex-row items-center mb-2.5">
      <Text className="text-accent mr-3 text-base">✓</Text>
      <Text className="text-sm text-gray-700">{text}</Text>
    </View>
  );
}
