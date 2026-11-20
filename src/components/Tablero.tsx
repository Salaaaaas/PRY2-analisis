import React from 'react';
import type { BoardState, Cell } from '../types/battleship';

/** Propiedades del componente de tablero de 10x10. */
interface TableroProps {
  /** Matriz 10x10 con el estado de cada celda y presencia de barcos. */
  tablero: BoardState;
  /** Callback ejecutado al hacer clic sobre una celda disponible. */
  alHacerClicCelda?: (fila: number, col: number) => void;
  /** Revela los barcos propios y los marcadores de inicio/final cuando es true. */
  modoInteractivo?: boolean;
}

/**
 * Renderiza un tablero de Batalla Naval de 10x10 con coordenadas A–J y 1–10,
 * mostrando estados de disparo, barcos propios e indicadores visuales en los extremos.
 */
export const Tablero: React.FC<TableroProps> = ({
  tablero,
  alHacerClicCelda,
  modoInteractivo = false,
}) => {
  const columnas = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];

  /** Obtiene las clases de color según el estado del disparo o la visibilidad del barco. */
  const obtenerEstiloCelda = (celda: Cell) => {
    if (celda.state === 'miss') return 'bg-sky-900/60 border-sky-700 text-sky-300';
    if (celda.state === 'hit') return 'bg-amber-600 border-amber-500 text-white font-bold';
    if (celda.state === 'sunk') return 'bg-red-700 border-red-600 text-white font-bold';
    if (celda.hasShip && modoInteractivo) {
      return 'bg-emerald-800/90 border-emerald-500 text-emerald-100';
    }
    return 'bg-slate-800/90 border-slate-700 text-slate-400';
  };

  /** Define el símbolo o ícono central que representa el estado de la celda. */
  const renderContenido = (celda: Cell) => {
    if (celda.state === 'miss') return '•';
    if (celda.state === 'hit') return '💥';
    if (celda.state === 'sunk') return '❌';
    if (celda.hasShip && modoInteractivo) return '🚢';
    return '';
  };

  /** Construye el texto descriptivo del tooltip para la coordenada y el tipo de tramo. */
  const obtenerTitulo = (celda: Cell, indiceFila: number) => {
    const base = `Fila ${indiceFila + 1}, Col ${columnas[celda.col]}`;
    if (!celda.hasShip || !modoInteractivo) return base;
    if (celda.isStart && celda.isEnd) return `${base} — Inicio y final de barco`;
    if (celda.isStart) return `${base} — Inicio de barco`;
    if (celda.isEnd) return `${base} — Final de barco`;
    return `${base} — Tramo de barco`;
  };

  return (
    <div className="flex flex-col items-center p-4 bg-slate-900 rounded-xl shadow-lg border border-slate-700">
      {/* Cuadrícula de 11x11 con encabezados de columnas (A-J) y filas (1-10) */}
      <div className="grid grid-cols-11 gap-1">
        <div className="w-9 h-9" />

        {columnas.map(col => (
          <div
            key={col}
            className="w-9 h-9 flex items-center justify-center font-bold text-slate-400 text-xs"
          >
            {col}
          </div>
        ))}

        {tablero.map((fila, indiceFila) => (
          <React.Fragment key={indiceFila}>
            <div className="w-9 h-9 flex items-center justify-center font-bold text-slate-400 text-xs">
              {indiceFila + 1}
            </div>

            {fila.map(celda => {
              const estilos = obtenerEstiloCelda(celda);
              const puedeClic = Boolean(alHacerClicCelda) && celda.state === 'empty';
              // Las franjas de inicio y final solo se muestran en barcos propios intactos
              const esInicio = Boolean(
                celda.hasShip && modoInteractivo && celda.state === 'empty' && celda.isStart,
              );
              const esFinal = Boolean(
                celda.hasShip && modoInteractivo && celda.state === 'empty' && celda.isEnd,
              );

              return (
                <button
                  key={`${celda.row}-${celda.col}`}
                  type="button"
                  onClick={() => alHacerClicCelda?.(celda.row, celda.col)}
                  disabled={!puedeClic}
                  className={`relative w-9 h-9 border flex items-center justify-center transition-all rounded-sm text-xs ${estilos} ${
                    puedeClic
                      ? 'cursor-pointer hover:scale-105 hover:border-slate-300 shadow-sm'
                      : 'cursor-default'
                  }`}
                  title={obtenerTitulo(celda, indiceFila)}
                >
                  {esInicio && (
                    <span
                      aria-hidden="true"
                      className="absolute left-1 top-1.5 bottom-1.5 w-1 rounded-full bg-cyan-300 shadow-[0_0_6px_rgba(103,232,249,0.8)]"
                    />
                  )}
                  {renderContenido(celda)}
                  {esFinal && (
                    <span
                      aria-hidden="true"
                      className="absolute right-1 top-1.5 bottom-1.5 w-1 rounded-full bg-amber-300 shadow-[0_0_6px_rgba(252,211,77,0.8)]"
                    />
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