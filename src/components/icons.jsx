const I = ({ size = 22, stroke = 'currentColor', sw = 2, fill = 'none', children }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill={fill}
    stroke={stroke}
    strokeWidth={sw}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {children}
  </svg>
);

export const HomeIcon = (p) => (
  <I {...p}>
    <path d="M3 10.5L12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z" />
  </I>
);
export const ChefIcon = (p) => (
  <I {...p}>
    <path d="M6 14a4 4 0 1 1 1.5-7.7A4 4 0 0 1 12 4a4 4 0 0 1 4.5 2.3A4 4 0 1 1 18 14" />
    <path d="M6 14v5a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-5" />
    <path d="M9 17h6" />
  </I>
);
export const BasketIcon = (p) => (
  <I {...p}>
    <path d="M3 9h18l-1.7 9.3a2 2 0 0 1-2 1.7H6.7a2 2 0 0 1-2-1.7L3 9z" />
    <path d="M8 9l3-5M16 9l-3-5" />
  </I>
);
export const HeartIcon = ({ filled = false, ...p }) => (
  <I {...p} fill={filled ? 'currentColor' : 'none'}>
    <path d="M20.8 5.6a5.5 5.5 0 0 0-8.8-1.4 5.5 5.5 0 1 0-8 7.5l7.3 7.6a1 1 0 0 0 1.5 0l7.3-7.6a5.5 5.5 0 0 0 .7-6.1z" />
  </I>
);
export const ClockIcon = (p) => (
  <I {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </I>
);
export const UsersIcon = (p) => (
  <I {...p}>
    <circle cx="9" cy="8" r="3.5" />
    <path d="M3 20a6 6 0 0 1 12 0" />
    <circle cx="17" cy="9" r="2.5" />
    <path d="M16 14a5 5 0 0 1 5 5" />
  </I>
);
export const SparkIcon = (p) => (
  <I {...p}>
    <path d="M12 4l1.5 4L17 9l-3.5 1L12 14l-1.5-4L7 9l3.5-1z" />
    <path d="M19 14l.7 1.8L21.5 16.5l-1.8.7L19 19l-.7-1.8L16.5 16.5l1.8-.7z" />
  </I>
);
export const PlusIcon = (p) => (
  <I {...p}>
    <path d="M12 5v14M5 12h14" />
  </I>
);
export const CheckIcon = (p) => (
  <I {...p}>
    <path d="M5 12.5l4.5 4.5L20 6.5" />
  </I>
);
export const ChevronDown = (p) => (
  <I {...p}>
    <path d="M6 9l6 6 6-6" />
  </I>
);
export const ArrowRight = (p) => (
  <I {...p}>
    <path d="M5 12h14M13 5l7 7-7 7" />
  </I>
);
export const BoltIcon = (p) => (
  <I {...p} fill="currentColor" stroke="none">
    <path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z" />
  </I>
);
export const SmileIcon = (p) => (
  <I {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M8 14s1.5 2 4 2 4-2 4-2" />
    <circle cx="9" cy="10" r="0.6" fill="currentColor" />
    <circle cx="15" cy="10" r="0.6" fill="currentColor" />
  </I>
);
