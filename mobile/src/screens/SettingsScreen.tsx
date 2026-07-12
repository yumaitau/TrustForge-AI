import { useEffect, useState } from "react";
import { Platform, Pressable, Switch, Text, TextInput, View } from "react-native";
import * as Notifications from "expo-notifications";
import { api, getBaseUrl, setBaseUrl, setToken } from "@/api/client";

export function SettingsScreen() {
  const [serverUrl, setServerUrl] = useState("");
  const [pushEnabled, setPushEnabled] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => { void getBaseUrl().then(setServerUrl); }, []);

  const registerForPush = async (enabled: boolean) => {
    setPushEnabled(enabled);
    setStatus(null);
    try {
      if (!enabled) { setStatus("Push disabled on this device."); return; }
      const permission = await Notifications.requestPermissionsAsync();
      if (!permission.granted) { setPushEnabled(false); setStatus("Notification permission was not granted."); return; }
      const token = await Notifications.getDevicePushTokenAsync();
      await api.registerDevice({ platform: Platform.OS === "ios" ? "ios" : "android", pushToken: String(token.data), pushEnabled: true, appVersion: "0.1.0" });
      setStatus("Push notifications registered. Payloads never contain sensitive content; details load over the authenticated API.");
    } catch (caught) {
      setPushEnabled(false);
      setStatus(caught instanceof Error ? caught.message : "Push registration failed");
    }
  };

  return (
    <View style={{ flex: 1, padding: 16, gap: 16 }}>
      <View>
        <Text accessibilityRole="header" style={{ fontSize: 17, fontWeight: "600" }}>Server</Text>
        <TextInput
          value={serverUrl}
          onChangeText={setServerUrl}
          onEndEditing={() => void setBaseUrl(serverUrl.trim())}
          accessibilityLabel="TrustForge server URL"
          accessibilityHint="Managed devices may pin this via device management"
          autoCapitalize="none"
          keyboardType="url"
          style={{ borderWidth: 1, borderColor: "#d1d5db", borderRadius: 10, padding: 12, marginTop: 6 }}
        />
      </View>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <Text style={{ fontSize: 16 }}>Trust-change push alerts</Text>
        <Switch value={pushEnabled} onValueChange={(value) => void registerForPush(value)} accessibilityLabel="Enable trust-change push alerts" />
      </View>
      {status && <Text accessibilityRole="alert" style={{ color: "#374151" }}>{status}</Text>}
      <Pressable accessibilityRole="button" accessibilityLabel="Sign out and clear local data" onPress={() => void setToken(null).then(() => setStatus("Signed out. Local session cleared from secure storage."))} style={{ backgroundColor: "#b91c1c", borderRadius: 10, padding: 14, alignItems: "center" }}>
        <Text style={{ color: "white", fontWeight: "600" }}>Sign out</Text>
      </Pressable>
      <Text style={{ color: "#6b7280" }}>
        TrustForge stores only your session token and favorites on this device, in platform secure storage. Evidence bodies and audit material are never cached locally.
      </Text>
    </View>
  );
}
