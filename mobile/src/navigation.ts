import type { SubjectType } from "@/api/client";

export type RootStackParamList = {
  Search: undefined;
  Subject: { subjectType: SubjectType; subjectId: string; name: string };
  Alerts: undefined;
  Settings: undefined;
};
