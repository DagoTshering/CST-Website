import fs from "node:fs";
import path from "node:path";

import Image from "next/image";

import { PageHeader } from "@/components/ui/PageHeader";

import s from "./Contact.module.css";

const BANNER = "/images/contact-banner.jpg";

// Without the photo the page keeps only its title, rather than an empty frame or a broken image.
const hasBanner = fs.existsSync(path.join(process.cwd(), "public", BANNER));

/**
 * A campus photograph whose four edges fade into the white page (two crossed masks), with the
 * page's title, set as on every inner page, over its faded foot. The photo fades in, then zooms
 * very slowly back and forth; reduced motion: a still.
 */
export function ContactBanner() {
  return (
    <div className={s.banner} data-photo={hasBanner || undefined}>
      {hasBanner && (
        <div className={s.art}>
          <Image
            src={BANNER}
            alt="The college campus at sunrise, with a tree-lined road between the academic blocks"
            fill
            priority
            sizes="100vw"
            className={s.photo}
          />
        </div>
      )}
      <div className={s.heading}>
        <PageHeader
          title="Contact us"
          intro="Questions about admissions, academics or the campus? Find the right office below, or write to us directly."
          paper={!hasBanner}
        />
      </div>
    </div>
  );
}
