import { useEffect, useState } from "react";
import { supabase } from "../database/supabaseconfig";

function ClienteSelector({ onSeleccionar }) {
  const [clientes, setClientes] = useState([]);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.from("clientes").select("*").order("nombre");
      setClientes(data || []);
    };
    fetch();
  }, []);

  return (

    <div className="w-full max-w-4xl mx-auto bg-white border border-gray-100 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow duration-300">
      <div className="flex flex-col gap-2">
        
        <label className="text-[14px] font-black text-emerald-800 uppercase tracking-[0.25em] text-center">
          Información del Cliente
        </label>
        
        <select 
          onChange={(e) => onSeleccionar(clientes.find(c => c.id_cliente === Number(e.target.value)))}
          className="w-full border-0 bg-gray-50 px-6 py-3 rounded-lg text-[15px] text-gray-700 font-bold focus:ring-2 focus:ring-emerald-500/20 outline-none appearance-none cursor-pointer transition-all text-center"
          style={{ 
            backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 fill=%27none%27 viewBox=%270 0 24 24%27 stroke=%27%23065f46%27%3E%3Cpath stroke-linecap=%27round%27 stroke-linejoin=%27round%27 stroke-width=%272%27 d=%27m19 9-7 7-7-7%27/%3E%3C/svg%3E")', 
            backgroundRepeat: 'no-repeat', 
            backgroundPosition: 'right 1.2rem center', 
            backgroundSize: '1.2em' 
          }}
        >
          <option value="">Seleccionar cliente...</option>
          {clientes.map(c => (
            <option key={c.id_cliente} value={c.id_cliente}>
              {c.nombre}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

export default ClienteSelector;