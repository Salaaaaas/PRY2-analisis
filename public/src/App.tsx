import { useEffect, useState } from 'react'
import type { BoardState, ResultadoDisparo, ShipType } from './types/battleship'
import { SHIPS } from './types/battleship'
import { Tablero } from './components/Tablero'
import { disparar, estadoFlota, flota_hundida, generarFlotaAleatoria, vistaAgente } from './logic/gameEngine'
import { calcularProbabilidades, obtener_recomendacion } from './logic/motorProbabilidad'

type Turno = 'jugador' | 'agente'
type EstadoPartida = 'jugando' | 'victoria' | 'derrota'

const COLUMNAS = 'ABCDEFGHIJ'
const nombreCelda = (fila: number, col: number) => `${COLUMNAS[col]}${fila + 1}`
const nombreBarco = (id?: ShipType) => SHIPS.find(b => b.id === id)?.name ?? ''

function describirResultado(resultado: ResultadoDisparo, barco?: ShipType) {
  if (resultado === 'agua') return 'agua'
  if (resultado === 'impacto') return 'impacto'
  return `¡hundió el ${nombreBarco(barco)}!`
}

function App() {
  const [tableroJugador, setTableroJugador] = useState<BoardState>(() => generarFlotaAleatoria().tablero)
  const [tableroAgente, setTableroAgente] = useState<BoardState>(() => generarFlotaAleatoria().tablero)
  const [turno, setTurno] = useState<Turno>('jugador')
  const [estado, setEstado] = useState<EstadoPartida>('jugando')
  const [mensaje, setMensaje] = useState('Tu turno: dispará a una celda del tablero enemigo.')

  const nuevaPartida = () => {
    setTableroJugador(generarFlotaAleatoria().tablero)
    setTableroAgente(generarFlotaAleatoria().tablero)
    setTurno('jugador')
    setEstado('jugando')
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
      const vista = vistaAgente(tableroJugador)
      const { matrizProbabilidades } = calcularProbabilidades(vista, 1000)
      const { fila, columna } = obtener_recomendacion(matrizProbabilidades, vista)

      const { tablero, resultado, barcoHundido } = disparar(tableroJugador, fila, columna)
      setTableroJugador(tablero)
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
  }, [turno, estado, tableroJugador])

  const colorEstado =
    estado === 'victoria' ? 'text-emerald-400' : estado === 'derrota' ? 'text-red-400' : 'text-cyan-300'

  return (
    <main className="min-h-screen bg-slate-950 text-slate-200 p-6">
      <header className="flex flex-wrap items-center justify-between gap-4 max-w-6xl mx-auto mb-6">
        <h1 className="text-3xl font-bold text-cyan-400">Batalla Naval Probabilística</h1>
        <button
          onClick={nuevaPartida}
          className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 font-semibold text-white"
        >
          {estado === 'jugando' ? 'Reiniciar partida' : 'Nueva partida'}
        </button>
      </header>

      <section className="max-w-6xl mx-auto mb-6 p-4 rounded-xl bg-slate-900 border border-slate-700">
        <p className={`font-semibold ${colorEstado}`}>
          {estado === 'jugando' ? (turno === 'jugador' ? 'Tu turno' : 'Turno del agente') : estado === 'victoria' ? 'Victoria' : 'Derrota'}
        </p>
        <p className="text-sm text-slate-300 mt-1">{mensaje}</p>
      </section>

      <div className="flex flex-wrap justify-center gap-8 max-w-6xl mx-auto">
        <div>
          <h2 className="text-lg font-semibold mb-2 text-center">Tu flota</h2>
          <Tablero tablero={tableroJugador} modoInteractivo />
          <ListaFlota tablero={tableroJugador} />
        </div>
        <div>
          <h2 className="text-lg font-semibold mb-2 text-center">Flota enemiga</h2>
          <Tablero
            tablero={tableroAgente}
            alHacerClicCelda={estado === 'jugando' && turno === 'jugador' ? dispararJugador : undefined}
          />
          <ListaFlota tablero={tableroAgente} />
        </div>
      </div>

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
