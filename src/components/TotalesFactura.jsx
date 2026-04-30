import React from 'react';
import { generarPDF } from './generarPDF';

function TotalesFactura({ totales, items, ultimaFactura, accionGuardar, cargando }) {
  
  const imprimirUltima = () => {
    if (ultimaFactura) {
      // Pasamos el cliente, items, totales Y el número de factura generado por la DB
      generarPDF(
        ultimaFactura.cliente, 
        ultimaFactura.items, 
        ultimaFactura.totales, 
        ultimaFactura.numero
      );
    }
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm w-full max-w-sm space-y-4">
      <div className="space-y-2">
        <div className="flex justify-between text-gray-500 text-sm">
          <span>Subtotal:</span>
          <span>C$ {totales.subtotal.toFixed(2)}</span>
        </div>
        
        {/* Línea del IVA */}
        <div className="flex justify-between text-gray-500 text-sm">
          <span>IVA (15%):</span>
          <span>C$ {totales.iva.toFixed(2)}</span>
        </div>

        <div className="flex justify-between text-2xl font-black text-emerald-700 pt-2 border-t">
          <span>TOTAL</span>
          <span>C$ {totales.total.toFixed(2)}</span>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <button
          onClick={accionGuardar}
          disabled={cargando || items.length === 0}
          className={`w-full py-4 rounded-xl font-bold text-white transition-all ${
            cargando || items.length === 0 ? 'bg-gray-400' : 'bg-emerald-600 hover:bg-emerald-700'
          }`}
        >
          {cargando ? "GUARDANDO..." : "GUARDAR VENTA"}
        </button>

        {/* El botón de descarga solo se activa después de guardar exitosamente */}
        <button
          onClick={imprimirUltima}
          type="button"
          disabled={!ultimaFactura} 
          className={`w-full py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 border-2 ${
            !ultimaFactura 
              ? 'border-gray-200 text-gray-400 cursor-not-allowed' 
              : 'border-emerald-600 text-emerald-700 hover:bg-emerald-50'
          }`}
        >
          <span>📄</span> 
          {ultimaFactura 
            ? `DESCARGAR FAC-${String(ultimaFactura.numero).padStart(5, '0')}` 
            : "ESPERANDO VENTA"}
        </button>
      </div>

      {ultimaFactura && (
        <p className="text-[10px] text-center text-gray-400 uppercase tracking-widest font-bold">
          Venta FAC-{String(ultimaFactura.numero).padStart(5, '0')} lista
        </p>
      )}
    </div>
  );
}

export default TotalesFactura;