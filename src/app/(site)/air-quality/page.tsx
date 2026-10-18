import type { Metadata } from "next";

import { AirQualitySheet } from "@/components/air-quality/AirQualitySheet";
import { PageHeader } from "@/components/ui/PageHeader";
import { airQuality } from "@/content/air-quality";

// The page itself is fixed; only the embedded dashboard is live. Keep it prerendered.
export const ensureStatic = "navigation";

export const metadata: Metadata = {
  title: "Live Campus Air & Climate Data",
  description:
    "Live campus air quality and climate readings at the College of Science and Technology",
};

export default function AirQualityPage() {
  return (
    <div className="bg-white">
      <PageHeader title="Live Campus Air & Climate Data" intro={airQuality.intro} />
      <div className="container-page pt-2 pb-[clamp(4rem,3rem+3vw,6rem)]">
        <AirQualitySheet />
      </div>
    </div>
  );
}
