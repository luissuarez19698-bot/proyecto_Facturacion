import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export const generarPDF = (cliente, items, totales, numeroFactura) => {
  const doc = new jsPDF();

  // --- CONFIGURACIÓN DE MÁRGENES ---
  const marginX = 190; 
  const labelX = 130;  
  const startX = 15;

  // --- ENCABEZADO PROFESIONAL ---
  doc.setFontSize(22);
  doc.setTextColor(5, 150, 105); // Verde Esmeralda de Martita Tools
  doc.setFont("helvetica", "bold");
  doc.text("MARTITA TOOLS", 105, 20, { align: "center" });

  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.setFont("helvetica", "normal");
  doc.text("Tu Empresa S.A. | RUC: 001-123456-0001X", 105, 27, { align: "center" });
  doc.text("Managua, Nicaragua | Tel: +505 8888-8888", 105, 32, { align: "center" });

  doc.setDrawColor(5, 150, 105);
  doc.setLineWidth(0.5);
  doc.line(startX, 38, marginX, 38);

  // --- INFO CLIENTE Y FACTURA ---
  doc.setTextColor(0);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("FACTURAR A:", startX, 48);
  
  doc.setFont("helvetica", "normal");
  doc.text(`Cliente: ${cliente?.nombre || "Consumidor Final"}`, startX, 55);
  
  const dir = cliente?.direccion || "Dirección no especificada";
  const splitDir = doc.splitTextToSize(`Dirección: ${dir}`, 90);
  doc.text(splitDir, startX, 61);

  // Fecha y Número de Factura (FAC-00001)
  doc.setFont("helvetica", "bold");
  const numFormateado = String(numeroFactura || 0).padStart(5, '0');
  doc.text(`FECHA: ${new Date().toLocaleDateString()}`, 145, 55);
  doc.text(`N° FACTURA: FAC-${numFormateado}`, 145, 61);

  // --- TABLA DE PRODUCTOS ---
  autoTable(doc, {
    startY: 75,
    head: [["Descripción", "Precio Unit.", "Cant.", "Subtotal"]],
    body: items.map(item => [
      item.nombre,
      `C$ ${item.precio.toFixed(2)}`,
      item.cantidad,
      `C$ ${(item.precio * item.cantidad).toFixed(2)}`
    ]),
    theme: "striped",
    headStyles: { fillColor: [5, 150, 105], halign: 'center' },
    columnStyles: {
      0: { halign: 'left' },
      1: { halign: 'center' },
      2: { halign: 'center' },
      3: { halign: 'right' }
    },
    styles: { fontSize: 9, cellPadding: 4 }
  });

  // --- SECCIÓN DE TOTALES ---
  let currentY = doc.lastAutoTable.finalY + 15;
  
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(80);

  // Subtotal e IVA
  doc.text("Subtotal:", labelX, currentY);
  doc.text(`C$ ${totales.subtotal.toFixed(2)}`, marginX, currentY, { align: "right" });

  currentY += 8;
  const etiquetaIVA = cliente?.exonerado ? "IVA (Exento):" : "IVA (15%):";
  doc.text(etiquetaIVA, labelX, currentY);
  doc.text(`C$ ${totales.iva.toFixed(2)}`, marginX, currentY, { align: "right" });

  // Línea decorativa
  currentY += 5;
  doc.setDrawColor(5, 150, 105);
  doc.setLineWidth(0.5);
  doc.line(labelX, currentY, marginX, currentY);

  // --- TOTAL A PAGAR (DEBAJO Y DESTACADO) ---
  currentY += 15; // Bajamos el cursor
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(5, 150, 105);
  doc.text("TOTAL A PAGAR", labelX, currentY);

  currentY += 12; // Ponemos el monto debajo del texto
  doc.setFontSize(26); // Tamaño grande para impacto
  doc.text(`C$ ${totales.total.toFixed(2)}`, marginX, currentY, { align: "right" });

  // --- PIE DE PÁGINA ---
  doc.setFontSize(8);
  doc.setTextColor(150);
  doc.setFont("helvetica", "italic");
  doc.text("Gracias por su preferencia en Martita Tools.", 105, 285, { align: "center" });

  doc.save(`Factura_FAC-${numFormateado}_${cliente?.nombre || 'Venta'}.pdf`);
};