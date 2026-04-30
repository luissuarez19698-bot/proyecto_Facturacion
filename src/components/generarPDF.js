import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export const generarPDF = (cliente, items, totales) => {
  const doc = new jsPDF();

  // --- CONFIGURACIÓN ---
  const marginX = 190; // Punto final a la derecha
  const labelX = 135;  // Punto donde empiezan las letras "Total a pagar"
  const startX = 15;

  // --- ENCABEZADO ---
  doc.setFontSize(22);
  doc.setTextColor(5, 150, 105); 
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

  // --- INFO CLIENTE ---
  doc.setTextColor(0);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("FACTURAR A:", startX, 48);
  
  doc.setFont("helvetica", "normal");
  doc.text(`Cliente: ${cliente?.nombre || "Consumidor Final"}`, startX, 55);
  doc.text(`Exonerado: ${cliente?.exonerado ? "SÍ" : "NO"}`, startX, 60);

  doc.setFont("helvetica", "bold");
  doc.text(`FECHA: ${new Date().toLocaleDateString()}`, 145, 55);
  doc.text(`N° FACTURA: FAC-2026-0001`, 145, 60);

  // --- TABLA DE PRODUCTOS (CENTRADOS) ---
  autoTable(doc, {
    startY: 70,
    head: [["Descripción", "Precio Unit.", "Cant.", "Subtotal"]],
    body: items.map(item => [
      item.nombre,
      `C$ ${item.precio.toFixed(2)}`,
      item.cantidad,
      `C$ ${(item.precio * item.cantidad).toFixed(2)}`
    ]),
    theme: "striped",
    headStyles: {
      fillColor: [5, 150, 105],
      fontSize: 10,
      halign: 'center' // Encabezados centrados
    },
    columnStyles: {
      0: { halign: 'center' }, // Descripción centrada
      1: { halign: 'center' }, // Precio centrado
      2: { halign: 'center' }, // Cantidad centrada
      3: { halign: 'center' }  // Subtotal centrado
    },
    styles: { fontSize: 9, cellPadding: 4 }
  });

  // --- SECCIÓN DE TOTALES (LIMPIA Y ABAJO) ---
  let currentY = doc.lastAutoTable.finalY + 15;
  
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(80);

  // Subtotal
  doc.text("Subtotal:", labelX, currentY);
  doc.text(`C$ ${totales.subtotal.toFixed(2)}`, marginX, currentY, { align: "right" });

  // IVA
  currentY += 8;
  doc.text("IVA (15%):", labelX, currentY);
  doc.text(`C$ ${totales.iva.toFixed(2)}`, marginX, currentY, { align: "right" });

  // Línea gruesa para separar el Total
  currentY += 5;
  doc.setDrawColor(5, 150, 105);
  doc.setLineWidth(1);
  doc.line(labelX, currentY, marginX, currentY);

  // TOTAL A PAGAR (Más abajo para evitar encaramado)
  currentY += 12; // Mucho más espacio aquí
  doc.setFontSize(16); // Un poco más grande para que destaque
  doc.setFont("helvetica", "bold");
  doc.setTextColor(5, 150, 105);
  
  doc.text("TOTAL A PAGAR:", labelX, currentY);
  
  // Ponemos el número un poco más abajo si el texto es muy largo
  currentY += 10; 
  doc.setFontSize(18); // El número más grande aún
  doc.text(`C$ ${totales.total.toFixed(2)}`, marginX, currentY, { align: "right" });

  // --- PIE DE PÁGINA ---
  doc.setFontSize(8);
  doc.setTextColor(150);
  doc.setFont("helvetica", "italic");
  doc.text("Gracias por su compra en Martita Tools.", 105, 285, { align: "center" });

  doc.save(`Factura_${cliente?.nombre || "Venta"}.pdf`);
};