import { PIECE_DEFINITIONS, PieceType, POWER_COLORS } from '../game/types'

interface MenuScreenProps {
  onStart: (vsAI: boolean) => void
}

const pieceOrder: PieceType[] = ['king', 'queen', 'rook', 'bishop', 'knight', 'pawn']

export function MenuScreen({ onStart }: MenuScreenProps) {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-start py-8 px-4 overflow-y-auto"
      style={{
        background: 'radial-gradient(ellipse at top, hsl(258 60% 8%) 0%, hsl(240 50% 3%) 100%)',
      }}
    >
      {/* Header */}
      <div className="text-center mb-8">
        <div className="text-5xl mb-3">⚔️</div>
        <h1
          className="text-4xl md:text-5xl font-black tracking-tight mb-2"
          style={{
            background: 'linear-gradient(135deg, #c4b5fd, #818cf8, #a78bfa)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          ARCANA CHESS
        </h1>
        <p className="text-sm" style={{ color: '#6b7280' }}>
          Xadrez com poderes arcanos — cada peça tem habilidades únicas
        </p>
      </div>

      {/* Piece powers grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 w-full max-w-2xl mb-8">
        {pieceOrder.map(type => {
          const def = PIECE_DEFINITIONS[type]
          const pc = POWER_COLORS[def.power]
          return (
            <div
              key={type}
              className="rounded-xl p-3 flex flex-col gap-2"
              style={{
                background: `${pc}0d`,
                border: `1px solid ${pc}44`,
                boxShadow: `0 0 20px ${pc}11`,
              }}
            >
              <div className="flex items-center gap-2">
                <span className="text-2xl">{def.emoji}</span>
                <div>
                  <div className="font-bold text-sm" style={{ color: '#e5e7eb' }}>{def.name}</div>
                  <div className="text-xs" style={{ color: '#6b7280' }}>{def.title}</div>
                </div>
              </div>
              <div
                className="rounded-lg p-2"
                style={{ background: `${pc}11` }}
              >
                <div className="text-xs font-bold mb-0.5" style={{ color: pc }}>{def.powerName}</div>
                <div className="text-xs leading-snug" style={{ color: '#9ca3af' }}>{def.powerDesc}</div>
              </div>
              <div className="flex items-center justify-between text-xs" style={{ color: '#6b7280' }}>
                <span>Custo:</span>
                <div className="flex gap-1">
                  {[1,2,3].map(n => (
                    <div
                      key={n}
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ background: n <= def.powerCost ? pc : '#374151' }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Rules summary */}
      <div
        className="w-full max-w-2xl rounded-xl p-4 mb-8"
        style={{
          background: 'hsl(258 50% 10%)',
          border: '1px solid rgba(139,92,246,0.25)',
        }}
      >
        <h3 className="font-bold text-sm mb-3" style={{ color: '#a78bfa' }}>📜 Regras Especiais</h3>
        <ul className="text-xs space-y-1.5" style={{ color: '#9ca3af' }}>
          <li>• Movimentos e capturas seguem as regras do xadrez clássico</li>
          <li>• Cada peça tem <strong style={{ color: '#c4b5fd' }}>1 poder especial</strong> que pode ser usado 1 vez por partida</li>
          <li>• Poderes custam <strong style={{ color: '#c4b5fd' }}>cargas</strong> (1–3). Ganha 1 carga por turno, máximo 3</li>
          <li>• Clique na peça → clique "Ativar Poder" → selecione o alvo</li>
          <li>• <span style={{ color: '#60d4f4' }}>Congelamento</span> impede movimento por 1 turno</li>
          <li>• <span style={{ color: '#fcd34d' }}>Escudo</span> torna a peça incapturável por 1 turno</li>
          <li>• Promoção de peão ao chegar no fim: vira Rainha</li>
        </ul>
      </div>

      {/* Start buttons */}
      <div className="flex flex-col gap-3 w-full max-w-sm">
        <button
          onClick={() => onStart(false)}
          className="py-4 rounded-xl font-black text-base tracking-wide transition-all duration-200 active:scale-95"
          style={{
            background: 'linear-gradient(135deg, #7c3aed, #4c1d95)',
            color: '#e5e7eb',
            border: '1px solid rgba(167,139,250,0.5)',
            boxShadow: '0 0 30px rgba(139,92,246,0.3)',
          }}
        >
          ⚔️ 2 Jogadores — Modo Local
        </button>
        <button
          onClick={() => onStart(true)}
          className="py-4 rounded-xl font-black text-base tracking-wide transition-all duration-200 active:scale-95"
          style={{
            background: 'linear-gradient(135deg, #1f2937, #111827)',
            color: '#d1d5db',
            border: '1px solid rgba(139,92,246,0.3)',
          }}
        >
          🤖 Jogar contra IA
        </button>
      </div>

      <p className="mt-6 text-xs" style={{ color: '#374151' }}>
        Arcana Chess • Xadrez com poderes especiais
      </p>
    </div>
  )
}
