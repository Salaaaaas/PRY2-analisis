import React from 'react'
import type { DecisionAgente, DecisionJugador } from '../types/battleship'
import { describirResultado } from '../logic/utilidades'

/** Devuelve la clase de color según el resultado del disparo. */
const colorResultado = (resultado: string) =>
  resultado === 'agua' ? 'text-sky-400' : resultado === 'impacto' ? 'text-amber-400' : 'text-red-400'

/**
 * Muestra la bitácora de disparos ejecutados por el agente probabilístico,
 * incluyendo probabilidad estimada, configuraciones válidas y tiempo de cálculo.
 */
export const HistorialAgente: React.FC<{ decisiones: DecisionAgente[] }> = ({ decisiones }) => (
  <div className="p-4 rounded-xl bg-slate-900 border border-slate-700">
    <h3 className="text-sm font-semibold text-slate-300 mb-3">Historial de decisiones del agente</h3>
    {decisiones.length === 0 ? (
      <p className="text-sm text-slate-500">El agente todavía no ha disparado.</p>
    ) : (
      <div className="max-h-72 overflow-y-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-slate-900">
            <tr className="text-slate-400 text-left">
              <th className="py-1 pr-3 font-medium">#</th>
              <th className="py-1 pr-3 font-medium">Celda</th>
              <th className="py-1 pr-3 font-medium">Prob.</th>
              <th className="py-1 pr-3 font-medium">Válidas</th>
              <th className="py-1 pr-3 font-medium">Tiempo</th>
              <th className="py-1 font-medium">Resultado</th>
            </tr>
          </thead>
          <tbody>
            {/* Se invierte el historial para mostrar primero los turnos más recientes */}
            {[...decisiones].reverse().map(d => (
              <tr key={d.turno} className="border-t border-slate-800 tabular-nums">
                <td className="py-1 pr-3 text-slate-500">{d.turno}</td>
                <td className="py-1 pr-3 font-semibold">{d.celda}</td>
                <td className="py-1 pr-3">{d.probabilidad.toFixed(1)} %</td>
                <td className="py-1 pr-3">{d.configuracionesValidas.toLocaleString()}/{d.simulaciones.toLocaleString()}</td>
                <td className="py-1 pr-3">{d.tiempoMs} ms</td>
                <td className={`py-1 ${colorResultado(d.resultado)}`}>{describirResultado(d.resultado, d.barcoHundido)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )}
  </div>
)

/**
 * Muestra las métricas de adherencia a la recomendación del algoritmo y el
 * registro detallado de cada disparo realizado por el jugador.
 */
export const HistorialJugador: React.FC<{ decisiones: DecisionJugador[] }> = ({ decisiones }) => {
  const seguidas = decisiones.filter(d => d.siguioRecomendacion)
  const aciertosSeguidas = seguidas.filter(d => d.resultado !== 'agua').length
  const ignoradas = decisiones.length - seguidas.length
  const aciertosIgnoradas = decisiones.filter(d => !d.siguioRecomendacion && d.resultado !== 'agua').length
  /** Formatea una proporción como porcentaje o guion cuando el denominador es cero. */
  const porcentaje = (a: number, b: number) => (b === 0 ? '—' : `${((a / b) * 100).toFixed(1)} %`)

  return (
    <div className="p-4 rounded-xl bg-slate-900 border border-slate-700">
      <h3 className="text-sm font-semibold text-slate-300 mb-3">Decisiones del jugador</h3>
      {/* Resumen de frecuencia de seguimiento y efectividad al seguir o ignorar sugerencias */}
      <div className="grid grid-cols-3 gap-2 mb-3 text-center">
        <div className="p-2 rounded-lg bg-slate-800">
          <p className="text-xs text-slate-400">Siguió la recomendación</p>
          <p className="text-lg font-semibold">{seguidas.length} <span className="text-xs text-slate-400">({porcentaje(seguidas.length, decisiones.length)})</span></p>
        </div>
        <div className="p-2 rounded-lg bg-slate-800">
          <p className="text-xs text-slate-400">Acierto siguiéndola</p>
          <p className="text-lg font-semibold">{porcentaje(aciertosSeguidas, seguidas.length)}</p>
        </div>
        <div className="p-2 rounded-lg bg-slate-800">
          <p className="text-xs text-slate-400">Acierto ignorándola</p>
          <p className="text-lg font-semibold">{porcentaje(aciertosIgnoradas, ignoradas)}</p>
        </div>
      </div>
      {decisiones.length === 0 ? (
        <p className="text-sm text-slate-500">Todavía no has disparado.</p>
      ) : (
        <div className="max-h-56 overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-slate-900">
              <tr className="text-slate-400 text-left">
                <th className="py-1 pr-3 font-medium">#</th>
                <th className="py-1 pr-3 font-medium">Recomendada</th>
                <th className="py-1 pr-3 font-medium">Elegida</th>
                <th className="py-1 pr-3 font-medium">¿La siguió?</th>
                <th className="py-1 font-medium">Resultado</th>
              </tr>
            </thead>
            <tbody>
              {/* Se invierte el historial para mostrar primero el último disparo del jugador */}
              {[...decisiones].reverse().map(d => (
                <tr key={d.turno} className="border-t border-slate-800 tabular-nums">
                  <td className="py-1 pr-3 text-slate-500">{d.turno}</td>
                  <td className="py-1 pr-3">{d.recomendada} ({d.probRecomendada.toFixed(1)} %)</td>
                  <td className="py-1 pr-3 font-semibold">{d.elegida} ({d.probElegida.toFixed(1)} %)</td>
                  <td className={`py-1 pr-3 ${d.siguioRecomendacion ? 'text-emerald-400' : 'text-slate-400'}`}>
                    {d.siguioRecomendacion ? 'Sí' : 'No'}
                  </td>
                  <td className={`py-1 ${colorResultado(d.resultado)}`}>{describirResultado(d.resultado, d.barcoHundido)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}