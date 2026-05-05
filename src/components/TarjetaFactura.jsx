import React from 'react';

const TarjetaFactura = ({ item, index, onEliminar, clienteExonerado }) => {
  const totalItem =
    item.precio *
    item.cantidad *
    (clienteExonerado || item.exonerado ? 1 : 1.15);

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-4 shadow-sm relative">
      <div className="flex justify-between items-start gap-3">
        <div className="flex-1">
          <h4 className="text-base font-black text-gray-800 uppercase leading-snug pr-6">
            {item.nombre}
          </h4>

          <div className="flex gap-6 mt-3">
            <div>
              <p className="text-xs text-gray-400 font-bold uppercase tracking-wide">
                Precio
              </p>
              <p className="text-sm font-semibold text-gray-700">
                C$ {item.precio.toFixed(2)}
              </p>
            </div>

            <div>
              <p className="text-xs text-gray-400 font-bold uppercase tracking-wide">
                Cant.
              </p>
              <p className="text-sm font-semibold text-gray-700">
                {item.cantidad}
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => onEliminar(index)}
          className="text-red-400 hover:text-red-600 transition-colors p-2"
        >
          <span className="text-2xl font-bold">✕</span>
        </button>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
        <span className="text-xs text-emerald-700 font-black uppercase tracking-wider">
          Total con IVA
        </span>

        <span className="text-lg font-black text-emerald-700">
          C$ {totalItem.toFixed(2)}
        </span>
      </div>
    </div>
  );
};

export default TarjetaFactura;