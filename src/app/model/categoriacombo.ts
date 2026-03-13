export interface CategoriaCombo {
  idCategoria: number;
  nombre: string;
  descripcion?: string | null;
  activo: boolean;
  totalProductos?: number;
}
