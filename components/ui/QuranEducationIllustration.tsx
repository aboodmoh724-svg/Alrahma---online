"use client";

export default function QuranEducationIllustration({ className = "w-36 h-36" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Background Soft Aura Circle */}
      <circle cx="100" cy="100" r="85" fill="#0C5C5E" fillOpacity="0.06" />

      {/* Decorative Halo Rings */}
      <circle cx="100" cy="100" r="70" stroke="#0C5C5E" strokeOpacity="0.12" strokeWidth="1.5" strokeDasharray="4 4" />

      {/* Wooden Rahl (Quran Stand) Base */}
      <path
        d="M60 145L100 115L140 145M60 145L72 155M140 145L128 155"
        stroke="#0C5C5E"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M72 130L128 130"
        stroke="#D97706"
        strokeWidth="3"
        strokeLinecap="round"
      />

      {/* Open Mushaf (Quran Book) Pages */}
      <path
        d="M100 110C82 102 62 105 50 112V82C62 75 82 72 100 80C118 72 138 75 150 82V112C138 105 118 102 100 110Z"
        fill="#EDF5F4"
        stroke="#0C5C5E"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      {/* Spine divider */}
      <path
        d="M100 80V110"
        stroke="#0C5C5E"
        strokeWidth="2.5"
        strokeLinecap="round"
      />

      {/* Book Lines (Calligraphy Simulation) */}
      <line x1="62" y1="88" x2="88" y2="91" stroke="#0C5C5E" strokeWidth="2" strokeLinecap="round" strokeOpacity="0.4" />
      <line x1="60" y1="96" x2="86" y2="99" stroke="#0C5C5E" strokeWidth="2" strokeLinecap="round" strokeOpacity="0.4" />
      <line x1="63" y1="104" x2="85" y2="106" stroke="#0C5C5E" strokeWidth="2" strokeLinecap="round" strokeOpacity="0.3" />

      <line x1="112" y1="91" x2="138" y2="88" stroke="#0C5C5E" strokeWidth="2" strokeLinecap="round" strokeOpacity="0.4" />
      <line x1="114" y1="99" x2="140" y2="96" stroke="#0C5C5E" strokeWidth="2" strokeLinecap="round" strokeOpacity="0.4" />
      <line x1="115" y1="106" x2="137" y2="104" stroke="#0C5C5E" strokeWidth="2" strokeLinecap="round" strokeOpacity="0.3" />

      {/* Soft Light Rays / Knowledge Radiance */}
      <path d="M100 68V55" stroke="#D97706" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M82 72L72 62" stroke="#D97706" strokeWidth="2" strokeLinecap="round" />
      <path d="M118 72L128 62" stroke="#D97706" strokeWidth="2" strokeLinecap="round" />

      {/* Floating Star Accent */}
      <path
        d="M100 45L102 49L106 50L103 53L104 57L100 55L96 57L97 53L94 50L98 49Z"
        fill="#D97706"
      />
    </svg>
  );
}
