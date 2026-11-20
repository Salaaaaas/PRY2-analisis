import React, { useState } from 'react'
import type { ResultadoExperimento, SimulationCount } from '../types/battleship'
import { ejecutarExperimento } from '../logic/experimentos'
import { OPCIONES_SIMULACION } from '../logic/utilidades'

/**
 * Componente que permite ejecutar lotes de partidas automáticas del agente
 * para medir tiempos, configuraciones válidas, disparos y tasa de acierto
 * según distintas cantidades de simulaciones de Monte Carlo.
 */
export const Experimentos: React.FC = () => {
  const [seleccion, setSeleccion] = useState<SimulationCount[]>(OPCIONES_SIMULACION)
  const [partidas, setPartidas] = useState(5)
  const [resultados, setResultados] = useState<ResultadoExperimento[]>([])
  const [progreso, setProgreso] = useState('')
  const [ejecutando, setEjecutando] = useState(false)

  /** Agrega o quita una cantidad de simulaciones manteniendo el orden ascendente. */
  const alternar = (valor: SimulationCount) =>
    setSeleccion(actual =>
      actual.includes(valor) ? actual.filter(v => v !== valor) : [...actual, valor].sort((a, b) => a - b),
    )

  /** Ejecuta secuencialmente los experimentos para cada tamaño de muestra seleccionado. */
  const ejecutar = async () => {
    setEjecutando(true)
    setResultados([])
    const nuevos: ResultadoExperimento[] = []
    for (const simulaciones of seleccion) {
      const resultado = await ejecutarExperimento(simulaciones, partidas, terminadas =>
        setProgreso(`${simulaciones.toLocaleString()} simulaciones: partida ${terminadas} de ${partidas}`),
      )
      nuevos.push(resultado)
      // Se actualiza el arreglo de forma incremental para mostrar cada lote al completarse
      setResultados([...nuevos])
    }
    setProgreso('Experimento terminado.')
    setEjecutando(false)
  }

  return (
    <div className="p-4 rounded-xl bg-slate-900 border border-slate-700">
      <h3 className="text-sm font-semibold text-slate-300 mb-1">Análisis experimental</h3>
      <p className="text-xs text-slate-400 mb-3">
        El agente juega partidas completas contra flotas aleatorias con cada cantidad de simulaciones. Los valores se obtienen de la ejecución real.
      </p>

      {/* Controles de selección de simulaciones, cantidad de partidas y disparo del lote */}
      <div className="flex flex-wrap items-center gap-4 mb-3 text-sm">
        {OPCIONES_SIMULACION.map(valor => (
          <label key={valor} className="flex items-center gap-1.5">
            <input
              type="checkbox"
              checked={seleccion.includes(valor)}
              onChange={() => alternar(valor)}
              disabled={ejecutando}
            />
            {valor.toLocaleString()}
          </label>
        ))}
        <label className="flex items-center gap-2">
          Partidas por valor
          <input
            type="number"
            min={1}
            max={50}
            value={partidas}
            // Se acota la cantidad de partidas entre 1 y 50 para evitar bloqueos prolongados
            onChange={e => setPartidas(Math.max(1, Math.min(50, Number(e.target.value) || 1)))}
            disabled={ejecutando}
            className="w-16 px-2 py-1 rounded bg-slate-800 border border-slate-600"
          />
        </label>
        <button
          onClick={ejecutar}
          disabled={ejecutando || seleccion.length === 0}
          className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 font-semibold text-white"
        >
          {ejecutando ? 'Ejecutando...' : 'Ejecutar experimento'}
        </button>
      </div>

      {progreso && <p className="text-xs text-slate-400 mb-2">{progreso}</p>}

      {/* Tabla comparativa de métricas obtenidas por cantidad de simulaciones */}
      {resultados.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-slate-400 text-left">
                <th className="py-1 pr-3 font-medium">Simulaciones</th>
                <th className="py-1 pr-3 font-medium">Tiempo prom. (ms)</th>
                <th className="py-1 pr-3 font-medium">Tiempo máx. (ms)</th>
                <th className="py-1 pr-3 font-medium">Config. válidas prom.</th>
                <th className="py-1 pr-3 font-medium">Disparos necesarios</th>
                <th className="py-1 pr-3 font-medium">Mín – Máx</th>
                <th className="py-1 font-medium">Tasa de acierto</th>
              </tr>
            </thead>
            <tbody>
              {resultados.map(r => (
                <tr key={r.simulaciones} className="border-t border-slate-800 tabular-nums">
                  <td className="py-1 pr-3 font-semibold">{r.simulaciones.toLocaleString()}</td>
                  <td className="py-1 pr-3">{r.tiempoPromedioMs}</td>
                  <td className="py-1 pr-3">{r.tiempoMaximoMs}</td>
                  <td className="py-1 pr-3">{r.validasPromedio.toLocaleString()}</td>
                  <td className="py-1 pr-3">{r.disparosPromedio}</td>
                  <td className="py-1 pr-3">{r.disparosMin} – {r.disparosMax}</td>
                  <td className="py-1">{r.tasaAcierto} %</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}