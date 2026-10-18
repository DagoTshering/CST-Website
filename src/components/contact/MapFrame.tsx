import { ButtonLink } from "@/components/ui/Button";
import { ExternalIcon } from "@/components/ui/icons";
import { contact } from "@/lib/contact";

import s from "./Contact.module.css";

/** The campus on Google Maps (allowed by the frame-src in next.config.ts), loaded lazily. */
export function MapFrame() {
  return (
    <section aria-label="Map" className={s.mapSection}>
      <div className={s.mapFrame}>
        <iframe
          src={contact.map.embed}
          loading="lazy"
          title="Map of the College of Science and Technology"
          referrerPolicy="no-referrer-when-downgrade"
          className={s.map}
        />
      </div>
      <div className={s.mapFoot}>
        <p className={s.muted}>{contact.address.join(", ")}</p>
        <ButtonLink href={contact.map.link} variant="secondary">
          Open in Google Maps <ExternalIcon className="size-4" aria-hidden="true" />
        </ButtonLink>
      </div>
    </section>
  );
}
