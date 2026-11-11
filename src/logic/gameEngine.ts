import type { BoardState, Cell, Placement, Orientation, ShipType } from '../types/battleship';
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


type ResultadoDisparo = 'agua' | 'impacto' | 'hundido' | 'repetido'
//es la funcion para disparar a los barcos, valida el estado de la celda
// y llama a barco hundido para validar si el barco esta tumbado 
export function disparar(tablero: BoardState, fila: number, columna: number): 
  {tablero: BoardState; resultado: ResultadoDisparo; barcoHundido? : ShipType}{
    const celda: Cell = tablero[fila][columna];
    if (celda.state !== 'empty'){
      return {tablero,  resultado: 'repetido'};
    }
    if (celda.hasShip){
      celda.state = 'hit';
      if (esta_hundido(tablero, celda.shipId!)){
        for (const fil of tablero){
          for (const cel of fil){
            if (cel.shipId === celda.shipId){
              cel.state = 'sunk'
            }
          }
        }
        return {tablero, resultado: 'hundido', barcoHundido: celda.shipId}
      }
      return {tablero, resultado: 'impacto'}
    }
    celda.state = 'miss';
    return {tablero, resultado: 'agua'}
  } 

//revisa si un barco esta completamnte destruido para hundirlo recorriendo el tablero
export function esta_hundido(tablero: BoardState, ship_id: ShipType): boolean {
    let hits = 0;
    for (const fila of tablero){
      for (const celda of fila){
        if (celda.shipId === ship_id && celda.state === 'hit'){
          hits ++;
        }
      }
    }
    const tamano = SHIPS.find(b => b.id === ship_id)
    return hits == tamano?.size
  }

//Para ver si existen barcos vivos en un tablero, es la funcion para validar si alguno de los 2 ya gano

export function flota_hundida(tablero: BoardState): boolean{
  for (const fila of tablero){
    for (const celda of fila){
      if (celda.hasShip && celda.state !== 'sunk') return false;
    }
  }
  return true
}