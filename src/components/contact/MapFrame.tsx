import { ButtonLink } from "@/components/ui/Button";
import { ExternalIcon } from "@/components/ui/icons";

import s from "./Contact.module.css";

/** The campus on Google Maps (allowed by the frame-src in next.config.ts), loaded lazily. */
export function MapFrame({
  map,
  address,
}: {
  map: { link: string; embed: string };
  address: string[];
}) {
  return (
    <section aria-label="Map" className={s.mapSection}>
      <div className={s.mapFrame}>
        <iframe
          src={map.embed}
          loading="lazy"
          title="Map of the College of Science and Technology"
          referrerPolicy="no-referrer-when-downgrade"
          className={s.map}
        />
      </div>
      <div className={s.mapFoot}>
        <p className={s.muted}>{address.join(", ")}</p>
        <ButtonLink href={map.link} variant="secondary">
          Open in Google Maps <ExternalIcon className="size-4" aria-hidden="true" />
        </ButtonLink>
      </div>
    </section>
  );
}
