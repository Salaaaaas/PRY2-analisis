import type { BoardState, Placement, Orientation, SimulationCount } from '../types/battleship';
import { SHIPS } from '../types/battleship';

/** Devuelve las orientaciones permitidas según se habiliten o no los barcos en diagonal. */
const obtenerOrientaciones = (permitirDiagonales: boolean): Orientation[] =>
  permitirDiagonales
    ? ['horizontal', 'vertical', 'diagonal-abajo', 'diagonal-arriba']
    : ['horizontal', 'vertical'];

/** Calcula la coordenada `(r, c)` de la celda en la posición `indice` de un barco. */
const obtenerCoordenadaCelda = (
  fila: number,
  columna: number,
  indice: number,
  orientacion: Orientation,
): { r: number; c: number } => {
  switch (orientacion) {
    case 'vertical':
      return { r: fila + indice, c: columna };
    case 'diagonal-abajo':
      return { r: fila + indice, c: columna + indice };
    case 'diagonal-arriba':
      return { r: fila - indice, c: columna + indice };
    case 'horizontal':
    default:
      return { r: fila, c: columna + indice };
  }
};

/**
 * Calcula la celda inicial de un barco asumiendo que su segmento `desplazamiento`
 * coincide con una celda impactada `(impactoR, impactoC)`.
 */
const calcularInicioDesdeImpacto = (
  impactoR: number,
  impactoC: number,
  desplazamiento: number,
  orientacion: Orientation,
): { fila: number; col: number } => {
  switch (orientacion) {
    case 'vertical':
      return { fila: impactoR - desplazamiento, col: impactoC };
    case 'diagonal-abajo':
      return { fila: impactoR - desplazamiento, col: impactoC - desplazamiento };
    case 'diagonal-arriba':
      return { fila: impactoR + desplazamiento, col: impactoC - desplazamiento };
    case 'horizontal':
    default:
      return { fila: impactoR, col: impactoC - desplazamiento };
  }
};

/**
 * Genera una configuración aleatoria sin colisiones para toda la flota en un tablero 10x10.
 */
export const generarConfiguracionAleatoria = (permitirDiagonales: boolean = false): Placement[] => {
  const colocaciones: Placement[] = [];
  const tableroOcupado: boolean[][] = Array.from({ length: 10 }, () => Array(10).fill(false));
  const orientacionesDisponibles = obtenerOrientaciones(permitirDiagonales);

  for (const barco of SHIPS) {
    let colocado = false;
    let intentos = 0;

    while (!colocado && intentos < 150) {
      intentos++;
      const orientacion =
        orientacionesDisponibles[Math.floor(Math.random() * orientacionesDisponibles.length)];

      // Se delimitan los rangos de inicio para que el barco quepa dentro de la cuadrícula
      let filaMin = 0;
      let filaMax = 9;
      let colMin = 0;
      let colMax = 9;

      if (orientacion === 'horizontal') {
        colMax = 10 - barco.size;
      } else if (orientacion === 'vertical') {
        filaMax = 10 - barco.size;
      } else if (orientacion === 'diagonal-abajo') {
        filaMax = 10 - barco.size;
        colMax = 10 - barco.size;
      } else if (orientacion === 'diagonal-arriba') {
        filaMin = barco.size - 1;
        colMax = 10 - barco.size;
      }

      const filaInicio = filaMin + Math.floor(Math.random() * (filaMax - filaMin + 1));
      const colInicio = colMin + Math.floor(Math.random() * (colMax - colMin + 1));

      let libre = true;
      const celdasTemp: { r: number; c: number }[] = [];

      for (let i = 0; i < barco.size; i++) {
        const { r, c } = obtenerCoordenadaCelda(filaInicio, colInicio, i, orientacion);
        if (r < 0 || r > 9 || c < 0 || c > 9 || tableroOcupado[r][c]) {
          libre = false;
          break;
        }
        celdasTemp.push({ r, c });
      }

      if (libre) {
        for (const celda of celdasTemp) {
          tableroOcupado[celda.r][celda.c] = true;
        }
        colocaciones.push({
          shipId: barco.id,
          row: filaInicio,
          col: colInicio,
          orientation: orientacion,
        });
        colocado = true;
      }
    }

    // Si se agotan los intentos para un barco, se reinicia el muestreo de la flota
    if (!colocado) {
      return generarConfiguracionAleatoria(permitirDiagonales);
    }
  }

  return colocaciones;
};

/**
 * Verifica que una configuración de barcos sea coherente con las celdas de agua (`miss`)
 * e impactos activos (`hit`) observados en el tablero actual.
 */
