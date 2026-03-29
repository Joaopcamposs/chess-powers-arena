import { GameState } from '../game/types'

interface GameOverScreenProps {
  state: GameState
  onRestart: () => void
}

export function GameOverScreen({ state, onRestart }: GameOverScreenProps) {
  const { winner } = state

  const title = winner === 'draw'
    ? 'Empate!'
    : winner === 'white'
    ? '☀️ Ordem da Luz Vence!'
    : '🌙 Sombras Vencem!'

  const subtitle = winner === 'draw'
    ? 'Impasse — nenhuma peça pode se mover'
    : 'Xeque-mate! O rei foi encurralado.'

  const bgColor = winner === 'white'
    ? 'from-amber-900/60 to-yellow-900/40'
    : winner === 'black'
    ? 'from-purple-950/80 to-violet-900/40'
    : 'from-slate-900/80 to-gray-800/40'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0"
        style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}
      />

      {/* Card */}
      <div
        className="relative z-10 rounded-2xl p-8 flex flex-col items-center gap-6 text-center"
        style={{
          background: 'hsl(258 50% 10%)',
          border: '2px solid rgba(139,92,246,0.5)',
          boxShadow: '0 0 60px rgba(139,92,246,0.3), 0 0 120px rgba(139,92,246,0.1)',
          minWidth: 320,
          maxWidth: 400,
        }}
      >
        {/* Trophy */}
        <div className="text-6xl animate-bounce">
          {winner === 'draw' ? '🤝' : winner === 'white' ? '🏆' : '👑'}
        </div>

        <div>
          <h2 className="text-2xl font-black mb-2" style={{ color: '#e5e7eb' }}>{title}</h2>
          <p className="text-sm" style={{ color: '#9ca3af' }}>{subtitle}</p>
        </div>

        {/* Stats */}
        <div
          className="w-full grid grid-cols-2 gap-3 p-3 rounded-xl"
          style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)' }}
        >
          <div className="text-center">
            <div className="text-2xl font-black" style={{ color: '#a78bfa' }}>
              {state.turnCount}
            </div>
            <div className="text-xs" style={{ color: '#6b7280' }}>turnos</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-black" style={{ color: '#34d399' }}>
              {state.players.white.capturedPieces.length + state.players.black.capturedPieces.length}
            </div>
            <div className="text-xs" style={{ color: '#6b7280' }}>capturas</div>
          </div>
        </div>

        <div className="flex gap-3 w-full">
          <button
            onClick={onRestart}
            className="flex-1 py-3 rounded-xl font-bold text-sm transition-all duration-200 active:scale-95"
            style={{
              background: 'linear-gradient(135deg, #7c3aed, #4c1d95)',
              color: '#e5e7eb',
              border: '1px solid rgba(139,92,246,0.5)',
              boxShadow: '0 0 20px rgba(139,92,246,0.3)',
            }}
          >
            ↺ Nova Partida
          </button>
        </div>
      </div>
    </div>
  )
}
