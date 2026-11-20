import React from 'react'
import type { AnalisisProbabilistico, BoardState } from '../types/battleship'
import { contarDisparos } from '../logic/utilidades'
import { estadoFlota } from '../logic/gameEngine'

/** Propiedades del componente comparativo de estadísticas de la partida. */
interface PanelEstadisticasProps {
  /** Tablero actual del jugador (recibe los disparos del agente). */
  tableroJugador: BoardState
  /** Tablero actual del agente (recibe los disparos del jugador). */
  tableroAgente: BoardState
  /** Análisis probabilístico vigente para el turno del jugador. */
  analisisJugador: AnalisisProbabilistico | null
  /** Último análisis probabilístico utilizado por el agente. */
  analisisAgente: AnalisisProbabilistico | null
}

/** Formatea las métricas clave de un análisis de Monte Carlo o devuelve guiones si no hay datos. */
const formatoAnalisis = (analisis: AnalisisProbabilistico | null) => ({
  simulaciones: analisis ? analisis.simulaciones.toLocaleString() : '—',
  validas: analisis ? analisis.configuracionesValidas.toLocaleString() : '—',
  probabilidad: analisis ? `${analisis.recomendacion.probabilidad.toFixed(1)} %` : '—',
  tiempo: analisis ? `${analisis.tiempoEjecucionMs} ms` : '—',
})

/**
 * Muestra una tabla comparativa entre el jugador y el agente con métricas
 * de disparos, barcos hundidos/restantes y rendimiento del motor probabilístico.
 */
export const PanelEstadisticas: React.FC<PanelEstadisticasProps> = ({
  tableroJugador,
  tableroAgente,
  analisisJugador,
  analisisAgente,
}) => {
  // Los disparos del jugador impactan en el tableroAgente y los del agente en tableroJugador
  const jugador = contarDisparos(tableroAgente)
  const agente = contarDisparos(tableroJugador)
  const hundidosPorJugador = estadoFlota(tableroAgente).filter(b => b.hundido).length
  const hundidosPorAgente = estadoFlota(tableroJugador).filter(b => b.hundido).length
  const totalBarcos = estadoFlota(tableroJugador).length
  const aJugador = formatoAnalisis(analisisJugador)
  const aAgente = formatoAnalisis(analisisAgente)

  const filas: [string, string | number, string | number][] = [
    ['Disparos realizados', jugador.disparos, agente.disparos],
    ['Impactos', jugador.impactos, agente.impactos],
    ['Disparos fallidos', jugador.fallos, agente.fallos],
    ['Barcos enemigos hundidos', hundidosPorJugador, hundidosPorAgente],
    ['Barcos enemigos restantes', totalBarcos - hundidosPorJugador, totalBarcos - hundidosPorAgente],
    ['Simulaciones utilizadas', aJugador.simulaciones, aAgente.simulaciones],
    ['Configuraciones válidas', aJugador.validas, aAgente.validas],
    ['Probabilidad celda recomendada', aJugador.probabilidad, aAgente.probabilidad],
    ['Tiempo de estimación', aJugador.tiempo, aAgente.tiempo],
  ]

  return (
    <div className="p-4 rounded-xl bg-slate-900 border border-slate-700 overflow-x-auto">
      <h3 className="text-sm font-semibold text-slate-300 mb-3">Estadísticas de la partida</h3>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-slate-400 text-left">
            <th className="py-1 pr-4 font-medium">Indicador</th>
            <th className="py-1 pr-4 font-medium">Jugador</th>
            <th className="py-1 font-medium">Agente</th>
          </tr>
        </thead>
        <tbody>
          {filas.map(([nombre, vJugador, vAgente]) => (
            <tr key={nombre} className="border-t border-slate-800">
              <td className="py-1 pr-4 text-slate-300">{nombre}</td>
              <td className="py-1 pr-4 tabular-nums">{vJugador}</td>
              <td className="py-1 tabular-nums">{vAgente}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="text-xs text-slate-500 mt-2">
        Las métricas probabilísticas del jugador corresponden al análisis actual del tablero enemigo; las del agente, a su último disparo.
      </p>
    </div>
  )
}