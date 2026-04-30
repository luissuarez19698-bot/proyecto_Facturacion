import { useEffect, useState } from "react";
import { supabase } from "../database/supabaseconfig";

function ProductoSelector({ onAgregar, itemsActuales = [] }) {
  const [productos, setProductos] = useState([]);
  const [productoId, setProductoId] = useState("");
  const [cantidad, setCantidad] = useState(1);
  const [loading, setLoading] = useState(true);

  // Función para limitar el nombre en el menú desplegable
  const truncarNombre = (nombre, limite = 35) => {
    return nombre.length > limite ? nombre.substring(0, limite) + "..." : nombre;
  };

  useEffect(() => {
    const cargarProductos = async () => {
      const { data, error } = await supabase.from("productos").select("*").order("nombre");
      if (error) console.error("Error:", error);
      else setProductos(data || []);
      setLoading(false);
    };
    cargarProductos();
  }, []);

  const productoDB = productos.find(p => p.id_producto === Number(productoId));
  const cantidadEnTabla = itemsActuales
    .filter(item => item.id_producto === Number(productoId))
    .reduce((acc, item) => acc + item.cantidad, 0);

  const stockReal = productoDB ? (productoDB.stock - cantidadEnTabla) : 0;
  const esCantidadInvalida = cantidad > stockReal || cantidad <= 0;

  const incrementar = () => { if (cantidad < stockReal) setCantidad(prev => prev + 1); };
  const decrementar = () => { if (cantidad > 1) setCantidad(prev => prev - 1); };

  const handleAgregar = () => {
    if (!productoId || esCantidadInvalida) return;
    // IMPORTANTE: Aquí mandamos el productoDB completo (nombre largo original)
    onAgregar({ ...productoDB, cantidad: Number(cantidad) });
    
    setProductoId("");
    setCantidad(1);
  };

  return (
    <div className="w-full max-w-4xl mx-auto bg-white border border-gray-100 rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-300">
      <div className="flex flex-col gap-3">
        <div className="flex flex-col items-center gap-1">
          <label className="text-[14px] font-black text-emerald-800 uppercase tracking-[0.25em]">Añadir Productos</label>
          {productoId && (
            <span className={`text-[10px] font-black px-3 py-0.5 rounded-full border transition-colors ${stockReal > 0 ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-red-50 text-red-600 border-red-100'}`}>
              STOCK: {stockReal}
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          <div className="md:col-span-8 overflow-hidden"> {/* overflow-hidden evita que el select empuje el layout */}
            <select
              value={productoId}
              onChange={(e) => {
                setProductoId(e.target.value);
                setCantidad(1);
              }}
              className="w-full border-0 bg-gray-50 px-4 md:px-6 py-3 rounded-lg text-[14px] md:text-[15px] text-gray-700 font-bold focus:ring-2 focus:ring-emerald-500/20 outline-none appearance-none cursor-pointer transition-all text-center truncate"
              style={{ 
                backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 fill=%27none%27 viewBox=%270 0 24 24%27 stroke=%27%23065f46%27%3E%3Cpath stroke-linecap=%27round%27 stroke-linejoin=%27round%27 stroke-width=%272%27 d=%27m19 9-7 7-7-7%27/%3E%3C/svg%3E")', 
                backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.8rem center', backgroundSize: '1.2em' 
              }}
              disabled={loading}
            >
              <option value="">— SELECCIONAR ÍTEM —</option>
              {productos.map((p) => {
                const cantUsada = itemsActuales.filter(item => item.id_producto === p.id_producto).reduce((acc, item) => acc + item.cantidad, 0);
                const disponible = p.stock - cantUsada;
                
                return (
                  <option key={p.id_producto} value={p.id_producto} disabled={disponible <= 0}>
                    {/* Aquí truncamos el nombre visualmente para el móvil */}
                    {truncarNombre(p.nombre, 40)} {disponible <= 0 ? '(AGOTADO)' : ''}
                  </option>
                );
              })}
            </select>
          </div>

          <div className="md:col-span-4 flex flex-row gap-2">
            <div className="flex flex-1 items-center justify-between bg-gray-50 rounded-lg p-1 border border-gray-100">
              <button type="button" onClick={decrementar} disabled={cantidad <= 1 || !productoId} className="w-9 h-9 flex items-center justify-center rounded-md bg-white shadow-sm hover:bg-gray-100 disabled:opacity-30 transition-all text-emerald-700 font-black"> − </button>
              <span className={`text-sm font-black ${esCantidadInvalida && productoId ? 'text-red-600' : 'text-gray-800'}`}>{cantidad}</span>
              <button type="button" onClick={incrementar} disabled={cantidad >= stockReal || !productoId} className="w-9 h-9 flex items-center justify-center rounded-md bg-white shadow-sm hover:bg-gray-100 disabled:opacity-30 transition-all text-emerald-700 font-black"> + </button>
            </div>

            <button
              onClick={handleAgregar}
              disabled={!productoId || esCantidadInvalida || stockReal <= 0}
              className="flex-[1.2] bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-200 disabled:text-gray-400 text-white font-black py-3 rounded-lg transition-all text-[13px] uppercase tracking-wider active:scale-95"
            >
              Añadir
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProductoSelector;