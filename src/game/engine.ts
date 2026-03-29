// ──────────────────────────────────────────────────────────────────
// ARCANA CHESS — Game Engine
// ──────────────────────────────────────────────────────────────────

import { Board, Cell, GameState, Move, Piece, PieceType, PlayerColor, PlayerState } from './types'

// ── Board Initialization ──────────────────────────────────────────

function createPiece(type: PieceType, color: PlayerColor): Piece {
  return {
    id: `${color}-${type}-${Math.random().toString(36).slice(2, 7)}`,
    type,
    color,
    hasMoved: false,
    powerUsed: false,
    activeEffects: [],
  }
}

export function createInitialBoard(): Board {
  const board: Board = Array.from({ length: 8 }, (_, row) =>
    Array.from({ length: 8 }, (_, col) => ({ row, col, piece: null }))
  )

  const backRow: PieceType[] = ['rook', 'knight', 'bishop', 'queen', 'king', 'bishop', 'knight', 'rook']

  // Black pieces (top)
  backRow.forEach((type, col) => {
    board[0][col].piece = createPiece(type, 'black')
  })
  for (let col = 0; col < 8; col++) {
    board[1][col].piece = createPiece('pawn', 'black')
  }

  // White pieces (bottom)
  backRow.forEach((type, col) => {
    board[7][col].piece = createPiece(type, 'white')
  })
  for (let col = 0; col < 8; col++) {
    board[6][col].piece = createPiece('pawn', 'white')
  }

  return board
}

function createPlayerState(color: PlayerColor): PlayerState {
  return { color, capturedPieces: [], powerCharges: 1 }
}

export function createInitialGameState(): GameState {
  return {
    board: createInitialBoard(),
    currentTurn: 'white',
    phase: 'playing',
    selectedCell: null,
    validMoves: [],
    players: {
      white: createPlayerState('white'),
      black: createPlayerState('black'),
    },
    lastMove: null,
    winner: null,
    check: null,
    turnCount: 0,
    powerMode: false,
    powerTarget: null,
    pendingPowerMove: null,
    log: ['⚔️ Arcana Chess começou! Brancas jogam primeiro.'],
    frozenCells: new Set(),
    shieldedCells: new Set(),
  }
}

// ── Utility ───────────────────────────────────────────────────────

export function cloneBoard(board: Board): Board {
  return board.map(row => row.map(cell => ({
    ...cell,
    piece: cell.piece ? { ...cell.piece, activeEffects: [...cell.piece.activeEffects] } : null,
  })))
}

function cellKey(row: number, col: number): string {
  return `${row},${col}`
}

function inBounds(row: number, col: number): boolean {
  return row >= 0 && row < 8 && col >= 0 && col < 8
}

// ── Raw Move Generation (ignores check) ──────────────────────────

function getRawMoves(board: Board, row: number, col: number): Move[] {
  const cell = board[row][col]
  const piece = cell.piece
  if (!piece) return []

  const moves: Move[] = []
  const addMove = (toRow: number, toCol: number) => {
    if (!inBounds(toRow, toCol)) return false
    const target = board[toRow][toCol].piece
    if (target && target.color === piece.color) return false
    moves.push({ fromRow: row, fromCol: col, toRow, toCol, capture: target ?? undefined })
    return !target  // returns true if square was empty (can continue sliding)
  }

  switch (piece.type) {
    case 'pawn': {
      const dir = piece.color === 'white' ? -1 : 1
      const startRow = piece.color === 'white' ? 6 : 1
      // Forward
      if (inBounds(row + dir, col) && !board[row + dir][col].piece) {
        moves.push({ fromRow: row, fromCol: col, toRow: row + dir, toCol: col })
        // Double push from start
        if (row === startRow && !board[row + dir * 2][col].piece) {
          moves.push({ fromRow: row, fromCol: col, toRow: row + dir * 2, toCol: col })
        }
      }
      // Captures diagonal
      for (const dc of [-1, 1]) {
        if (inBounds(row + dir, col + dc)) {
          const diag = board[row + dir][col + dc].piece
          if (diag && diag.color !== piece.color) {
            moves.push({ fromRow: row, fromCol: col, toRow: row + dir, toCol: col + dc, capture: diag })
          }
        }
      }
      break
    }
    case 'knight': {
      const knightMoves = [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]]
      for (const [dr, dc] of knightMoves) addMove(row + dr, col + dc)
      break
    }
    case 'bishop': {
      for (const [dr, dc] of [[-1,-1],[-1,1],[1,-1],[1,1]]) {
        let r = row + dr, c = col + dc
        while (inBounds(r, c) && addMove(r, c)) { r += dr; c += dc }
      }
      break
    }
    case 'rook': {
      for (const [dr, dc] of [[-1,0],[1,0],[0,-1],[0,1]]) {
        let r = row + dr, c = col + dc
        while (inBounds(r, c) && addMove(r, c)) { r += dr; c += dc }
      }
      break
    }
    case 'queen': {
      for (const [dr, dc] of [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]]) {
        let r = row + dr, c = col + dc
        while (inBounds(r, c) && addMove(r, c)) { r += dr; c += dc }
      }
      break
    }
    case 'king': {
      for (const [dr, dc] of [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]]) {
        addMove(row + dr, col + dc)
      }
      // Castling
      if (!piece.hasMoved) {
        // Kingside
        const kRook = board[row][7].piece
        if (kRook && kRook.type === 'rook' && !kRook.hasMoved &&
            !board[row][5].piece && !board[row][6].piece) {
          moves.push({ fromRow: row, fromCol: col, toRow: row, toCol: 6 })
        }
        // Queenside
        const qRook = board[row][0].piece
        if (qRook && qRook.type === 'rook' && !qRook.hasMoved &&
            !board[row][1].piece && !board[row][2].piece && !board[row][3].piece) {
          moves.push({ fromRow: row, fromCol: col, toRow: row, toCol: 2 })
        }
      }
      break
    }
  }

  return moves
}

