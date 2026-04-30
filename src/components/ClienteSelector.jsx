import { useEffect, useState, useRef } from "react";
import { supabase } from "../database/supabaseconfig";

function ClienteSelector({ onSeleccionar }) {
  const [clientes, setClientes] = useState([]);
  const [seleccionado, setSeleccionado] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    // Variable de control para evitar actualizaciones en componentes desmontados
    let montado = true;

    const fetchClientes = async () => {
      const { data, error } = await supabase
        .from("clientes")
        .select("*")
        .order("nombre");
      
      if (error) {
        console.error("Error al cargar clientes:", error.message);
        return;
      }

      if (montado) {
        // Usamos un Set o simplemente reemplazamos el estado para evitar duplicados
        setClientes(data || []);
      }
    };

    fetchClientes();

    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    
    return () => {
      montado = false; // Limpieza al desmontar
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const seleccionarCliente = (c) => {
    setSeleccionado(c);
    onSeleccionar(c);
    setIsOpen(false);
  };

  return (
    <div className="w-full max-w-4xl mx-auto" ref={dropdownRef}>
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-6">
        
        <label className="block text-[14px] font-black text-emerald-800 uppercase tracking-[0.25em] text-center">
          Información del Cliente
        </label>

        {/* Selector UI */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="w-full bg-gray-50 border border-gray-100 hover:border-emerald-300 px-6 py-4 rounded-xl text-[18px] text-gray-800 font-bold flex items-center justify-center gap-3 transition-all shadow-inner group"
          >
            <span className={seleccionado ? "text-gray-800" : "text-gray-400"}>
              {seleccionado ? seleccionado.nombre : "Seleccionar cliente..."}
            </span>
            <svg 
              className={`w-5 h-5 text-emerald-700 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} 
              fill="none" viewBox="0 0 24 24" stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Menú Desplegable */}
          {isOpen && (
            <div className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden max-h-60 overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
              {clientes.length > 0 ? (
                clientes.map((c) => (
                  <button
                    key={c.id_cliente}
                    type="button"
                    onClick={() => seleccionarCliente(c)}
                    className="w-full px-6 py-3 text-[16px] text-gray-700 font-medium hover:bg-emerald-50 hover:text-emerald-800 transition-colors border-b border-gray-50 last:border-0 text-center"
                  >
                    {c.nombre}
                  </button>
                ))
              ) : (
                <div className="px-6 py-3 text-gray-400 text-center">Cargando clientes...</div>
              )}
            </div>
          )}
        </div>

        {/* Detalles del Cliente Seleccionado */}
        {seleccionado && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-emerald-50/40 rounded-2xl border border-emerald-100/50 animate-in slide-in-from-top-2 duration-300">
            <div className="flex flex-col items-center justify-center text-center">
              <p className="text-[11px] uppercase font-black text-emerald-700 tracking-widest mb-1">
                Dirección Registrada
              </p>
              <p className="text-[17px] text-gray-700 font-medium leading-tight italic">
                {seleccionado.direccion}
              </p>
            </div>
            
            <div className="flex flex-col items-center justify-center text-center">
              <p className="text-[11px] uppercase font-black text-emerald-700 tracking-widest mb-1">
                Condición Fiscal
              </p>
              <p className={`text-[18px] font-black px-5 py-1 rounded-full ${
                seleccionado.exonerado ? "text-blue-700 bg-blue-100/50" : "text-emerald-800 bg-emerald-100/50"
              }`}>
                {seleccionado.exonerado ? "EXONERADO (0% IVA)" : "GRAVADO (15% IVA)"}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ClienteSelector;