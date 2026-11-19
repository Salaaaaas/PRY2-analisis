import { useEffect, useMemo, useState } from 'react'
import type { AnalisisProbabilistico, BoardState, SimulationCount } from './types/battleship'
import { Tablero } from './components/Tablero'
import { MapaCalor } from './components/MapaCalor'
import { FlujoAlgoritmo } from './components/FlujoAlgoritmo'
import { disparar, estadoFlota, flota_hundida, generarFlotaAleatoria } from './logic/gameEngine'
import { OPCIONES_SIMULACION, analizarTablero, describirResultado, nombreCelda } from './logic/utilidades'

type Turno = 'jugador' | 'agente'
type EstadoPartida = 'jugando' | 'victoria' | 'derrota'

function App() {
  const [tableroJugador, setTableroJugador] = useState<BoardState>(() => generarFlotaAleatoria().tablero)
  const [tableroAgente, setTableroAgente] = useState<BoardState>(() => generarFlotaAleatoria().tablero)
  const [turno, setTurno] = useState<Turno>('jugador')
  const [estado, setEstado] = useState<EstadoPartida>('jugando')
  const [mensaje, setMensaje] = useState('Tu turno: dispará a una celda del tablero enemigo.')
  const [simulaciones, setSimulaciones] = useState<SimulationCount>(1000)
  const [mostrarMapa, setMostrarMapa] = useState(true)
  const [analisisAgente, setAnalisisAgente] = useState<AnalisisProbabilistico | null>(null)
  const [ultimoDisparoAgente, setUltimoDisparoAgente] = useState<string>()

  const analisisJugador = useMemo(
    () => analizarTablero(tableroAgente, simulaciones),
    [tableroAgente, simulaciones],
  )
  const recomendacion = analisisJugador.recomendacion
  const celdaRecomendada = nombreCelda(recomendacion.fila, recomendacion.columna)

  const nuevaPartida = () => {
    setTableroJugador(generarFlotaAleatoria().tablero)
    setTableroAgente(generarFlotaAleatoria().tablero)
    setTurno('jugador')
    setEstado('jugando')
    setAnalisisAgente(null)
    setUltimoDisparoAgente(undefined)
    setMensaje('Nueva partida. Tu turno: dispará a una celda del tablero enemigo.')
  }

  const dispararJugador = (fila: number, col: number) => {
    if (estado !== 'jugando' || turno !== 'jugador') return
    const { tablero, resultado, barcoHundido } = disparar(tableroAgente, fila, col)
    if (resultado === 'repetido') return

    setTableroAgente(tablero)
    const texto = `Disparaste a ${nombreCelda(fila, col)}: ${describirResultado(resultado, barcoHundido)}`

    if (flota_hundida(tablero)) {
      setEstado('victoria')
      setMensaje(`${texto} — ¡Ganaste! Hundiste toda la flota enemiga.`)
      return
    }
    setMensaje(`${texto} — Turno del agente...`)
    setTurno('agente')
  }

  useEffect(() => {
    if (turno !== 'agente' || estado !== 'jugando') return

    const temporizador = setTimeout(() => {
      const analisis = analizarTablero(tableroJugador, simulaciones)
      const { fila, columna } = analisis.recomendacion
      const { tablero, resultado, barcoHundido } = disparar(tableroJugador, fila, columna)

      setAnalisisAgente(analisis)
      setTableroJugador(tablero)
      setUltimoDisparoAgente(`${nombreCelda(fila, columna)}: ${describirResultado(resultado, barcoHundido)}`)
      const texto = `El agente disparó a ${nombreCelda(fila, columna)}: ${describirResultado(resultado, barcoHundido)}`

      if (flota_hundida(tablero)) {
        setEstado('derrota')
        setMensaje(`${texto} — Perdiste. El agente hundió toda tu flota.`)
        return
      }
      setMensaje(`${texto} — Tu turno.`)
      setTurno('jugador')
    }, 600)

    return () => clearTimeout(temporizador)
  }, [turno, estado, tableroJugador, simulaciones])

  const colorEstado =
    estado === 'victoria' ? 'text-emerald-400' : estado === 'derrota' ? 'text-red-400' : 'text-cyan-300'
  const puedeDisparar = estado === 'jugando' && turno === 'jugador'

  return (
    <main className="min-h-screen bg-slate-950 text-slate-200 p-4 sm:p-6">
      <header className="flex flex-wrap items-center justify-between gap-4 max-w-7xl mx-auto mb-6">
        <h1 className="text-3xl font-bold text-cyan-400">Batalla Naval Probabilística</h1>
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-sm">
            Simulaciones
            <select
              value={simulaciones}
              onChange={e => setSimulaciones(Number(e.target.value) as SimulationCount)}
              className="px-2 py-1.5 rounded-lg bg-slate-800 border border-slate-600"
            >
              {OPCIONES_SIMULACION.map(valor => (
                <option key={valor} value={valor}>{valor.toLocaleString()}</option>
              ))}
            </select>
          </label>
          <button
            onClick={nuevaPartida}
            className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 font-semibold text-white"
          >
            {estado === 'jugando' ? 'Reiniciar partida' : 'Nueva partida'}
          </button>
        </div>
      </header>

      <section className="max-w-7xl mx-auto mb-6 p-4 rounded-xl bg-slate-900 border border-slate-700">
        <p className={`font-semibold ${colorEstado}`}>
          {estado === 'jugando' ? (turno === 'jugador' ? 'Tu turno' : 'Turno del agente') : estado === 'victoria' ? 'Victoria' : 'Derrota'}
        </p>
        <p className="text-sm text-slate-300 mt-1">{mensaje}</p>
      </section>

      <div className="flex flex-wrap justify-center gap-6 max-w-7xl mx-auto">
        <div>
          <h2 className="text-lg font-semibold mb-2 text-center">Tu flota</h2>
          <Tablero tablero={tableroJugador} modoInteractivo />
          <ListaFlota tablero={tableroJugador} />
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-2 text-center">Flota enemiga</h2>
          <MapaCalor
            tablero={tableroAgente}
            matrizProbabilidades={analisisJugador.matrizProbabilidades}
            alHacerClicCelda={puedeDisparar ? dispararJugador : undefined}
            recomendada={estado === 'jugando' ? recomendacion : null}
            titulo={mostrarMapa ? 'Mapa de probabilidades del tablero enemigo' : 'Tablero enemigo'}
            mostrarProbabilidades={mostrarMapa}
          />
          <ListaFlota tablero={tableroAgente} />
        </div>

        <div className="w-full max-w-sm space-y-4">
          <div className="p-4 rounded-xl bg-slate-900 border border-yellow-300/40">
            <p className="text-xs uppercase tracking-wide text-slate-400">Recomendación del algoritmo</p>
            {estado === 'jugando' ? (
              <>
                <p className="text-xl font-bold text-yellow-300 mt-1">
                  Objetivo recomendado: {celdaRecomendada} — {recomendacion.probabilidad.toFixed(1)} %
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  {analisisJugador.simulaciones.toLocaleString()} simulaciones · {analisisJugador.configuracionesValidas.toLocaleString()} configuraciones válidas · {analisisJugador.tiempoEjecucionMs} ms
                </p>
                <div className="flex flex-wrap gap-2 mt-3">
                  <button
                    onClick={() => dispararJugador(recomendacion.fila, recomendacion.columna)}
                    disabled={!puedeDisparar}
                    className="px-3 py-1.5 rounded-lg bg-yellow-400 hover:bg-yellow-300 disabled:opacity-50 text-slate-900 font-semibold"
                  >
                    Atacar {celdaRecomendada}
                  </button>
                  <span className="self-center text-xs text-slate-400">o elegí otra celda del tablero enemigo</span>
                </div>
              </>
            ) : (
              <p className="text-sm text-slate-400 mt-1">La partida terminó.</p>
            )}
            <label className="flex items-center gap-2 text-sm mt-3">
              <input type="checkbox" checked={mostrarMapa} onChange={e => setMostrarMapa(e.target.checked)} />
              Mostrar mapa de probabilidades
            </label>
          </div>
          <EscalaProbabilidad />
        </div>
      </div>

      <section className="max-w-7xl mx-auto mt-8 space-y-4">
        <h2 className="text-xl font-semibold text-cyan-300">Proceso del algoritmo</h2>
        <FlujoAlgoritmo
          titulo="Tu análisis del tablero enemigo"
          tablero={tableroAgente}
          analisis={estado === 'jugando' ? analisisJugador : null}
          disparo={puedeDisparar ? 'esperando tu decisión' : undefined}
        />
        <FlujoAlgoritmo
          titulo="Último razonamiento del agente"
          tablero={tableroJugador}
          analisis={analisisAgente}
          disparo={ultimoDisparoAgente}
        />
        <MapaCalor
          tablero={tableroJugador}
          matrizProbabilidades={analisisAgente?.matrizProbabilidades ?? []}
          recomendada={analisisAgente?.recomendacion ?? null}
          titulo="Mapa del agente sobre tu tablero (antes de su último disparo)"
        />
      </section>

      <Leyenda />
    </main>
  )
}