// ── Check Detection ───────────────────────────────────────────────

export function isInCheck(board: Board, color: PlayerColor): boolean {
  // Find king
  let kingRow = -1, kingCol = -1
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = board[r][c].piece
      if (p && p.type === 'king' && p.color === color) { kingRow = r; kingCol = c }
    }
  }
  if (kingRow === -1) return false

  // Check if any enemy piece can capture the king
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = board[r][c].piece
      if (p && p.color !== color) {
        const enemyMoves = getRawMoves(board, r, c)
        if (enemyMoves.some(m => m.toRow === kingRow && m.toCol === kingCol)) return true
      }
    }
  }
  return false
}

// ── Legal Moves (filters check) ──────────────────────────────────

export function getLegalMoves(board: Board, row: number, col: number, frozenCells: Set<string>): Move[] {
  const piece = board[row][col].piece
  if (!piece) return []

  // Frozen pieces cannot move
  if (frozenCells.has(cellKey(row, col))) return []

  const raw = getRawMoves(board, row, col)
  return raw.filter(move => {
    // Cannot capture shielded pieces (handled by shield power)
    const testBoard = cloneBoard(board)
    applyMoveToBoard(testBoard, move)
    return !isInCheck(testBoard, piece.color)
  })
}

// ── Apply Move ────────────────────────────────────────────────────

export function applyMoveToBoard(board: Board, move: Move): Piece | null {
  const piece = board[move.fromRow][move.fromCol].piece
  if (!piece) return null

  let captured: Piece | null = null

  // Castling detection
  if (piece.type === 'king' && Math.abs(move.toCol - move.fromCol) === 2) {
    const rookFromCol = move.toCol > move.fromCol ? 7 : 0
    const rookToCol = move.toCol > move.fromCol ? 5 : 3
    const rook = board[move.fromRow][rookFromCol].piece
    board[move.fromRow][rookToCol].piece = rook ? { ...rook, hasMoved: true } : null
    board[move.fromRow][rookFromCol].piece = null
  }

  // Capture
  if (board[move.toRow][move.toCol].piece) {
    captured = board[move.toRow][move.toCol].piece
  }

  board[move.toRow][move.toCol].piece = { ...piece, hasMoved: true }
  board[move.fromRow][move.fromCol].piece = null

  // Pawn promotion
  if (piece.type === 'pawn') {
    const promotionRow = piece.color === 'white' ? 0 : 7
    if (move.toRow === promotionRow) {
      board[move.toRow][move.toCol].piece = {
        ...piece,
        type: 'queen',
        hasMoved: true,
        promoted: true,
      }
    }
  }

  return captured
}

// ── Has Any Legal Moves ───────────────────────────────────────────

export function hasAnyLegalMoves(board: Board, color: PlayerColor, frozenCells: Set<string>): boolean {
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = board[r][c].piece
      if (p && p.color === color) {
        if (getLegalMoves(board, r, c, frozenCells).length > 0) return true
      }
    }
  }
  return false
}

// ── Main Game Move Handler ────────────────────────────────────────

