import React from 'react';

const TarjetaFactura = ({ item, index, onEliminar, clienteExonerado }) => {
  const totalItem = item.precio * item.cantidad * (clienteExonerado || item.exonerado ? 1 : 1.15);

  return (
    <div className="bg-white border border-gray-100 rounded-xl p-4 mb-3 shadow-sm relative">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <h4 className="text-sm font-black text-gray-800 uppercase leading-tight truncate pr-6">
            {item.nombre}
          </h4>
          <div className="flex gap-4 mt-2">
            <div>
              <p className="text-[10px] text-gray-400 font-bold uppercase">Precio</p>
              <p className="text-xs font-semibold text-gray-600">C$ {item.precio.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-[10px] text-gray-400 font-bold uppercase">Cant.</p>
              <p className="text-xs font-semibold text-gray-600">{item.cantidad}</p>
            </div>
          </div>
        </div>
        
        <button 
          onClick={() => onEliminar(index)}
          className="text-red-400 hover:text-red-600 transition-colors p-1"
        >
          <span className="text-xl">✕</span>
        </button>
      </div>

      <div className="mt-3 pt-3 border-t border-gray-50 flex justify-between items-center">
        <span className="text-[10px] text-emerald-700 font-black uppercase tracking-wider">Total con IVA</span>
        <span className="text-sm font-black text-emerald-700">
          C$ {totalItem.toFixed(2)}
        </span>
      </div>
    </div>
  );
};

export default TarjetaFactura;