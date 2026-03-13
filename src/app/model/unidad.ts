// src/app/models/unidad.model.ts

export interface UnidadCategoria {
  id: 'genericas' | 'peso' | 'volumen' | 'cocina' | 'presentacion' | 'cortes' | 'vegetales';
  label: string;
  items: readonly string[];
}

export const UNIDAD_CATEGORIES: readonly UnidadCategoria[] = [
  {
    id: 'genericas',
    label: 'Unidades genéricas',
    items: ['unidad', 'pieza', 'porción'],
  },
  {
    id: 'peso',
    label: 'Peso (sólidos)',
    items: ['gramo', 'kilogramo', 'miligramo', 'onza', 'libra'],
  },
  {
    id: 'volumen',
    label: 'Volumen (líquidos)',
    items: [
      'mililitro',
      'centilitro',
      'litro',
      'cucharadita',
      'cucharada',
      'cucharón',
      'taza',
      'vaso',
      'copa',
      'gota',
      'chorrito',
    ],
  },
  {
    id: 'cocina',
    label: 'Medidas de cocina',
    items: ['pizca', 'pellizco'],
  },
  {
    id: 'presentacion',
    label: 'Presentación comercial',
    items: ['paquete', 'lata', 'frasco', 'botella', 'bolsa', 'tarro', 'sobre', 'bandeja'],
  },
  {
    id: 'cortes',
    label: 'Cortes / Formas',
    items: [
      'rodaja',
      'rebanada',
      'loncha',
      'trozo',
      'cubo',
      'gajo',
      'tira',
      'lámina',
      'filete',
      'medallón',
    ],
  },
  {
    id: 'vegetales',
    label: 'Vegetales / Hierbas',
    items: ['rama', 'ramita', 'manojo', 'ramillete', 'hoja', 'diente'],
  },
] as const;

/** Tipo literal de todas las unidades disponibles */
export type Unidad = (typeof UNIDAD_CATEGORIES)[number]['items'][number];

/** Unidad por defecto opcional */
export const DEFAULT_UNIDAD: Unidad = 'pieza';
