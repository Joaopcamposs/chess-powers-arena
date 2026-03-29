import { useCallback, useEffect, useReducer, useRef, useState } from 'react'
import { Board } from './components/Board'
import { PowerPanel } from './components/PowerPanel'
import { GameHUD } from './components/GameHUD'
import { GameLog } from './components/GameLog'
import { GameOverScreen } from './components/GameOverScreen'
import { MenuScreen } from './components/MenuScreen'
import {
  createInitialGameState,
  getLegalMoves,
  applyMove,
  applyPower,
  getAIMove,
} from './game/engine'
import { GameState, PIECE_DEFINITIONS, PieceType } from './game/types'

// ── Reducer ────────────────────────────────────────────────────────

type Action =
  | { type: 'CELL_CLICK'; row: number; col: number }
  | { type: 'ACTIVATE_POWER' }
  | { type: 'RESTART' }
  | { type: 'AI_MOVE' }

function gameReducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case 'RESTART':
      return createInitialGameState()

    case 'ACTIVATE_POWER': {
      if (!state.selectedCell) return state
      const piece = state.board[state.selectedCell.row][state.selectedCell.col].piece
      if (!piece || piece.powerUsed || piece.color !== state.currentTurn) return state
      const { powerCost } = PIECE_DEFINITIONS[piece.type]
      if (state.players[state.currentTurn].powerCharges < powerCost) return state

      // King's shield activates immediately without target selection
      if (piece.type === 'king') {
        return applyPower(state, state.selectedCell.row, state.selectedCell.col,
          state.selectedCell.row, state.selectedCell.col)
      }

      return { ...state, powerMode: true }
    }

    case 'CELL_CLICK': {
      const { row, col } = action
      const piece = state.board[row][col].piece

      // Power mode: activate power at target
      if (state.powerMode && state.selectedCell) {
        const sourcePiece = state.board[state.selectedCell.row][state.selectedCell.col].piece
        if (sourcePiece) {
          // Check if valid power target
          return applyPower(state, state.selectedCell.row, state.selectedCell.col, row, col)
        }
        return { ...state, powerMode: false, selectedCell: null, validMoves: [] }
      }

      // Cancel power mode if clicking elsewhere
      if (state.powerMode) {
        return { ...state, powerMode: false, selectedCell: null, validMoves: [] }
      }

      // No selection yet
      if (!state.selectedCell) {
        if (!piece || piece.color !== state.currentTurn) return state
        const moves = getLegalMoves(state.board, row, col, state.frozenCells)
        return { ...state, selectedCell: { row, col }, validMoves: moves }
      }

      // Already selected
      const { row: selRow, col: selCol } = state.selectedCell
      const selectedPiece = state.board[selRow][selCol].piece

      // Click same cell = deselect
      if (selRow === row && selCol === col) {
        return { ...state, selectedCell: null, validMoves: [] }
      }

      // Click own piece = re-select
      if (piece && piece.color === state.currentTurn) {
        const moves = getLegalMoves(state.board, row, col, state.frozenCells)
        return { ...state, selectedCell: { row, col }, validMoves: moves }
      }

      // Try to move to this cell
      const move = state.validMoves.find(m => m.toRow === row && m.toCol === col)
      if (move) {
        return applyMove(state, move)
      }

      return { ...state, selectedCell: null, validMoves: [] }
    }

    case 'AI_MOVE': {
      if (state.currentTurn !== 'black' || state.phase !== 'playing') return state
      const move = getAIMove(state)
      if (!move) return state
      return applyMove(state, move)
    }

    default:
      return state
  }
}

// ── Main Game Component ────────────────────────────────────────────

