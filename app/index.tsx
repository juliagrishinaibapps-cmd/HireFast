import { View, Text, Pressable } from "react-native";
import { router } from "expo-router";
import { useAuth } from "@/lib/auth-context";
import { useEffect } from "react";

export default function Onboarding() {
  const { session, loading } = useAuth();

  useEffect(() => {
    if (!loading && session) {
      router.replace("/(tabs)/home");
    }
  }, [loading, session]);

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <Text className="text-lg text-gray-400">Loading...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white px-6 justify-center items-center">
      <View className="items-center mb-12">
        <Text className="text-5xl font-bold text-primary mb-3">HireFast</Text>
        <Text className="text-xl text-gray-500 text-center">
          Land your dream job faster
        </Text>
      </View>

      <View className="w-full max-w-sm mb-12">
        <BenefitRow
          icon="📄"
          title="AI CV Rewriting"
          subtitle="Tailored to every job listing"
        />
        <BenefitRow
          icon="🎯"
          title="Match Score"
          subtitle="Know your chances before applying"
        />
        <BenefitRow
          icon="🎤"
          title="Interview Prep"
          subtitle="Role-specific questions & answers"
        />
      </View>

      <View className="w-full max-w-sm">
        <Pressable
          className="bg-primary rounded-2xl py-4 items-center mb-4 active:bg-primary-dark"
          onPress={() => router.push("/auth/signup")}
        >
          <Text className="text-white text-lg font-semibold">
            Get started free
          </Text>
        </Pressable>
        <Pressable
          className="py-4 items-center"
          onPress={() => router.push("/auth/login")}
        >
          <Text className="text-primary text-base font-medium">
            I already have an account
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

function BenefitRow({
  icon,
  title,
  subtitle,
}: {
  icon: string;
  title: string;
  subtitle: string;
}) {
  return (
    <View className="flex-row items-center mb-5">
      <Text className="text-3xl mr-4">{icon}</Text>
      <View>
        <Text className="text-base font-semibold text-gray-900">{title}</Text>
        <Text className="text-sm text-gray-500">{subtitle}</Text>
      </View>
    </View>
  );
}
