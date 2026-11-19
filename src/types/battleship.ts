export type ShipType = 'carrier' | 'battleship' | 'cruiser' | 'submarine' | 'destroyer';

export interface ShipInfo {
  id: ShipType;
  name: string;
  size: number;
}

export const SHIPS: ShipInfo[] = [
  { id: 'carrier', name: 'Portaaviones', size: 5 },
  { id: 'battleship', name: 'Acorazado', size: 4 },
  { id: 'cruiser', name: 'Crucero', size: 3 },
  { id: 'submarine', name: 'Submarino', size: 3 },
  { id: 'destroyer', name: 'Destructor', size: 2 },
];

export type CellState = 'empty' | 'miss' | 'hit' | 'sunk';

export interface Cell {
  row: number;
  col: number;
  hasShip: boolean;
  shipId?: ShipType;
  state: CellState;
}

export type BoardState = Cell[][];

export type Orientation = 'horizontal' | 'vertical';

export interface Placement {
  shipId: ShipType;
  row: number;
  col: number;
  orientation: Orientation;
}

export type SimulationCount = 100 | 1000 | 5000 | 10000;

export interface GameStats {
  playerShots: number;
  agentShots: number;
  playerHits: number;
  agentHits: number;
  playerMisses: number;
  agentMisses: number;
  simulationTimeMs: number;
  validConfigurationsCount: number;
}
export type ResultadoDisparo = 'agua' | 'impacto' | 'hundido' | 'repetido'