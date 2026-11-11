import type { BoardState, Cell, Placement, Orientation } from '../types/battleship';
import { SHIPS } from '../types/battleship';

export const crearTableroVacio = (): BoardState => {
  const tablero: BoardState = [];
  for (let fila = 0; fila < 10; fila++) {
    const filaCelda: Cell[] = [];
    for (let col = 0; col < 10; col++) {
      filaCelda.push({
        row: fila,
        col: col,
        hasShip: false,
        state: 'empty',
      });
    }
    tablero.push(filaCelda);
  }
  return tablero;
};

export const generarFlotaAleatoria = (): { tablero: BoardState; colocaciones: Placement[] } => {
  let tablero = crearTableroVacio();
  let colocaciones: Placement[] = [];
  let exito = false;

  while (!exito) {
    tablero = crearTableroVacio();
    colocaciones = [];
    let colisiones = false;

    for (const barco of SHIPS) {
      let colocadoBarco = false;
      let intentos = 0;

      while (!colocadoBarco && intentos < 100) {
        intentos++;
        const orientacion: Orientation = Math.random() < 0.5 ? 'horizontal' : 'vertical';
        const filaMax = orientacion === 'vertical' ? 10 - barco.size : 9;
        const colMax = orientacion === 'horizontal' ? 10 - barco.size : 9;

        const filaInicio = Math.floor(Math.random() * (filaMax + 1));
        const colInicio = Math.floor(Math.random() * (colMax + 1));

        let espacioLibre = true;
        const celdasTemp: { r: number; c: number }[] = [];

        for (let i = 0; i < barco.size; i++) {
          const r = orientacion === 'vertical' ? filaInicio + i : filaInicio;
          const c = orientacion === 'horizontal' ? colInicio + i : colInicio;

          if (tablero[r][c].hasShip) {
            espacioLibre = false;
            break;
          }
          celdasTemp.push({ r, c });
        }

        if (espacioLibre) {
          for (const celda of celdasTemp) {
            tablero[celda.r][celda.c].hasShip = true;
            tablero[celda.r][celda.c].shipId = barco.id;
          }
          colocaciones.push({
            shipId: barco.id,
            row: filaInicio,
            col: colInicio,
            orientation: orientacion,
          });
          colocadoBarco = true;
        }
      }

      if (!colocadoBarco) {
        colisiones = true;
        break;
      }
    }

    if (!colisiones) {
      exito = true;
    }
  }

  return { tablero, colocaciones };
};