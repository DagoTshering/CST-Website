# Links to pages that don't exist yet

The header, footer and homepage link to these paths. Each is a placeholder for a page still to be
built in the new site; until then it returns 404. When a page is added, remove it from this list.
The paths are defined in `src/content/site.ts` and `src/content/home.ts`.

## Main menu (header)

| Label                                   | Path                     | Notes                                                    |
| --------------------------------------- | ------------------------ | -------------------------------------------------------- |
| About Us › About CST                    | `/about`                 |                                                          |
| About Us › Executives                   | `/about/executives`      |                                                          |
| About Us › Staff Directory              | `/about/staff-directory` |                                                          |
| Academics                               | `/academics`             |                                                          |
| Announcements                           | `/announcements`         | Same page as the homepage's Announcements › View all.    |
| Admissions                              | `/admissions`            | Admission for new students.                              |
| Others › Vacancies                      | `/vacancies`             |                                                          |
| Others › Student Hub                    | `/student-hub`           |                                                          |
| Others › EU Project Links               | `/eu-projects`           |                                                          |
| Others › Downloads                      | `/downloads`             | Same page as the footer's E-Services › Downloads.        |
| Others › Live Campus Air & Climate Data | `/campus-climate`        | May be an external dashboard: link there directly if so. |
| Header button › Contact us              | `/contact`               |                                                          |

The Important Links (Research, Student Life, Hostel Booking, CST-25) go to other CST sites.
Programmes, Academic Calendar, Examination and Library are no longer in the menu: link them from
the Academics page. The October 2026 menu also dropped the old Department submenu
(`/departments/...`) and About Us › FAQ (`/faq`). The old site's FAQ page (WordPress page 636)
still needs a home if it is kept.

## Homepage sections

| Label                                      | Path                    | Notes                                      |
| ------------------------------------------ | ----------------------- | ------------------------------------------ |
| Academic › View all programmes (and rows)  | `/academics/programmes` | Same page as Academics › Programmes.       |
| Events › View all events (and each event)  | `/events`               | Each event should get its own page later.  |
| Leadership › Leadership & governance       | `/about/governance`     |                                            |
| Leadership › Meet the executives           | `/about/executives`     | Same page as About Us › Executives.        |
| Announcements › View all (and each notice) | `/announcements`        | Each notice should get its own page later. |
| Opportunities › Exchange programmes        | `/exchange-programmes`  |                                            |
| Opportunities › Career opportunities       | `/careers`              |                                            |

## Footer

| Label                  | Path         | Notes                                                    |
| ---------------------- | ------------ | -------------------------------------------------------- |
| E-Services › Downloads | `/downloads` | The live site has it at cst.edu.bt/downloads to migrate. |

The other footer links go to external sites. Two of them need checking:

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
