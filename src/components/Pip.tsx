// Pip: the app's original mascot (a round little bird). Calm by default;
// it only celebrates (a small hop with happy eyes) when the teacher marks ✓
// or she finds a pair. It never looks sad.

import { useEffect, useState } from 'react'

const CHEER_EVENT = 'eps-pip-cheer'

/** Make every Pip on screen celebrate once. */
export const pipCheer = () => window.dispatchEvent(new Event(CHEER_EVENT))

export function Pip({ size = 96, className = '' }: { size?: number; className?: string }) {
  const [cheering, setCheering] = useState(false)

  useEffect(() => {
    let t: number | undefined
    const on = () => {
      setCheering(true)
      window.clearTimeout(t)
      t = window.setTimeout(() => setCheering(false), 1200)
    }
    window.addEventListener(CHEER_EVENT, on)
    return () => {
      window.removeEventListener(CHEER_EVENT, on)
      window.clearTimeout(t)
    }
  }, [])

  return (
    <svg
      className={`pip ${cheering ? 'cheer' : ''} ${className}`}
      width={size}
      height={size}
      viewBox="0 0 130 130"
      aria-hidden="true"
    >
      <ellipse cx="65" cy="122" rx="36" ry="6" fill="rgba(0,0,0,.1)" />
      <g className="pip-body">
        <circle cx="65" cy="70" r="50" fill="#ffb84d" />
        <circle cx="65" cy="80" r="32" fill="#ffe2a8" />
        {/* wings: up when cheering */}
        <path className="pip-wing l" d="M20 70 q-18 -6 -14 14 q10 4 18 -4z" fill="#f59a1f" />
        <path className="pip-wing r" d="M110 70 q18 -6 14 14 q-10 4 -18 -4z" fill="#f59a1f" />
        {cheering ? (
          <>
            <path d="M42 60 q8 -10 16 0" stroke="#2b2d5c" strokeWidth="5" fill="none" strokeLinecap="round" />
            <path d="M72 60 q8 -10 16 0" stroke="#2b2d5c" strokeWidth="5" fill="none" strokeLinecap="round" />
          </>
        ) : (
          <>
            <circle cx="50" cy="58" r="9" fill="#fff" />
            <circle cx="80" cy="58" r="9" fill="#fff" />
            <circle cx="52" cy="60" r="5" fill="#2b2d5c" />
            <circle cx="82" cy="60" r="5" fill="#2b2d5c" />
          </>
        )}
        <path d="M58 72 l7 8 l7 -8z" fill="#f08a24" />
        <path d="M58 22 q7 -16 14 0" fill="#f59a1f" />
        <circle cx="40" cy="78" r="6" fill="#ff9d9d" opacity=".6" />
        <circle cx="90" cy="78" r="6" fill="#ff9d9d" opacity=".6" />
      </g>
    </svg>
  )
}
