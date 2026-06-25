import { View, Text, Pressable, ScrollView, RefreshControl } from "react-native";
import { router } from "expo-router";
import { useAuth } from "@/lib/auth-context";
import { useEffect, useState, useCallback } from "react";
import { getAnalyses } from "@/lib/api";
import type { Analysis } from "@/lib/types";
import { FREE_ANALYSIS_LIMIT } from "@/lib/types";

export default function Home() {
  const { profile, session, loading, refreshProfile } = useAuth();
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    const data = await getAnalyses();
    setAnalyses(data);
  }, []);

  useEffect(() => {
    if (session) loadData();
  }, [session, loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadData(), refreshProfile()]);
    setRefreshing(false);
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <Text className="text-gray-400">Loading...</Text>
      </View>
    );
  }

  const firstName = profile?.full_name?.split(" ")[0] ?? "there";
  const isFree = profile?.plan !== "pro";
  const usedCount = profile?.analyses_count ?? 0;

  const handleNewAnalysis = () => {
    if (isFree && usedCount >= FREE_ANALYSIS_LIMIT) {
      router.push("/upgrade");
    } else {
      router.push("/analyse");
    }
  };

  return (
    <ScrollView
      className="flex-1 bg-white"
      contentContainerClassName="px-6 pt-16 pb-8"
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <Text className="text-2xl font-bold text-gray-900 mb-6">
        Hi {firstName} 👋
      </Text>

      <Pressable
        className="bg-primary rounded-2xl p-6 mb-6 active:bg-primary-dark"
        onPress={handleNewAnalysis}
      >
        <Text className="text-white text-xl font-bold mb-1">
          Analyse a new job
        </Text>
        <Text className="text-blue-100 text-sm">
          Get your match score, rewritten CV & more
        </Text>
      </Pressable>

      {isFree && (
        <Pressable
          className="bg-amber/10 border border-amber/30 rounded-xl p-4 mb-6"
          onPress={() => router.push("/upgrade")}
        >
          <Text className="text-amber text-sm font-semibold">
            {usedCount} of {FREE_ANALYSIS_LIMIT} free analyses used
          </Text>
          <Text className="text-amber/70 text-xs mt-0.5">
            Upgrade to Pro for unlimited analyses →
          </Text>
        </Pressable>
      )}

      {analyses.length > 0 && (
        <View>
          <Text className="text-lg font-semibold text-gray-900 mb-3">
            Past analyses
          </Text>
          {analyses.map((a) => (
            <Pressable
              key={a.id}
              className="border border-gray-200 rounded-xl p-4 mb-3 active:bg-gray-50"
              onPress={() => router.push(`/results/${a.id}`)}
            >
              <View className="flex-row justify-between items-start">
                <View className="flex-1 mr-3">
                  <Text
                    className="text-base font-semibold text-gray-900"
                    numberOfLines={1}
                  >
                    {a.job_title}
                  </Text>
                  <Text className="text-sm text-gray-500" numberOfLines={1}>
                    {a.company_name}
                  </Text>
                </View>
                <ScoreBadge score={a.match_score} />
              </View>
              <Text className="text-xs text-gray-400 mt-2">
                {new Date(a.created_at).toLocaleDateString()}
              </Text>
            </Pressable>
          ))}
        </View>
      )}

      {analyses.length === 0 && !loading && (
        <View className="items-center mt-8">
          <Text className="text-gray-400 text-base text-center">
            No analyses yet.{"\n"}Tap above to get started!
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

function ScoreBadge({ score }: { score: number }) {
  const color =
    score >= 71
      ? "bg-green-100 text-green-700"
      : score >= 41
        ? "bg-amber-100 text-amber-700"
        : "bg-red-100 text-red-700";

  return (
    <View className={`rounded-lg px-3 py-1.5 ${color.split(" ")[0]}`}>
      <Text className={`text-base font-bold ${color.split(" ")[1]}`}>
        {score}
      </Text>
    </View>
  );
}
