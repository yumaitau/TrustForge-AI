import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "TrustForge AI", template: "%s | TrustForge AI" },
  description: "Evidence-backed trust intelligence for the AI ecosystem.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
