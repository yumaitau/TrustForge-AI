import { NextResponse } from "next/server";

/** Universal Links for the iOS app. Team and bundle ids come from deploy config. */
export async function GET() {
  const appId = `${process.env.APPLE_TEAM_ID ?? "TEAMID0000"}.${process.env.IOS_BUNDLE_ID ?? "au.trustforge.app"}`;
  return NextResponse.json({
    applinks: { apps: [], details: [{ appID: appId, paths: ["/registry/*", "/search", "/api/v1/trust-scores/*"] }] },
    webcredentials: { apps: [appId] },
  });
}