export function applyMove(state: GameState, move: Move): GameState {
  const newBoard = cloneBoard(state.board)
  const newFrozen = new Set(state.frozenCells)
  const newShielded = new Set(state.shieldedCells)

  // Decrement frozen turns and unfreeze if expired
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = newBoard[r][c].piece
      if (p) {
        p.activeEffects = p.activeEffects
          .map(e => ({ ...e, turnsLeft: e.turnsLeft - 1 }))
          .filter(e => e.turnsLeft > 0)
        const key = cellKey(r, c)
        if (!p.activeEffects.some(e => e.type === 'frozen')) newFrozen.delete(key)
        if (!p.activeEffects.some(e => e.type === 'shielded')) newShielded.delete(key)
      }
    }
  }

  const captured = applyMoveToBoard(newBoard, move)

  const newPlayers = {
    white: { ...state.players.white, capturedPieces: [...state.players.white.capturedPieces] },
    black: { ...state.players.black, capturedPieces: [...state.players.black.capturedPieces] },
  }

  if (captured) {
    newPlayers[state.currentTurn].capturedPieces.push(captured)
  }

  const nextTurn: PlayerColor = state.currentTurn === 'white' ? 'black' : 'white'

  // Give power charge each turn (max 3)
  newPlayers[nextTurn].powerCharges = Math.min(3, newPlayers[nextTurn].powerCharges + 1)

  const inCheck = isInCheck(newBoard, nextTurn)
  const hasMoves = hasAnyLegalMoves(newBoard, nextTurn, newFrozen)

  let winner: GameState['winner'] = null
  let phase = state.phase

  if (!hasMoves) {
    if (inCheck) {
      winner = state.currentTurn
    } else {
      winner = 'draw'
    }
    phase = 'gameover'
  }

  // Check if king was directly captured
  let kingStillAlive = false
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = newBoard[r][c].piece
      if (p && p.type === 'king' && p.color === nextTurn) { kingStillAlive = true; break }
    }
  }
  if (!kingStillAlive) {
    winner = state.currentTurn
    phase = 'gameover'
  }

  const logEntry = buildLogEntry(move, captured, state.currentTurn, inCheck)

  return {
    ...state,
    board: newBoard,
    currentTurn: nextTurn,
    phase,
    selectedCell: null,
    validMoves: [],
    lastMove: move,
    winner,
    check: inCheck ? nextTurn : null,
    turnCount: state.turnCount + 1,
    powerMode: false,
    powerTarget: null,
    pendingPowerMove: null,
    players: newPlayers,
    log: [logEntry, ...state.log].slice(0, 30),
    frozenCells: newFrozen,
    shieldedCells: newShielded,
  }
}

// ── Power Activation ──────────────────────────────────────────────

