import { Layout } from '../../shared/layout/layout';
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { MatIconModule } from '@angular/material/icon';
import {
  faTriangleExclamation,
  faCalendarDays,
  faChartLine,
  faPenToSquare,
  faCubes,
  faFileExport,
  faClock,
  faBoxOpen,
} from '@fortawesome/free-solid-svg-icons';
import { Producto } from '../../model/producto';
import { InventoryService } from '../../services/inventory';
import { HttpClient } from '@angular/common/http';
import { AddKardexRecord } from '../../dialogs/add-kardex-record/add-kardex-record';
import { MatDialog } from '@angular/material/dialog';
import { MessageService } from '../../services/message';
import { CategoriaCombo } from '../../model/categoriacombo';
import { MatSlideToggleModule, MatSlideToggleChange } from '@angular/material/slide-toggle';
import { CategoriaComboService } from '../../services/categoriacombo';
import { EditCategoriaCombo } from '../../dialogs/edit-categoria-combo/edit-categoria-combo';
import { Platillo } from '../../model/platillo';
import { PlatillosService } from '../../services/platillos';
import { CrearCategoriaCombo } from '../../dialogs/crear-categoria-combo/crear-categoria-combo';
import { CrearPlatillo } from '../../dialogs/crear-platillo/crear-platillo';
import { AlergenosService } from '../../services/alergenos';
import { AlergenosPlatillo } from '../../services/alergenos-platillo';
import { RecetaService } from '../../services/receta';
import { EditarPlatillo } from '../../dialogs/editar-platillo/editar-platillo';

const round6 = (v: any) =>
  Number((v ?? 0).toString().trim() === '' ? 0 : Number(v)).toFixed
    ? Number(Number(v).toFixed(6))
    : Number(v);

type RecetaItemBody = {
  idProducto: number;
  cantidadMostrada: number;
  unidadMostrada: string;
  cantidadDescuento?: number | null;
  unidadDescuento?: string | null;
};

type SetRecetaRequest = {
  idPlatillo: number;
  items: RecetaItemBody[];
};

@Component({
  selector: 'app-menu',
  imports: [Layout, CommonModule, FontAwesomeModule, MatIconModule, MatSlideToggleModule],
  templateUrl: './menu.html',
  styleUrl: './menu.scss',
})
export class Menu implements OnInit {
  // Iconos
  faWarning = faTriangleExclamation;
  faCalendar = faCalendarDays;
  faChart = faChartLine;
  faPenToSquare = faPenToSquare;
  faCubes = faCubes;
  faExport = faFileExport;
  faClock = faClock;
  faBoxOpen = faBoxOpen;

  // Pestañas
  vistaActiva: 'producto' | 'categoriacombo' = 'categoriacombo';
  categoriaActiva: number = 1;

  // Categorías
  categorias: any[] = [];

  // Proveedores
  proveedores: any[] = [];

  alergenos: any[] = [];

  // Datos de resumen
  stockCritico = 0;
  reposicionesRecientes = 0;
  valorTotal = 0;

  // Productos
  productos: Producto[] = [];

  // categoriacombo
  categoriacombo: CategoriaCombo[] = [];

  platillos: Platillo[] = [];

  private readonly tz = 'America/Guatemala';

  constructor(
    readonly inventoryService: InventoryService,
    readonly http: HttpClient,
    readonly dialog: MatDialog,
    readonly msg: MessageService,
    readonly categoriaComboService: CategoriaComboService,
    readonly platilloService: PlatillosService,
    readonly alergenosService: AlergenosService,
    readonly alergenosPlatillosService: AlergenosPlatillo,
    readonly recetaService: RecetaService
  ) {}

  ngOnInit(): void {
    this.initCategorias();
    this.initProductos();
    this.initCategoriasCombo();
    this.initAlergenos();
  }

