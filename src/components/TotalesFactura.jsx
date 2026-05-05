import React from 'react';
import { generarPDF } from './generarPDF';

function TotalesFactura({ totales, items, ultimaFactura, accionGuardar, cargando, metodoPago, tasaCambio }) {
  
  const totalUSD = (totales.total / tasaCambio).toFixed(2);

  const imprimirUltima = () => {
    if (ultimaFactura) {
      generarPDF(
        ultimaFactura.cliente, 
        ultimaFactura.items, 
        ultimaFactura.totales, 
        ultimaFactura.numero,
        ultimaFactura.metodoPago,
        ultimaFactura.numeroCheque,
        ultimaFactura.tasaCambio
      );
    }
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm w-full max-w-sm space-y-4">
      <div className="space-y-2">
        <div className="flex justify-between text-gray-500 text-sm font-bold">
          <span>SUBTOTAL:</span>
          <span>C$ {totales.subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-gray-500 text-sm font-bold">
          <span>IVA (15%):</span>
          <span>C$ {totales.iva.toFixed(2)}</span>
        </div>

        <div className="pt-2 border-t flex flex-col items-end">
          <span className="text-[10px] font-black text-emerald-600 uppercase">Total a Pagar</span>
          <div className="text-3xl font-black text-emerald-800">
            C$ {totales.total.toFixed(2)}
          </div>
          {metodoPago === "Dolares" && (
            <div className="text-lg font-black text-blue-600 animate-pulse">
              U$ {totalUSD}
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <button
          onClick={accionGuardar}
          disabled={cargando || items.length === 0}
          className={`w-full py-4 rounded-xl font-black text-white transition-all shadow-lg ${
            cargando || items.length === 0 ? 'bg-gray-400' : 'bg-emerald-600 hover:bg-emerald-700 active:scale-95'
          }`}
        >
          {cargando ? "PROCESANDO..." : "COMPLETAR VENTA"}
        </button>

        <button
          onClick={imprimirUltima}
          type="button"
          disabled={!ultimaFactura} 
          className={`w-full py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 border-2 ${
            !ultimaFactura ? 'border-gray-100 text-gray-300' : 'border-emerald-600 text-emerald-700 hover:bg-emerald-50'
          }`}
        >
          <span>PDF FACTURA</span>
        </button>
      </div>
    </div>
  );
}

export default TotalesFactura;