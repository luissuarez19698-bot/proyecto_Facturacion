import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export const generarPDF = (cliente, items, totales, numeroFactura, pagoInfo) => {
  const doc = new jsPDF();

  // --- CONFIGURACIÓN DE MÁRGENES Y COLORES ---
  const marginX = 190; 
  const startX = 15;
  const centerX = 105;
  const ESMERALDA = [5, 150, 105]; 
  const TEXTO_GRIS = [31, 41, 55];

  // --- LÓGICA DE FECHA Y HORA (NICARAGUA) ---
  const ahora = new Date();
  const fechaNica = ahora.toLocaleDateString("es-NI", {
    timeZone: "America/Managua",
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  });
  const horaNica = ahora.toLocaleTimeString("es-NI", {
    timeZone: "America/Managua",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true
  });

  // --- ENCABEZADO (ESTILO ORIGINAL) ---
  doc.setFontSize(26);
  doc.setTextColor(...ESMERALDA); 
  doc.setFont("helvetica", "bold");
  doc.text("MARTITA TOOLS", centerX, 20, { align: "center" });

  doc.setFontSize(11);
  doc.setTextColor(100);
  doc.setFont("helvetica", "normal");
  doc.text("Soluciones Profesionales en Ferretería", centerX, 28, { align: "center" });
  doc.text("Juigalpa, Chontales | Nicaragua", centerX, 33, { align: "center" });

  doc.setDrawColor(...ESMERALDA);
  doc.setLineWidth(0.8);
  doc.line(startX, 40, marginX, 40);

  // --- INFO CLIENTE ---
  doc.setTextColor(0);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("FACTURAR A:", startX, 52);
  
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text(`Cliente: ${cliente?.nombre?.toUpperCase() || "CONSUMIDOR FINAL"}`, startX, 60);
  
  const dir = cliente?.direccion || "Dirección no especificada";
  const splitDir = doc.splitTextToSize(`Dirección: ${dir}`, 85);
  doc.text(splitDir, startX, 67);

  // --- FECHA, HORA Y TIPO DE PAGO (DERECHA) ---
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(TEXTO_GRIS);
  doc.text(`FECHA: ${fechaNica}`, 140, 52);
  doc.text(`HORA: ${horaNica}`, 140, 59);
  
  // NUEVO: Tipo de Pago
  const metodoPago = pagoInfo?.metodo?.toUpperCase() || "EFECTIVO";
  doc.text(`PAGO: ${metodoPago}`, 140, 66);
  
  const numFormateado = String(numeroFactura || 0).padStart(5, '0');
  doc.setFontSize(16); 
  doc.setTextColor(...ESMERALDA);
  doc.text(`FAC-${numFormateado}`, 140, 75);

  // --- TABLA DE PRODUCTOS (FUENTE 10px + CENTRADO) ---
  autoTable(doc, {
    startY: 85,
    head: [["DESCRIPCIÓN", "CANT.", "PRECIO UNIT.", "SUBTOTAL"]],
    body: items.map(item => [
      item.nombre.toUpperCase(),
      item.cantidad,
      `C$ ${item.precio.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      `C$ ${(item.precio * item.cantidad).toLocaleString('en-US', { minimumFractionDigits: 2 })}`
    ]),
    theme: "striped",
    headStyles: { 
        fillColor: ESMERALDA, 
        halign: 'center', 
        fontSize: 10, 
        fontStyle: 'bold' 
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 80 }, 
      1: { halign: 'center', cellWidth: 20 },
      2: { halign: 'right', cellWidth: 40 },
      3: { halign: 'right', cellWidth: 40 }
    },
    styles: { 
        fontSize: 10, 
        cellPadding: 4,
        textColor: TEXTO_GRIS 
    }
  });

  // --- SECCIÓN DE TOTALES ---
  const labelX = 130;
  let currentY = doc.lastAutoTable.finalY + 12;
  
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(80);

  doc.text("Subtotal:", labelX, currentY);
  doc.text(`C$ ${totales.subtotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, marginX, currentY, { align: "right" });

  currentY += 9;
  const etiquetaIVA = cliente?.exonerado ? "IVA (Exento):" : "IVA (15%):";
  doc.text(etiquetaIVA, labelX, currentY);
  doc.text(`C$ ${totales.iva.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, marginX, currentY, { align: "right" });

  currentY += 6;
  doc.setDrawColor(...ESMERALDA);
  doc.setLineWidth(0.5);
  doc.line(labelX, currentY, marginX, currentY);

  currentY += 15; 
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...ESMERALDA);
  doc.text("TOTAL A PAGAR", labelX, currentY);

  currentY += 12; 
  doc.setFontSize(28); 
  doc.text(`C$ ${totales.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, marginX, currentY, { align: "right" });

  // --- PIE DE PÁGINA ---
  doc.setFontSize(10);
  doc.setTextColor(150);
  doc.setFont("helvetica", "italic");
  doc.text("Gracias por su preferencia en Martita Tools.", centerX, 285, { align: "center" });

  doc.save(`Factura_FAC-${numFormateado}_${cliente?.nombre || 'Venta'}.pdf`);
};