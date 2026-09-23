import type { Metadata } from "next";

import { LabEntryApp } from "@/components/blind-test/lab-form";

export const metadata: Metadata = {
  title: "Lab measurements",
  robots: { index: false, follow: false },
};

export default function BlindTestLabPage() {
  return <LabEntryApp />;
}