export function applyPower(state: GameState, sourceRow: number, sourceCol: number, targetRow: number, targetCol: number): GameState {
  const piece = state.board[sourceRow][sourceCol].piece
  if (!piece || piece.powerUsed) return state

  const newBoard = cloneBoard(state.board)
  const newFrozen = new Set(state.frozenCells)
  const newShielded = new Set(state.shieldedCells)
  const newPlayers = {
    white: { ...state.players.white, capturedPieces: [...state.players.white.capturedPieces] },
    black: { ...state.players.black, capturedPieces: [...state.players.black.capturedPieces] },
  }

  const power = piece.type
  let logMsg = ''

  switch (power) {
    case 'bishop': {
      // FREEZE — freeze enemy piece
      const target = newBoard[targetRow][targetCol].piece
      if (target && target.color !== piece.color) {
        target.activeEffects = [...target.activeEffects, { type: 'frozen', turnsLeft: 2 }]
        newFrozen.add(cellKey(targetRow, targetCol))
        logMsg = `🧊 ${piece.color === 'white' ? 'Brancas' : 'Pretas'}: Arauto congela peça em (${targetRow},${targetCol})!`
      }
      break
    }
    case 'queen': {
      // BLAST — 3x3 area kill
      let killCount = 0
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          const r = targetRow + dr, c = targetCol + dc
          if (!inBounds(r, c)) continue
          const target = newBoard[r][c].piece
          if (target && target.color !== piece.color) {
            newPlayers[piece.color].capturedPieces.push(target)
            newBoard[r][c].piece = null
            newFrozen.delete(cellKey(r, c))
            newShielded.delete(cellKey(r, c))
            killCount++
          }
        }
      }
      logMsg = `💥 ${piece.color === 'white' ? 'Brancas' : 'Pretas'}: Nova Cósmica destrói ${killCount} peça(s)!`
      break
    }
    case 'rook': {
      // TELEPORT — move rook to any empty cell
      const target = newBoard[targetRow][targetCol].piece
      if (!target) {
        newBoard[targetRow][targetCol].piece = { ...piece, hasMoved: true, powerUsed: true }
        newBoard[sourceRow][sourceCol].piece = null
        logMsg = `✨ ${piece.color === 'white' ? 'Brancas' : 'Pretas'}: Colosso se teleporta!`
      }
      break
    }
    case 'king': {
      // SHIELD — shield this king for 2 turns
      const king = newBoard[sourceRow][sourceCol].piece!
      king.activeEffects = [...king.activeEffects, { type: 'shielded', turnsLeft: 2 }]
      newShielded.add(cellKey(sourceRow, sourceCol))
      logMsg = `🛡️ ${piece.color === 'white' ? 'Brancas' : 'Pretas'}: Rex ativa Escudo Divino!`
      break
    }
    case 'pawn': {
      // RESURRECT — revive last captured piece next to pawn
      const lastCaptured = newPlayers[piece.color].capturedPieces[newPlayers[piece.color].capturedPieces.length - 1]
      if (lastCaptured && !newBoard[targetRow][targetCol].piece) {
        newBoard[targetRow][targetCol].piece = {
          ...lastCaptured,
          id: `revived-${Date.now()}`,
          powerUsed: false,
          hasMoved: true,
          activeEffects: [],
        }
        newPlayers[piece.color].capturedPieces = newPlayers[piece.color].capturedPieces.slice(0, -1)
        logMsg = `🔥 ${piece.color === 'white' ? 'Brancas' : 'Pretas'}: Recruta ressuscita ${lastCaptured.type}!`
      }
      break
    }
    default:
      break
  }

  // Mark power as used on the piece
  const sourcePiece = newBoard[sourceRow][sourceCol].piece
  if (sourcePiece) sourcePiece.powerUsed = true

  const nextTurn: PlayerColor = state.currentTurn === 'white' ? 'black' : 'white'
  newPlayers[nextTurn].powerCharges = Math.min(3, newPlayers[nextTurn].powerCharges + 1)

  const inCheck = isInCheck(newBoard, nextTurn)
  const hasMoves = hasAnyLegalMoves(newBoard, nextTurn, newFrozen)
  let winner: GameState['winner'] = null
  let phase = state.phase

  if (!hasMoves) {
    winner = inCheck ? state.currentTurn : 'draw'
    phase = 'gameover'
  }

  return {
    ...state,
    board: newBoard,
    currentTurn: nextTurn,
    phase,
    selectedCell: null,
    validMoves: [],
    lastMove: { fromRow: sourceRow, fromCol: sourceCol, toRow: targetRow, toCol: targetCol, isPowerMove: true },
    winner,
    check: inCheck ? nextTurn : null,
    turnCount: state.turnCount + 1,
    powerMode: false,
    powerTarget: null,
    pendingPowerMove: null,
    players: newPlayers,
    log: [logMsg || '✨ Poder ativado!', ...state.log].slice(0, 30),
    frozenCells: newFrozen,
    shieldedCells: newShielded,
  }
}

// ── AI (Simple) ───────────────────────────────────────────────────

export function getAIMove(state: GameState): Move | null {
  const allMoves: Move[] = []

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = state.board[r][c].piece
      if (p && p.color === 'black') {
        const moves = getLegalMoves(state.board, r, c, state.frozenCells)
        allMoves.push(...moves)
      }
    }
  }

  if (allMoves.length === 0) return null

  // Prioritize: checkmate > capture king > capture high value > random
  const pieceValue: Record<string, number> = { king: 1000, queen: 9, rook: 5, bishop: 3, knight: 3, pawn: 1 }

  // Try to find checkmate
  for (const move of allMoves) {
    const testBoard = cloneBoard(state.board)
    applyMoveToBoard(testBoard, move)
    if (isInCheck(testBoard, 'white') && !hasAnyLegalMoves(testBoard, 'white', state.frozenCells)) {
      return move
    }
  }

  // Capture moves sorted by value
  const captures = allMoves.filter(m => m.capture)
  captures.sort((a, b) => (pieceValue[b.capture!.type] || 0) - (pieceValue[a.capture!.type] || 0))

  if (captures.length > 0 && Math.random() > 0.2) return captures[0]

  return allMoves[Math.floor(Math.random() * allMoves.length)]
}

// ── Helpers ───────────────────────────────────────────────────────

function buildLogEntry(move: Move, captured: Piece | null, turn: PlayerColor, inCheck: boolean): string {
  const cols = 'abcdefgh'
  const rows = '87654321'
  const from = cols[move.fromCol] + rows[move.fromRow]
  const to = cols[move.toCol] + rows[move.toRow]
  const side = turn === 'white' ? 'Brancas' : 'Pretas'
  let msg = `${side}: ${from}→${to}`
  if (captured) msg += ` (captura ${captured.type})`
  if (inCheck) msg += ' ♟️ Xeque!'
  return msg
}
