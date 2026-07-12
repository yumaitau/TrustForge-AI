import { Text, View } from "react-native";

/** Score badge with a full accessibility description — never colour alone. */
export function TrustScoreBadge({ score, confidenceSummary }: { score: number | null; confidenceSummary?: string }) {
  const label = score === null ? "No trust score yet" : `Trust score ${Math.round(score)} out of 100${confidenceSummary ? `. ${confidenceSummary}` : ""}`;
  const tone = score === null ? "#6b7280" : score >= 75 ? "#15803d" : score >= 50 ? "#a16207" : "#b91c1c";
  return (
    <View accessible accessibilityRole="text" accessibilityLabel={label} style={{ backgroundColor: tone, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6, alignSelf: "flex-start" }}>
      <Text style={{ color: "white", fontSize: 18, fontWeight: "700" }}>{score === null ? "—" : Math.round(score)}</Text>
    </View>
  );
}
