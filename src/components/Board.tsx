import { useMemo } from 'react'
import { GameState, Move, PIECE_DEFINITIONS } from '../game/types'
import { getLegalMoves } from '../game/engine'
import { PieceIcon } from './PieceIcon'

interface BoardProps {
  state: GameState
  onCellClick: (row: number, col: number) => void
  flipped?: boolean
}

function cellKey(r: number, c: number) { return `${r},${c}` }

export function Board({ state, onCellClick, flipped = false }: BoardProps) {
  const { board, selectedCell, validMoves, lastMove, frozenCells, shieldedCells, check, currentTurn } = state

  // Build a set of valid target cells for fast lookup
  const validTargets = useMemo(() => {
    return new Set(validMoves.map(m => cellKey(m.toRow, m.toCol)))
  }, [validMoves])

  // Build a set of valid capture cells
  const capturableTargets = useMemo(() => {
    return new Set(validMoves.filter(m => m.capture).map(m => cellKey(m.toRow, m.toCol)))
  }, [validMoves])

  // Find king in check position
  const checkKingPos = useMemo(() => {
    if (!check) return null
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const p = board[r][c].piece
        if (p && p.type === 'king' && p.color === check) return { r, c }
      }
    }
    return null
  }, [board, check])

  // Power mode: calculate valid power targets
  const powerTargets = useMemo(() => {
    if (!state.powerMode || !selectedCell) return new Set<string>()
    const piece = board[selectedCell.row][selectedCell.col].piece
    if (!piece) return new Set<string>()

    const targets = new Set<string>()
    const { row, col } = selectedCell

    switch (piece.type) {
      case 'bishop':
        // Freeze: any enemy piece
        for (let r = 0; r < 8; r++) {
          for (let c = 0; c < 8; c++) {
            const p = board[r][c].piece
            if (p && p.color !== piece.color) targets.add(cellKey(r, c))
          }
        }
        break
      case 'queen':
        // Blast: any cell (center of 3x3 area)
        for (let r = 0; r < 8; r++) {
          for (let c = 0; c < 8; c++) {
            targets.add(cellKey(r, c))
          }
        }
        break
      case 'rook':
        // Teleport: any empty cell
        for (let r = 0; r < 8; r++) {
          for (let c = 0; c < 8; c++) {
            if (!board[r][c].piece) targets.add(cellKey(r, c))
          }
        }
        break
      case 'king':
        // Shield: self
        targets.add(cellKey(row, col))
        break
      case 'pawn':
        // Resurrect: adjacent empty cells
        for (const [dr, dc] of [[-1,0],[1,0],[0,-1],[0,1],[-1,-1],[-1,1],[1,-1],[1,1]]) {
          const r = row + dr, c = col + dc
          if (r >= 0 && r < 8 && c >= 0 && c < 8 && !board[r][c].piece) {
            targets.add(cellKey(r, c))
          }
        }
        break
    }
    return targets
  }, [state.powerMode, selectedCell, board])

  const rows = flipped ? [0,1,2,3,4,5,6,7] : [0,1,2,3,4,5,6,7]
  const cols = flipped ? [7,6,5,4,3,2,1,0] : [0,1,2,3,4,5,6,7]
  const labels = flipped
    ? { files: 'hgfedcba', ranks: '12345678' }
    : { files: 'abcdefgh', ranks: '87654321' }

  return (
    <div className="relative">
      {/* Rank labels left */}
      <div className="absolute -left-6 top-0 bottom-0 flex flex-col">
        {rows.map((r, i) => (
          <div key={r} className="flex-1 flex items-center justify-center text-xs font-mono" style={{ color: '#a78bfa', opacity: 0.7 }}>
            {labels.ranks[i]}
          </div>
        ))}
      </div>

      {/* File labels bottom */}
      <div className="absolute -bottom-5 left-0 right-0 flex">
        {cols.map((c, i) => (
          <div key={c} className="flex-1 flex items-center justify-center text-xs font-mono" style={{ color: '#a78bfa', opacity: 0.7 }}>
            {labels.files[i]}
          </div>
        ))}
      </div>

      {/* Board Grid */}
      <div
        className="grid border-2 overflow-hidden"
        style={{
          gridTemplateColumns: 'repeat(8, 1fr)',
          gridTemplateRows: 'repeat(8, 1fr)',
          width: 'min(88vw, 560px)',
          height: 'min(88vw, 560px)',
          borderColor: '#4c1d95',
          borderRadius: 8,
          boxShadow: '0 0 40px rgba(139,92,246,0.4), 0 0 80px rgba(139,92,246,0.15)',
        }}
      >
        {rows.map(row => cols.map(col => {
          const isLight = (row + col) % 2 === 0
          const piece = board[row][col].piece
          const key = cellKey(row, col)
          const isSelected = selectedCell?.row === row && selectedCell?.col === col
          const isValidTarget = validTargets.has(key)
          const isCaptureTarget = capturableTargets.has(key)
          const isPowerTarget = powerTargets.has(key)
          const isFrozen = frozenCells.has(key)
          const isShielded = shieldedCells.has(key)
          const isLastFrom = lastMove && lastMove.fromRow === row && lastMove.fromCol === col
          const isLastTo = lastMove && lastMove.toRow === row && lastMove.toCol === col
          const isInCheck = checkKingPos?.r === row && checkKingPos?.c === col

          let bgColor = isLight
            ? 'hsl(258 40% 22%)'
            : 'hsl(258 50% 14%)'

          if (isLastFrom || isLastTo) bgColor = isLight ? 'hsl(50 70% 28%)' : 'hsl(50 70% 20%)'
          if (isSelected) bgColor = 'hsl(258 80% 40%)'
          if (isInCheck) bgColor = 'hsl(0 80% 30%)'

          return (
            <div
              key={key}
              className="relative flex items-center justify-center cursor-pointer"
              style={{
                backgroundColor: bgColor,
                transition: 'background-color 0.15s',
              }}
              onClick={() => onCellClick(row, col)}
            >
              {/* Valid move indicator */}
              {isValidTarget && !isCaptureTarget && !isPowerTarget && (
                <div
                  className="absolute w-4 h-4 rounded-full z-10 pointer-events-none"
                  style={{ background: 'rgba(167,243,208,0.7)', boxShadow: '0 0 8px rgba(167,243,208,0.5)' }}
                />
              )}

              {/* Power target indicator */}
              {isPowerTarget && (
                <div
                  className="absolute inset-0 z-10 pointer-events-none animate-pulse"
                  style={{
                    background: 'rgba(139,92,246,0.2)',
                    border: '2px solid rgba(167,139,250,0.8)',
                    boxShadow: '0 0 12px rgba(139,92,246,0.6)',
                  }}
                />
              )}

              {/* Capture target ring */}
              {isCaptureTarget && !isPowerTarget && (
                <div
                  className="absolute inset-1 rounded z-10 pointer-events-none"
                  style={{
                    border: '3px solid rgba(248,113,113,0.8)',
                    boxShadow: '0 0 10px rgba(248,113,113,0.5)',
                  }}
                />
              )}

              {/* Piece */}
              {piece && (
                <div className="relative z-20" style={{ pointerEvents: 'none' }}>
                  <PieceIcon
                    piece={piece}
                    size={60}
                    frozen={isFrozen}
                    shielded={isShielded}
                  />
                  {/* Power charge indicator */}
                  {!piece.powerUsed && (
                    <div
                      className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full border border-black"
                      style={{
                        background: PIECE_DEFINITIONS[piece.type] ? '#a78bfa' : 'transparent',
                        boxShadow: '0 0 6px #a78bfa',
                      }}
                    />
                  )}
                </div>
              )}
            </div>
          )
        }))}
      </div>
    </div>
  )
}
