import type { Metadata } from "next";

import { BlindTestGuide } from "@/components/blind-test/guide";

export const metadata: Metadata = {
  title: "Blind Test Protocol",
  description:
    "Grippy team knowledge base — gym scoring, lab entry, and analysis playbooks.",
  robots: { index: false, follow: false },
};

export default function BlindTestGuidePage() {
  return <BlindTestGuide />;
}
