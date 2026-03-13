import { RecetaItem } from "./recetaitem";

export interface Platillo {
  id: number;
  nombre: string;
  descripcion: string;
  precioVenta: number;
  categoriaNombre: string;
  tiempoMin: number;
  imagen?: string;
  activo: boolean;

  alergenos: string[]; 
  ingredientes: RecetaItem[];
  numIngredientes: number;
  unidad:string;
}