import type { ResultadoExperimento, SimulationCount } from '../types/battleship'
import { SHIPS } from '../types/battleship'
import { disparar, flota_hundida, generarFlotaAleatoria, vistaAgente } from './gameEngine'
import { calcularProbabilidades, obtener_recomendacion } from './motorProbabilidad'

/** Cantidad total de celdas ocupadas por una flota completa. */
const CELDAS_CON_BARCO = SHIPS.reduce((total, barco) => total + barco.size, 0)

/** Cede brevemente el hilo de ejecución para que la interfaz actualice su estado. */
const pausa = () => new Promise<void>(resolver => setTimeout(resolver, 0))

/**
 * Simula una partida completa jugando el agente contra un tablero generado aleatoriamente
 * y acumula las métricas de rendimiento y disparos realizados.
 */
async function jugarPartidaAutomatica(simulaciones: SimulationCount) {
  let tablero = generarFlotaAleatoria().tablero
  let disparos = 0
  let tiempoTotal = 0
  let tiempoMaximo = 0
  let validasTotal = 0

  // Se limita a 100 disparos como tope de seguridad sobre el tablero 10x10
  while (!flota_hundida(tablero) && disparos < 100) {
    const vista = vistaAgente(tablero)
    const analisis = calcularProbabilidades(vista, simulaciones)
    const { fila, columna } = obtener_recomendacion(analisis.matrizProbabilidades, vista)
    tablero = disparar(tablero, fila, columna).tablero
    disparos++
    tiempoTotal += analisis.tiempoEjecucionMs
    tiempoMaximo = Math.max(tiempoMaximo, analisis.tiempoEjecucionMs)
    validasTotal += analisis.configuracionesValidas
    await pausa()
  }

  return { disparos, tiempoTotal, tiempoMaximo, validasTotal }
}

/**
 * Ejecuta un conjunto de partidas automáticas para una cantidad de simulaciones
 * dada y calcula promedios, extremos y tasa de acierto global.
 */
export async function ejecutarExperimento(
  simulaciones: SimulationCount,
  partidas: number,
  alProgresar: (partidaTerminada: number) => void,
): Promise<ResultadoExperimento> {
  const disparosPorPartida: number[] = []
  let tiempoTotal = 0
  let tiempoMaximo = 0
  let validasTotal = 0
  let calculos = 0

  for (let p = 0; p < partidas; p++) {
    const partida = await jugarPartidaAutomatica(simulaciones)
    disparosPorPartida.push(partida.disparos)
    tiempoTotal += partida.tiempoTotal
    tiempoMaximo = Math.max(tiempoMaximo, partida.tiempoMaximo)
    validasTotal += partida.validasTotal
    // Cada disparo corresponde a un cálculo probabilístico del agente
    calculos += partida.disparos
    alProgresar(p + 1)
  }

  const disparosTotales = disparosPorPartida.reduce((a, b) => a + b, 0)
  /** Redondea un número a dos decimales. */
  const redondear = (n: number) => Math.round(n * 100) / 100

  return {
    simulaciones,
    partidas,
    tiempoPromedioMs: redondear(tiempoTotal / calculos),
    tiempoMaximoMs: redondear(tiempoMaximo),
    validasPromedio: redondear(validasTotal / calculos),
    disparosPromedio: redondear(disparosTotales / partidas),
    disparosMin: Math.min(...disparosPorPartida),
    disparosMax: Math.max(...disparosPorPartida),
    tasaAcierto: redondear((CELDAS_CON_BARCO * partidas / disparosTotales) * 100),
  }
}