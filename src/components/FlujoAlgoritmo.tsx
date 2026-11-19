import React from 'react'
import type { AnalisisProbabilistico, BoardState } from '../types/battleship'
import { contarDisparos, nombreCelda } from '../logic/utilidades'
import { estadoFlota } from '../logic/gameEngine'

interface FlujoAlgoritmoProps {
  titulo: string
  tablero: BoardState
  analisis: AnalisisProbabilistico | null
  disparo?: string
}

export const FlujoAlgoritmo: React.FC<FlujoAlgoritmoProps> = ({ titulo, tablero, analisis, disparo }) => {
  const conteo = contarDisparos(tablero)
  const hundidos = estadoFlota(tablero).filter(b => b.hundido).length

  const pasos = [
    {
      nombre: 'Información obtenida',
      valor: `${conteo.fallos} agua · ${conteo.impactosActivos} impactos · ${hundidos} hundidos`,
    },
    {
      nombre: 'Configuraciones válidas',
      valor: analisis ? `${analisis.configuracionesValidas.toLocaleString()} de ${analisis.simulaciones.toLocaleString()} simulaciones` : '—',
    },
    {
      nombre: 'Probabilidades',
      valor: analisis ? `calculadas en ${analisis.tiempoEjecucionMs} ms` : '—',
    },
    {
      nombre: 'Recomendación',
      valor: analisis
        ? `${nombreCelda(analisis.recomendacion.fila, analisis.recomendacion.columna)} — ${analisis.recomendacion.probabilidad.toFixed(1)} %`
        : '—',
    },
    { nombre: 'Disparo', valor: disparo ?? 'pendiente' },
  ]

  return (
    <div className="p-4 rounded-xl bg-slate-900 border border-slate-700">
      <h3 className="text-sm font-semibold text-slate-300 mb-3">{titulo}</h3>
      <ol className="flex flex-wrap items-stretch gap-2">
        {pasos.map((paso, i) => (
          <React.Fragment key={paso.nombre}>
            <li className="flex-1 min-w-36 p-2 rounded-lg bg-slate-800 border border-slate-700">
              <p className="text-[11px] uppercase tracking-wide text-slate-400">{i + 1}. {paso.nombre}</p>
              <p className="text-sm text-slate-100 mt-1">{paso.valor}</p>
            </li>
            {i < pasos.length - 1 && <span className="self-center text-cyan-400">→</span>}
          </React.Fragment>
        ))}
      </ol>
    </div>
  )
}
