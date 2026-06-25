import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useState } from "react";
import { router } from "expo-router";
import * as DocumentPicker from "expo-document-picker";
import { runAnalysis } from "@/lib/api";

export default function Analyse() {
  const [step, setStep] = useState<1 | 2>(1);
  const [jobText, setJobText] = useState("");
  const [cvText, setCvText] = useState("");
  const [cvFileName, setCvFileName] = useState("");
  const [loading, setLoading] = useState(false);

  const handlePickCV = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: "application/pdf",
      copyToCacheDirectory: true,
    });

    if (!result.canceled && result.assets?.[0]) {
      const file = result.assets[0];
      setCvFileName(file.name);
      setCvText(`[PDF uploaded: ${file.name}]\n\nPlease paste your CV text below for best results, or the AI will work with the file name and any text it can extract.`);
    }
  };

  const handleAnalyse = async () => {
    if (!jobText.trim()) {
      Alert.alert("Missing info", "Please provide a job description.");
      return;
    }
    if (!cvText.trim()) {
      Alert.alert("Missing info", "Please provide your CV text.");
      return;
    }

    setLoading(true);
    try {
      const analysis = await runAnalysis(jobText, cvText);
      setLoading(false);
      router.replace(`/results/${analysis.id}`);
    } catch (err: unknown) {
      setLoading(false);
      const message =
        err instanceof Error ? err.message : "Something went wrong";
      Alert.alert("Error", message);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 bg-white items-center justify-center px-6">
        <ActivityIndicator size="large" color="#2563EB" />
        <Text className="text-lg font-semibold text-gray-900 mt-6 text-center">
          AI is reading your CV and the job listing...
        </Text>
        <Text className="text-sm text-gray-500 mt-2 text-center">
          This usually takes 15-30 seconds
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-white"
      contentContainerClassName="px-6 pt-16 pb-8"
      keyboardShouldPersistTaps="handled"
    >
      <Pressable className="mb-6" onPress={() => step === 2 ? setStep(1) : router.back()}>
        <Text className="text-primary text-base">← Back</Text>
      </Pressable>

      <Text className="text-2xl font-bold text-gray-900 mb-1">
        New analysis
      </Text>
      <Text className="text-sm text-gray-500 mb-6">
        Step {step} of 2
      </Text>

      {step === 1 && (
        <View>
          <Text className="text-base font-semibold text-gray-900 mb-2">
            Job description
          </Text>
          <Text className="text-sm text-gray-500 mb-3">
            Paste the job listing URL or the full description text
          </Text>
          <TextInput
            className="border border-gray-300 rounded-xl px-4 py-3 text-base bg-white text-gray-900 min-h-[200px]"
            placeholder="Paste job description here..."
            placeholderTextColor="#9CA3AF"
            value={jobText}
            onChangeText={setJobText}
            multiline
            textAlignVertical="top"
          />
          <Pressable
            className="bg-primary rounded-2xl py-4 items-center mt-6 active:bg-primary-dark"
            onPress={() => {
              if (!jobText.trim()) {
                Alert.alert("Missing info", "Please provide a job description.");
                return;
              }
              setStep(2);
            }}
          >
            <Text className="text-white text-lg font-semibold">
              Next: Add your CV
            </Text>
          </Pressable>
        </View>
      )}

      {step === 2 && (
        <View>
          <Text className="text-base font-semibold text-gray-900 mb-2">
            Your CV
          </Text>
          <Text className="text-sm text-gray-500 mb-3">
            Upload a PDF or paste your CV text
          </Text>

          <Pressable
            className="border-2 border-dashed border-gray-300 rounded-xl py-6 items-center mb-4 active:border-primary"
            onPress={handlePickCV}
          >
            <Text className="text-2xl mb-2">📄</Text>
            <Text className="text-sm font-medium text-gray-700">
              {cvFileName || "Upload PDF"}
            </Text>
            {cvFileName && (
              <Text className="text-xs text-green-600 mt-1">
                File selected ✓
              </Text>
            )}
          </Pressable>

          <View className="flex-row items-center my-3">
            <View className="flex-1 h-px bg-gray-200" />
            <Text className="mx-4 text-gray-400 text-sm">or paste text</Text>
            <View className="flex-1 h-px bg-gray-200" />
          </View>

          <TextInput
            className="border border-gray-300 rounded-xl px-4 py-3 text-base bg-white text-gray-900 min-h-[200px]"
            placeholder="Paste your CV text here..."
            placeholderTextColor="#9CA3AF"
            value={cvText}
            onChangeText={setCvText}
            multiline
            textAlignVertical="top"
          />

          <Pressable
            className="bg-primary rounded-2xl py-4 items-center mt-6 active:bg-primary-dark"
            onPress={handleAnalyse}
          >
            <Text className="text-white text-lg font-semibold">
              Analyse now
            </Text>
          </Pressable>
        </View>
      )}
    </ScrollView>
  );
}
