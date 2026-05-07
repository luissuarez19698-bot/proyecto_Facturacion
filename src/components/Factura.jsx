import { useState } from "react";
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

  const procesoGuardar = async () => {
    if (!cliente || items.length === 0) return alert("Faltan datos");

    if (metodoPago === "Cheque") {
      if (!numeroCheque) return alert("Por favor, ingrese el número de cheque.");
      
      const checkResp = await fetch(`https://api-martitatools.onrender.com/facturas/verificar-cheque/${numeroCheque}`);
      const { existe } = await checkResp.json();
      if (existe) return alert("ERROR: Este número de cheque ya fue registrado anteriormente.");
    }

    setGuardando(true);
    try {
      const respFactura = await fetch('https://api-martitatools.onrender.com/facturas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          id_cliente: cliente.id_cliente, 
          ...totales,
          metodo_pago: metodoPago,
          numero_cheque: metodoPago === "Cheque" ? numeroCheque : null,
          tasa_cambio: TASA_OFICIAL
        })
      });

      if (!respFactura.ok) throw new Error("Error al crear factura");
      const factura = await respFactura.json();

      const detalles = items.map(item => ({
        id_factura: factura.id_factura,
        id_producto: item.id_producto,
        cantidad: item.cantidad,
        precio_unitario: item.precio,
        subtotal_linea: item.precio * item.cantidad
      }));

      const respDetalle = await fetch('https://api-martitatools.onrender.com/facturas/detalles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ detalles })
      });

      if (!respDetalle.ok) throw new Error("Error al guardar detalles");

      alert("Venta guardada con éxito.");
      setItems([]);
      setCliente(null);
      setNumeroCheque("");
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
          <h1 className="text-3xl font-black italic">MARTITA TOOLS POS</h1>
        </div>

        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
          <ClienteSelector onSeleccionar={setCliente} />
          
          <div className="bg-emerald-50/50 p-6 rounded-2xl border border-emerald-100 space-y-4">
            <h3 className="text-emerald-800 font-black text-sm uppercase tracking-widest text-center">Forma de Pago</h3>
            <div className="grid grid-cols-2 gap-3">
              {["Efectivo", "Tarjeta", "Cheque", "Dolares"].map((opcion) => (
                <button
                  key={opcion}
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