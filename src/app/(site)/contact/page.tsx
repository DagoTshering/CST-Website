import type { Metadata } from "next";

import { ContactBanner } from "@/components/contact/ContactBanner";
import { Directory } from "@/components/contact/Directory";
import { InfoRow } from "@/components/contact/InfoRow";
import { MapFrame } from "@/components/contact/MapFrame";
import { WriteToUs } from "@/components/contact/WriteToUs";
import { site } from "@/content/site";
import { contact, emailOffices } from "@/lib/contact";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: { absolute: `Contact | ${site.name}` },
    description: `How to reach the ${site.name}, ${site.university}: address, office hours, phone, email and the right office for your question.`,
  };
}

/**
 * Contact (replacing cst.edu.bt/contact): the banner, the four ways to reach the college, the
 * office directory, a message box that opens the visitor's email app, and the map (the feedback
 * portal is in the footer). All from data/contact.json (src/lib/contact.ts).
 */
export default function ContactPage() {
  const recipients = emailOffices.map(({ id, name, email }) => ({ id, name, email }));
  const general = emailOffices.find((o) => o.email === contact.general.email) ?? emailOffices[0];

  return (
    <div className="bg-white">
      <ContactBanner />
      <div className="container-page pb-[clamp(5rem,3.6rem+4vw,8rem)]">
        <InfoRow />
        <Directory />
        <WriteToUs recipients={recipients} defaultId={general.id} />
        <MapFrame />
      </div>
    </div>
  );
}
