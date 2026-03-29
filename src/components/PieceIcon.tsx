import { Piece, PieceType } from '../game/types'
import { PIECE_IMAGES } from '../game/assets'

interface PieceIconProps {
  piece: Piece
  size?: number
  frozen?: boolean
  shielded?: boolean
}

// Fallback SVG symbols if images fail
const PIECE_SYMBOLS: Record<PieceType, { white: string; black: string }> = {
  king:   { white: '♔', black: '♚' },
  queen:  { white: '♕', black: '♛' },
  rook:   { white: '♖', black: '♜' },
  bishop: { white: '♗', black: '♝' },
  knight: { white: '♘', black: '♞' },
  pawn:   { white: '♙', black: '♟' },
}

export function PieceIcon({ piece, size = 56, frozen, shielded }: PieceIconProps) {
  const imgUrl = PIECE_IMAGES[piece.color]?.[piece.type]

  return (
    <div
      className="relative flex items-center justify-center select-none"
      style={{ width: size, height: size }}
    >
      {/* Glow ring for shielded */}
      {shielded && (
        <div
          className="absolute inset-0 rounded-full animate-pulse"
          style={{
            boxShadow: '0 0 16px 4px #fcd34d, 0 0 30px 8px #fbbf24',
            border: '2px solid #fcd34d',
            borderRadius: 8,
          }}
        />
      )}

      {/* Freeze overlay */}
      {frozen && (
        <div
          className="absolute inset-0 rounded z-10"
          style={{
            background: 'rgba(96,212,244,0.35)',
            backdropFilter: 'blur(1px)',
            border: '2px solid #60d4f4',
            boxShadow: '0 0 12px #60d4f4',
          }}
        />
      )}

      {imgUrl ? (
        <img
          src={imgUrl}
          alt={`${piece.color} ${piece.type}`}
          className="object-contain drop-shadow-lg"
          style={{
            width: size * 0.9,
            height: size * 0.9,
            imageRendering: 'pixelated',
            filter: frozen ? 'hue-rotate(180deg) brightness(0.8) saturate(1.5)' : undefined,
          }}
          draggable={false}
        />
      ) : (
        <span
          style={{
            fontSize: size * 0.7,
            lineHeight: 1,
            filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.8))',
            color: piece.color === 'white' ? '#f0e8c0' : '#1a0a0a',
          }}
        >
          {PIECE_SYMBOLS[piece.type][piece.color]}
        </span>
      )}

      {/* Power used indicator */}
      {piece.powerUsed && (
        <div
          className="absolute bottom-0 right-0 w-3 h-3 rounded-full"
          style={{ background: '#6b7280', border: '1px solid #374151' }}
          title="Poder usado"
        />
      )}
    </div>
  )
}
