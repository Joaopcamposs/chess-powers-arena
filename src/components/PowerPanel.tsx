import { GameState, PIECE_DEFINITIONS, POWER_COLORS, PieceType } from '../game/types'

interface PowerPanelProps {
  state: GameState
  onActivatePower: () => void
  selectedPieceType: PieceType | null
}

export function PowerPanel({ state, onActivatePower, selectedPieceType }: PowerPanelProps) {
  const currentPlayer = state.players[state.currentTurn]
  const def = selectedPieceType ? PIECE_DEFINITIONS[selectedPieceType] : null
  const selectedPiece = state.selectedCell ? state.board[state.selectedCell.row][state.selectedCell.col].piece : null
  const powerColor = def ? POWER_COLORS[def.power] : '#a78bfa'

  const canActivate =
    def &&
    selectedPiece &&
    !selectedPiece.powerUsed &&
    currentPlayer.powerCharges >= def.powerCost &&
    !state.powerMode &&
    state.currentTurn === selectedPiece.color

  return (
    <div
      className="rounded-xl p-4 flex flex-col gap-3"
      style={{
        background: 'hsl(258 50% 10%)',
        border: '1px solid rgba(139,92,246,0.3)',
        minWidth: 220,
        maxWidth: 280,
      }}
    >
      {/* Charges */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider" style={{ color: '#a78bfa' }}>
            ⚡ Cargas de Poder
          </span>
          <span className="text-xs" style={{ color: '#6b7280' }}>max 3</span>
        </div>
        <div className="flex gap-2">
          {[1,2,3].map(n => (
            <div
              key={n}
              className="w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-bold transition-all"
              style={{
                borderColor: n <= currentPlayer.powerCharges ? '#a78bfa' : '#374151',
                background: n <= currentPlayer.powerCharges ? 'rgba(139,92,246,0.25)' : 'transparent',
                color: n <= currentPlayer.powerCharges ? '#c4b5fd' : '#374151',
                boxShadow: n <= currentPlayer.powerCharges ? '0 0 10px rgba(139,92,246,0.4)' : 'none',
              }}
            >
              {n}
            </div>
          ))}
        </div>
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: 'rgba(139,92,246,0.2)' }} />

      {/* Power info */}
      {def ? (
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
              style={{ background: `${powerColor}22`, border: `2px solid ${powerColor}` }}
            >
              {def.emoji}
            </div>
            <div>
              <div className="font-bold text-sm" style={{ color: '#e5e7eb' }}>{def.name}</div>
              <div className="text-xs" style={{ color: '#6b7280' }}>{def.title}</div>
            </div>
          </div>

          <div
            className="rounded-lg p-2"
            style={{ background: `${powerColor}11`, border: `1px solid ${powerColor}44` }}
          >
            <div className="text-xs font-bold mb-1" style={{ color: powerColor }}>{def.powerName}</div>
            <div className="text-xs leading-relaxed" style={{ color: '#9ca3af' }}>{def.powerDesc}</div>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span style={{ color: '#6b7280' }}>Custo:</span>
            <div className="flex gap-1">
              {Array.from({ length: 3 }, (_, i) => (
                <div
                  key={i}
                  className="w-3 h-3 rounded-full"
                  style={{
                    background: i < def.powerCost
                      ? (currentPlayer.powerCharges >= def.powerCost ? powerColor : '#f87171')
                      : '#374151',
                    opacity: i < def.powerCost ? 1 : 0.3,
                  }}
                />
              ))}
            </div>
          </div>

          <button
            onClick={canActivate ? onActivatePower : undefined}
            disabled={!canActivate}
            className="rounded-lg py-2 px-4 text-sm font-bold transition-all duration-200"
            style={{
              background: canActivate
                ? state.powerMode
                  ? `${powerColor}88`
                  : `${powerColor}33`
                : 'rgba(55,65,81,0.5)',
              border: `2px solid ${canActivate ? powerColor : '#374151'}`,
              color: canActivate ? powerColor : '#4b5563',
              cursor: canActivate ? 'pointer' : 'not-allowed',
              boxShadow: canActivate && !state.powerMode ? `0 0 12px ${powerColor}44` : 'none',
              transform: state.powerMode ? 'scale(0.97)' : 'scale(1)',
            }}
          >
            {state.powerMode ? '✦ Selecione o alvo' : canActivate ? '✦ Ativar Poder' : selectedPiece?.powerUsed ? '✗ Poder usado' : '✗ Cargas insuficientes'}
          </button>

          {state.powerMode && (
            <div className="text-xs text-center animate-pulse" style={{ color: powerColor }}>
              Clique no alvo para usar {def.powerName}
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-2 opacity-60">
          <div className="text-sm text-center" style={{ color: '#6b7280' }}>
            Selecione uma peça para ver seus poderes
          </div>
          <div className="grid grid-cols-3 gap-2 mt-2">
            {(['king','queen','rook','bishop','knight','pawn'] as PieceType[]).map(type => {
              const d = PIECE_DEFINITIONS[type]
              const pc = POWER_COLORS[d.power]
              return (
                <div
                  key={type}
                  className="rounded-lg p-2 flex flex-col items-center gap-1"
                  style={{ background: `${pc}11`, border: `1px solid ${pc}33` }}
                  title={`${d.name}: ${d.powerName}`}
                >
                  <span className="text-base">{d.emoji}</span>
                  <span className="text-xs" style={{ color: pc, fontSize: 9 }}>{d.powerName}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
