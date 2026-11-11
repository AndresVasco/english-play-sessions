// Short (1.5 s) celebration: soft confetti falling once. No flashing.

const COLORS = ['#ffb347', '#2f6f6a', '#7fc8a9', '#f4a6a6', '#9ab7e6']

export function Confetti({ burst }: { burst: number }) {
  if (!burst) return null
  return (
    <div className="confetti" key={burst} aria-hidden="true">
      {Array.from({ length: 28 }, (_, i) => (
        <span
          key={i}
          style={{
            left: `${(i * 37) % 100}%`,
            background: COLORS[i % COLORS.length],
            animationDelay: `${(i % 7) * 60}ms`,
            transform: `rotate(${i * 29}deg)`,
          }}
        />
      ))}
    </div>
  )
}
