import type { Metadata } from "next";
import { Suspense } from "react";

import { ContactBanner } from "@/components/contact/ContactBanner";
import { Directory } from "@/components/contact/Directory";
import { InfoRow } from "@/components/contact/InfoRow";
import { MapFrame } from "@/components/contact/MapFrame";
import { WriteToUs } from "@/components/contact/WriteToUs";
import { site } from "@/content/site";
import { loadPublished } from "@/lib/cms/public";
import { getContactPage } from "@/lib/cms/resources/contact";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: { absolute: `Contact | ${site.name}` },
    description: `How to reach the ${site.name}, ${site.university}: address, office hours, phone, email and the right office for your question.`,
  };
}

/**
 * The page's content (Admin › Contact Page), read through a cached query the admin panel
 * refreshes on every change.
 */
async function Content() {
  const result = await loadPublished("Contact page", getContactPage);
  if (!result.ok || !result.data) {
    return (
      <div className="container-page py-16">
        <h1 className="heading-serif text-ink">Contact us</h1>
        <p className="mt-6 text-copy">
          {result.ok
            ? "The contact details are being prepared. Please check back soon."
            : "This page cannot be shown at the moment. Please try again later."}{" "}
          You can reach the college at{" "}
          <a href={site.contact.email.href} className="font-semibold text-primary-strong">
            {site.contact.email.label}
          </a>
          .
        </p>
      </div>
    );
  }
  const page = result.data;
  const recipients = page.offices.flatMap(({ id, name, email }) =>
    email ? [{ id: String(id), name, email }] : [],
  );
  const general = recipients.find((r) => r.email === page.general.email) ?? recipients[0];

  return (
    <>
      <ContactBanner intro={page.intro} photo={page.banner} />
      <div className="container-page pb-[clamp(5rem,3.6rem+4vw,8rem)]">
        <InfoRow page={page} />
        {page.offices.length > 0 && <Directory offices={page.offices} />}
        {general && <WriteToUs recipients={recipients} defaultId={general.id} />}
        <MapFrame map={page.map} address={page.address} />
      </div>
    </>
  );
}

/**
 * Contact (replacing cst.edu.bt/contact): the banner, the ways to reach the college, the office
 * directory, a message box that opens the visitor's email app, and the map (the feedback portal
 * is in the footer).
 */
export default function ContactPage() {
  return (
    <div className="bg-white">
      <Suspense fallback={<div aria-busy="true" className="container-page min-h-[90vh]" />}>
        <Content />
      </Suspense>
    </div>
  );
}
