import type { Metadata } from "next";

import { ResultsDashboard } from "@/components/blind-test/results-dashboard";

export const metadata: Metadata = {
  title: "Blind test results",
  robots: { index: false, follow: false },
};

export default function BlindTestResultsPage() {
  return <ResultsDashboard />;
}
