import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { twoFactor } from "better-auth/plugins";
import { passkey } from "@better-auth/passkey";
import { db } from "@/lib/db/client";

export const auth = betterAuth({
  appName: "TrustForge AI",
  baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
  secret: process.env.BETTER_AUTH_SECRET ?? "development-only-secret-change-before-deploying",
  database: drizzleAdapter(db, { provider: "pg", usePlural: true }),
  emailAndPassword: { enabled: true, minPasswordLength: 14 },
  session: { expiresIn: 60 * 60 * 8, updateAge: 60 * 60 },
  rateLimit: { enabled: true, window: 60, max: 30 },
  plugins: [twoFactor({ issuer: "TrustForge AI" }), passkey(), nextCookies()],
});
