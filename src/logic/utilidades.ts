import type {
  AnalisisProbabilistico,
  BoardState,
  SimulationCount,
} from '../types/battleship';
import { calcularProbabilidades, obtener_recomendacion } from './motorProbabilidad';

/** Cantidades de simulaciones disponibles para el análisis de Monte Carlo. */
export const OPCIONES_SIMULACION: SimulationCount[] = [100, 1000, 5000, 10000];

/** Convierte índices numéricos de fila y columna en notación tipo `"A1"` a `"J10"`. */
export function nombreCelda(fila: number, columna: number): string {
  const letra = String.fromCharCode(65 + columna);
  return `${letra}${fila + 1}`;
}

/** Devuelve una etiqueta legible en español para el resultado de un disparo. */
export function describirResultado(resultado: string, barcoHundido?: string): string {
  if (resultado === 'agua') return 'Agua';
  if (resultado === 'hundido' || barcoHundido) {
    return barcoHundido ? `Hundido (${barcoHundido})` : 'Hundido';
  }
  if (resultado === 'impacto') return 'Impacto';
  return resultado;
}

/** Contabiliza el total de disparos, impactos (incluyendo hundidos) y fallos en el tablero. */
export function contarDisparos(tablero: BoardState): {
  disparos: number;
  impactos: number;
  fallos: number;
} {
  let impactos = 0;
  let fallos = 0;

  for (const fila of tablero) {
    for (const celda of fila) {
      // Las celdas hundidas también provienen de impactos previos sobre barcos
      if (celda.state === 'hit' || celda.state === 'sunk') {
        impactos++;
      } else if (celda.state === 'miss') {
        fallos++;
      }
    }
  }

  return {
    disparos: impactos + fallos,
    impactos,
    fallos,
  };
}

/**
 * Ejecuta la estimación probabilística sobre el tablero y adjunta la celda
 * recomendada junto con la cantidad de simulaciones solicitada.
 */
export function analizarTablero(
  tablero: BoardState,
  simulaciones: SimulationCount,
  permitirDiagonales: boolean = false,
): AnalisisProbabilistico {
  const analisis = calcularProbabilidades(tablero, simulaciones, permitirDiagonales);
  const recomendacion = obtener_recomendacion(analisis.matrizProbabilidades, tablero);

  return {
    ...analisis,
    simulaciones,
    recomendacion,
  };
}