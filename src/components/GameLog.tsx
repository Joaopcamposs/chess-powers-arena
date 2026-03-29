interface GameLogProps {
  log: string[]
}

export function GameLog({ log }: GameLogProps) {
  return (
    <div
      className="rounded-xl p-3 flex flex-col gap-1 overflow-y-auto"
      style={{
        background: 'hsl(258 50% 8%)',
        border: '1px solid rgba(139,92,246,0.2)',
        maxHeight: 200,
        minHeight: 80,
      }}
    >
      <div className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: '#6b7280' }}>
        ⚔ Registro de batalha
      </div>
      {log.map((entry, i) => (
        <div
          key={i}
          className="text-xs py-0.5 px-2 rounded transition-all"
          style={{
            color: i === 0 ? '#e5e7eb' : '#6b7280',
            background: i === 0 ? 'rgba(139,92,246,0.15)' : 'transparent',
            borderLeft: i === 0 ? '2px solid rgba(139,92,246,0.6)' : '2px solid transparent',
          }}
        >
          {entry}
        </div>
      ))}
    </div>
  )
}
