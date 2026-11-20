/** Identificadores de los cinco tipos de barcos disponibles en la flota. */
export type ShipType = 'carrier' | 'battleship' | 'cruiser' | 'submarine' | 'destroyer';

/** Metadatos de un tipo de barco: identificador interno, nombre en español y longitud. */
export interface ShipInfo {
  id: ShipType;
  name: string;
  size: number;
}

/** Flota estándar de Batalla Naval (5 barcos, 17 celdas ocupadas en total). */
export const SHIPS: ShipInfo[] = [
  { id: 'carrier', name: 'Portaaviones', size: 5 },
  { id: 'battleship', name: 'Acorazado', size: 4 },
  { id: 'cruiser', name: 'Crucero', size: 3 },
  { id: 'submarine', name: 'Submarino', size: 3 },
  { id: 'destroyer', name: 'Destructor', size: 2 },
];

/** Estados posibles de ataque sobre una celda del tablero. */
export type CellState = 'empty' | 'miss' | 'hit' | 'sunk';

/** Representa una celda individual dentro del tablero de 10x10. */
export interface Cell {
  row: number;
  col: number;
  hasShip: boolean;
  shipId?: ShipType;
  state: CellState;
  isStart?: boolean;
  isEnd?: boolean;
}

/** Matriz bidimensional de 10x10 que modela el estado completo de un tablero. */
export type BoardState = Cell[][];

/** Orientaciones válidas para colocar un barco en el tablero. */
export type Orientation = 'horizontal' | 'vertical' | 'diagonal-abajo' | 'diagonal-arriba';

/** Posición inicial y orientación asignada a un barco concreto. */
export interface Placement {
  shipId: ShipType;
  row: number;
  col: number;
  orientation: Orientation;
}

/** Tamaños de muestra admitidos para las simulaciones de Monte Carlo. */
export type SimulationCount = 100 | 1000 | 5000 | 10000;

/** Métricas acumuladas de disparos, aciertos y rendimiento de simulación. */
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

/** Posibles resultados al efectuar un disparo sobre una coordenada. */
export type ResultadoDisparo = 'agua' | 'impacto' | 'hundido' | 'repetido';

/** Celda sugerida por el motor probabilístico junto con su probabilidad estimada. */
export interface Recomendacion {
  fila: number;
  columna: number;
  probabilidad: number;
}

/** Resultado completo del análisis de Monte Carlo sobre un tablero. */
export interface AnalisisProbabilistico {
  matrizProbabilidades: number[][];
  tiempoEjecucionMs: number;
  configuracionesValidas: number;
  simulaciones: SimulationCount;
  recomendacion: Recomendacion;
}

/** Registro de un turno ejecutado por el agente automático. */
export interface DecisionAgente {
  turno: number;
  celda: string;
  probabilidad: number;
  configuracionesValidas: number;
  simulaciones: SimulationCount;
  tiempoMs: number;
  resultado: ResultadoDisparo;
  barcoHundido?: ShipType;
}

/** Registro de un turno del jugador contrastado con la sugerencia del algoritmo. */
export interface DecisionJugador {
  turno: number;
  recomendada: string;
  probRecomendada: number;
  elegida: string;
  probElegida: number;
  siguioRecomendacion: boolean;
  resultado: ResultadoDisparo;
  barcoHundido?: ShipType;
}

/** Resumen estadístico de un lote de partidas experimentales para un número de simulaciones. */
export interface ResultadoExperimento {
  simulaciones: SimulationCount;
  partidas: number;
  tiempoPromedioMs: number;
  tiempoMaximoMs: number;
  validasPromedio: number;
  disparosPromedio: number;
  disparosMin: number;
  disparosMax: number;
  tasaAcierto: number;
}