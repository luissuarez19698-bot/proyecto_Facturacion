import { useState } from "react";
import Swal from "sweetalert2";
// 1. Importamos la instancia de Supabase configurada previamente
import { supabase } from "./supabase"; 
import ClienteSelector from "./components/ClienteSelector";
import ProductoSelector from "./components/ProductoSelector";
import TablaFactura from "./components/TablaFactura";
import TotalesFactura from "./components/TotalesFactura";
import { calcularTotales } from "./components/calcularTotales";

const MiniToast = Swal.mixin({
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  timer: 1500,
  width: '240px',
  padding: '0.6rem',
  background: '#fff',
  color: '#374151',
  customClass: { title: 'text-[14px] font-black uppercase tracking-wider' }
});

function App() {
  const [cliente, setCliente] = useState(null);
  const [itemsFactura, setItemsFactura] = useState([]);
  const [guardando, setGuardando] = useState(false);
  const [ultimaFactura, setUltimaFactura] = useState(null);

  const [metodoPago, setMetodoPago] = useState("Efectivo");
  const [numeroReferencia, setNumeroReferencia] = useState("");
  const [monedaVista, setMonedaVista] = useState("NIO");
  const [pagoRecibido, setPagoRecibido] = useState(""); 
  const TASA_OFICIAL = 36.84; 

  const totales = calcularTotales(itemsFactura, cliente?.exonerado || false);

  const obtenerMontoFormateado = (monto) => {
    const valor = monedaVista === "USD" ? monto / TASA_OFICIAL : monto;
    return valor.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const calcularCambio = () => {
    if (!pagoRecibido) return 0;
    const recibido = parseFloat(pagoRecibido);
    const totalNIO = totales.total;
    const recibidoEnNIO = monedaVista === "USD" ? recibido * TASA_OFICIAL : recibido;
    return recibidoEnNIO - totalNIO;
  };

  const agregarProducto = (producto) => {
    setItemsFactura((prev) => [...prev, producto]);
    MiniToast.fire({ icon: 'success', title: 'Añadido' });
  };

  const eliminarProducto = (index) => {
    setItemsFactura((prev) => prev.filter((_, i) => i !== index));
    MiniToast.fire({ icon: 'info', title: 'Eliminado' });
  };

  // 2. NUEVO PROCESO DE GUARDADO USANDO EL SDK DE SUPABASE
  const manejarGuardado = async () => {
    if (!cliente || itemsFactura.length === 0) return MiniToast.fire({ icon: 'warning', title: 'Faltan datos' });
    
    const recibidoNumerico = parseFloat(pagoRecibido);
    const recibidoEnNIO = monedaVista === "USD" ? recibidoNumerico * TASA_OFICIAL : recibidoNumerico;

    if (!pagoRecibido || recibidoNumerico <= 0) {
      return Swal.fire("Monto Inválido", "Debe ingresar un monto válido y mayor a cero.", "warning");
    }

    if (recibidoEnNIO < totales.total) {
      const faltante = totales.total - recibidoEnNIO;
      return Swal.fire("Pago Insuficiente", `El monto no cubre el total. Faltan: C$ ${faltante.toFixed(2)}`, "error");
    }

    if (metodoPago === "Cheque" && !numeroReferencia) {
      return Swal.fire("Atención", "Ingrese número de Cheque", "warning");
    }

    // A. Verificación de duplicados de Cheque directo en Supabase
    if (metodoPago === "Cheque") {
      try {
        const { data: chequeExistente, error: errorCheque } = await supabase
          .from('facturas')
          .select('numero_cheque')
          .eq('numero_cheque', numeroReferencia)
          .maybeSingle();

        if (errorCheque) throw errorCheque;
        if (chequeExistente) {
          return Swal.fire("Error", `El cheque "${numeroReferencia}" ya existe.`, "error");
        }
      } catch (err) {
        return Swal.fire("Error de Conexión", "No se pudo verificar el cheque en Supabase.", "error");
      }
    }

    setGuardando(true);
    try {
      // B. Inserción del Encabezado de Factura
      const { data: facturaGenerada, error: errorFactura } = await supabase
        .from('facturas')
        .insert([{
          id_cliente: cliente.id_cliente,
          subtotal: totales.subtotal,
          iva: totales.iva,
          total: totales.total,
          metodo_pago: metodoPago,
          numero_cheque: metodoPago === "Cheque" ? numeroReferencia : null,
          tasa_cambio: TASA_OFICIAL
        }])
        .select()
        .single();

      if (errorFactura) throw errorFactura;
      if (!facturaGenerada) throw new Error("No se pudo recuperar el ID de la factura creada.");

      // C. Inserción masiva de los Detalles de la Factura
      const detalles = itemsFactura.map(item => ({
        id_factura: facturaGenerada.id_factura,
        id_producto: item.id_producto,
        cantidad: item.cantidad,
        precio_unitario: item.precio,
        subtotal_linea: item.precio * item.cantidad
      }));

      const { error: errorDetalles } = await supabase
        .from('detalle_factura')
        .insert(detalles);

      if (errorDetalles) throw errorDetalles;

      // D. Deducción síncrona del inventario de Productos
      for (const item of itemsFactura) {
        const nuevoStock = item.stock - item.cantidad;
        const { error: errorStock } = await supabase
          .from('productos')
          .update({ stock: nuevoStock })
          .eq('id_producto', item.id_producto);

        if (errorStock) {
          console.error(`Error al actualizar stock del ID ${item.id_producto}:`, errorStock.message);
        }
      }

      // E. Almacenar estado local para visualización o impresión de ticket
      setUltimaFactura({
        cliente: { ...cliente },
        items: [...itemsFactura],
        totales: { ...totales },
        numero: facturaGenerada.id_factura,
        pago: { 
          metodo: metodoPago, 
          ref: numeroReferencia,
          recibido: recibidoEnNIO,
          vuelto: calcularCambio()
        }
      });

      MiniToast.fire({ icon: 'success', title: 'Venta Registrada' });
      
      // Limpieza completa del formulario pos-venta exitosa
      setItemsFactura([]); 
      setCliente(null); 
      setMetodoPago("Efectivo"); 
      setNumeroReferencia(""); 
      setPagoRecibido("");

    } catch (error) {
      Swal.fire({ 
        title: "Error", 
        text: "Error al guardar en Supabase: " + error.message, 
        icon: "error", 
        confirmButtonColor: "#065f46" 
      });
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-6 px-4 font-sans text-[#3D454B]">
      <div className="w-full max-w-[1400px] mx-auto bg-white shadow-2xl rounded-3xl overflow-hidden border border-gray-200">
        
        <div className="bg-emerald-800 text-white px-8 py-10 md:px-14 flex flex-col sm:flex-row justify-between items-center gap-6">
          <div className="text-center sm:text-left">
            <h1 className="text-4xl md:text-6xl font-black tracking-tighter italic">FACTURACIÓN</h1>
            <p className="text-emerald-300 text-xs font-bold tracking-[0.4em] uppercase">Martita Tools — Sistema de Gestión</p>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-right border-l-2 border-emerald-600/50 pl-6 hidden md:block">
               <p className="text-emerald-200/40 text-[10px] uppercase tracking-widest font-bold">Tipo Documento</p>
               <p className="text-2xl font-light italic opacity-90">Venta Directa</p>
            </div>
          </div>
        </div>

        <div className="p-6 md:p-10 space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            <div className="lg:col-span-7 space-y-6">
              <ClienteSelector 
                onSeleccionar={setCliente} 
                clienteActual={cliente} 
              />
              <ProductoSelector onAgregar={agregarProducto} itemsActuales={itemsFactura} />
            </div>

            <div className="lg:col-span-5 bg-gray-50 border-2 border-gray-200 rounded-3xl p-6 flex flex-col shadow-sm">
              <div className="space-y-6 flex-grow">
                <h3 className="text font-black text-gray-400 uppercase tracking-[0.3em] text-center italic">Método de Pago</h3>
                
                <div className="grid grid-cols-3 gap-3">
                  {["Efectivo", "Tarjeta", "Cheque"].map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => {
                        setMetodoPago(m);
                        setPagoRecibido("");
                        setNumeroReferencia("");
                        if (m === "Cheque") setMonedaVista("NIO");
                      }}
                      className={`py-4 rounded-xl text-xs font-black transition-all border-2 uppercase ${
                        metodoPago === m 
                        ? "border-emerald-600 bg-emerald-600 text-white shadow-lg" 
                        : "border-gray-300 bg-white text-gray-500 hover:border-emerald-400"
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>

                {metodoPago === "Tarjeta" && (
                  <div className="bg-blue-600 text-white p-4 rounded-2xl shadow-md">
                    <p className="text-[12.5px] font-black uppercase opacity-80 text-[#FFFFFF]">Deposite a esta cuenta:</p>
                    <p className="text-xl font-black tracking-widest text-[#FFFFFF]">3612-3232-7523-09</p>
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-end mb-2 px-2">
                      <label className="text-[16px] font-black text-emerald-800 uppercase italic">
                        {metodoPago === "Tarjeta" ? "Monto Depositado" : 
                         metodoPago === "Cheque" ? "Monto del Cheque" : "Monto Recibido"} ({monedaVista})
                      </label>
                      <span className="text-[22px] font-black bg-emerald-600 text-white px-5 py-2 rounded-xl shadow-xl uppercase tracking-tighter italic border-b-4 border-emerald-800 flex flex-col leading-none items-center">
                        <span className="text-[12.5px] tracking-[0.2em] mb-1 text-center block mx-auto">TASA DE CAMBIO</span>
                        C$ {TASA_OFICIAL}
                      </span>
                    </div>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-black text-emerald-800/40">
                        {monedaVista === "USD" ? "$" : "C$"}
                      </span>
                      <input
                        type="number"
                        value={pagoRecibido}
                        onChange={(e) => setPagoRecibido(e.target.value)}
                        placeholder="0.00"
                        className="w-full p-5 pl-12 rounded-2xl border-4 border-emerald-100 focus:border-emerald-500 outline-none font-black text-3xl text-emerald-900 shadow-inner"
                      />
                    </div>
                  </div>
                  
                  {pagoRecibido && (metodoPago === "Efectivo" || metodoPago === "Cheque" || metodoPago === "Tarjeta") && (
                    <div className="bg-white border-2 border-dashed border-emerald-200 p-4 rounded-2xl flex justify-between items-center">
                      <span className="text-xs font-bold text-gray-500 uppercase italic">Vuelto (C$):</span>
                      <span className={`text-2xl font-black ${calcularCambio() < 0 ? 'text-red-500' : 'text-emerald-600'}`}>
                        C$ {calcularCambio().toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  )}
                </div>

                {metodoPago === "Cheque" && (
                  <div>
                    <label className="text-[12px] font-black text-gray-400 uppercase ml-2 italic">Número de Cheque</label>
                    <input
                      type="text"
                      placeholder="INGRESE N° DE CHEQUE..."
                      value={numeroReferencia}
                      onChange={(e) => setNumeroReferencia(e.target.value)}
                      className="w-full mt-1 p-5 rounded-2xl border-2 border-emerald-200 focus:border-emerald-600 outline-none font-black text-xl uppercase bg-white"
                    />
                  </div>
                )}
              </div>

              <div className="mt-8 pt-6 border-t-4 border-emerald-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <p className="text-[15px] font-black text-gray-400 uppercase tracking-widest">Total a Cobrar</p>
                  <p className="text-5xl font-black text-emerald-900 leading-tight">
                    <span className="text-2xl mr-1 font-medium">{monedaVista === "NIO" ? "C$" : "$"}</span>
                    {obtenerMontoFormateado(totales.total)}
                  </p>
                </div>
                
                <button 
                  type="button"
                  disabled={metodoPago === "Cheque"}
                  onClick={() => {
                    setMonedaVista(monedaVista === "NIO" ? "USD" : "NIO");
                    setPagoRecibido(""); 
                  }}
                  className={`w-[180px] h-[64px] flex items-center justify-center rounded-2xl border-b-4 font-black text-[14px] uppercase transition-all shadow-md ${
                    metodoPago === "Cheque" 
                    ? "bg-gray-200 border-gray-300 text-gray-400 cursor-not-allowed opacity-50"
                    : monedaVista === "USD" 
                      ? "bg-[#3386D7] border-blue-800 text-white active:translate-y-1" 
                      : "bg-white border-emerald-600 text-emerald-700 active:translate-y-1"
                  }`}
                >
                  {monedaVista === "NIO" ? "Paga en Dólares" : "Paga en Córdobas"}
                </button>
              </div>
            </div>
          </div>

          <div className="bg-gray-50/50 rounded-2xl border-2 border-gray-100 overflow-hidden shadow-inner">
            <TablaFactura items={itemsFactura} onEliminar={eliminarProducto} />
          </div>

          <div className="flex justify-end pt-4">
            <div className="w-full sm:w-[420px]">
              <TotalesFactura
                totales={totales}
                items={itemsFactura}
                ultimaFactura={ultimaFactura}
                accionGuardar={manejarGuardado}
                cargando={guardando}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;