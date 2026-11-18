import type { BoardState, Placement, Orientation, SimulationCount } from '../types/battleship';
import { SHIPS } from '../types/battleship';

export const generarConfiguracionAleatoria = (): Placement[] => {
  const colocaciones: Placement[] = [];
  const tableroOcupado: boolean[][] = Array.from({ length: 10 }, () => Array(10).fill(false));

  for (const barco of SHIPS) {
    let colocado = false;
    let intentos = 0;

    while (!colocado && intentos < 100) {
      intentos++;
      const orientacion: Orientation = Math.random() < 0.5 ? 'horizontal' : 'vertical';
      const filaMax = orientacion === 'vertical' ? 10 - barco.size : 9;
      const colMax = orientacion === 'horizontal' ? 10 - barco.size : 9;

      const filaInicio = Math.floor(Math.random() * (filaMax + 1));
      const colInicio = Math.floor(Math.random() * (colMax + 1));

      let libre = true;
      const celdasTemp: { r: number; c: number }[] = [];

      for (let i = 0; i < barco.size; i++) {
        const r = orientacion === 'vertical' ? filaInicio + i : filaInicio;
        const c = orientacion === 'horizontal' ? colInicio + i : colInicio;

        if (tableroOcupado[r][c]) {
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

    if (!colocado) {
      return generarConfiguracionAleatoria();
    }
  }

  return colocaciones;
};

export const esConfiguracionValida = (colocaciones: Placement[], tableroActual: BoardState): boolean => {
  const mapaConfig: boolean[][] = Array.from({ length: 10 }, () => Array(10).fill(false));

  for (const colocacion of colocaciones) {
    const barco = SHIPS.find(s => s.id === colocacion.shipId)!;
    for (let i = 0; i < barco.size; i++) {
      const r = colocacion.orientation === 'vertical' ? colocacion.row + i : colocacion.row;
      const c = colocacion.orientation === 'horizontal' ? colocacion.col + i : colocacion.col;
      mapaConfig[r][c] = true;
    }
  }

  for (let r = 0; r < 10; r++) {
    for (let c = 0; c < 10; c++) {
      const estadoCelda = tableroActual[r][c].state;

      if (estadoCelda === 'miss' && mapaConfig[r][c]) {
        return false;
      }

      if ((estadoCelda === 'hit') && !mapaConfig[r][c]) {
        return false;
      }
    }
  }

  return true;
};


export interface ResultadoProbabilidad {
  matrizProbabilidades: number[][]; 
  tiempoEjecucionMs: number;
  configuracionesValidas: number;
}

export const calcularProbabilidades = (
  tableroActual: BoardState,
  cantidadSimulaciones: SimulationCount = 1000
): ResultadoProbabilidad => {
  const inicioTiempo = performance.now();

  const conteoBarcosEnCelda: number[][] = Array.from({ length: 10 }, () => Array(10).fill(0));
  let validasEncontradas = 0;
  let intentosTotales = 0;
  const maxIntentosPermitidos = cantidadSimulaciones * 20; 

  while (validasEncontradas < cantidadSimulaciones && intentosTotales < maxIntentosPermitidos) {
    intentosTotales++;
    const config = generarConfiguracionCompatible(tableroActual);

    if (config && esConfiguracionValida(config, tableroActual)) {
      validasEncontradas++;
      for (const colocacion of config) {
        const barco = SHIPS.find(s => s.id === colocacion.shipId)!;
        for (let i = 0; i < barco.size; i++) {
          const r = colocacion.orientation === 'vertical' ? colocacion.row + i : colocacion.row;
          const c = colocacion.orientation === 'horizontal' ? colocacion.col + i : colocacion.col;
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


export function obtener_recomendacion(matriz: number[][], tablero: BoardState): {fila: number, columna: number, probabilidad: number} {
  const EPSILON = 1e-9
  let mejor_prob = -1
  let candidatas: {fila: number, columna: number}[] = []
  for (let fil = 0; fil < 10; fil++){
    for (let col = 0; col < 10; col++){
      if (tablero[fil][col].state !== 'empty') continue
      const prob = matriz[fil][col]
      if (prob > mejor_prob + EPSILON){
        mejor_prob = prob
        candidatas = [{fila: fil, columna: col}]
      } else if (Math.abs(prob - mejor_prob) <= EPSILON){
        candidatas.push({fila: fil, columna: col})
      }
    }
  }
  const elegida = candidatas[Math.floor(Math.random() * candidatas.length)]
  return {fila: elegida.fila, columna: elegida.columna, probabilidad: Math.max(mejor_prob, 0)}
}

export function puedeColocar(tablero: BoardState, ocupado: boolean[][], fila: number, columna: number, tamano:number, orientacion: Orientation): boolean {
  for(let i = 0; i < tamano; i++){
    const r = orientacion === "vertical" ? fila + i : fila;
    const c = orientacion === "horizontal" ? columna + i : columna;
    if (r > 9 || c > 9 ) return false;
    if (ocupado[r][c]) return false;
    const estado = tablero[r][c].state;
    if (estado === "miss" || estado === "sunk") return false;
  }
  return true;
}

function marcarOcupado(ocupado: boolean[][], colocacion: Placement, tamano: number) {
  for (let i = 0; i < tamano; i++){
    const r = colocacion.orientation === "vertical" ? colocacion.row + i : colocacion.row;
    const c = colocacion.orientation === "horizontal" ? colocacion.col + i : colocacion.col;
    ocupado[r][c] = true;
  }
}

const elegirAlAzar = <T,>(lista: T[]): T => lista[Math.floor(Math.random() * lista.length)];

export function generarConfiguracionCompatible(tablero: BoardState): Placement[] | null {
  const colocaciones: Placement[] = [];
  const tableroOcupado: boolean[][] = Array.from({ length: 10 }, () => Array(10).fill(false));

  const hundidos = new Set<string>();
  const impactos: { r: number; c: number }[] = [];
  for (const fila of tablero){
    for (const celda of fila){
      if (celda.state === 'sunk' && celda.shipId) hundidos.add(celda.shipId);
      if (celda.state === 'hit') impactos.push({ r: celda.row, c: celda.col });
    }
  }
  let pendientes = SHIPS.filter(b => !hundidos.has(b.id));
  const orientaciones: Orientation[] = ['horizontal', 'vertical'];

  for (let k = impactos.length - 1; k > 0; k--) {
    const j = Math.floor(Math.random() * (k + 1));
    [impactos[k], impactos[j]] = [impactos[j], impactos[k]];
  }

  for (const impacto of impactos) {
    if (tableroOcupado[impacto.r][impacto.c]) continue;
    const opciones: Placement[] = [];
    for (const barco of pendientes) {
      for (const orientacion of orientaciones) {
        for (let desplazamiento = 0; desplazamiento < barco.size; desplazamiento++) {
          const fila = orientacion === 'vertical' ? impacto.r - desplazamiento : impacto.r;
          const col = orientacion === 'horizontal' ? impacto.c - desplazamiento : impacto.c;
          if (fila < 0 || col < 0) continue;
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
