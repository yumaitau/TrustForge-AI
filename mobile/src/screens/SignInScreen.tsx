import { useState } from "react";
import { ActivityIndicator, Pressable, Text, TextInput, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { signInWithEmail } from "@/api/client";
import type { RootStackParamList } from "@/navigation";

export function SignInScreen({ navigation }: NativeStackScreenProps<RootStackParamList, "SignIn">) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!email.trim() || !password) return;
    setLoading(true);
    setError(null);
    try {
      await signInWithEmail(email.trim(), password);
      navigation.reset({ index: 0, routes: [{ name: "Search" }] });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Sign-in failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, padding: 24, justifyContent: "center", gap: 12 }}>
      <Text accessibilityRole="header" style={{ fontSize: 24, fontWeight: "700", marginBottom: 8 }}>Sign in to TrustForge</Text>
      <TextInput
        value={email}
        onChangeText={setEmail}
        placeholder="Email"
        accessibilityLabel="Email address"
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        textContentType="username"
        style={{ borderWidth: 1, borderColor: "#d1d5db", borderRadius: 10, padding: 12, fontSize: 16 }}
      />
      <TextInput
        value={password}
        onChangeText={setPassword}
        placeholder="Password"
        accessibilityLabel="Password"
        secureTextEntry
        autoComplete="password"
        textContentType="password"
        onSubmitEditing={submit}
        style={{ borderWidth: 1, borderColor: "#d1d5db", borderRadius: 10, padding: 12, fontSize: 16 }}
      />
      {error && <Text accessibilityRole="alert" style={{ color: "#b91c1c" }}>{error}</Text>}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Sign in"
        disabled={loading || !email.trim() || !password}
        onPress={submit}
        style={{ backgroundColor: loading || !email.trim() || !password ? "#9ca3af" : "#1d4ed8", borderRadius: 10, padding: 14, alignItems: "center" }}
      >
        {loading ? <ActivityIndicator color="white" accessibilityLabel="Signing in" /> : <Text style={{ color: "white", fontWeight: "600", fontSize: 16 }}>Sign in</Text>}
      </Pressable>
      <Text style={{ color: "#6b7280", marginTop: 8 }}>
        Your session token is stored in platform secure storage only. Passkey sign-in arrives with the store build.
      </Text>
    </View>
  );
}
