import { NavigationContainer, type LinkingOptions } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import * as Linking from "expo-linking";
import { StatusBar } from "expo-status-bar";
import { Pressable, Text } from "react-native";
import type { RootStackParamList } from "@/navigation";
import { SearchScreen } from "@/screens/SearchScreen";
import { SubjectScreen } from "@/screens/SubjectScreen";
import { AlertsScreen } from "@/screens/AlertsScreen";
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
      Settings: "settings",
    },
  },
};

export default function App() {
  return (
    <NavigationContainer linking={linking}>
      <StatusBar style="auto" />
      <Stack.Navigator initialRouteName="Search">
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
                <Pressable accessibilityRole="button" accessibilityLabel="Open settings" onPress={() => navigation.navigate("Settings")} style={{ paddingHorizontal: 8 }}>
                  <Text style={{ fontSize: 16 }}>Settings</Text>
                </Pressable>
              </>
            ),
          })}
        />
        <Stack.Screen name="Subject" component={SubjectScreen} options={({ route }) => ({ title: route.params.name })} />
        <Stack.Screen name="Alerts" component={AlertsScreen} options={{ title: "Trust alerts" }} />
        <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: "Settings" }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
