# Links to pages that don't exist yet

The header, footer and homepage link to these paths. Each is a placeholder for a page still to be
built in the new site; until then it returns 404. When a page is added, remove it from this list.
The paths are defined in `src/content/site.ts` and `src/content/home.ts`.

## Main menu (header)

| Label                                            | Path                                             | Notes                                                        |
| ------------------------------------------------ | ------------------------------------------------ | ------------------------------------------------------------ |
| About Us › About Us                              | `/about`                                         |                                                              |
| About Us › FAQ                                   | `/faq`                                           | The old site had a FAQ page (WordPress page 636) to migrate. |
| About Us › Contact                               | `/contact`                                       |                                                              |
| Header button › Contact us                       | `/contact`                                       | Same page as About Us › Contact.                             |
| About Us › Executives                            | `/about/executives`                              |                                                              |
| About Us › Staff Directory                       | `/about/staff-directory`                         |                                                              |
| Academics › Programmes                           | `/academics/programmes`                          |                                                              |
| Academics › Academic Calendar                    | `/academics/calendar`                            |                                                              |
| Academics › Examination                          | `/academics/examination`                         |                                                              |
| Academics › Library                              | `/library`                                       |                                                              |
| Department › Architecture                        | `/departments/architecture`                      |                                                              |
| Department › Civil & Environmental Engineering   | `/departments/civil-environmental-engineering`   |                                                              |
| Department › Computing Technologies              | `/departments/computing-technologies`            |                                                              |
| Department › Electrical & Electronic Engineering | `/departments/electrical-electronic-engineering` |                                                              |
| Department › Mechanical Engineering              | `/departments/mechanical-engineering`            |                                                              |
| Department › Science & Humanities                | `/departments/science-humanities`                |                                                              |
| Research                                         | `/research`                                      |                                                              |

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
