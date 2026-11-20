import React from 'react';
import type { BoardState } from '../types/battleship';

/** Coordenadas y probabilidad opcional de una celda sugerida por el algoritmo. */
interface CeldaRecomendada {
  fila: number;
  columna: number;
  probabilidad?: number;
}

/** Propiedades del tablero probabilístico de 10x10. */
interface MapaCalorProps {
  /** Estado actual de celdas y disparos del tablero. */
  tablero: BoardState;
  /** Matriz 10x10 con porcentajes estimados de ocupación por celda. */
  matrizProbabilidades: number[][];
  /** Callback disparado al seleccionar una celda vacía habilitada. */
  alHacerClicCelda?: (fila: number, col: number) => void;
  /** Celda destacada con mayor probabilidad según el análisis actual. */
  recomendada?: CeldaRecomendada | null;
  /** Encabezado mostrado sobre la cuadrícula. */
  titulo?: string;
  /** Controla si se colorean y muestran los porcentajes de probabilidad. */
  mostrarProbabilidades?: boolean;
}

/**
 * Renderiza una cuadrícula de 10x10 con el estado de disparos y, opcionalmente,
 * un mapa de calor con las probabilidades estimadas de cada celda.
 */
export const MapaCalor: React.FC<MapaCalorProps> = ({
  tablero,
  matrizProbabilidades,
  alHacerClicCelda,
  recomendada = null,
  titulo = 'Mapa de Calor (Probabilidad de Flota)',
  mostrarProbabilidades = true,
}) => {
  const columnas = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];

  /** Determina el estilo visual según el estado del disparo o el tramo de probabilidad. */
  const obtenerEstiloCelda = (probabilidad: number, estadoCelda: string) => {
    if (estadoCelda === 'miss') return 'bg-sky-950/70 border-sky-800 text-sky-400';
    if (estadoCelda === 'hit') return 'bg-amber-600 border-amber-500 text-white font-bold';
    if (estadoCelda === 'sunk') return 'bg-red-700 border-red-600 text-white font-bold';

    if (!mostrarProbabilidades) {
      return 'bg-slate-800/90 border-slate-700 text-slate-400';
    }

    // Escala cromática progresiva desde 0 % hasta 80 % o más
    if (probabilidad === 0) return 'bg-slate-800/90 border-slate-700 text-slate-500';
    if (probabilidad < 20) return 'bg-indigo-950/90 border-indigo-800 text-indigo-300';
    if (probabilidad < 40) return 'bg-blue-900/90 border-blue-700 text-blue-200';
    if (probabilidad < 60) return 'bg-teal-900/90 border-teal-700 text-teal-200';
    if (probabilidad < 80) return 'bg-amber-950/90 border-amber-700 text-amber-200';
    return 'bg-rose-900/95 border-rose-600 text-rose-100 font-bold';
  };

  return (
    <div className="flex flex-col items-center p-4 bg-slate-900 rounded-xl shadow-lg border border-slate-700">
      <div className="mb-2 text-sm font-semibold text-slate-300">{titulo}</div>

      {/* Cuadrícula de 11x11: primera fila y columna reservadas para etiquetas A-J y 1-10 */}
      <div className="grid grid-cols-11 gap-1">
        <div className="w-9 h-9"></div>

        {columnas.map((col) => (
          <div key={col} className="w-9 h-9 flex items-center justify-center font-bold text-slate-400 text-xs">
            {col}
          </div>
        ))}

        {tablero.map((fila, indiceFila) => (
          <React.Fragment key={indiceFila}>
            <div className="w-9 h-9 flex items-center justify-center font-bold text-slate-400 text-xs">
              {indiceFila + 1}
            </div>

            {fila.map((celda) => {
              const prob = Math.round(matrizProbabilidades[indiceFila]?.[celda.col] || 0);
              // Solo se resalta la celda recomendada si aún no ha sido atacada
              const esRecomendada =
                recomendada !== null &&
                recomendada.fila === celda.row &&
                recomendada.columna === celda.col &&
                celda.state === 'empty';
              const estilos = obtenerEstiloCelda(prob, celda.state);
              const puedeClic = celda.state === 'empty' && Boolean(alHacerClicCelda);

              return (
                <button
                  key={`${celda.row}-${celda.col}`}
                  type="button"
                  onClick={() => alHacerClicCelda?.(celda.row, celda.col)}
                  disabled={!puedeClic}
                  className={`w-9 h-9 border flex items-center justify-center transition-all rounded-sm text-[10px] ${estilos} ${
                    esRecomendada ? 'ring-2 ring-yellow-300 border-yellow-300' : ''
                  } ${
                    puedeClic
                      ? 'cursor-pointer hover:scale-105 hover:border-slate-300 shadow-sm'
                      : 'cursor-default'
                  }`}
                  title={`Fila ${indiceFila + 1}, Col ${columnas[celda.col]} - Probabilidad: ${prob}%`}
                >
                  {celda.state === 'empty' ? (
                    <span>{mostrarProbabilidades && prob > 0 ? `${prob}%` : ''}</span>
                  ) : (
                    <span>
                      {celda.state === 'miss' ? '•' : celda.state === 'hit' ? '💥' : '❌'}
                    </span>
                  )}
                </button>
              );
            })}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};