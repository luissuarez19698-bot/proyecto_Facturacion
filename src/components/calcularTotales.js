export function calcularTotales(items, clienteExonerado) {
  let subtotal = 0;
  let iva = 0;

  items.forEach(item => {
    const subtotalLinea =
      item.precio * item.cantidad;

    subtotal += subtotalLinea;

    const exento =
      clienteExonerado || item.exonerado;

    if (!exento) {
      iva += subtotalLinea * 0.15;
    }
  });

  return {
    subtotal,
    iva,
    total: subtotal + iva
  };
}