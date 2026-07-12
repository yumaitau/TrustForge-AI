import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, RefreshControl, Text, View } from "react-native";
import { api, type TrustAlert } from "@/api/client";

const describe = (alert: TrustAlert) => {
  if (alert.kind === "score_drop") return `Trust score dropped ${typeof alert.payload.scoreDelta === "number" ? `by ${Math.abs(alert.payload.scoreDelta)} points` : ""}`;
  if (alert.kind === "new_finding") return `New ${typeof alert.payload.severity === "string" ? alert.payload.severity : ""} security finding`;
  return "Verification level changed";
};

export function AlertsScreen() {
  const [alerts, setAlerts] = useState<TrustAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      setAlerts(await api.alerts());
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Failed to load alerts");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const acknowledge = async (id: string) => {
    await api.acknowledgeAlerts([id]).catch(() => undefined);
    setAlerts((current) => current.filter((alert) => alert.id !== id));
  };

  if (loading) return <ActivityIndicator accessibilityLabel="Loading alerts" style={{ marginTop: 32 }} />;

  return (
    <View style={{ flex: 1, padding: 16 }}>
      {error && <Text accessibilityRole="alert" style={{ color: "#b91c1c", marginBottom: 8 }}>{error}</Text>}
      <FlatList
        data={alerts}
        keyExtractor={(alert) => alert.id}
        refreshControl={<RefreshControl refreshing={false} onRefresh={load} />}
        renderItem={({ item }) => (
          <View accessible accessibilityLabel={`${describe(item)} for a followed subject on ${new Date(item.createdAt).toLocaleString()}`} style={{ paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#e5e7eb", flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <View style={{ flexShrink: 1, paddingRight: 8 }}>
              <Text style={{ fontWeight: "600" }}>{describe(item)}</Text>
              <Text style={{ color: "#6b7280" }}>{item.subjectType} · {new Date(item.createdAt).toLocaleString()}</Text>
            </View>
            <Pressable accessibilityRole="button" accessibilityLabel="Acknowledge alert" onPress={() => acknowledge(item.id)} style={{ backgroundColor: "#1d4ed8", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8 }}>
              <Text style={{ color: "white" }}>Done</Text>
            </Pressable>
          </View>
        )}
        ListEmptyComponent={<Text style={{ color: "#6b7280" }}>No pending alerts. Follow subjects from their trust profile to get score-drop and finding alerts.</Text>}
      />
    </View>
  );
}