  /**
   * Cambia la vista activa entre inventario y categoriacombo
   */
  cambiarVista(vista: 'producto' | 'categoriacombo'): void {
    if (vista == 'categoriacombo') {
      this.initCategoriasCombo();
    } else {
      this.initPlatillos();
    }
    this.vistaActiva = vista;
  }

  /**
   * Obtiene la clase CSS según el estado del stock
   */
  getEstadoClass(estado: string): string {
    const clases: any = {
      critico: 'critico',
      bajo: 'critico',
      medio: 'medio',
      optimo: 'optimo',
    };
    return clases[estado] || '';
  }

  /**
   * Abre el diálogo para registrar un nuevo movimiento
   */
  registrarCategoria(): void {
    const dialogRef = this.dialog.open(CrearCategoriaCombo, {
      width: '500px',
      disableClose: true,
    });

    dialogRef.afterClosed().subscribe((categoria) => {
      if (categoria) {
        this.categoriaComboService.crearCategoria(categoria).subscribe({
          next: (res: any) => {
            this.msg.success('Categoría creada correctamente.');
            this.initCategoriasCombo();
          },
          error: (err: any) => this.msg.error('Error al crear la categoría.'),
        });
      }
    });
  }

  registrarProducto(): void {
    const dialogRef = this.dialog.open(CrearPlatillo, {
      width: '640px',
      disableClose: true,
      data: {
        categorias: this.categoriacombo,
        productos: this.productos,
        alergenos: this.alergenos,
      },
    });

    dialogRef.afterClosed().subscribe((platillo) => {

      if (!platillo) {
        this.msg.info('Registro cancelado.');
        return;
      }

      this.msg.info('Inicia proceso de guardado');

      const platilloBody = {
        nombre: platillo.nombre,
        descripcion: platillo.descripcion ?? '',
        precioVenta: Number(platillo.precioVenta),
        tiempoMin: Number(platillo.tiempoMin),
        categoria: { idCategoria: platillo.idCategoria },
        imagen: platillo.imagen ?? '',
        activo: true,
      };
      const alergenoIds: number[] = Array.isArray(platillo.alergenosIds)
        ? platillo.alergenosIds.map((n: any) => Number(n)).filter((n: any) => Number.isFinite(n))
        : [];

      this.platilloService.crearPlatillo(platilloBody).subscribe({
        next: (res) => {
          const idPlatillo = res?.idPlatillo ?? res?.id ?? res?.data?.idPlatillo;
          const recetaPayload = buildRecetaPayload(idPlatillo, platillo);
          if (!idPlatillo) {
            console.warn('No se recibió idPlatillo en la respuesta:', res);
            this.msg.warn('Platillo creado pero no se pudo asociar alérgenos (sin idPlatillo).');
            return;
          }

          const ids = alergenoIds ?? [];
          const bodyGuardar = {
            idPlatillo,
            alergenosIds: ids,
          };

          this.alergenosPlatillosService.crearPlatillo(bodyGuardar).subscribe({
            next: () => this.msg.success('Alérgenos asociados al platillo.'),
            error: () => this.msg.error('No se pudo asociar alérgenos.'),
          });

          this.recetaService.crearPlatillo(recetaPayload).subscribe({
            next: () => this.msg.success('Ingredientes Agregados al platillo'),
            error: () => this.msg.error('No se pudo asociar ingredientes'),
          });

          this.msg.success('Platillo registrado correctamente.');

          setTimeout(() => {
            this.initPlatillos();
          }, 5000);
        },
        error: () => this.msg.error('Error al reegistrar plaillo'),
      });
    });
  }

  /**
   * Edita un producto del inventario
   */
  editarProducto(platillo: Platillo): void {
    
    const dialogRef = this.dialog.open(EditarPlatillo, {
      width: '500px',
      disableClose: true,
      data: {
        platillo,
        categorias: this.categorias,
      },
    });

    dialogRef.afterClosed().subscribe((payload) => {
      if (!payload) {
        this.msg.info('Edición cancelada.');
        return;
      }

      this.platilloService.actualizarPlatillo(platillo.id, payload).subscribe({
        next: () => {
          this.msg.success('Producto actualizado correctamente.');
          this.initPlatillos();
        },
        error: (err: any) => {
          this.msg.error('Error al actualizar el producto.');
        },
      });
    });
  }

