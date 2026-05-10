import { useEffect, useState, useRef } from "react";

function ProductoSelector({ onAgregar, itemsActuales = [] }) {
  const [productos, setProductos] = useState([]);
  const [productoId, setProductoId] = useState("");
  const [cantidad, setCantidad] = useState(1);
  const [loading, setLoading] = useState(true);
  const [anchoPantalla, setAnchoPantalla] = useState(window.innerWidth);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const cargarProductos = async () => {
    setLoading(true);
    try {
      const response = await fetch('https://api-martitatools.onrender.com/productos');
      if (!response.ok) throw new Error('Error en servidor');
      const data = await response.json();
      setProductos(data || []);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (itemsActuales.length === 0) {
      cargarProductos();
    }
  }, [itemsActuales.length]);

  useEffect(() => {
    const handleResize = () => setAnchoPantalla(window.innerWidth);
    window.addEventListener('resize', handleResize);
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
      return palabras.length <= 2 ? nombre : `${palabras[0]} ${palabras[1]} ${palabras[2]} ...`;
    }
    return nombre.length > 80 ? nombre.substring(0, 80) + "..." : nombre;
  };

  const productoDB = productos.find(p => p.id_producto === Number(productoId));
  const cantidadEnTabla = itemsActuales
    .filter(item => item.id_producto === Number(productoId))
    .reduce((acc, item) => acc + item.cantidad, 0);

  const stockReal = productoDB ? (productoDB.stock - cantidadEnTabla) : 0;
  const esCantidadInvalida = cantidad > stockReal || cantidad <= 0 || cantidad === "";

  const incrementar = () => { if (cantidad < stockReal) setCantidad(prev => Number(prev) + 1); };
  const decrementar = () => { if (cantidad > 1) setCantidad(prev => Number(prev) - 1); };

  const handleCantidadChange = (e) => {
    const valor = e.target.value;
    if (valor === "") { setCantidad(""); return; }
    const num = parseInt(valor);
    if (num > stockReal) setCantidad(stockReal);
    else if (num < 0) setCantidad(1);
    else setCantidad(num);
  };

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
          
          {productoId && (
            <div className="bg-emerald-600 px-6 py-1 rounded-full shadow-sm border border-emerald-700 transition-all">
              <span className="text-[14px] font-black text-white uppercase tracking-wider">
                Stock Disponible: {stockReal}
              </span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
          
          <div className="md:col-span-7 relative">
            <button
              onClick={() => !loading && setIsOpen(!isOpen)}
              disabled={loading}
              className="w-full bg-gray-50 border border-gray-200 hover:border-emerald-500 px-5 py-4 rounded-xl text-[16px] text-gray-800 font-bold flex items-center justify-between gap-3 transition-colors"
            >
              <span className={`truncate flex-1 text-center ${productoId ? 'text-gray-900' : 'text-gray-400'}`}>
                {productoId ? simplificarNombre(productoDB?.nombre) : "— SELECCIONAR PRODUCTO —"}
              </span>
              <svg className="w-5 h-5 text-emerald-700 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
                      <span className={`text-[11px] px-2 py-1 rounded font-black ${agotado ? 'bg-red-200 text-red-700' : 'bg-emerald-100 text-emerald-900'}`}>
                        {agotado ? 'AGOTADO' : `DISP: ${disponible}`}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="md:col-span-5 flex flex-row gap-2 items-center justify-center">
            <div className="flex items-center justify-between bg-gray-100 rounded-xl p-1 border border-gray-200 w-32 shrink-0">
              <button type="button" onClick={decrementar} disabled={cantidad <= 1 || !productoId} className="w-8 h-10 flex items-center justify-center text-emerald-700 font-black text-xl disabled:opacity-20"> − </button>
              
              <input 
                type="number"
                value={cantidad}
                onChange={handleCantidadChange}
                disabled={!productoId}
                className="w-10 bg-transparent text-center text-[18px] font-black text-gray-900 outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />

              <button type="button" onClick={incrementar} disabled={cantidad >= stockReal || !productoId} className="w-8 h-10 flex items-center justify-center text-emerald-700 font-black text-xl disabled:opacity-20"> + </button>
            </div>

            <button
              onClick={handleAgregar}
              disabled={!productoId || esCantidadInvalida}
              className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 text-white font-black py-4 rounded-xl text-[13px] uppercase tracking-tighter shadow-md active:scale-95 transition-all"
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