export const esConfiguracionValida = (colocaciones: Placement[], tableroActual: BoardState): boolean => {
  const mapaConfig: boolean[][] = Array.from({ length: 10 }, () => Array(10).fill(false));

  for (const colocacion of colocaciones) {
    const barco = SHIPS.find(s => s.id === colocacion.shipId)!;
    for (let i = 0; i < barco.size; i++) {
      const { r, c } = obtenerCoordenadaCelda(colocacion.row, colocacion.col, i, colocacion.orientation);
      if (r < 0 || r > 9 || c < 0 || c > 9) {
        return false;
      }
      mapaConfig[r][c] = true;
    }
  }

  for (let r = 0; r < 10; r++) {
    for (let c = 0; c < 10; c++) {
      const estadoCelda = tableroActual[r][c].state;

      if (estadoCelda === 'miss' && mapaConfig[r][c]) {
        return false;
      }

      if (estadoCelda === 'hit' && !mapaConfig[r][c]) {
        return false;
      }
    }
  }

  return true;
};

/** Resultado del análisis probabilístico por Monte Carlo sobre el tablero. */
export interface ResultadoProbabilidad {
  matrizProbabilidades: number[][];
  tiempoEjecucionMs: number;
  configuracionesValidas: number;
}

/**
 * Estima la probabilidad porcentual de ocupación por celda mediante muestreo de Monte Carlo
 * filtrando configuraciones compatibles con el estado conocido del tablero.
 */
export const calcularProbabilidades = (
  tableroActual: BoardState,
  cantidadSimulaciones: SimulationCount = 1000,
  permitirDiagonales: boolean = false,
): ResultadoProbabilidad => {
  const inicioTiempo = performance.now();

  const conteoBarcosEnCelda: number[][] = Array.from({ length: 10 }, () => Array(10).fill(0));
  let validasEncontradas = 0;
  let intentosTotales = 0;
  // Límite superior de intentos para acotar el tiempo de cómputo en estados muy restringidos
  const maxIntentosPermitidos = cantidadSimulaciones * 20;

  while (validasEncontradas < cantidadSimulaciones && intentosTotales < maxIntentosPermitidos) {
    intentosTotales++;
    const config = generarConfiguracionCompatible(tableroActual, permitirDiagonales);

    if (config && esConfiguracionValida(config, tableroActual)) {
      validasEncontradas++;
      for (const colocacion of config) {
        const barco = SHIPS.find(s => s.id === colocacion.shipId)!;
        for (let i = 0; i < barco.size; i++) {
          const { r, c } = obtenerCoordenadaCelda(colocacion.row, colocacion.col, i, colocacion.orientation);
          conteoBarcosEnCelda[r][c]++;
        }
      }
    }
  }

  const matrizProbabilidades: number[][] = Array.from({ length: 10 }, () => Array(10).fill(0));

  if (validasEncontradas > 0) {
    for (let r = 0; r < 10; r++) {
      for (let c = 0; c < 10; c++) {
        matrizProbabilidades[r][c] = (conteoBarcosEnCelda[r][c] / validasEncontradas) * 100;
      }
    }
  }

  const finTiempo = performance.now();
  const tiempoEjecucionMs = Math.round(finTiempo - inicioTiempo);

  return {
    matrizProbabilidades,
    tiempoEjecucionMs,
    configuracionesValidas: validasEncontradas,
  };
};

/**
 * Selecciona aleatoriamente entre las celdas intactas (`empty`) con mayor probabilidad
 * estimada para romper empates de forma neutral.
 */
export function obtener_recomendacion(
  matriz: number[][],
  tablero: BoardState,
): { fila: number; columna: number; probabilidad: number } {
  const EPSILON = 1e-9;
  let mejor_prob = -1;
  let candidatas: { fila: number; columna: number }[] = [];
  for (let fil = 0; fil < 10; fil++) {
    for (let col = 0; col < 10; col++) {
      if (tablero[fil][col].state !== 'empty') continue;
      const prob = matriz[fil][col];
      if (prob > mejor_prob + EPSILON) {
        mejor_prob = prob;
        candidatas = [{ fila: fil, columna: col }];
      } else if (Math.abs(prob - mejor_prob) <= EPSILON) {
        candidatas.push({ fila: fil, columna: col });
      }
    }
  }
  const elegida = candidatas[Math.floor(Math.random() * candidatas.length)];
  return { fila: elegida.fila, columna: elegida.columna, probabilidad: Math.max(mejor_prob, 0) };
}