  /**
   * Registra movimiento de stock para un producto
   */
  registrarMovimientoProducto(producto: Platillo): void {
    const dialogRef = this.dialog.open(AddKardexRecord, {
      width: '500px',
      disableClose: true,
      data: { idProducto: producto.id, precioCompra: producto.nombre },
    });

    dialogRef.afterClosed().subscribe((movimiento) => {
      if (movimiento) {
        this.inventoryService.registrarMovimiento(movimiento).subscribe({
          next: (res: any) => {
            this.msg.success('Movimiento registrado:');
            this.vistaActiva = 'categoriacombo';
          },
          error: (err: any) => this.msg.error('Error al registrar movimiento.'),
        });
      }
    });
  }

  initCategorias() {
    this.categoriaComboService.obtenerCategoriasActivas().subscribe((response: any) => {
      this.categorias = response.map((cat: any) => ({
        idCategoria: cat.idCategoria,
        nombre: cat.nombre,
        descripcion: cat.descripcion ?? '',
        activo: cat.activo,
      }));
    });
  }

  getEstadoStock(nivelStock: number): string {
    if (nivelStock < 50) {
      return 'critico';
    } else if (nivelStock >= 50 && nivelStock < 100) {
      return 'medio';
    } else {
      return 'optimo';
    }
  }

