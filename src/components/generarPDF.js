import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export const generarPDF = (cliente, items, totales, numeroFactura) => {
  const doc = new jsPDF();

  // --- CONFIGURACIÓN DE MÁRGENES ---
  const marginX = 190; 
  const startX = 15;
  const centerX = 105;

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
  doc.setTextColor(5, 150, 105); 
  doc.setFont("helvetica", "bold");
  doc.text("MARTITA TOOLS", centerX, 20, { align: "center" });

  doc.setFontSize(11);
  doc.setTextColor(100);
  doc.setFont("helvetica", "normal");
  doc.text("Tu Empresa S.A. | RUC: 001-123456-0001X", centerX, 28, { align: "center" });
  doc.text("Managua, Nicaragua | Tel: +505 8888-8888", centerX, 33, { align: "center" });

  doc.setDrawColor(5, 150, 105);
  doc.setLineWidth(0.8);
  doc.line(startX, 40, marginX, 40);

  // --- INFO CLIENTE ---
  doc.setTextColor(0);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("FACTURAR A:", startX, 52);
  
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text(`Cliente: ${cliente?.nombre || "Consumidor Final"}`, startX, 60);
  
  const dir = cliente?.direccion || "Dirección no especificada";
  const splitDir = doc.splitTextToSize(`Dirección: ${dir}`, 85);
  doc.text(splitDir, startX, 67);

  // --- FECHA Y HORA (DERECHA) ---
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text(`FECHA: ${fechaNica}`, 140, 52);
  doc.text(`HORA: ${horaNica}`, 140, 59);
  
  const numFormateado = String(numeroFactura || 0).padStart(5, '0');
  doc.setFontSize(16); 
  doc.setTextColor(5, 150, 105);
  doc.text(`FAC-${numFormateado}`, 140, 70);

  // --- TABLA DE PRODUCTOS ---
  autoTable(doc, {
    startY: 85,
    head: [["Descripción", "Precio Unit.", "Cant.", "Subtotal"]],
    body: items.map(item => [
      item.nombre,
      `C$ ${item.precio.toFixed(2)}`,
      item.cantidad,
      `C$ ${(item.precio * item.cantidad).toFixed(2)}`
    ]),
    theme: "striped",
    headStyles: { fillColor: [5, 150, 105], halign: 'center', fontSize: 11 },
    columnStyles: {
      0: { halign: 'center', cellWidth: 80 }, // <--- AQUÍ: Ahora la descripción está centrada
      1: { halign: 'center' },
      2: { halign: 'center' },
      3: { halign: 'right' }
    },
    styles: { fontSize: 10, cellPadding: 5 }
  });

  // --- SECCIÓN DE TOTALES ---
  const labelX = 130;
  let currentY = doc.lastAutoTable.finalY + 15;
  
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(80);

  doc.text("Subtotal:", labelX, currentY);
  doc.text(`C$ ${totales.subtotal.toFixed(2)}`, marginX, currentY, { align: "right" });

  currentY += 10;
  const etiquetaIVA = cliente?.exonerado ? "IVA (Exento):" : "IVA (15%):";
  doc.text(etiquetaIVA, labelX, currentY);
  doc.text(`C$ ${totales.iva.toFixed(2)}`, marginX, currentY, { align: "right" });

  currentY += 6;
  doc.setDrawColor(5, 150, 105);
  doc.setLineWidth(0.5);
  doc.line(labelX, currentY, marginX, currentY);

  currentY += 15; 
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(5, 150, 105);
  doc.text("TOTAL A PAGAR", labelX, currentY);

  currentY += 14; 
  doc.setFontSize(32); 
  doc.text(`C$ ${totales.total.toFixed(2)}`, marginX, currentY, { align: "right" });

  // --- PIE DE PÁGINA ---
  doc.setFontSize(10);
  doc.setTextColor(150);
  doc.setFont("helvetica", "italic");
  doc.text("Gracias por su preferencia en Martita Tools.", centerX, 285, { align: "center" });

  doc.save(`Factura_FAC-${numFormateado}_${cliente?.nombre || 'Venta'}.pdf`);
};