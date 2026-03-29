// ──────────────────────────────────────────────────────────────────
// ARCANA CHESS — Game Types & Definitions
// ──────────────────────────────────────────────────────────────────

export type PlayerColor = 'white' | 'black'
export type PieceType = 'king' | 'queen' | 'rook' | 'bishop' | 'knight' | 'pawn'
export type GamePhase = 'menu' | 'playing' | 'gameover'
export type PowerEffect =
  | 'freeze'       // Congela peça inimiga por 1 turno
  | 'swap'         // Troca posição com peça aliada
  | 'shield'       // Protege peça de captura por 1 turno
  | 'blast'        // Explode em área 3x3 (mata peças na área)
  | 'summon'       // Invoca um peão em casa vazia adjacente
  | 'teleport'     // Move para qualquer casa do tabuleiro
  | 'resurrect'    // Revive última peça capturada
  | 'charge'       // Move duas vezes no mesmo turno
  | 'corrupt'      // Rouba poder especial de peça inimiga
  | 'cleanse'      // Remove todos os efeitos negativos de aliados

export interface ActiveEffect {
  type: 'frozen' | 'shielded' | 'corrupted'
  turnsLeft: number
  stolenPower?: PowerEffect
}

export interface Piece {
  id: string
  type: PieceType
  color: PlayerColor
  hasMoved: boolean
  powerUsed: boolean
  activeEffects: ActiveEffect[]
  // Special: for pawns that become queens via promotion
  promoted?: boolean
}

export interface Cell {
  row: number
  col: number
  piece: Piece | null
}

export type Board = Cell[][]

export interface Move {
  fromRow: number
  fromCol: number
  toRow: number
  toCol: number
  capture?: Piece
  isPowerMove?: boolean
  powerEffect?: PowerEffect
  targetRow?: number   // for powers that need a secondary target
  targetCol?: number
}

export interface PlayerState {
  color: PlayerColor
  capturedPieces: Piece[]
  powerCharges: number  // max 3 power charges, 1 gained per turn
}

export interface GameState {
  board: Board
  currentTurn: PlayerColor
  phase: GamePhase
  selectedCell: { row: number; col: number } | null
  validMoves: Move[]
  players: { white: PlayerState; black: PlayerState }
  lastMove: Move | null
  winner: PlayerColor | 'draw' | null
  check: PlayerColor | null
  turnCount: number
  powerMode: boolean             // when true, activating power instead of regular move
  powerTarget: PowerEffect | null
  pendingPowerMove: Move | null  // power move awaiting secondary selection
  log: string[]
  frozenCells: Set<string>       // "row,col" strings of frozen pieces
  shieldedCells: Set<string>     // "row,col" strings of shielded pieces
}

// ──────────────────────────────────────────────────────────────────
// PIECE DEFINITIONS — Lore + Powers
// ──────────────────────────────────────────────────────────────────

export interface PieceDefinition {
  type: PieceType
  name: string
  title: string
  lore: string
  power: PowerEffect
  powerName: string
  powerDesc: string
  powerCost: number  // Power charges needed (1-3)
  emoji: string
  symbol: string
}

export const PIECE_DEFINITIONS: Record<PieceType, PieceDefinition> = {
  king: {
    type: 'king',
    name: 'Rex Eterno',
    title: 'O Imortal',
    lore: 'Nunca pode ser capturado — invoca um escudo divino quando ameaçado.',
    power: 'shield',
    powerName: 'Escudo Divino',
    powerDesc: 'Envolve o Rei em uma barreira sagrada. Imune a capturas por 1 turno.',
    powerCost: 2,
    emoji: '♔',
    symbol: 'K',
  },
  queen: {
    type: 'queen',
    name: 'Rainha do Caos',
    title: 'A Destruidora',
    lore: 'Senhora da magia negra. Destrói tudo no raio de sua explosão cósmica.',
    power: 'blast',
    powerName: 'Nova Cósmica',
    powerDesc: 'Explode em área 3x3 ao redor de um alvo. Captura TODAS as peças inimigas na área.',
    powerCost: 3,
    emoji: '♕',
    symbol: 'Q',
  },
  rook: {
    type: 'rook',
    name: 'Colosso de Ferro',
    title: 'A Fortaleza',
    lore: 'Torre mecânica ancestral. Pode se teletransportar instantaneamente para qualquer ponto da linha.',
    power: 'teleport',
    powerName: 'Salto Dimensional',
    powerDesc: 'Teleporta para qualquer casa vazia no tabuleiro. Ignora peças no caminho.',
    powerCost: 2,
    emoji: '♖',
    symbol: 'R',
  },
  bishop: {
    type: 'bishop',
    name: 'Arauto das Chamas',
    title: 'O Queimador',
    lore: 'Sacerdote do fogo eterno. Congela inimigos em cristal de gelo negro.',
    power: 'freeze',
    powerName: 'Criostase',
    powerDesc: 'Congela uma peça inimiga por 1 turno. Ela não pode se mover nem capturar.',
    powerCost: 1,
    emoji: '♗',
    symbol: 'B',
  },
  knight: {
    type: 'knight',
    name: 'Corsário das Sombras',
    title: 'O Fantasma',
    lore: 'Guerreiro que domina o tempo. Ataca duas vezes no mesmo turno.',
    power: 'charge',
    powerName: 'Carga Fantasma',
    powerDesc: 'Move-se e ataca novamente no mesmo turno. Dois movimentos consecutivos.',
    powerCost: 2,
    emoji: '♘',
    symbol: 'N',
  },
  pawn: {
    type: 'pawn',
    name: 'Recruta',
    title: 'O Invocador',
    lore: 'Soldado simples com segredo perigoso: pode ressuscitar aliados caídos.',
    power: 'resurrect',
    powerName: 'Renascimento',
    powerDesc: 'Revive a última peça capturada do seu time em uma casa adjacente vazia.',
    powerCost: 3,
    emoji: '♙',
    symbol: 'P',
  },
}

export const POWER_COLORS: Record<PowerEffect, string> = {
  freeze: '#60d4f4',
  swap: '#a78bfa',
  shield: '#fcd34d',
  blast: '#f87171',
  summon: '#34d399',
  teleport: '#818cf8',
  resurrect: '#fb923c',
  charge: '#f472b6',
  corrupt: '#7c3aed',
  cleanse: '#6ee7b7',
}
