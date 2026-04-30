import { useState } from "react";
import Swal from "sweetalert2";
import ClienteSelector from "./components/ClienteSelector";
import ProductoSelector from "./components/ProductoSelector";
import TablaFactura from "./components/TablaFactura";
import TotalesFactura from "./components/TotalesFactura";
import { calcularTotales } from "./components/calcularTotales";
import { supabase } from "./database/supabaseconfig";

const MiniToast = Swal.mixin({
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  timer: 1500,
  width: '220px',
  padding: '0.4rem',
  background: '#fff',
  color: '#374151',
  customClass: {
    title: 'text-[12px] font-black uppercase tracking-wider',
  }
});

function App() {
  const [cliente, setCliente] = useState(null);
  const [itemsFactura, setItemsFactura] = useState([]);
  const [guardando, setGuardando] = useState(false);
  const [ultimaFactura, setUltimaFactura] = useState(null);

  const agregarProducto = (producto) => {
    setItemsFactura((prev) => [...prev, producto]);
    MiniToast.fire({
      icon: 'success',
      title: 'Añadido'
    });
  };

  const eliminarProducto = (index) => {
    setItemsFactura((prev) => prev.filter((_, i) => i !== index));
    MiniToast.fire({
      icon: 'info',
      title: 'Eliminado'
    });
  };

  const totales = calcularTotales(itemsFactura, cliente?.exonerado || false);

  const manejarGuardado = async () => {
    if (!cliente || itemsFactura.length === 0) {
      return MiniToast.fire({ icon: 'warning', title: 'Faltan datos' });
      window.location.reload()
    }

    setGuardando(true);
    try {
      const { data: factura, error: errorF } = await supabase
        .from("facturas")
        .insert([{
          id_cliente: cliente.id_cliente,
          subtotal: totales.subtotal,
          iva: totales.iva,
          total: totales.total
        }])
        .select().single();

      if (errorF) throw errorF;

      const detalles = itemsFactura.map(item => ({
        id_factura: factura.id_factura,
        id_producto: item.id_producto,
        cantidad: item.cantidad,
        precio_unitario: item.precio,
        subtotal_linea: item.precio * item.cantidad
      }));

      const { error: errorD } = await supabase.from("detalle_factura").insert(detalles);
      if (errorD) throw errorD;

      setUltimaFactura({
        cliente: { ...cliente },
        items: [...itemsFactura],
        totales: { ...totales },
        numero: factura.id_factura
      });

      MiniToast.fire({
        icon: 'success',
        title: 'Venta Registrada',
        timer: 2000
      });

      setItemsFactura([]);
      setCliente(null);

    } catch (error) {
      MiniToast.fire({ icon: 'error', title: 'Error Sistema' });
      console.error(error);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4 font-sans">
      <div className="w-full max-w-[1400px] mx-auto bg-white shadow-2xl rounded-3xl overflow-hidden border border-gray-200">

        <div className="bg-emerald-800 text-white px-8 py-10 md:px-14 md:py-16 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
          <div>
          <h1 className="text-4xl md:text-6xl font-light tracking-tighter text-emerald-50">Facturación</h1>
            <p className="text-emerald-200 text-xs md:text-sm uppercase tracking-[0.4em] mt-3 font-bold">Martita Tools — Sistema de Gestión</p>
          </div>
          <div className="text-left sm:text-right border-l-2 border-emerald-600/50 pl-6 sm:pl-10">
            <p className="text-emerald-200/40 text-[10px] uppercase tracking-widest mb-1 font-bold">Tipo de Documento</p>
            <p className="text-xl md:text-3xl font-light italic opacity-90">Venta Directa</p>
          </div>
        </div>

        <div className="p-6 md:p-12 space-y-10">
          <div className="flex flex-col gap-6">
            <ClienteSelector onSeleccionar={setCliente} />
            <ProductoSelector onAgregar={agregarProducto} itemsActuales={itemsFactura} />
          </div>

          <div className="bg-gray-50/50 rounded-2xl border border-gray-100 overflow-hidden">
            <TablaFactura items={itemsFactura} onEliminar={eliminarProducto} />
          </div>

          <div className="flex justify-end pt-4">
            <div className="w-full sm:w-[400px]">
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