function ListaFlota({ tablero }: { tablero: BoardState }) {
  const flota = estadoFlota(tablero)
  const restantes = flota.filter(b => !b.hundido).length
  return (
    <div className="mt-3 text-sm">
      <p className="text-slate-400 mb-1">Barcos restantes: {restantes} / {flota.length}</p>
      <ul className="space-y-0.5">
        {flota.map(b => (
          <li key={b.id} className={b.hundido ? 'line-through text-red-400' : 'text-slate-200'}>
            {b.nombre} ({b.tamano}) {b.hundido && '— hundido'}
          </li>
        ))}
      </ul>
    </div>
  )
}

function EscalaProbabilidad() {
  const tramos = [
    ['bg-slate-800', '0 %'],
    ['bg-indigo-950', '< 20 %'],
    ['bg-blue-900', '20–40 %'],
    ['bg-teal-900', '40–60 %'],
    ['bg-amber-950', '60–80 %'],
    ['bg-rose-900', '≥ 80 %'],
  ]
  return (
    <div className="p-4 rounded-xl bg-slate-900 border border-slate-700">
      <p className="text-xs uppercase tracking-wide text-slate-400 mb-2">Escala de probabilidad</p>
      <div className="grid grid-cols-3 gap-2 text-xs">
        {tramos.map(([color, texto]) => (
          <span key={texto} className="flex items-center gap-2">
            <span className={`w-4 h-4 rounded-sm border border-slate-600 ${color}`} /> {texto}
          </span>
        ))}
      </div>
      <p className="text-xs text-slate-400 mt-2">
        P(c) = configuraciones válidas con barco en c / total de configuraciones válidas
      </p>
    </div>
  )
}

function Leyenda() {
  const items = [
    ['bg-slate-800', 'Agua sin atacar'],
    ['bg-sky-900/60', 'Disparo fallido'],
    ['bg-amber-600', 'Impacto'],
    ['bg-red-700', 'Barco hundido'],
    ['bg-emerald-800', 'Barco propio'],
  ]
  return (
    <div className="flex flex-wrap justify-center gap-4 mt-8 text-sm">
      {items.map(([color, texto]) => (
        <span key={texto} className="flex items-center gap-2">
          <span className={`w-4 h-4 rounded-sm ${color}`} /> {texto}
        </span>
      ))}
    </div>
  )
}

export default App
