export default function Mascot({ size = 84 }) {
  return (
    <svg
      viewBox="0 0 120 120"
      width={size}
      height={size}
      aria-hidden
      style={{ display: 'block' }}
    >
      {/* leafy top */}
      <path
        d="M60 14c-4-8-13-9-18-5 0 7 5 12 12 12-5 4-6 11-2 16 6-2 9-7 9-13 1 6 5 11 11 12 3-6 0-13-6-15 7-1 12-7 11-14-6-2-13 0-17 7z"
        fill="#2D5016"
      />
      {/* carrot body */}
      <path
        d="M60 30c14 0 24 10 24 22 0 22-12 50-24 50S36 74 36 52c0-12 10-22 24-22z"
        fill="#E8610A"
      />
      {/* carrot ridges */}
      <path
        d="M48 56c2 4 2 9 0 14M60 60c0 6 0 13-2 19M72 56c-2 4-2 9 0 14"
        stroke="#C44E03"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />
      {/* cheeks */}
      <circle cx="48" cy="58" r="4" fill="#F5A07A" opacity="0.8" />
      <circle cx="72" cy="58" r="4" fill="#F5A07A" opacity="0.8" />
      {/* eyes */}
      <ellipse cx="52" cy="50" rx="2.4" ry="3" fill="#2D5016" />
      <ellipse cx="68" cy="50" rx="2.4" ry="3" fill="#2D5016" />
      <circle cx="53" cy="49" r="0.8" fill="#fff" />
      <circle cx="69" cy="49" r="0.8" fill="#fff" />
      {/* smile */}
      <path
        d="M54 60 Q60 66 66 60"
        stroke="#2D5016"
        strokeWidth="2.2"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  );
}
