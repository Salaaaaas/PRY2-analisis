import type { BoardState, Cell, Placement, Orientation, ShipType, ResultadoDisparo } from '../types/battleship';
import { SHIPS } from '../types/battleship';

/** Crea una matriz de 10x10 inicializada sin barcos ni disparos. */
export const crearTableroVacio = (): BoardState => {
  const tablero: BoardState = [];
  for (let fila = 0; fila < 10; fila++) {
    const filaCelda: Cell[] = [];
    for (let col = 0; col < 10; col++) {
      filaCelda.push({
        row: fila,
        col: col,
        hasShip: false,
        state: 'empty',
        isStart: false,
        isEnd: false,
      });
    }
    tablero.push(filaCelda);
  }
  return tablero;
};

/**
 * Calcula las coordenadas que ocuparía un barco a partir de una celda inicial
 * y una orientación; devuelve `null` si alguna celda se sale del tablero 10x10.
 */
export const obtenerCeldasBarco = (
  filaInicio: number,
  colInicio: number,
  tamano: number,
  orientacion: Orientation,
): { r: number; c: number }[] | null => {
  const celdas: { r: number; c: number }[] = [];

  for (let i = 0; i < tamano; i++) {
    let r = filaInicio;
    let c = colInicio;

    if (orientacion === 'horizontal') {
      c = colInicio + i;
    } else if (orientacion === 'vertical') {
      r = filaInicio + i;
    } else if (orientacion === 'diagonal-abajo') {
      r = filaInicio + i;
      c = colInicio + i;
    } else if (orientacion === 'diagonal-arriba') {
      r = filaInicio - i;
      c = colInicio + i;
    }

    // Se descarta la posición si excede los límites válidos del tablero
    if (r < 0 || r >= 10 || c < 0 || c >= 10) {
      return null;
    }

    celdas.push({ r, c });
  }

  return celdas;
};

/**
 * Genera de forma aleatoria una distribución válida de toda la flota en el tablero 10x10,
 * habilitando opcionalmente orientaciones diagonales y marcando los extremos de cada barco.
 */
export const generarFlotaAleatoria = (
  permitirDiagonales: boolean = false,
): { tablero: BoardState; colocaciones: Placement[] } => {
  let tablero = crearTableroVacio();
  let colocaciones: Placement[] = [];
  let exito = false;

  const orientacionesDisponibles: Orientation[] = permitirDiagonales
    ? ['horizontal', 'vertical', 'diagonal-abajo', 'diagonal-arriba']
    : ['horizontal', 'vertical'];

  // Si un intento no logra ubicar todos los barcos tras varios reintentos, se reinicia el tablero
  while (!exito) {
    tablero = crearTableroVacio();
    colocaciones = [];
    let colisiones = false;

    for (const barco of SHIPS) {
      let colocadoBarco = false;
      let intentos = 0;

      while (!colocadoBarco && intentos < 150) {
        intentos++;
        const orientacion =
          orientacionesDisponibles[Math.floor(Math.random() * orientacionesDisponibles.length)];

        // Se restringen los rangos de inicio según la orientación y longitud del barco
        let filaMin = 0;
        let filaMax = 9;
        let colMin = 0;
        let colMax = 9 - (barco.size - 1);

        if (orientacion === 'horizontal') {
          colMax = 10 - barco.size;
        } else if (orientacion === 'vertical') {
          filaMax = 10 - barco.size;
          colMax = 9;
        } else if (orientacion === 'diagonal-abajo') {
          filaMax = 10 - barco.size;
          colMax = 10 - barco.size;
        } else if (orientacion === 'diagonal-arriba') {
          filaMin = barco.size - 1;
          filaMax = 9;
          colMax = 10 - barco.size;
        }

        const filaInicio = filaMin + Math.floor(Math.random() * (filaMax - filaMin + 1));
        const colInicio = colMin + Math.floor(Math.random() * (colMax - colMin + 1));

        const celdasTemp = obtenerCeldasBarco(filaInicio, colInicio, barco.size, orientacion);
        if (!celdasTemp) continue;

        let espacioLibre = true;
        for (const celda of celdasTemp) {
          if (tablero[celda.r][celda.c].hasShip) {
            espacioLibre = false;
            break;
          }
        }

        if (espacioLibre) {
          celdasTemp.forEach((celda, idx) => {
            tablero[celda.r][celda.c].hasShip = true;
            tablero[celda.r][celda.c].shipId = barco.id;
            tablero[celda.r][celda.c].isStart = idx === 0;
            tablero[celda.r][celda.c].isEnd = idx === celdasTemp.length - 1;
          });
          colocaciones.push({
            shipId: barco.id,
            row: filaInicio,
            col: colInicio,
            orientation: orientacion,
          });
          colocadoBarco = true;
        }
      }

      if (!colocadoBarco) {
        colisiones = true;
        break;
      }
    }

    if (!colisiones) {
      exito = true;
    }
  }

  return { tablero, colocaciones };
};

