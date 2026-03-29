import { type GameState, Piece, PieceType } from '../game/types'
import { PieceIcon } from './PieceIcon'

interface GameHUDProps {
  state: GameState
  side: 'top' | 'bottom'
  playerColor: 'white' | 'black'
  isAI?: boolean
}

const PIECE_VALUE: Record<PieceType, number> = {
  queen: 9, rook: 5, bishop: 3, knight: 3, pawn: 1, king: 0,
}

function scoreDiff(captured: Piece[]): number {
  return captured.reduce((sum, p) => sum + PIECE_VALUE[p.type], 0)
}

export function GameHUD({ state, side, playerColor, isAI }: GameHUDProps) {
  const player = state.players[playerColor]
  const opponent = state.players[playerColor === 'white' ? 'black' : 'white']
  const myScore = scoreDiff(player.capturedPieces)
  const theirScore = scoreDiff(opponent.capturedPieces)
  const advantage = myScore - theirScore
  const isActive = state.currentTurn === playerColor && state.phase === 'playing'
  const inCheck = state.check === playerColor

  return (
    <div
      className="flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-300"
      style={{
        background: isActive ? 'hsl(258 60% 16%)' : 'hsl(258 50% 10%)',
        border: isActive ? '1px solid rgba(139,92,246,0.6)' : '1px solid rgba(139,92,246,0.2)',
        boxShadow: isActive ? '0 0 20px rgba(139,92,246,0.3)' : 'none',
        minHeight: 52,
      }}
    >
      {/* Avatar */}
      <div
        className="w-9 h-9 rounded-full flex items-center justify-center text-lg font-bold flex-shrink-0"
        style={{
          background: playerColor === 'white'
            ? 'linear-gradient(135deg, #f0e8c0, #d4b896)'
            : 'linear-gradient(135deg, #1a0a2e, #4c1d95)',
          border: `2px solid ${isActive ? '#a78bfa' : '#374151'}`,
          boxShadow: inCheck ? '0 0 12px #f87171' : 'none',
        }}
      >
        {playerColor === 'white' ? '☀️' : '🌙'}
      </div>

      {/* Name & status */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-bold text-sm truncate" style={{ color: '#e5e7eb' }}>
            {playerColor === 'white' ? 'Ordem da Luz' : isAI ? '🤖 Sombras [IA]' : 'Sombras'}
          </span>
          {inCheck && (
            <span className="text-xs px-1.5 py-0.5 rounded font-bold animate-pulse" style={{ background: '#7f1d1d', color: '#fca5a5' }}>
              ♟ XEQUE
            </span>
          )}
          {isActive && !inCheck && (
            <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: 'rgba(139,92,246,0.3)', color: '#c4b5fd' }}>
              jogar
            </span>
          )}
        </div>

        {/* Captured pieces */}
        <div className="flex items-center gap-0.5 mt-0.5 flex-wrap">
          {player.capturedPieces.slice(-8).map((p, i) => (
            <PieceIcon key={`${p.id}-${i}`} piece={p} size={18} />
          ))}
          {advantage > 0 && (
            <span className="text-xs ml-1 font-bold" style={{ color: '#34d399' }}>+{advantage}</span>
          )}
        </div>
      </div>

      {/* Power charges */}
      <div className="flex flex-col items-end gap-1 flex-shrink-0">
        <div className="flex gap-1">
          {[1,2,3].map(n => (
            <div
              key={n}
              className="w-2.5 h-2.5 rounded-full transition-all"
              style={{
                background: n <= player.powerCharges ? '#a78bfa' : '#374151',
                boxShadow: n <= player.powerCharges ? '0 0 6px #a78bfa' : 'none',
              }}
            />
          ))}
        </div>
        <span className="text-xs" style={{ color: '#6b7280' }}>cargas</span>
      </div>
    </div>
  )
}
