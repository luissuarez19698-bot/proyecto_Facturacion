import { useState } from "react";
// 1. Importamos la instancia de Supabase
import { supabase } from "../supabase"; 
import ClienteSelector from "./ClienteSelector";
import ProductoSelector from "./ProductoSelector";
import TablaFactura from "./TablaFactura";
import TotalesFactura from "./TotalesFactura";

function Factura() {
  const [cliente, setCliente] = useState(null);
  const [items, setItems] = useState([]);
  const [guardando, setGuardando] = useState(false);
  
  const [metodoPago, setMetodoPago] = useState("Efectivo");
  const [numeroCheque, setNumeroCheque] = useState("");
  const TASA_OFICIAL = 36.62;

  const subtotal = items.reduce((acc, item) => acc + (item.precio * item.cantidad), 0);
  const clienteExonerado = cliente?.exonerado || false;
  const iva = clienteExonerado ? 0 : items.reduce((acc, item) => {
    return acc + (item.exonerado ? 0 : (item.precio * item.cantidad) * 0.15);
  }, 0);

  const totales = { subtotal, iva, total: subtotal + iva };
  const totalDolares = (totales.total / TASA_OFICIAL).toFixed(2);

  const agregarItem = (nuevo) => setItems([...items, nuevo]);
  const eliminarItem = (index) => setItems(items.filter((_, i) => i !== index));

  // 2. NUEVO PROCESO PARA GUARDAR DIRECTO EN SUPABASE
  const procesoGuardar = async () => {
    if (!cliente || items.length === 0) return alert("Faltan datos");

    // A. Validación del Cheque en Supabase
    if (metodoPago === "Cheque") {
      if (!numeroCheque) return alert("Por favor, ingrese el número de cheque.");
      
      const { data: chequeExistente, error: ErrorCheque } = await supabase
        .from('facturas')
        .select('numero_cheque')
        .eq('numero_cheque', numeroCheque)
        .maybeSingle(); // Trae un registro o null si no existe

      if (ErrorCheque) return alert("Error al verificar cheque: " + ErrorCheque.message);
      if (chequeExistente) return alert("ERROR: Este número de cheque ya fue registrado anteriormente.");
    }

    setGuardando(true);
    try {
      // B. Insertar Encabezado de Factura
      // Usamos .select().single() para que nos devuelva el registro creado con su ID autogenerado
      const { data: nuevaFactura, error: errorFactura } = await supabase
        .from('facturas')
        .insert([{
          id_cliente: cliente.id_cliente,
          subtotal: totales.subtotal,
          iva: totales.iva,
          total: totales.total,
          metodo_pago: metodoPago,
          numero_cheque: metodoPago === "Cheque" ? numeroCheque : null,
          tasa_cambio: TASA_OFICIAL
        }])
        .select()
        .single();

      if (errorFactura) throw errorFactura;
      if (!nuevaFactura) throw new Error("No se pudo obtener el ID de la factura generada.");

      // C. Preparar e Insertar Detalles de Factura en bloque (Bulk Insert)
      const detalles = items.map(item => ({
        id_factura: nuevaFactura.id_factura, // ID recuperado de la inserción anterior
        id_producto: item.id_producto,
        cantidad: item.cantidad,
        precio_unitario: item.precio,
        subtotal_linea: item.precio * item.cantidad
      }));

      const { error: errorDetalle } = await supabase
        .from('detalle_factura')
        .insert(detalles);

      if (errorDetalle) throw errorDetalle;

      // D. [OPCIONAL] Actualizar el Stock de los productos en Supabase
      // Como estamos quitando la lógica del backend, el frontend puede actualizar el stock restante de cada uno
      for (const item of items) {
        const nuevoStock = item.stock - item.cantidad;
        const { error: errorStock } = await supabase
          .from('productos')
          .update({ stock: nuevoStock })
          .eq('id_producto', item.id_producto);
        
        if (errorStock) console.error(`Error al actualizar stock del producto ${item.id_producto}:`, errorStock.message);
      }

      alert("Venta guardada con éxito en Supabase.");
      
      // Reseteo de estados
      setItems([]);
      setCliente(null);
      setNumeroCheque("");
    } catch (e) {
      alert("Error en la operación: " + e.message);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-5xl mx-auto bg-white rounded-3xl shadow-2xl overflow-hidden">
        <div className="bg-emerald-700 p-8 text-white flex justify-between items-center">
          <h1 className="text-3xl font-black italic">MARTITA TOOLS POS</h1>
        </div>

        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
          <ClienteSelector onSeleccionar={setCliente} clienteActual={cliente} />
          
          <div className="bg-emerald-50/50 p-6 rounded-2xl border border-emerald-100 space-y-4">
            <h3 className="text-emerald-800 font-black text-sm uppercase tracking-widest text-center">Forma de Pago</h3>
            <div className="grid grid-cols-2 gap-3">
              {["Efectivo", "Tarjeta", "Cheque", "Dolares"].map((opcion) => (
                <button
                  key={opcion}
                  type="button"
                  onClick={() => setMetodoPago(opcion)}
                  className={`py-3 rounded-xl font-bold transition-all ${
                    metodoPago === opcion 
                    ? "bg-emerald-600 text-white shadow-lg scale-105" 
                    : "bg-white text-emerald-700 border border-emerald-200"
                  }`}
                >
                  {opcion}
                </button>
              ))}
            </div>

            {metodoPago === "Cheque" && (
              <div className="animate-in fade-in slide-in-from-top-2">
                <input
                  type="text"
                  placeholder="Número de cheque..."
                  value={numeroCheque}
                  onChange={(e) => setNumeroCheque(e.target.value)}
                  className="w-full p-4 rounded-xl border-2 border-emerald-200 focus:border-emerald-600 outline-none font-bold text-emerald-900"
                />
              </div>
            )}

            {metodoPago === "Dolares" && (
              <div className="bg-white p-4 rounded-xl border border-emerald-200 text-center">
                <p className="text-xs font-bold text-gray-500 uppercase">Tasa de Cambio Oficial</p>
                <p className="text-2xl font-black text-emerald-700">C$ {TASA_OFICIAL}</p>
                <div className="mt-2 pt-2 border-t border-gray-100">
                  <p className="text-sm font-bold text-gray-600">Total a pagar: <span className="text-lg text-blue-600">${totalDolares}</span></p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="p-8 bg-gray-50 border-y border-gray-200">
          <ProductoSelector onAgregar={agregarItem} itemsActuales={items} />
        </div>

        <div className="p-8">
          <TablaFactura items={items} clienteExonerado={clienteExonerado} onEliminar={eliminarItem} />
        </div>

        <div className="p-8 flex justify-end bg-gray-50">
          <div className="w-full max-w-md">
            <TotalesFactura
              totales={totales}
              items={items}
              cargando={guardando}
              accionGuardar={procesoGuardar}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default Factura;