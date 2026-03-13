export interface RecetaItem {
  idProducto: number;
  nombreProducto: string;
  cantidadMostrada: number;
  unidadMostrada: string;
  cantidadDescuento: number | null;
  unidadDescuento: string | null;
}