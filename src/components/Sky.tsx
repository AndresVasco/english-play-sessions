// The calm background of every screen: sky, sun, two clouds and green hills.
// Purely decorative (no motion, no clicks).

export function Sky() {
  return (
    <div className="sky" aria-hidden="true">
      <div className="sky-sun" />
      <div className="sky-cloud c1" />
      <div className="sky-cloud c2" />
      <svg className="sky-hills" viewBox="0 0 1100 220" preserveAspectRatio="none">
        <path d="M0 130 Q220 50 440 115 T840 95 T1100 115 V220 H0Z" fill="#bfe3c8" />
        <path d="M0 175 Q280 105 560 165 T1100 155 V220 H0Z" fill="#9fd4ae" />
      </svg>
    </div>
  )
}