export function Game() {
  const [vsAI, setVsAI] = useState(false)
  const [started, setStarted] = useState(false)
  const [gameState, dispatch] = useReducer(gameReducer, createInitialGameState())
  const aiTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Derived: what piece is selected
  const selectedPieceType: PieceType | null = gameState.selectedCell
    ? (gameState.board[gameState.selectedCell.row][gameState.selectedCell.col].piece?.type ?? null)
    : null

  // AI auto-move
  useEffect(() => {
    if (!vsAI || gameState.currentTurn !== 'black' || gameState.phase !== 'playing') return
    aiTimeoutRef.current = setTimeout(() => {
      dispatch({ type: 'AI_MOVE' })
    }, 700)
    return () => {
      if (aiTimeoutRef.current) clearTimeout(aiTimeoutRef.current)
    }
  }, [vsAI, gameState.currentTurn, gameState.phase, gameState.turnCount])

  const handleCellClick = useCallback((row: number, col: number) => {
    // Prevent clicking while AI is thinking
    if (vsAI && gameState.currentTurn === 'black') return
    dispatch({ type: 'CELL_CLICK', row, col })
  }, [vsAI, gameState.currentTurn])

  const handleActivatePower = useCallback(() => {
    dispatch({ type: 'ACTIVATE_POWER' })
  }, [])

  const handleRestart = useCallback(() => {
    dispatch({ type: 'RESTART' })
  }, [])

  const handleStart = useCallback((ai: boolean) => {
    setVsAI(ai)
    setStarted(true)
    dispatch({ type: 'RESTART' })
  }, [])

  if (!started) {
    return <MenuScreen onStart={handleStart} />
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-start py-4 px-2"
      style={{
        background: 'radial-gradient(ellipse at top, hsl(258 60% 8%) 0%, hsl(240 50% 3%) 100%)',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between w-full max-w-4xl mb-3 px-2">
        <h1
          className="text-xl font-black tracking-tight"
          style={{
            background: 'linear-gradient(135deg, #c4b5fd, #818cf8)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          ⚔ ARCANA CHESS
        </h1>
        <div className="flex items-center gap-3">
          <span className="text-xs px-2 py-1 rounded" style={{ background: 'rgba(139,92,246,0.2)', color: '#a78bfa' }}>
            Turno {gameState.turnCount + 1}
          </span>
          {vsAI && (
            <span className="text-xs px-2 py-1 rounded" style={{ background: 'rgba(248,113,113,0.15)', color: '#f87171' }}>
              vs IA
            </span>
          )}
          <button
            onClick={() => setStarted(false)}
            className="text-xs px-2 py-1 rounded transition-all hover:opacity-80"
            style={{ background: 'rgba(55,65,81,0.5)', color: '#9ca3af', border: '1px solid #374151' }}
          >
            Menu
          </button>
          <button
            onClick={handleRestart}
            className="text-xs px-2 py-1 rounded transition-all hover:opacity-80"
            style={{ background: 'rgba(55,65,81,0.5)', color: '#9ca3af', border: '1px solid #374151' }}
          >
            ↺ Reiniciar
          </button>
        </div>
      </div>

      {/* Main layout */}
      <div className="flex flex-col lg:flex-row items-start justify-center gap-4 w-full max-w-4xl">

        {/* Left sidebar (desktop only) */}
        <div className="hidden lg:flex flex-col gap-3" style={{ width: 260 }}>
          <GameHUD state={gameState} side="top" playerColor="black" isAI={vsAI} />
          <PowerPanel
            state={gameState}
            onActivatePower={handleActivatePower}
            selectedPieceType={selectedPieceType}
          />
          <GameLog log={gameState.log} />
        </div>

        {/* Board center */}
        <div className="flex flex-col items-center gap-2">
          {/* Mobile: black HUD above board */}
          <div className="lg:hidden w-full max-w-sm">
            <GameHUD state={gameState} side="top" playerColor="black" isAI={vsAI} />
          </div>

          {gameState.check && (
            <div
              className="px-4 py-1.5 rounded-full text-sm font-bold animate-pulse"
              style={{ background: '#7f1d1d', color: '#fca5a5', border: '1px solid #f87171' }}
            >
              ♟ Xeque ao {gameState.check === 'white' ? 'Rei da Luz' : 'Rei das Sombras'}!
            </div>
          )}

          <Board
            state={gameState}
            onCellClick={handleCellClick}
          />

          {/* Mobile: white HUD below board */}
          <div className="lg:hidden w-full max-w-sm">
            <GameHUD state={gameState} side="bottom" playerColor="white" />
          </div>

          {/* Mobile: power panel below HUDs */}
          <div className="lg:hidden w-full max-w-sm">
            <PowerPanel
              state={gameState}
              onActivatePower={handleActivatePower}
              selectedPieceType={selectedPieceType}
            />
          </div>
        </div>

        {/* Right sidebar (desktop only) */}
        <div className="hidden lg:flex flex-col gap-3" style={{ width: 260 }}>
          <GameHUD state={gameState} side="bottom" playerColor="white" />

          {/* Turn indicator */}
          <div
            className="rounded-xl p-3 flex items-center gap-3"
            style={{
              background: 'hsl(258 50% 10%)',
              border: '1px solid rgba(139,92,246,0.3)',
            }}
          >
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-base"
              style={{
                background: gameState.currentTurn === 'white'
                  ? 'linear-gradient(135deg, #f0e8c0, #d4b896)'
                  : 'linear-gradient(135deg, #1a0a2e, #4c1d95)',
                border: '2px solid #a78bfa',
              }}
            >
              {gameState.currentTurn === 'white' ? '☀️' : '🌙'}
            </div>
            <div>
              <div className="text-xs font-bold" style={{ color: '#e5e7eb' }}>
                {gameState.currentTurn === 'white' ? 'Ordem da Luz' : vsAI ? '🤖 IA pensando...' : 'Sombras'}
              </div>
              <div className="text-xs" style={{ color: '#6b7280' }}>
                {gameState.powerMode ? '✦ Modo poder ativo' : 'Selecione uma peça'}
              </div>
            </div>
          </div>

          {/* Mobile log at bottom for desktop */}
          <GameLog log={gameState.log} />
        </div>
      </div>

      {/* Game over overlay */}
      {gameState.phase === 'gameover' && (
        <GameOverScreen state={gameState} onRestart={handleRestart} />
      )}
    </div>
  )
}
