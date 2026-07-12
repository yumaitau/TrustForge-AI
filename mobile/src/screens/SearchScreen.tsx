import { useState } from "react";
import { ActivityIndicator, FlatList, Pressable, Text, TextInput, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { api, type SearchResult, type SubjectType } from "@/api/client";
import type { RootStackParamList } from "@/navigation";

export function SearchScreen({ navigation }: NativeStackScreenProps<RootStackParamList, "Search">) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runSearch = async () => {
    if (query.trim().length < 2) return;
    setLoading(true);
    setError(null);
    try {
      setResults(await api.search(query.trim()));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Search failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, padding: 16, gap: 12 }}>
      <TextInput
        value={query}
        onChangeText={setQuery}
        onSubmitEditing={runSearch}
        placeholder="Search AI companies, products, MCP servers…"
        accessibilityLabel="Search the TrustForge registry"
        accessibilityHint="Enter at least two characters, then submit to search"
        returnKeyType="search"
        autoCapitalize="none"
        style={{ borderWidth: 1, borderColor: "#d1d5db", borderRadius: 10, padding: 12, fontSize: 16 }}
      />
      {loading && <ActivityIndicator accessibilityLabel="Searching" />}
      {error && <Text accessibilityRole="alert" style={{ color: "#b91c1c" }}>{error}</Text>}
      <FlatList
        data={results}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${item.name}, ${item.type}${item.verificationLevel && item.verificationLevel !== "unverified" ? ", verified" : ""}`}
            accessibilityHint="Opens the trust profile"
            onPress={() => navigation.navigate("Subject", { subjectType: (item.type === "company" ? "company" : item.type) as SubjectType, subjectId: item.id, name: item.name })}
            style={{ paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#e5e7eb" }}
          >
            <Text style={{ fontSize: 16, fontWeight: "600" }}>{item.name}</Text>
            <Text style={{ color: "#6b7280" }}>{item.type}{item.verificationLevel && item.verificationLevel !== "unverified" ? ` · ${item.verificationLevel.replaceAll("_", " ")}` : ""}</Text>
          </Pressable>
        )}
        ListEmptyComponent={!loading && !error ? <Text style={{ color: "#6b7280" }}>Search the registry to inspect trust scores, evidence, and findings.</Text> : null}
      />
    </View>
  );
}
