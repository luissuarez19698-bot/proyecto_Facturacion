import { useEffect, useState, useRef } from "react";
import { supabase } from "../database/supabaseconfig";

function ProductoSelector({ onAgregar, itemsActuales = [] }) {
  const [productos, setProductos] = useState([]);
  const [productoId, setProductoId] = useState("");
  const [cantidad, setCantidad] = useState(1);
  const [loading, setLoading] = useState(true);
  const [anchoPantalla, setAnchoPantalla] = useState(window.innerWidth);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleResize = () => setAnchoPantalla(window.innerWidth);
    window.addEventListener('resize', handleResize);
    const cargarProductos = async () => {
      const { data, error } = await supabase.from("productos").select("*").order("nombre");
      if (error) console.error("Error:", error);
      else setProductos(data || []);
      setLoading(false);
    };
    cargarProductos();

    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) setIsOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const simplificarNombre = (nombre) => {
    if (!nombre) return "";
    if (anchoPantalla < 768) {
      const palabras = nombre.trim().split(/\s+/);
      return palabras.length <= 2 ? nombre : `${palabras[0]} ${palabras[1]}...`;
    }
    return nombre.length > 80 ? nombre.substring(0, 80) + "..." : nombre;
  };

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
    onAgregar({ ...productoDB, cantidad: Number(cantidad) });
    setProductoId("");
    setCantidad(1);
  };

  const seleccionarProducto = (id) => {
    setProductoId(id);
    setCantidad(1);
    setIsOpen(false);
  };

  return (
    <div className="w-full max-w-4xl mx-auto bg-white border border-gray-100 rounded-2xl p-6 shadow-sm" ref={dropdownRef}>
      <div className="flex flex-col gap-4">
        
        <div className="flex flex-col items-center gap-2">
          <label className="text-[14px] font-black text-emerald-800 uppercase tracking-[0.25em]">
            Añadir Productos
          </label>
          
          {/* Bloque de stock estático sin animaciones */}
          {productoId && (
            <div className="bg-emerald-600 px-6 py-1 rounded-full shadow-sm border border-emerald-700">
              <span className="text-[14px] font-black text-white uppercase tracking-wider">
                Stock Disponible: {stockReal}
              </span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
          
          <div className="md:col-span-8 relative">
            <button
              onClick={() => !loading && setIsOpen(!isOpen)}
              disabled={loading}
              className="w-full bg-gray-50 border border-gray-200 hover:border-emerald-500 px-6 py-4 rounded-xl text-[16px] text-gray-800 font-bold flex items-center justify-between gap-3"
            >
              <span className={`truncate ${productoId ? 'text-gray-900' : 'text-gray-400'}`}>
                {productoId ? simplificarNombre(productoDB?.nombre) : "— SELECCIONAR PRODUCTO —"}
              </span>
              <svg 
                className="w-6 h-6 text-emerald-700 shrink-0" 
                fill="none" viewBox="0 0 24 24" stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {isOpen && (
              <div className="absolute z-50 w-full mt-2 bg-white border border-gray-300 rounded-xl shadow-2xl overflow-hidden max-h-80 overflow-y-auto">
                {productos.map((p) => {
                  const enTabla = itemsActuales.find(i => i.id_producto === p.id_producto)?.cantidad || 0;
                  const disponible = p.stock - enTabla;
                  const agotado = disponible <= 0;

                  return (
                    <button
                      key={p.id_producto}
                      onClick={() => !agotado && seleccionarProducto(p.id_producto)}
                      disabled={agotado}
                      className={`w-full px-6 py-4 text-[15px] font-bold border-b border-gray-100 last:border-0 flex items-center justify-between
                        ${agotado ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'hover:bg-emerald-600 hover:text-white text-gray-800'}`}
                    >
                      <span className={agotado ? 'line-through' : ''}>{p.nombre}</span>
                      <span className={`text-[12px] px-2 py-1 rounded font-black ${agotado ? 'bg-red-200 text-red-700' : 'bg-emerald-100 text-emerald-900'}`}>
                        {agotado ? 'AGOTADO' : `DISP: ${disponible}`}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="md:col-span-4 flex flex-row gap-3">
            <div className="flex flex-1 items-center justify-between bg-gray-100 rounded-xl p-1 border border-gray-200">
              <button type="button" onClick={decrementar} disabled={cantidad <= 1 || !productoId} className="w-10 h-10 flex items-center justify-center text-emerald-700 font-black text-2xl disabled:opacity-10"> − </button>
              <span className="text-[18px] font-black text-gray-900">{cantidad}</span>
              <button type="button" onClick={incrementar} disabled={cantidad >= stockReal || !productoId} className="w-10 h-10 flex items-center justify-center text-emerald-700 font-black text-2xl disabled:opacity-10"> + </button>
            </div>

            <button
              onClick={handleAgregar}
              disabled={!productoId || esCantidadInvalida}
              className="flex-[1.2] bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 text-white font-black py-4 rounded-xl text-[14px] uppercase tracking-widest shadow-md"
            >
              Añadir
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


//añañingo
export default ProductoSelector;