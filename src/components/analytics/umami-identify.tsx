"use client";

import { useEffect } from "react";
import { identify } from "@/features/analytics/track";

type UmamiIdentifyProps = {
  /** The keyed hash from identity.ts. Never an email, name, or the raw account subject. */
  distinctId: string;
};

/**
 * Links this page load's activity to one signed-in account. The identity lives only in memory
 * (Umami keeps no storage for it), so a full page load, such as sign-out, clears it.
 */
export function UmamiIdentify({ distinctId }: UmamiIdentifyProps) {
  useEffect(() => {
    identify(distinctId);
  }, [distinctId]);
  return null;
}
