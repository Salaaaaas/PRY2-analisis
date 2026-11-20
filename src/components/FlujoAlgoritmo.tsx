import React from 'react';

/** Propiedades del componente de flujo del algoritmo. */
interface FlujoAlgoritmoProps {
  [key: string]: unknown;
}

/**
 * Componente informativo que resume en tres pasos el ciclo de estimación
 * probabilística mediante Monte Carlo sobre el tablero de 10x10.
 */
export const FlujoAlgoritmo: React.FC<FlujoAlgoritmoProps> = () => {
  return (
    <div className="p-4 rounded-xl bg-slate-900 border border-slate-700 text-slate-300">
      <h3 className="text-sm font-semibold mb-2">Flujo del algoritmo de Monte Carlo</h3>
      {/* Pasos principales de muestreo, filtrado por evidencia y selección de objetivo */}
      <ol className="text-xs text-slate-400 space-y-1 list-decimal list-inside">
        <li>Generar configuraciones aleatorias válidas de la flota en el tablero 10x10.</li>
        <li>Filtrar configuraciones incompatibles con disparos previos (agua, impacto o hundido).</li>
        <li>Calcular la probabilidad por celda P(c) y recomendar la de mayor valor.</li>
      </ol>
    </div>
  );
};