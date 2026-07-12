import type { SubjectType } from "@/api/client";

export type RootStackParamList = {
  SignIn: undefined;
  Search: undefined;
  Subject: { subjectType: SubjectType; subjectId: string; name: string };
  Alerts: undefined;
  Compare: undefined;
  Settings: undefined;
};
