import { NextResponse } from "next/server";

/** Android App Links for the Android app. Package and fingerprint come from deploy config. */
export async function GET() {
  return NextResponse.json([
    {
      relation: ["delegate_permission/common.handle_all_urls", "delegate_permission/common.get_login_creds"],
      target: {
        namespace: "android_app",
        package_name: process.env.ANDROID_PACKAGE_NAME ?? "au.trustforge.app",
        sha256_cert_fingerprints: [process.env.ANDROID_CERT_FINGERPRINT ?? "00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00"],
      },
    },
  ]);
}