/**
 * Procesa un disparo sobre una coordenada del tablero devolviendo una copia actualizada,
 * el resultado obtenido y el identificador del barco si este quedó hundido.
 */
export function disparar(
  tablero: BoardState,
  fila: number,
  columna: number,
): { tablero: BoardState; resultado: ResultadoDisparo; barcoHundido?: ShipType } {
  tablero = clonarTablero(tablero);
  const celda: Cell = tablero[fila][columna];
  if (celda.state !== 'empty') {
    return { tablero, resultado: 'repetido' };
  }
  if (celda.hasShip) {
    celda.state = 'hit';
    if (esta_hundido(tablero, celda.shipId!)) {
      // Al completarse todos los impactos del barco, sus celdas pasan a estado 'sunk'
      for (const fil of tablero) {
        for (const cel of fil) {
          if (cel.shipId === celda.shipId) {
            cel.state = 'sunk';
          }
        }
      }
      return { tablero, resultado: 'hundido', barcoHundido: celda.shipId };
    }
    return { tablero, resultado: 'impacto' };
  }
  celda.state = 'miss';
  return { tablero, resultado: 'agua' };
}

/** Indica si un barco específico ya recibió impactos en todas sus celdas. */
export function esta_hundido(tablero: BoardState, ship_id: ShipType): boolean {
  let hits = 0;
  for (const fila of tablero) {
    for (const celda of fila) {
      if (celda.shipId === ship_id && celda.state === 'hit') {
        hits++;
      }
    }
  }
  const tamano = SHIPS.find(b => b.id === ship_id);
  return hits === tamano?.size;
}

/** Verifica si todos los barcos del tablero han sido hundidos. */
export function flota_hundida(tablero: BoardState): boolean {
  for (const fila of tablero) {
    for (const celda of fila) {
      if (celda.hasShip && celda.state !== 'sunk') return false;
    }
  }
  return true;
}

/** Crea una copia superficial por celda para evitar mutaciones directas del estado. */
export function clonarTablero(tablero: BoardState): BoardState {
  return tablero.map(fila => fila.map(celda => ({ ...celda })));
}

/**
 * Construye una vista del tablero ocultando barcos no hundidos para que el agente
 * calcule probabilidades solo con información pública de disparos y barcos hundidos.
 */
export function vistaAgente(tablero: BoardState): BoardState {
  return tablero.map(fila =>
    fila.map(celda => ({
      row: celda.row,
      col: celda.col,
      hasShip: false,
      shipId: celda.state === 'sunk' ? celda.shipId : undefined,
      state: celda.state,
      isStart: false,
      isEnd: false,
    })),
  );
}

/** Resume el estado actual de cada barco de la flota (tamaño y si está hundido). */
export function estadoFlota(tablero: BoardState): { id: ShipType; nombre: string; tamano: number; hundido: boolean }[] {
  return SHIPS.map(barco => ({
    id: barco.id,
    nombre: barco.name,
    tamano: barco.size,
    hundido: tablero.some(fila => fila.some(c => c.shipId === barco.id && c.state === 'sunk')),
  }));
}