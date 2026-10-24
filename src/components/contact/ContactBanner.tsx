import Image from "next/image";

import type { Photo } from "@/content/home";
import { PageHeader } from "@/components/ui/PageHeader";

import s from "./Contact.module.css";

/**
 * A campus photograph whose four edges fade into the white page (two crossed masks), with the
 * page's title, set as on every inner page, over its faded foot. The photo fades in, then zooms
 * very slowly back and forth; reduced motion: a still. Without a photo the page keeps only its
 * title, rather than an empty frame.
 */
export function ContactBanner({ intro, photo }: { intro: string; photo: Photo | null }) {
  return (
    <div className={s.banner} data-photo={photo ? true : undefined}>
      {photo && (
        <div className={s.art} data-loop="" suppressHydrationWarning>
          <Image src={photo.src} alt={photo.alt} fill preload sizes="100vw" className={s.photo} />
        </div>
      )}
      <div className={s.heading}>
        <PageHeader title="Contact us" intro={intro} paper={!photo} />
      </div>
    </div>
  );
}
