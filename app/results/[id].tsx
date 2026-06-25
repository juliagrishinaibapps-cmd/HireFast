import {
  View,
  Text,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Platform,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { useEffect, useState } from "react";
import { getAnalysis } from "@/lib/api";
import type { Analysis, InterviewQuestion } from "@/lib/types";
import * as Clipboard from "expo-clipboard";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";

type Tab = "match" | "cv" | "cover" | "interview";

export default function Results() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("match");
  const [practiceMode, setPracticeMode] = useState(false);
  const [practiceIndex, setPracticeIndex] = useState(0);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (id) {
      getAnalysis(id).then((data) => {
        setAnalysis(data);
        setLoading(false);
      });
    }
  }, [id]);

  const copyToClipboard = async (text: string) => {
    await Clipboard.setStringAsync(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadPDF = async (content: string, title: string) => {
    const html = `
      <html><body style="font-family: Arial, sans-serif; padding: 40px; line-height: 1.6;">
        <h1 style="color: #1a1a1a;">${title}</h1>
        ${content.split("\n").map((line) => `<p>${line}</p>`).join("")}
      </body></html>
    `;
    const { uri } = await Print.printToFileAsync({ html });
    if (Platform.OS === "web") {
      const link = document.createElement("a");
      link.href = uri;
      link.download = `${title}.pdf`;
      link.click();
    } else {
      await Sharing.shareAsync(uri);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  if (!analysis) {
    return (
      <View className="flex-1 items-center justify-center bg-white px-6">
        <Text className="text-gray-500 text-center">Analysis not found.</Text>
        <Pressable className="mt-4" onPress={() => router.back()}>
          <Text className="text-primary font-medium">Go back</Text>
        </Pressable>
      </View>
    );
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: "match", label: "Match" },
    { key: "cv", label: "CV" },
    { key: "cover", label: "Cover" },
    { key: "interview", label: "Interview" },
  ];

  return (
    <View className="flex-1 bg-white">
      <View className="px-6 pt-16 pb-3">
        <Pressable className="mb-4" onPress={() => router.back()}>
          <Text className="text-primary text-base">← Back</Text>
        </Pressable>
        <Text className="text-xl font-bold text-gray-900" numberOfLines={1}>
          {analysis.job_title}
        </Text>
        <Text className="text-sm text-gray-500">{analysis.company_name}</Text>
      </View>

      <View className="flex-row px-6 mb-2">
        {tabs.map((tab) => (
          <Pressable
            key={tab.key}
            className={`flex-1 py-2.5 items-center rounded-lg mr-1 ${
              activeTab === tab.key ? "bg-primary" : "bg-gray-100"
            }`}
            onPress={() => {
              setActiveTab(tab.key);
              setPracticeMode(false);
            }}
          >
            <Text
              className={`text-sm font-semibold ${
                activeTab === tab.key ? "text-white" : "text-gray-600"
              }`}
            >
              {tab.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <ScrollView
        className="flex-1"
        contentContainerClassName="px-6 py-4 pb-8"
      >
        {activeTab === "match" && (
          <MatchTab analysis={analysis} />
        )}
        {activeTab === "cv" && (
          <CVTab
            cv={analysis.rewritten_cv}
            jobTitle={analysis.job_title}
            copied={copied}
            onCopy={() => copyToClipboard(analysis.rewritten_cv)}
            onDownload={() => downloadPDF(analysis.rewritten_cv, `CV - ${analysis.job_title}`)}
          />
        )}
        {activeTab === "cover" && (
          <CoverTab
            letter={analysis.cover_letter}
            copied={copied}
            onCopy={() => copyToClipboard(analysis.cover_letter)}
          />
        )}
        {activeTab === "interview" && (
          <InterviewTab
            questions={analysis.interview_questions}
            practiceMode={practiceMode}
            practiceIndex={practiceIndex}
            onTogglePractice={() => {
              setPracticeMode(!practiceMode);
              setPracticeIndex(0);
            }}
            onNext={() =>
              setPracticeIndex((i) =>
                i < analysis.interview_questions.length - 1 ? i + 1 : 0
              )
            }
          />
        )}
      </ScrollView>
    </View>
  );
}

function MatchTab({ analysis }: { analysis: Analysis }) {
  const score = analysis.match_score;
  const reasons = analysis.match_reasons;
  const scoreColor =
    score >= 71 ? "text-green-600" : score >= 41 ? "text-amber-500" : "text-red-500";
  const scoreBg =
    score >= 71 ? "bg-green-50" : score >= 41 ? "bg-amber-50" : "bg-red-50";

  return (
    <View>
      <View className={`${scoreBg} rounded-2xl p-8 items-center mb-6`}>
        <Text className={`text-6xl font-bold ${scoreColor}`}>{score}</Text>
        <Text className="text-sm text-gray-500 mt-2">
          Your CV match for this role
        </Text>
      </View>

      <Text className="text-base font-semibold text-gray-900 mb-3">
        Strengths
      </Text>
      {reasons.positives?.map((p, i) => (
        <View key={i} className="flex-row mb-2">
          <Text className="text-green-600 mr-2">✓</Text>
          <Text className="text-sm text-gray-700 flex-1">{p}</Text>
        </View>
      ))}

      <Text className="text-base font-semibold text-gray-900 mt-5 mb-3">
        Gaps
      </Text>
      {reasons.gaps?.map((g, i) => (
        <View key={i} className="flex-row mb-2">
          <Text className="text-red-500 mr-2">✗</Text>
          <Text className="text-sm text-gray-700 flex-1">{g}</Text>
        </View>
      ))}

      <Text className="text-base font-semibold text-gray-900 mt-5 mb-3">
        What to improve
      </Text>
      {reasons.improvements?.map((imp, i) => (
        <View key={i} className="flex-row mb-2">
          <Text className="text-primary mr-2">→</Text>
          <Text className="text-sm text-gray-700 flex-1">{imp}</Text>
        </View>
      ))}
    </View>
  );
}

function CVTab({
  cv,
  jobTitle,
  copied,
  onCopy,
  onDownload,
}: {
  cv: string;
  jobTitle: string;
  copied: boolean;
  onCopy: () => void;
  onDownload: () => void;
}) {
  return (
    <View>
      <View className="flex-row mb-4">
        <Pressable
          className="bg-primary rounded-lg px-4 py-2.5 mr-2 active:bg-primary-dark"
          onPress={onCopy}
        >
          <Text className="text-white text-sm font-medium">
            {copied ? "Copied ✓" : "Copy to clipboard"}
          </Text>
        </Pressable>
        <Pressable
          className="border border-primary rounded-lg px-4 py-2.5 active:bg-blue-50"
          onPress={onDownload}
        >
          <Text className="text-primary text-sm font-medium">
            Download PDF
          </Text>
        </Pressable>
      </View>
      <View className="bg-surface rounded-xl p-4">
        <Text className="text-sm text-gray-800 leading-6">{cv}</Text>
      </View>
    </View>
  );
}

function CoverTab({
  letter,
  copied,
  onCopy,
}: {
  letter: string;
  copied: boolean;
  onCopy: () => void;
}) {
  return (
    <View>
      <Pressable
        className="bg-primary rounded-lg px-4 py-2.5 self-start mb-4 active:bg-primary-dark"
        onPress={onCopy}
      >
        <Text className="text-white text-sm font-medium">
          {copied ? "Copied ✓" : "Copy to clipboard"}
        </Text>
      </Pressable>
      <View className="bg-surface rounded-xl p-4">
        <Text className="text-sm text-gray-800 leading-6">{letter}</Text>
      </View>
    </View>
  );
}

function InterviewTab({
  questions,
  practiceMode,
  practiceIndex,
  onTogglePractice,
  onNext,
}: {
  questions: InterviewQuestion[];
  practiceMode: boolean;
  practiceIndex: number;
  onTogglePractice: () => void;
  onNext: () => void;
}) {
  return (
    <View>
      <Pressable
        className={`rounded-lg px-4 py-2.5 self-start mb-4 ${
          practiceMode ? "bg-gray-200" : "bg-primary"
        }`}
        onPress={onTogglePractice}
      >
        <Text
          className={`text-sm font-medium ${
            practiceMode ? "text-gray-700" : "text-white"
          }`}
        >
          {practiceMode ? "Show all questions" : "Practice mode"}
        </Text>
      </Pressable>

      {practiceMode ? (
        <View>
          <Text className="text-xs text-gray-400 mb-2">
            Question {practiceIndex + 1} of {questions.length}
          </Text>
          <View className="bg-surface rounded-xl p-4 mb-4">
            <Text className="text-base font-semibold text-gray-900 mb-3">
              {questions[practiceIndex]?.question}
            </Text>
            <Text className="text-sm text-gray-600 leading-5">
              💡 {questions[practiceIndex]?.answer_structure}
            </Text>
          </View>
          <Pressable
            className="bg-primary rounded-lg py-3 items-center active:bg-primary-dark"
            onPress={onNext}
          >
            <Text className="text-white font-semibold">Next question →</Text>
          </Pressable>
        </View>
      ) : (
        questions.map((q, i) => (
          <View key={i} className="bg-surface rounded-xl p-4 mb-3">
            <Text className="text-sm font-semibold text-gray-900 mb-2">
              {i + 1}. {q.question}
            </Text>
            <Text className="text-sm text-gray-600 leading-5">
              💡 {q.answer_structure}
            </Text>
          </View>
        ))
      )}
    </View>
  );
}