/** Comprueba si un barco de cierto tamaño y orientación cabe sin chocar con celdas ocupadas, fallos o hundidos. */
export function puedeColocar(
  tablero: BoardState,
  ocupado: boolean[][],
  fila: number,
  columna: number,
  tamano: number,
  orientacion: Orientation,
): boolean {
  for (let i = 0; i < tamano; i++) {
    const { r, c } = obtenerCoordenadaCelda(fila, columna, i, orientacion);
    if (r < 0 || r > 9 || c < 0 || c > 9) return false;
    if (ocupado[r][c]) return false;
    const estado = tablero[r][c].state;
    if (estado === 'miss' || estado === 'sunk') return false;
  }
  return true;
}

/** Marca como ocupadas en la matriz auxiliar todas las celdas cubiertas por una colocación. */
function marcarOcupado(ocupado: boolean[][], colocacion: Placement, tamano: number) {
  for (let i = 0; i < tamano; i++) {
    const { r, c } = obtenerCoordenadaCelda(colocacion.row, colocacion.col, i, colocacion.orientation);
    if (r >= 0 && r <= 9 && c >= 0 && c <= 9) {
      ocupado[r][c] = true;
    }
  }
}

/** Selecciona un elemento aleatorio de una lista no vacía. */
const elegirAlAzar = <T,>(lista: T[]): T => lista[Math.floor(Math.random() * lista.length)];

/**
 * Construye una colocación candidata de los barcos restantes respetando barcos ya hundidos
 * y cubriendo los impactos (`hit`) actuales; devuelve `null` si no logra ubicarlos.
 */
export function generarConfiguracionCompatible(
  tablero: BoardState,
  permitirDiagonales: boolean = false,
): Placement[] | null {
  const colocaciones: Placement[] = [];
  const tableroOcupado: boolean[][] = Array.from({ length: 10 }, () => Array(10).fill(false));

  const hundidos = new Set<string>();
  const impactos: { r: number; c: number }[] = [];
  for (const fila of tablero) {
    for (const celda of fila) {
      if (celda.state === 'sunk' && celda.shipId) hundidos.add(celda.shipId);
      if (celda.state === 'hit') impactos.push({ r: celda.row, c: celda.col });
    }
  }
  let pendientes = SHIPS.filter(b => !hundidos.has(b.id));
  const orientaciones = obtenerOrientaciones(permitirDiagonales);

  // Se barajan los impactos para variar el orden en que se anclan los barcos restantes
  for (let k = impactos.length - 1; k > 0; k--) {
    const j = Math.floor(Math.random() * (k + 1));
    [impactos[k], impactos[j]] = [impactos[j], impactos[k]];
  }

  // Primero se ubican barcos que expliquen cada impacto aún no cubierto
  for (const impacto of impactos) {
    if (tableroOcupado[impacto.r][impacto.c]) continue;
    const opciones: Placement[] = [];
    for (const barco of pendientes) {
      for (const orientacion of orientaciones) {
        for (let desplazamiento = 0; desplazamiento < barco.size; desplazamiento++) {
          const { fila, col } = calcularInicioDesdeImpacto(
            impacto.r,
            impacto.c,
            desplazamiento,
            orientacion,
          );
          if (puedeColocar(tablero, tableroOcupado, fila, col, barco.size, orientacion)) {
            opciones.push({ shipId: barco.id, row: fila, col, orientation: orientacion });
          }
        }
      }
    }
    if (opciones.length === 0) return null;
    const elegida = elegirAlAzar(opciones);
    const barco = pendientes.find(b => b.id === elegida.shipId)!;
    marcarOcupado(tableroOcupado, elegida, barco.size);
    colocaciones.push(elegida);
    pendientes = pendientes.filter(b => b.id !== barco.id);
  }

  // Luego se colocan aleatoriamente los barcos pendientes restantes
  for (const barco of pendientes) {
    const opciones: Placement[] = [];
    for (const orientacion of orientaciones) {
      for (let fila = 0; fila < 10; fila++) {
        for (let col = 0; col < 10; col++) {
          if (puedeColocar(tablero, tableroOcupado, fila, col, barco.size, orientacion)) {
            opciones.push({ shipId: barco.id, row: fila, col, orientation: orientacion });
          }
        }
      }
    }
    if (opciones.length === 0) return null;
    const elegida = elegirAlAzar(opciones);
    marcarOcupado(tableroOcupado, elegida, barco.size);
    colocaciones.push(elegida);
  }

  return colocaciones;
}