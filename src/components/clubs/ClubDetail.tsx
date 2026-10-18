import type { ClubWithPhotos } from "@/lib/clubs";

import { ClubBand } from "./ClubBand";
import s from "./StudentHub.module.css";

/**
 * One club: its name and description, its curved photo band, then what it does and how to get
 * involved. Anything the college has not given yet is shown as a plain "to be added" notice.
 * The same content fills the pop-up over the list and the club's own page; only the heading
 * level differs (h1 on the page, h2 in the pop-up).
 */
export function ClubDetail({
  club,
  titleId,
  heading: Heading = "h2",
}: {
  club: ClubWithPhotos;
  /** The heading's id, for the pop-up's aria-labelledby. */
  titleId?: string;
  heading?: "h1" | "h2";
}) {
  return (
    <div className={s.detail}>
      <div className={s.head}>
        <div>
          <p className={s.eyebrow}>Club</p>
          <Heading id={titleId} className={s.name}>
            {club.name}
          </Heading>
          {club.fullName && <p className={s.fullName}>{club.fullName}</p>}
        </div>
        {club.about ? (
          <p className={s.about}>{club.about}</p>
        ) : (
          <p className={s.pending}>Club description to be added.</p>
        )}
      </div>

      {club.photos.length > 0 ? (
        <ClubBand name={club.name} photos={club.photos} />
      ) : (
        <p className={s.noPhotos}>Photos coming soon</p>
      )}

      <div className={s.details}>
        <div>
          <h3 className={s.subhead}>What they do</h3>
          {club.activities?.length ? (
            <ul className={s.list}>
              {club.activities.map((activity) => (
                <li key={activity}>{activity}</li>
              ))}
            </ul>
          ) : (
            <p className={s.pending}>Activities to be added.</p>
          )}
        </div>
        <div>
          <h3 className={s.subhead}>Get involved</h3>
          {club.contact ? (
            <p className={s.contact}>{club.contact}</p>
          ) : (
            <p className={s.pending}>Club advisor and contact details to be added.</p>
          )}
        </div>
      </div>
    </div>
  );
}
