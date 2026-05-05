import React from 'react';
import { generarPDF } from './generarPDF';

function TotalesFactura({ totales, items, ultimaFactura, accionGuardar, cargando, metodoPago, tasaCambio }) {
  
  const totalUSD = (totales.total / tasaCambio).toFixed(2);

  const imprimirUltima = () => {
    if (ultimaFactura) {
      // CORRECCIÓN: Pasar los argumentos exactamente como los espera generarPDF
      // (cliente, items, totales, numeroFactura, pagoInfo)
      generarPDF(
        ultimaFactura.cliente, 
        ultimaFactura.items, 
        ultimaFactura.totales, 
        ultimaFactura.numero,
        {
          metodo: ultimaFactura.pago.metodo,
          recibido: ultimaFactura.pago.recibido || 0, // Asegura que llegue el número
          vuelto: ultimaFactura.pago.vuelto || 0,     // Asegura que llegue el número
          ref: ultimaFactura.pago.ref
        }
      );
    }
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm w-full max-w-sm space-y-4">
      <div className="space-y-2">
        {/* Fuente subida 3px: de 14px (text-sm) a 17px */}
        <div className="flex justify-between text-gray-500 text-[17px] font-bold">
          <span>SUBTOTAL:</span>
          <span>C$ {totales.subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-gray-500 text-[17px] font-bold">
          <span>IVA (15%):</span>
          <span>C$ {totales.iva.toFixed(2)}</span>
        </div>

        <div className="pt-2 border-t flex flex-col items-end">
          {/* Fuente subida 3px: de 17px a 20px */}
          <span className="text-[20px] font-black text-emerald-600 uppercase">Total a Pagar</span>
          <div className="text-3xl font-black text-emerald-800">
            C$ {totales.total.toFixed(2)}
          </div>
          {metodoPago === "USD" && (
            <div className="text-lg font-black text-blue-600 animate-pulse">
              U$ {totalUSD}
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <button
          onClick={accionGuardar}
          type="button"
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
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
          <span>IMPRIMIR FACTURA</span>
        </button>
      </div>
    </div>
  );
}

export default TotalesFactura;