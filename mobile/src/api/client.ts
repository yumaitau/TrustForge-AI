import * as SecureStore from "expo-secure-store";

/**
 * Thin client over the shared /api/v1 contracts. No mobile-only data shapes:
 * every type here mirrors the server's REST responses. The session token is
 * kept in platform secure storage and never cached elsewhere.
 */

const DEFAULT_BASE_URL = "https://trustforge.au";
const TOKEN_KEY = "trustforge.session";
const BASE_URL_KEY = "trustforge.baseUrl"; // MDM/managed config can pin this.

export type SubjectType = "company" | "product" | "mcp_server" | "skill" | "agent" | "model" | "api";

export type TrustScoreRecord = {
  id: string;
  subjectType: SubjectType;
  subjectId: string;
  score: string;
  methodologyVersion: string;
  explanation: { summary?: string; evidenceIds?: string[] } | null;
  calculatedAt: string;
};

export type SearchResult = { id: string; name: string; type: string; verificationLevel?: string };

export type SecurityFinding = { id: string; title: string; severity: string; status: string; affectedComponent?: string | null };

export type TrustAlert = { id: string; subjectType: SubjectType; subjectId: string; kind: "score_drop" | "new_finding" | "verification_change"; payload: Record<string, unknown>; createdAt: string };

export type AlertPreference = { id?: string; subjectType: SubjectType; subjectId: string; scoreDrops: boolean; newFindings: boolean; verificationChanges: boolean; minSeverity: "unknown" | "none" | "low" | "medium" | "high" | "critical" };

export type Favorite = { id: string; subjectType: SubjectType; subjectId: string; label?: string | null };

export type Recommendation = {
  result: {
    question: string;
    recommended: { name: string; subjectId: string; subjectType: SubjectType; rationale: string; citations: { evidenceIds: string[] } } | null;
    alternatives: { name: string; subjectId: string; rationale: string }[];
    caveats: string[];
  };
  answer: string;
};

async function getToken() {
  return SecureStore.getItemAsync(TOKEN_KEY);
}

export async function setToken(token: string | null) {
  if (token) await SecureStore.setItemAsync(TOKEN_KEY, token);
  else await SecureStore.deleteItemAsync(TOKEN_KEY);
}

export async function getBaseUrl() {
  return (await SecureStore.getItemAsync(BASE_URL_KEY)) ?? DEFAULT_BASE_URL;
}

export async function setBaseUrl(url: string) {
  await SecureStore.setItemAsync(BASE_URL_KEY, url);
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const [baseUrl, token] = await Promise.all([getBaseUrl(), getToken()]);
  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}), ...init.headers },
  });
  const body = (await response.json().catch(() => null)) as { data?: T; history?: unknown; error?: { message?: string } } | null;
  if (!response.ok) throw new Error(body?.error?.message ?? `Request failed (${response.status})`);
  return (body?.data ?? body) as T;
}

export const api = {
  search: (query: string) => request<SearchResult[]>(`/api/v1/search?q=${encodeURIComponent(query)}`),
  trustScore: (subjectType: SubjectType, subjectId: string) => request<TrustScoreRecord | null>(`/api/v1/trust-scores/${subjectType}/${subjectId}`),
  securityFindings: (subjectType: SubjectType, subjectId: string) =>
    request<{ items: SecurityFinding[] }>(`/api/v1/security/findings?subjectType=${subjectType}&subjectId=${subjectId}`).then((body) => body.items ?? []),
  recommend: (question: string) => request<Recommendation>(`/api/v1/recommendations`, { method: "POST", body: JSON.stringify({ question }) }),
  registerDevice: (input: { platform: "ios" | "android"; pushToken: string; deviceName?: string; appVersion?: string; pushEnabled: boolean }) =>
    request<{ id: string }>(`/api/v1/mobile/devices`, { method: "POST", body: JSON.stringify(input) }),
  preferences: () => request<AlertPreference[]>(`/api/v1/mobile/preferences`),
  savePreference: (preference: AlertPreference) => request<AlertPreference>(`/api/v1/mobile/preferences`, { method: "PUT", body: JSON.stringify(preference) }),
  favorites: () => request<Favorite[]>(`/api/v1/mobile/favorites`),
  addFavorite: (favorite: Omit<Favorite, "id">) => request<Favorite>(`/api/v1/mobile/favorites`, { method: "POST", body: JSON.stringify(favorite) }),
  removeFavorite: (id: string) => request<Favorite>(`/api/v1/mobile/favorites/${id}`, { method: "DELETE" }),
  alerts: () => request<TrustAlert[]>(`/api/v1/mobile/alerts`),
  acknowledgeAlerts: (acknowledgeIds: string[]) => request<TrustAlert[]>(`/api/v1/mobile/alerts`, { method: "POST", body: JSON.stringify({ acknowledgeIds }) }),
};
