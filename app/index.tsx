import { View, Text, Pressable, StyleSheet } from "react-native";
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
      <View style={styles.center} className="flex-1 items-center justify-center bg-white">
        <Text style={styles.loadingText} className="text-lg text-gray-400">Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container} className="flex-1 bg-white px-6 justify-center items-center">
      <View style={styles.header} className="items-center mb-12">
        <Text style={styles.logo} className="text-5xl font-bold text-primary mb-3">
          HireFast
        </Text>
        <Text style={styles.tagline} className="text-xl text-gray-500 text-center">
          Land your dream job faster
        </Text>
      </View>

      <View style={styles.benefits} className="w-full max-w-sm mb-12">
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

      <View style={styles.buttons} className="w-full max-w-sm">
        <Pressable
          style={styles.primaryBtn}
          className="bg-primary rounded-2xl py-4 items-center mb-4 active:bg-primary-dark"
          onPress={() => router.push("/auth/signup")}
        >
          <Text style={styles.primaryBtnText} className="text-white text-lg font-semibold">
            Get started free
          </Text>
        </Pressable>
        <Pressable
          style={styles.secondaryBtn}
          className="py-4 items-center"
          onPress={() => router.push("/auth/login")}
        >
          <Text style={styles.secondaryBtnText} className="text-primary text-base font-medium">
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
    <View style={styles.benefitRow} className="flex-row items-center mb-5">
      <Text style={styles.benefitIcon} className="text-3xl mr-4">{icon}</Text>
      <View>
        <Text style={styles.benefitTitle} className="text-base font-semibold text-gray-900">
          {title}
        </Text>
        <Text style={styles.benefitSubtitle} className="text-sm text-gray-500">
          {subtitle}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  loadingText: {
    fontSize: 18,
    color: "#9CA3AF",
  },
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingHorizontal: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    alignItems: "center",
    marginBottom: 48,
  },
  logo: {
    fontSize: 48,
    fontWeight: "bold",
    color: "#2563EB",
    marginBottom: 12,
  },
  tagline: {
    fontSize: 20,
    color: "#6B7280",
    textAlign: "center",
  },
  benefits: {
    width: "100%",
    maxWidth: 384,
    marginBottom: 48,
  },
  benefitRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  benefitIcon: {
    fontSize: 30,
    marginRight: 16,
  },
  benefitTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
  },
  benefitSubtitle: {
    fontSize: 14,
    color: "#6B7280",
  },
  buttons: {
    width: "100%",
    maxWidth: 384,
  },
  primaryBtn: {
    backgroundColor: "#2563EB",
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
    marginBottom: 16,
  },
  primaryBtnText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  secondaryBtn: {
    paddingVertical: 16,
    alignItems: "center",
  },
  secondaryBtnText: {
    color: "#2563EB",
    fontSize: 16,
    fontWeight: "500",
  },
});
