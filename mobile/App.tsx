import { useEffect, useState } from "react";
import { NavigationContainer, type LinkingOptions } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import * as Linking from "expo-linking";
import { StatusBar } from "expo-status-bar";
import { ActivityIndicator, Pressable, Text } from "react-native";
import { hasSession } from "@/api/client";
import type { RootStackParamList } from "@/navigation";
import { SignInScreen } from "@/screens/SignInScreen";
import { SearchScreen } from "@/screens/SearchScreen";
import { SubjectScreen } from "@/screens/SubjectScreen";
import { AlertsScreen } from "@/screens/AlertsScreen";
import { CompareScreen } from "@/screens/CompareScreen";
import { SettingsScreen } from "@/screens/SettingsScreen";

const Stack = createNativeStackNavigator<RootStackParamList>();

/** Mirrors the Universal Links / App Links paths served from /.well-known. */
const linking: LinkingOptions<RootStackParamList> = {
  prefixes: [Linking.createURL("/"), "https://trustforge.au"],
  config: {
    screens: {
      Search: "search",
      Subject: "registry/:subjectType/:subjectId",
      Alerts: "alerts",
      Compare: "compare",
      Settings: "settings",
    },
  },
};

export default function App() {
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  useEffect(() => { void hasSession().then(setSignedIn); }, []);
  if (signedIn === null) return <ActivityIndicator accessibilityLabel="Starting TrustForge" style={{ flex: 1 }} />;
  return (
    <NavigationContainer linking={linking}>
      <StatusBar style="auto" />
      <Stack.Navigator initialRouteName={signedIn ? "Search" : "SignIn"}>
        <Stack.Screen name="SignIn" component={SignInScreen} options={{ headerShown: false }} />
        <Stack.Screen
          name="Search"
          component={SearchScreen}
          options={({ navigation }) => ({
            title: "TrustForge",
            headerRight: () => (
              <>
                <Pressable accessibilityRole="button" accessibilityLabel="Open alerts" onPress={() => navigation.navigate("Alerts")} style={{ paddingHorizontal: 8 }}>
                  <Text style={{ fontSize: 16 }}>Alerts</Text>
                </Pressable>
                <Pressable accessibilityRole="button" accessibilityLabel="Compare favorites" onPress={() => navigation.navigate("Compare")} style={{ paddingHorizontal: 8 }}>
                  <Text style={{ fontSize: 16 }}>Compare</Text>
                </Pressable>
                <Pressable accessibilityRole="button" accessibilityLabel="Open settings" onPress={() => navigation.navigate("Settings")} style={{ paddingHorizontal: 8 }}>
                  <Text style={{ fontSize: 16 }}>Settings</Text>
                </Pressable>
              </>
            ),
          })}
        />
        <Stack.Screen name="Subject" component={SubjectScreen} options={({ route }) => ({ title: route.params.name })} />
        <Stack.Screen name="Alerts" component={AlertsScreen} options={{ title: "Trust alerts" }} />
        <Stack.Screen name="Compare" component={CompareScreen} options={{ title: "Compare" }} />
        <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: "Settings" }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
