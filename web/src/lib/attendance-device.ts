import type { NextRequest } from "next/server";

const PHONE_USER_AGENT_PATTERN =
  /iPhone|iPod|Windows Phone|BlackBerry|IEMobile|Opera Mini|Android.+Mobile/i;

const DESKTOP_PLATFORM_PATTERN = /macOS|Windows|Linux|Chrome OS/i;
const MOBILE_PLATFORM_PATTERN = /Android|iOS/i;

function normalizeClientHint(value: string | null) {
  return (value || "").replaceAll('"', "").trim();
}

export function isPhoneAttendanceRequest(req: NextRequest) {
  const userAgent = req.headers.get("user-agent") || "";
  const mobileHint = normalizeClientHint(req.headers.get("sec-ch-ua-mobile"));
  const platformHint = normalizeClientHint(
    req.headers.get("sec-ch-ua-platform"),
  );

  const hasPhoneUserAgent = PHONE_USER_AGENT_PATTERN.test(userAgent);
  const isDesktopPlatform = DESKTOP_PLATFORM_PATTERN.test(platformHint);
  const isMobilePlatform = MOBILE_PLATFORM_PATTERN.test(platformHint);

  if (isDesktopPlatform) return false;
  if (mobileHint === "?0") return false;
  if (mobileHint === "?1" && (isMobilePlatform || !platformHint)) return true;

  return hasPhoneUserAgent;
}
