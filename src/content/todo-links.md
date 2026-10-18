# Links to pages that don't exist yet

The header, footer and homepage link to these paths. Each is a placeholder for a page still to be
built in the new site; until then it returns 404. When a page is added, remove it from this list.
The paths are defined in `src/content/site.ts` and `src/content/home.ts`.

## Main menu (header)

| Label                      | Path             | Notes                                                 |
| -------------------------- | ---------------- | ----------------------------------------------------- |
| About Us › About CST       | `/about`         |                                                       |
| Announcements              | `/announcements` | Same page as the homepage's Announcements › View all. |
| Others › Vacancies         | `/vacancies`     |                                                       |
| Others › Student Hub       | `/student-hub`   |                                                       |
| Others › EU Project Links  | `/eu-projects`   |                                                       |
| Header button › Contact us | `/contact`       |                                                       |

The Important Links (Research, Student Life, Hostel Booking, CST-25) go to other CST sites.
Academics links to the Programmes page (`/programmes`). Academic Calendar, Examination and Library
are no longer in the menu and still need a home. The October 2026 menu also dropped the old Department submenu
(`/departments/...`) and About Us › FAQ (`/faq`). The old site's FAQ page (WordPress page 636)
still needs a home if it is kept.

## Homepage sections

| Label                                      | Path                   | Notes                                      |
| ------------------------------------------ | ---------------------- | ------------------------------------------ |
| Events › View all events (and each event)  | `/events`              | Each event should get its own page later.  |
| Leadership › Leadership & governance       | `/about/governance`    |                                            |
| Announcements › View all (and each notice) | `/announcements`       | Each notice should get its own page later. |
| Opportunities › Exchange programmes        | `/exchange-programmes` |                                            |
| Opportunities › Career opportunities       | `/careers`             |                                            |

## Footer

The footer links go to external sites, apart from Downloads. Two of them need checking:

- **Feedback Portal** is a tinyurl.com short link: confirm where it lands and link there directly.
- **Online Substitution Form** is a Google Sheets edit link: decide whether it should be a form or
  a view-only link.

## Missing links

- **LinkedIn.** The live site's LinkedIn icon points to an unrelated institution, so it was left
  out of the footer. Find CST's real LinkedIn page and add it to `site.social` in
  `src/content/site.ts`, with an icon in `src/components/ui/icons.tsx`.

## Features not built yet

- **Site search.** The old header had a full-screen search overlay. Left out until there is a
  search backend; add a search button to the header bar when there is.
