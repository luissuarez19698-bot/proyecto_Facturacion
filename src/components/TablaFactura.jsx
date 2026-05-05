import React from 'react';
import TarjetaFactura from './TarjetaFactura';

function TablaFactura({ items, clienteExonerado, onEliminar }) {
  if (items.length === 0) {
    return (
      <div className="p-12 text-center bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
        <p className="text-gray-400 font-medium italic">
          La factura está vacía. Agregue productos para comenzar.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="md:hidden space-y-1">
        {/* Tamaño de label móvil ajustado */}
        <label className="text-[14px] font-bold text-emerald-700 uppercase tracking-[0.15em] ml-1 mb-2 block">
          Resumen de Pedido
        </label>
        {items.map((item, i) => (
          <TarjetaFactura 
            key={i} 
            item={item} 
            index={i} 
            onEliminar={onEliminar} 
            clienteExonerado={clienteExonerado} 
          />
        ))}
      </div>

      <div className="hidden md:block overflow-hidden rounded-xl border border-gray-200 shadow-sm">
        <table className="w-full table-fixed border-collapse bg-white">
          <thead>
            <tr className="bg-gray-800 text-white">
              <th className="p-5 text-lg font-bold text-center w-[40%]">Producto</th>
              <th className="p-5 text-lg font-bold text-center w-[20%]">Precio</th>
              <th className="p-5 text-lg font-bold text-center w-[15%]">Cant.</th>
              <th className="p-5 text-lg font-bold text-center w-[20%]">Total</th>
              <th className="p-5 w-[5%]"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {items.map((item, i) => (
              <tr key={i} className="hover:bg-emerald-50/30 transition-colors">
                {/* Texto de producto subido a 17px */}
                <td className="p-4 text-center font-bold text-[17px] text-gray-700 truncate">
                  {item.nombre}
                </td>
                {/* Texto de precio subido a 17px */}
                <td className="p-4 text-center text-[17px] text-gray-600">
                  C$ {item.precio.toFixed(2)}
                </td>
                <td className="p-4 text-center">
                  <span className="bg-gray-100 px-4 py-1.5 rounded-full font-black text-[16px]">
                    {item.cantidad}
                  </span>
                </td>
                {/* Texto de total de línea subido a 18px */}
                <td className="p-4 text-center font-black text-[18px] text-emerald-700">
                  C$ {(
                    item.precio * 
                    item.cantidad * 
                    (clienteExonerado || item.exonerado ? 1 : 1.15)
                  ).toFixed(2)}
                </td>
                <td className="p-4 text-center">
                  <button 
                    onClick={() => onEliminar(i)} 
                    className="text-red-400 hover:text-red-600 hover:scale-125 transition-all font-bold text-xl"
                  >
                    ✕
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default TablaFactura;