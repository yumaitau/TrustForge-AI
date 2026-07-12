import { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, ScrollView, Text, View } from "react-native";
import { api, type Favorite, type TrustScoreRecord } from "@/api/client";
import { TrustScoreBadge } from "@/components/TrustScoreBadge";

type Comparison = { favorite: Favorite; score: TrustScoreRecord | null };

export function CompareScreen() {
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [selected, setSelected] = useState<Favorite[]>([]);
  const [comparison, setComparison] = useState<Comparison[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.favorites().then(setFavorites).catch((caught) => setError(caught instanceof Error ? caught.message : "Failed to load favorites")).finally(() => setLoading(false));
  }, []);

  const toggle = (favorite: Favorite) => {
    setComparison(null);
    setSelected((current) => current.some((item) => item.id === favorite.id)
      ? current.filter((item) => item.id !== favorite.id)
      : current.length >= 4 ? current : [...current, favorite]);
  };

  const runComparison = async () => {
    setLoading(true);
    setError(null);
    try {
      setComparison(await Promise.all(selected.map(async (favorite) => ({ favorite, score: await api.trustScore(favorite.subjectType, favorite.subjectId).catch(() => null) }))));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Comparison failed");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <ActivityIndicator accessibilityLabel="Loading" style={{ marginTop: 32 }} />;

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
      {error && <Text accessibilityRole="alert" style={{ color: "#b91c1c" }}>{error}</Text>}
      <Text accessibilityRole="header" style={{ fontSize: 17, fontWeight: "600" }}>Pick two to four favorites</Text>
      <FlatList
        data={favorites}
        scrollEnabled={false}
        keyExtractor={(favorite) => favorite.id}
        renderItem={({ item }) => {
          const isSelected = selected.some((favorite) => favorite.id === item.id);
          return (
            <Pressable
              accessibilityRole="checkbox"
              accessibilityState={{ checked: isSelected }}
              accessibilityLabel={`${item.label ?? item.subjectId}, ${item.subjectType}`}
              onPress={() => toggle(item)}
              style={{ paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#e5e7eb", flexDirection: "row", justifyContent: "space-between" }}
            >
              <Text style={{ fontSize: 16 }}>{item.label ?? item.subjectId}</Text>
              <Text style={{ color: isSelected ? "#1d4ed8" : "#9ca3af", fontWeight: "600" }}>{isSelected ? "Selected" : "Select"}</Text>
            </Pressable>
          );
        }}
        ListEmptyComponent={<Text style={{ color: "#6b7280" }}>Save favorites from a trust profile first, then compare them here.</Text>}
      />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Compare ${selected.length} subjects`}
        disabled={selected.length < 2}
        onPress={runComparison}
        style={{ backgroundColor: selected.length < 2 ? "#9ca3af" : "#1d4ed8", borderRadius: 10, padding: 14, alignItems: "center" }}
      >
        <Text style={{ color: "white", fontWeight: "600" }}>Compare ({selected.length}/4)</Text>
      </Pressable>
      {comparison?.map(({ favorite, score }) => (
        <View key={favorite.id} accessible accessibilityLabel={`${favorite.label ?? favorite.subjectId}: ${score ? `trust score ${Math.round(Number(score.score))} out of 100` : "no trust score yet"}`} style={{ borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 10, padding: 12, gap: 6 }}>
          <Text style={{ fontSize: 16, fontWeight: "600" }}>{favorite.label ?? favorite.subjectId}</Text>
          <TrustScoreBadge score={score ? Number(score.score) : null} />
          {score?.explanation?.summary ? <Text style={{ color: "#374151" }}>{score.explanation.summary}</Text> : <Text style={{ color: "#6b7280" }}>No published score. Missing evidence is explicit, never hidden.</Text>}
        </View>
      ))}
    </ScrollView>
  );
}