  /**
   * Calcula los días transcurridos desde la última reposición hasta hoy
   */
  getDiasHastaVencimiento(fechaVencimiento: string | Date | null): number | null {
    if (!fechaVencimiento) return null;

    const fv = new Date(fechaVencimiento);
    const hoy = new Date();

    fv.setHours(0, 0, 0, 0);
    hoy.setHours(0, 0, 0, 0);

    return Math.ceil((fv.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
  }

  getClaseVencimiento(dias: number | null): string {
    if (dias === null) return '';
    if (dias < 0) return 'vencido'; // ya venció
    if (dias <= 3) return 'critico'; // muy cerca
    if (dias <= 7) return 'vencimiento'; // pronto
    return 'optimo';
  }

  getEtiquetaVencimiento(dias: number | null): string {
    if (dias === null) return 'Sin registro';
    if (dias < 0) return `Vencido hace ${Math.abs(dias)} día${Math.abs(dias) === 1 ? '' : 's'}`;
    if (dias === 0) return 'Vence hoy';
    if (dias === 1) return '1 día restante';
    return `Faltan ${dias} días`;
  }

  /**
   * Calcula el valor total del inventario sumando precioVenta * stockActual de cada producto
   */
  calcularValorTotal(): number {
    if (!this.productos || this.productos.length === 0) {
      return 0;
    }

    const total = this.productos.reduce((acumulado, producto) => {
      const subtotal = (producto.precioVenta || 0) * (producto.stockActual || 0);
      return acumulado + subtotal;
    }, 0);
    this.valorTotal = total;
    return total;
  }

  // Dentro de tu componente
  verProductos(cat: any) {
    // navega o filtra a los productos de la categoría
    // this.router.navigate(['/productos'], { queryParams: { categoria: cat.idCategoria } });
  }

  toggleActivo(cat: CategoriaCombo, ev: MatSlideToggleChange) {
    const checked = ev.checked;
    if (cat.activo === checked) return;
    const previo = cat.activo;
    cat.activo = checked;

    this.categoriaComboService.cambiarEstadoCategoria(cat.idCategoria, checked).subscribe({
      next: () => this.msg.success('Estado actualizado.'),
      error: () => {
        cat.activo = previo;
        this.msg.error('No se pudo actualizar.');
      },
    });
  }

  toggleActivoPlatillo(platillo: Platillo, ev: MatSlideToggleChange) {
    const checked = ev.checked;
    if (platillo.activo === checked) return;
    const previo = platillo.activo;
    platillo.activo = checked;

    this.platilloService.cambiarEstadoPlatillo(platillo.id, checked).subscribe({
      next: () => this.msg.success('Estado actualizado.'),
      error: () => {
        platillo.activo = previo;
        this.msg.error('No se pudo actualizar.');
      },
    });
  }

  editarCategoria(cat: any) {
    this.dialog
      .open(EditCategoriaCombo, {
        width: '500px',
        disableClose: true,
        data: { categoria: cat },
      })
      .afterClosed()
      .subscribe((payload) => {
        if (!payload) {
          this.msg.info('Edición cancelada.');
          return;
        }
        const { nombre, descripcion } = payload;
        this.categoriaComboService
          .editarCategoria(cat.idCategoria, { nombre, descripcion })
          .subscribe({
            next: () => {
              this.msg.success('Categoría actualizada.');
              this.initCategoriasCombo();
            },
            error: () => this.msg.error('Error al actualizar categoría.'),
          });
      });
  }

  initCategoriasCombo() {
    this.categoriaComboService.obtenerCategorias().subscribe({
      next: (response: any) => {
        let list: any[];
        if (Array.isArray(response)) {
          list = response;
        } else if (Array.isArray(response?.data)) {
          list = response.data;
        } else {
          list = [];
        }
        this.categoriacombo = list
          .filter((cat: any) => (cat.idCategoria ?? cat.id) !== 1)
          .map((cat: any) => ({
            idCategoria: cat.idCategoria ?? cat.id,
            nombre: cat.nombre,
            descripcion: cat.descripcion ?? '',
            activo: !!cat.activo,
            totalProductos: Number(cat.totalProductos ?? 0),
          }));
      },
      error: (err) => {
        this.msg.error('Error al cargar categorías.');
        this.categoriacombo = [];
      },
    });
  }

  nuevaCategoria(): void {
    console.log('Crear nueva categoría');
  }

  initPlatillos() {
    this.platilloService.getPlatillosActivos().subscribe((response: any[]) => {
      this.platillos = response.map((plat: any) => {
        const ingredientes = (plat.ingredientes ?? []).map((r: any) => ({
          idProducto: r.idProducto,
          nombreProducto: r.nombreProducto ?? '',
          cantidadMostrada: Number(r.cantidadMostrada ?? 0),
          unidadMostrada: r.unidadMostrada ?? '',
          cantidadDescuento: r.cantidadDescuento ?? null,
          unidadDescuento: r.unidadDescuento ?? null,
        }));

        const alergenos: string[] = Array.isArray(plat.alergenos) ? plat.alergenos : [];

        return {
          id: plat.id ?? plat.idPlatillo,
          nombre: plat.nombre ?? '',
          descripcion: plat.descripcion ?? '',
          precioVenta: Number(plat.precioVenta ?? 0),
          categoriaNombre: plat.categoriaNombre ?? '',
          idCategoria: plat.idCategoria ?? 2,
          imagen: plat.imagen ?? '',
          activo: Boolean(plat.activo),
          tiempoMin: Number(plat.tiempoMin ?? 0),

          ingredientes,
          alergenos,
          numIngredientes: ingredientes.length,
          unidad:plat.unidad
        } as Platillo;
      });
    });
  }

  // Cuenta ingredientes desde recetaItems o ingredientes, con fallback a 0
  getIngredientesCount(p: any): number {
    if (Array.isArray(p.recetaItems)) return p.recetaItems.length;
    if (Array.isArray(p.ingredientes)) return p.ingredientes.length;
    return 0;
  }

  eliminarPlatillo(p: any) {
    // this.platilloService.eliminar(p.idPlatillo).subscribe(() => this.initPlatillos())
  }

  formatUnidad(unidad: string | null | undefined, cantidad: number | null | undefined): string {
    const u = (unidad ?? '').toLowerCase().trim();
    const n = Number(cantidad ?? 0);
    if (!u) return '';
    if (n === 1) return u;
    return u.endsWith('s') ? u : `${u}s`;
  }

  initProductos() {
    return this.inventoryService.productos().subscribe((response: any) => {
      if (response.data && Array.isArray(response.data)) {
        this.productos = response.data.map((prod: any) => {
          const nivelStock =
            prod.stockMinimo > 0 ? Math.round((prod.stockActual / prod.stockMinimo) * 100) : 0;
          const estadoStock = this.getEstadoStock(nivelStock);
          return {
            id: prod.idProducto,
            nombre: prod.nombre,
            descripcion: prod.descripcion ?? '',
            idCategoria: prod.categoria?.idCategoria ?? prod.idCategoria,
            precioVenta: prod.precioVenta,
            precioCompra: prod.precioCompra,
            tipo: prod.tipo,
            stockActual: prod.stockActual,
            stockMinimo: prod.stockMinimo,
            estadoStock,
            unidad: prod.unidad,
            valorTotal: Number(prod.precioVenta) * Number(prod.stockActual),
            nivelStock,
            idProveedor: prod.proveedor?.idProveedor ?? prod.idProveedor,
            ubicacion: prod.ubicacion,
            ultimaReposicion: prod.ultimaReposicion,
            fechavencimiento: prod.fechavencimiento,
            activo: prod.activo,
          };
        });

        this.stockCritico = this.productos.filter(
          (p) =>
            p.estadoStock?.toLowerCase() === 'critico' || p.estadoStock?.toLowerCase() === 'bajo'
        ).length;

        this.reposicionesRecientes = this.productos.filter((p) => {
          const dias = this.getDiasHastaVencimiento(p.fechavencimiento);
          return dias !== null && dias <= 3;
        }).length;

        this.calcularValorTotal();
      }
    });
  }

  initAlergenos() {
    this.alergenosService.obtenerAlergenos().subscribe({
      next: (response: any) => {
        const list = Array.isArray(response)
          ? response
          : Array.isArray(response?.data)
          ? response.data
          : [];

        this.alergenos = list.map((a: any) => ({
          id: a.idAlergeno ?? a.id ?? null,
          nombre: a.nombre ?? a.nombreAlergeno ?? '',
          descripcion: a.descripcion ?? '',
          activo: Boolean(a.activo ?? true),
          codigo: a.codigo ?? a.slug ?? '',
          icono: a.icono ?? a.emoji ?? '',
        }));
      },
      error: (err: any) => {
        this.alergenos = [];
        this.msg.error('Error al cargar alérgenos.');
      },
    });
  }
}
function buildRecetaPayload(idPlatillo: number, platillo: any): SetRecetaRequest {
  const items: RecetaItemBody[] = (platillo?.ingredientes ?? [])
    .filter((i: any) => i && i.idProducto != null)
    .map((i: any) => {
      const base: RecetaItemBody = {
        idProducto: Number(i.idProducto),
        cantidadMostrada: round6(i.cantidadMostrada),
        unidadMostrada: (i.unidadMostrada ?? '').toString().trim(),
        cantidadDescuento: round6(i.cantidadMostrada),
        unidadDescuento: (i.unidadBase ?? '').toString().trim(),
      };

      // Solo agrega los campos de descuento si existen en el objeto original.
      if (Object.prototype.hasOwnProperty.call(i, 'cantidadDescuento')) {
        base.cantidadDescuento = i.cantidadDescuento != null ? round6(i.cantidadDescuento) : null;
      }
      if (Object.prototype.hasOwnProperty.call(i, 'unidadDescuento')) {
        const ud = (i.unidadDescuento ?? '').toString().trim();
        base.unidadDescuento = ud.length ? ud : null;
      }
      return base;
    });

  return { idPlatillo: Number(idPlatillo), items };
}
