import type { Metadata } from "next";

import { GymBlindTestForm } from "@/components/blind-test/gym-form";

export const metadata: Metadata = {
  title: "Blind test",
  description: "Grippy gym blind-test scorecard — chalk-friendly mobile entry.",
  robots: { index: false, follow: false },
};

export default function BlindTestPage() {
  return <GymBlindTestForm />;
}
