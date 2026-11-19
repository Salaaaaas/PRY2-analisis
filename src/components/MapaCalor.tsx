import React from 'react';
import type { BoardState, Recomendacion } from '../types/battleship';

interface MapaCalorProps {
  tablero: BoardState;
  matrizProbabilidades: number[][];
  alHacerClicCelda?: (fila: number, col: number) => void;
  recomendada?: Recomendacion | null;
  titulo?: string;
  mostrarProbabilidades?: boolean;
}

export const MapaCalor: React.FC<MapaCalorProps> = ({
  tablero,
  matrizProbabilidades,
  alHacerClicCelda,
  recomendada,
  titulo = 'Mapa de Calor (Probabilidad de Flota)',
  mostrarProbabilidades = true,
}) => {
  const columnas = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];

  const obtenerEstiloCelda = (probabilidad: number, estadoCelda: string) => {
    if (estadoCelda === 'miss') return 'bg-sky-950/70 border-sky-800 text-sky-400';
    if (estadoCelda === 'hit') return 'bg-amber-600 border-amber-500 text-white font-bold';
    if (estadoCelda === 'sunk') return 'bg-red-700 border-red-600 text-white font-bold';
    if (!mostrarProbabilidades) return 'bg-slate-800 border-slate-700 text-slate-500';

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
              const probExacta = matrizProbabilidades[indiceFila]?.[celda.col] || 0;
              const prob = Math.round(probExacta);
              const estilos = obtenerEstiloCelda(prob, celda.state);
              const esRecomendada =
                mostrarProbabilidades && recomendada?.fila === celda.row && recomendada?.columna === celda.col;
              const clicable = !!alHacerClicCelda && celda.state === 'empty';

              return (
                <button
                  key={`${celda.row}-${celda.col}`}
                  onClick={() => clicable && alHacerClicCelda!(celda.row, celda.col)}
                  disabled={!clicable}
                  className={`w-9 h-9 border flex items-center justify-center transition-all rounded-sm text-[10px] ${estilos} ${
                    clicable ? 'cursor-pointer hover:scale-105 hover:border-slate-300 shadow-sm' : 'cursor-default'
                  } ${esRecomendada ? 'ring-2 ring-yellow-300 ring-offset-1 ring-offset-slate-900 animate-pulse' : ''}`}
                  title={`${columnas[celda.col]}${indiceFila + 1} - Probabilidad: ${probExacta.toFixed(1)}%`}
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
