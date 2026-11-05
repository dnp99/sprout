import { Bell, Palette, Shield, UserRound } from "lucide-react";

/** Shared ordering and labels keep account entry points and responsive panels aligned. */
export const accountSections = [
  { id: "profile", label: "accountProfile", icon: UserRound },
  { id: "security", label: "security", icon: Shield },
  { id: "appearance", label: "appearance", icon: Palette },
  { id: "notifications", label: "notifications", icon: Bell },
] as const;

export type AccountSection = (typeof accountSections)[number]["id"];
