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

    if (esConfiguracionValida(config, tableroActual)) {
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
  let mejor_prob = -1
  let mejor_fil = 0
  let mejor_col = 0
  for (let fil = 0; fil < 10; fil++){
    for (let col = 0; col < 10; col++){
      if (tablero[fil][col].state !== 'empty'){
        continue
      }
      if (matriz[fil][col] > mejor_prob){
        mejor_prob = matriz[fil][col]
        mejor_col = col
        mejor_fil = fil 
      }
    }
  }
  return {fila: mejor_fil, columna: mejor_col, probabilidad: mejor_prob}
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

export function generarConfiguracionCompatible(tablero:BoardState): Placement[]{
  const colocaciones: Placement[] = [];
  const tableroOcupado: boolean[][] = Array.from({ length: 10 }, () => Array(10).fill(false));

  const hundidos = new Set<string>();
  for (const fila of tablero){
    for (const celda of fila){
      if (celda.state === 'sunk' && celda.shipId) hundidos.add(celda.shipId);
    }
  }
  for (const barco of SHIPS) {
    if (hundidos.has(barco.id)) continue;
    let colocado = false;
    let intentos = 0;

    while (!colocado && intentos < 100) {
      intentos++;
      const orientacion: Orientation = Math.random() < 0.5 ? 'horizontal' : 'vertical';
      const filaMax = orientacion === 'vertical' ? 10 - barco.size : 9;
      const colMax = orientacion === 'horizontal' ? 10 - barco.size : 9;

      const filaInicio = Math.floor(Math.random() * (filaMax + 1));
      const colInicio = Math.floor(Math.random() * (colMax + 1));

      if (puedeColocar(tablero, tableroOcupado, filaInicio, colInicio, barco.size, orientacion)){
        for (let i = 0; i < barco.size; i++){
          const r = orientacion === "vertical" ? filaInicio + i: filaInicio;
          const c = orientacion === "horizontal" ? colInicio + i: colInicio;
          tableroOcupado[r][c] = true
        }
        colocaciones.push({
          shipId: barco.id,
          row: filaInicio,
          col: colInicio,
          orientation: orientacion,
        });
        colocado = true
      }
    }

    if (!colocado) {
      return generarConfiguracionCompatible(tablero);
    }
  }

  return colocaciones;
};


