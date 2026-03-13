    export interface Producto {
    id: number;
    nombre: string;
    descripcion?: string;
    idCategoria: number;
    tipo: 'PLATILLO' | 'BEBIDA' | 'COMBO' | 'INSUMO_VENDIBLE';
    idProveedor: number;
    precioCompra: number;
    categoria: string;
    stockActual: number;
    stockMinimo: number;
    unidad: string;
    precioVenta: number;
    valorTotal: number;
    nivelStock: number;
    estadoStock: 'critico' | 'bajo' | 'medio' | 'optimo';
    diasVencimiento?: number;
    nombreProveedor: string;
    ubicacion: string;
    ultimaReposicion: string;
    color: string;
    fechavencimiento: string;
    activo: boolean;
    }
