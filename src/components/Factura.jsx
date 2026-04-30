import { useState } from "react";
import ClienteSelector from "./ClienteSelector";
import ProductoSelector from "./ProductoSelector";
import TablaFactura from "./TablaFactura";
import TotalesFactura from "./TotalesFactura";
import { supabase } from "../database/supabaseconfig";

function Factura() {
  const [cliente, setCliente] = useState(null);
  const [items, setItems] = useState([]);
  const [guardando, setGuardando] = useState(false);

  // Cálculos automáticos
  const subtotal = items.reduce((acc, item) => acc + (item.precio * item.cantidad), 0);
  const clienteExonerado = cliente?.exonerado || false;
  const iva = clienteExonerado
    ? 0
    : items.reduce((acc, item) => {
      const lineaExenta = item.exonerado || false;
      return acc + (lineaExenta ? 0 : (item.precio * item.cantidad) * 0.15);
    }, 0);

  const totales = { subtotal, iva, total: subtotal + iva };

  const agregarItem = (nuevo) => setItems([...items, nuevo]);
  const eliminarItem = (index) => setItems(items.filter((_, i) => i !== index));

  const procesoGuardar = async () => {
    if (!cliente || items.length === 0) return alert("Faltan datos");
    setGuardando(true);
    try {
      const { data: factura, error: errorF } = await supabase
        .from("facturas")
        .insert([{ id_cliente: cliente.id_cliente, ...totales }])
        .select().single();

      if (errorF) throw errorF;

      const detalles = items.map(item => ({
        id_factura: factura.id_factura,
        id_producto: item.id_producto,
        cantidad: item.cantidad,
        precio_unitario: item.precio,
        subtotal_linea: item.precio * item.cantidad
      }));

      const { error: errorD } = await supabase.from("detalle_factura").insert(detalles);
      if (errorD) throw errorD;

      alert("Factura Guardada");
      setItems([]);
      setCliente(null);
    } catch (e) {
      alert("Error: " + e.message);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-5xl mx-auto bg-white rounded-3xl shadow-2xl overflow-hidden">
        <div className="bg-emerald-700 p-8 text-white flex justify-between items-center">
          <h1 className="text-3xl font-black">SISTEMA POS - MARTITA</h1>
          <div className="bg-white text-emerald-700 p-2 rounded-lg font-bold">LOGO</div>
        </div>

        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="border-l-4 border-emerald-500 pl-4">
            <h2 className="font-bold text-xl">Tu Empresa S.A.</h2>
            <p className="text-gray-500 text-sm">Managua, Nicaragua</p>
          </div>
          <ClienteSelector onSeleccionar={setCliente} />
        </div>

        <div className="p-8 bg-gray-50 border-y border-gray-200">
          <ProductoSelector onAgregar={agregarItem} />
        </div>

        <div className="p-8">
          <TablaFactura items={items} clienteExonerado={clienteExonerado} onEliminar={eliminarItem} />
        </div>

        <div className="p-8 flex justify-end bg-gray-50">
          <div className="w-full max-w-md">
            {/* AQUÍ CAMBIAMOS EL NOMBRE DE LA PROP A accionGuardar */}
            <TotalesFactura
              totales={totales}
              clienteExonerado={clienteExonerado}
              cargando={guardando}
              accionGuardar={() => {
                console.log("¡CONEXIÓN EXITOSA!");
                procesoGuardar(); // O guardarFactura() según como se llame la tuya
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
export default Factura;