import type { Metadata } from "next";

import { ExecutivesChart } from "@/components/executives/ExecutivesChart";
import { PageHeader } from "@/components/ui/PageHeader";
import { site } from "@/content/site";

// Everything here is known at build time (src/content/executives.json): keep it prerendered.
export const ensureStatic = "navigation";

export const metadata: Metadata = {
  title: "Our Executives",
  description: `The executive leadership of the ${site.name}, ${site.university}: the President and the Deans of Academic Affairs, Research & Industrial Linkages and Student Affairs.`,
};

export default function ExecutivesPage() {
  return (
    <div className="bg-white">
      <PageHeader title="Our Executives" intro={`Executive leadership of the ${site.name}.`} />
      <div className="container-page pt-2">
        <ExecutivesChart />
      </div>
    </div>
  );
}
