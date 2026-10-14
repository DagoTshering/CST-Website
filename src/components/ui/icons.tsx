import type { SVGProps } from "react";

/**
 * Inline SVG icons, drawn on a 24px grid. They are decorative (aria-hidden); the control or
 * text they sit next to carries the accessible name. Size them with Tailwind (size-5 ...).
 */

type IconProps = SVGProps<SVGSVGElement>;

function Stroke({ children, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      {children}
    </svg>
  );
}

function Fill({ children, ...props }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false" {...props}>
      {children}
    </svg>
  );
}

export const MapPinIcon = (props: IconProps) => (
  <Stroke {...props}>
    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
    <circle cx="12" cy="10" r="3" />
  </Stroke>
);

export const PhoneIcon = (props: IconProps) => (
  <Stroke {...props}>
    <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.96.36 1.9.7 2.8a2 2 0 0 1-.45 2.1L8.1 9.9a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.9.34 1.84.58 2.8.7A2 2 0 0 1 22 16.9Z" />
  </Stroke>
);

export const MailIcon = (props: IconProps) => (
  <Stroke {...props}>
    <rect x="2.5" y="4.5" width="19" height="15" rx="2" />
    <path d="m21.5 7-9.5 6-9.5-6" />
  </Stroke>
);

export const ClockIcon = (props: IconProps) => (
  <Stroke {...props}>
    <circle cx="12" cy="12" r="9.5" />
    <path d="M12 7v5l3.5 2" />
  </Stroke>
);

export const ChevronDownIcon = (props: IconProps) => (
  <Stroke {...props}>
    <path d="m6 9 6 6 6-6" />
  </Stroke>
);

export const ChevronLeftIcon = (props: IconProps) => (
  <Stroke {...props}>
    <path d="m15 18-6-6 6-6" />
  </Stroke>
);

export const ChevronRightIcon = (props: IconProps) => (
  <Stroke {...props}>
    <path d="m9 18 6-6-6-6" />
  </Stroke>
);

export const ArrowRightIcon = (props: IconProps) => (
  <Stroke {...props}>
    <path d="M4.5 12h15M13.5 6l6 6-6 6" />
  </Stroke>
);

export const MenuIcon = (props: IconProps) => (
  <Stroke {...props}>
    <path d="M4 7h16M4 12h16M4 17h16" />
  </Stroke>
);

export const CloseIcon = (props: IconProps) => (
  <Stroke {...props}>
    <path d="M18 6 6 18M6 6l12 12" />
  </Stroke>
);

export const GraduationCapIcon = (props: IconProps) => (
  <Stroke {...props}>
    <path d="M21.4 10.9a1 1 0 0 0 0-1.8l-8.6-3.9a2 2 0 0 0-1.6 0L2.6 9.1a1 1 0 0 0 0 1.8l8.6 3.9a2 2 0 0 0 1.6 0Z" />
    <path d="M22 10v6M6 12.5V16c0 1.7 2.7 3 6 3s6-1.3 6-3v-3.5" />
  </Stroke>
);

export const AwardIcon = (props: IconProps) => (
  <Stroke {...props}>
    <circle cx="12" cy="8.5" r="5.5" />
    <path d="M15.4 13 17 21.5l-5-2.8-5 2.8 1.6-8.5" />
  </Stroke>
);

export const CheckIcon = (props: IconProps) => (
  <Stroke {...props}>
    <path d="M20 6 9 17l-5-5" />
  </Stroke>
);

export const ArrowUpIcon = (props: IconProps) => (
  <Stroke {...props}>
    <path d="M12 19.5v-15M6 10.5l6-6 6 6" />
  </Stroke>
);

export const ExternalIcon = (props: IconProps) => (
  <Stroke {...props}>
    <path d="M8 16 16 8M9.5 8H16v6.5" />
  </Stroke>
);

export const FacebookIcon = (props: IconProps) => (
  <Fill {...props}>
    <path d="M13.5 22v-8h2.7l.4-3.2h-3.1V8.8c0-.9.25-1.55 1.57-1.55h1.68V4.4a22 22 0 0 0-2.45-.13c-2.42 0-4.08 1.48-4.08 4.2v2.33H7.5V14h2.72v8h3.28Z" />
  </Fill>
);

export const InstagramIcon = (props: IconProps) => (
  <Stroke {...props}>
    <rect x="3" y="3" width="18" height="18" rx="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17.5" cy="6.5" r="0.6" fill="currentColor" />
  </Stroke>
);

export const YouTubeIcon = (props: IconProps) => (
  <Fill {...props}>
    <path
      fillRule="evenodd"
      d="M21.6 7.2a2.5 2.5 0 0 0-1.77-1.77C18.27 5 12 5 12 5s-6.27 0-7.83.43A2.5 2.5 0 0 0 2.4 7.2 26 26 0 0 0 2 12a26 26 0 0 0 .4 4.8 2.5 2.5 0 0 0 1.77 1.77C5.73 19 12 19 12 19s6.27 0 7.83-.43a2.5 2.5 0 0 0 1.77-1.77A26 26 0 0 0 22 12a26 26 0 0 0-.4-4.8ZM10 15.1V8.9l5.3 3.1-5.3 3.1Z"
    />
  </Fill>
);
