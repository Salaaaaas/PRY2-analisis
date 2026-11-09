import React from 'react';
import type { BoardState } from '../types/battleship';

interface TableroProps {
  tablero: BoardState;
  alHacerClicCelda?: (fila: number, col: number) => void;
  modoInteractivo?: boolean;
}

export const Tablero: React.FC<TableroProps> = ({ tablero, alHacerClicCelda, modoInteractivo = false }) => {
  const columnas = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];

  return (
    <div className="flex flex-col items-center p-4 bg-slate-900 rounded-xl shadow-lg border border-slate-700">
      <div className="grid grid-cols-11 gap-1">
        <div className="w-8 h-8"></div>

        {columnas.map((col) => (
          <div key={col} className="w-8 h-8 flex items-center justify-center font-bold text-slate-400 text-sm">
            {col}
          </div>
        ))}

        {tablero.map((fila, indiceFila) => (
          <React.Fragment key={indiceFila}>
            <div className="w-8 h-8 flex items-center justify-center font-bold text-slate-400 text-sm">
              {indiceFila + 1}
            </div>

            {fila.map((celda) => {
              let colorFondo = 'bg-slate-800 hover:bg-slate-700 border-slate-700';
              let contenido = '';

              if (celda.state === 'miss') {
                colorFondo = 'bg-sky-900/60 border-sky-700';
                contenido = '•'; 
              } else if (celda.state === 'hit') {
                colorFondo = 'bg-amber-600 border-amber-500';
                contenido = '💥'; 
              } else if (celda.state === 'sunk') {
                colorFondo = 'bg-red-700 border-red-600';
                contenido = '❌';
              } else if (celda.hasShip && modoInteractivo) {
                colorFondo = 'bg-emerald-800 border-emerald-600';
                contenido = '🚢'; 
              }

              return (
                <button
                  key={`${celda.row}-${celda.col}`}
                  onClick={() => alHacerClicCelda && alHacerClicCelda(celda.row, celda.col)}
                  disabled={!modoInteractivo && alHacerClicCelda === undefined}
                  className={`w-8 h-8 border flex items-center justify-center text-sm transition-all rounded-sm ${colorFondo} ${
                    alHacerClicCelda ? 'cursor-pointer hover:border-slate-400' : 'cursor-default'
                  }`}
                >
                  <span className="text-xs">{contenido}</span>
                </button>
              );
            })}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};