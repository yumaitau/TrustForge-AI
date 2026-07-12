import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { api, type SecurityFinding, type TrustScoreRecord } from "@/api/client";
import { TrustScoreBadge } from "@/components/TrustScoreBadge";
import type { RootStackParamList } from "@/navigation";

export function SubjectScreen({ route }: NativeStackScreenProps<RootStackParamList, "Subject">) {
  const { subjectType, subjectId, name } = route.params;
  const [score, setScore] = useState<TrustScoreRecord | null>(null);
  const [findings, setFindings] = useState<SecurityFinding[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [favoriteSaved, setFavoriteSaved] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [scoreResult, findingResults] = await Promise.all([api.trustScore(subjectType, subjectId), api.securityFindings(subjectType, subjectId).catch(() => [])]);
        if (!active) return;
        setScore(scoreResult);
        setFindings(findingResults.filter((finding) => !["resolved", "not_affected", "false_positive"].includes(finding.status)));
      } catch (caught) {
        if (active) setError(caught instanceof Error ? caught.message : "Failed to load trust profile");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [subjectType, subjectId]);

  const saveFavorite = async () => {
    try {
      await api.addFavorite({ subjectType, subjectId, label: name });
      setFavoriteSaved(true);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not save favorite");
    }
  };

  if (loading) return <ActivityIndicator accessibilityLabel="Loading trust profile" style={{ marginTop: 32 }} />;

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
      <Text accessibilityRole="header" style={{ fontSize: 22, fontWeight: "700" }}>{name}</Text>
      {error && <Text accessibilityRole="alert" style={{ color: "#b91c1c" }}>{error}</Text>}
      <TrustScoreBadge score={score ? Number(score.score) : null} confidenceSummary={score?.explanation?.summary} />
      {score && (
        <View accessible accessibilityLabel={`Methodology ${score.methodologyVersion}. ${score.explanation?.summary ?? ""}`}>
          <Text style={{ color: "#6b7280" }}>Methodology {score.methodologyVersion} · calculated {new Date(score.calculatedAt).toLocaleDateString()}</Text>
          {score.explanation?.summary ? <Text style={{ marginTop: 4 }}>{score.explanation.summary}</Text> : null}
        </View>
      )}
      {!score && <Text>No trust score has been calculated yet. A missing score is explicit, never hidden.</Text>}
      <View>
        <Text accessibilityRole="header" style={{ fontSize: 17, fontWeight: "600", marginBottom: 6 }}>Open security findings ({findings.length})</Text>
        {findings.length === 0 && <Text style={{ color: "#6b7280" }}>No open findings.</Text>}
        {findings.slice(0, 20).map((finding) => (
          <View key={finding.id} accessible accessibilityLabel={`${finding.severity} severity finding: ${finding.title}`} style={{ paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: "#e5e7eb" }}>
            <Text style={{ fontWeight: "600" }}>{finding.title}</Text>
            <Text style={{ color: "#6b7280" }}>{finding.severity}{finding.affectedComponent ? ` · ${finding.affectedComponent}` : ""}</Text>
          </View>
        ))}
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={favoriteSaved ? "Saved to favorites" : "Save to favorites"}
        disabled={favoriteSaved}
        onPress={saveFavorite}
        style={{ backgroundColor: favoriteSaved ? "#9ca3af" : "#1d4ed8", borderRadius: 10, padding: 14, alignItems: "center" }}
      >
        <Text style={{ color: "white", fontWeight: "600" }}>{favoriteSaved ? "Saved to favorites" : "Save to favorites"}</Text>
      </Pressable>
    </ScrollView>
  );
}
