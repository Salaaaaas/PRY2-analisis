import type { AnalisisProbabilistico, BoardState, ResultadoDisparo, ShipType, SimulationCount } from '../types/battleship'
import { SHIPS } from '../types/battleship'
import { calcularProbabilidades, obtener_recomendacion } from './motorProbabilidad'
import { vistaAgente } from './gameEngine'

export const COLUMNAS = 'ABCDEFGHIJ'
export const OPCIONES_SIMULACION: SimulationCount[] = [100, 1000, 5000, 10000]

export const nombreCelda = (fila: number, col: number) => `${COLUMNAS[col]}${fila + 1}`

export const nombreBarco = (id?: ShipType) => SHIPS.find(b => b.id === id)?.name ?? ''

export function describirResultado(resultado: ResultadoDisparo, barco?: ShipType) {
  if (resultado === 'agua') return 'agua'
  if (resultado === 'impacto') return 'impacto'
  if (resultado === 'hundido') return `hundido (${nombreBarco(barco)})`
  return 'repetido'
}

export function analizarTablero(tablero: BoardState, simulaciones: SimulationCount): AnalisisProbabilistico {
  const vista = vistaAgente(tablero)
  const resultado = calcularProbabilidades(vista, simulaciones)
  const recomendacion = obtener_recomendacion(resultado.matrizProbabilidades, vista)
  return { ...resultado, simulaciones, recomendacion }
}

export function contarDisparos(tablero: BoardState) {
  let fallos = 0
  let impactos = 0
  let hundidas = 0
  for (const fila of tablero) {
    for (const celda of fila) {
      if (celda.state === 'miss') fallos++
      if (celda.state === 'hit') impactos++
      if (celda.state === 'sunk') hundidas++
    }
  }
  return { disparos: fallos + impactos + hundidas, fallos, impactos: impactos + hundidas, impactosActivos: impactos }
}
