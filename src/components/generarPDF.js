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

  // --- ENCABEZADO ---
  doc.setFontSize(26);
  doc.setTextColor(ESMERALDA[0], ESMERALDA[1], ESMERALDA[2]); 
  doc.setFont("helvetica", "bold");
  doc.text("MARTITA TOOLS", centerX, 20, { align: "center" });

  doc.setFontSize(11);
  doc.setTextColor(100, 100, 100);
  doc.setFont("helvetica", "normal");
  doc.text("Soluciones Profesionales en Ferretería", centerX, 28, { align: "center" });
  doc.text("Juigalpa, Chontales | Nicaragua", centerX, 33, { align: "center" });

  doc.setDrawColor(ESMERALDA[0], ESMERALDA[1], ESMERALDA[2]);
  doc.setLineWidth(0.8);
  doc.line(startX, 40, marginX, 40);

  // --- INFO CLIENTE ---
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("FACTURAR A:", startX, 52);
  
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text(`Cliente: ${cliente?.nombre?.toUpperCase() || "CONSUMIDOR FINAL"}`, startX, 60);
  
  const dir = cliente?.direccion || "Dirección no especificada";
  const splitDir = doc.splitTextToSize(`Dirección: ${dir}`, 85);
  doc.text(splitDir, startX, 67);

  // --- INFO FACTURA (DERECHA) ---
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(TEXTO_GRIS[0], TEXTO_GRIS[1], TEXTO_GRIS[2]);
  doc.text(`FECHA: ${fechaNica}`, 140, 52);
  doc.text(`HORA: ${horaNica}`, 140, 59);
  
  const metodoPago = String(pagoInfo?.metodo || "EFECTIVO").toUpperCase();
  doc.text(`PAGO: ${metodoPago}`, 140, 66);
  
  const numFormateado = String(numeroFactura || 0).padStart(5, '0');
  doc.setFontSize(16); 
  doc.setTextColor(ESMERALDA[0], ESMERALDA[1], ESMERALDA[2]);
  doc.text(`FAC-${numFormateado}`, 140, 75);

  // --- TABLA DE PRODUCTOS ---
  autoTable(doc, {
    startY: 85,
    head: [["DESCRIPCIÓN", "CANT.", "PRECIO UNIT.", "SUBTOTAL"]],
    body: items.map(item => [
      String(item.nombre || "SIN NOMBRE").toUpperCase(),
      item.cantidad || 0,
      `C$ ${(item.precio || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      `C$ ${((item.precio || 0) * (item.cantidad || 0)).toLocaleString('en-US', { minimumFractionDigits: 2 })}`
    ]),
    theme: "striped",
    headStyles: { fillColor: ESMERALDA, halign: 'center', fontSize: 10 },
    columnStyles: { 0: { halign: 'center', cellWidth: 80 }, 1: { halign: 'center' }, 2: { halign: 'right' }, 3: { halign: 'right' } },
    styles: { fontSize: 10, cellPadding: 4, textColor: TEXTO_GRIS }
  });

  // --- SECCIÓN DE TOTALES ---
  const labelX = 130;
  let currentY = doc.lastAutoTable.finalY + 12;
  
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(80, 80, 80);

  // Subtotal
  doc.text("Subtotal:", labelX, currentY);
  doc.text(`C$ ${(totales?.subtotal || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`, marginX, currentY, { align: "right" });

  // IVA
  currentY += 8;
  const etiquetaIVA = cliente?.exonerado ? "IVA (Exento):" : "IVA (15%):";
  doc.text(etiquetaIVA, labelX, currentY);
  doc.text(`C$ ${(totales?.iva || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`, marginX, currentY, { align: "right" });

  // Línea divisoria
  currentY += 5;
  doc.setDrawColor(ESMERALDA[0], ESMERALDA[1], ESMERALDA[2]);
  doc.line(labelX, currentY, marginX, currentY);

  // TOTAL NETO
  currentY += 10; 
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(ESMERALDA[0], ESMERALDA[1], ESMERALDA[2]);
  doc.text("TOTAL NETO:", labelX, currentY);
  doc.text(`C$ ${(totales?.total || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`, marginX, currentY, { align: "right" });

  // --- PAGO Y VUELTO (CORRECCIÓN DE ALINEACIÓN) ---
  currentY += 12;
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(TEXTO_GRIS[0], TEXTO_GRIS[1], TEXTO_GRIS[2]);
  
  // Aseguramos que los valores sean números reales
  const recibidoVal = parseFloat(pagoInfo?.recibido) || 0;
  const vueltoVal = parseFloat(pagoInfo?.vuelto) || 0;

  // Monto Recibido
  doc.text("Monto Recibido:", labelX, currentY);
  doc.text(`C$ ${recibidoVal.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, marginX, currentY, { align: "right" });

  // Cambio / Vuelto
  currentY += 8;
  doc.setFont("helvetica", "bold");
  doc.text("Cambio / Vuelto:", labelX, currentY);
  
  // Color del vuelto: Rojo si es insuficiente, Esmeralda si es correcto
  if (recibidoVal < (totales?.total || 0) && recibidoVal > 0) {
    doc.setTextColor(200, 0, 0); 
  } else {
    doc.setTextColor(ESMERALDA[0], ESMERALDA[1], ESMERALDA[2]);
  }
  
  doc.text(`C$ ${vueltoVal.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, marginX, currentY, { align: "right" });

  // --- PIE DE PÁGINA ---
  doc.setFontSize(10);
  doc.setTextColor(150, 150, 150);
  doc.setFont("helvetica", "italic");
  doc.text("Gracias por su preferencia en Martita Tools.", centerX, 285, { align: "center" });

  doc.save(`Factura_FAC-${numFormateado}_${cliente?.nombre || 'Venta'}.pdf`);
};