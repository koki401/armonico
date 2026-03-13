import { Layout } from '../../shared/layout/layout';
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faTriangleExclamation,
  faCalendarDays,
  faChartLine,
  faPenToSquare,
  faCubes,
  faFileExport,
  faGear,
  faBell,
  faLayerGroup,
  faBoxesPacking
} from '@fortawesome/free-solid-svg-icons';
import { Producto } from '../../model/producto';
import { Movimiento } from '../../model/movimiento';
import { InventoryService } from '../../services/inventory';
import { HttpClient } from '@angular/common/http';
import { AddKardexRecord } from '../../dialogs/add-kardex-record/add-kardex-record';
import { MatDialog } from '@angular/material/dialog';
import { AddProduct } from '../../dialogs/add-product/add-product';
import { Supplier } from '../../services/supplier';
import { EditProduct } from '../../dialogs/edit-product/edit-product';
import { MessageService } from '../../services/message';
import jsPDF from 'jspdf';
import autoTable, { RowInput } from 'jspdf-autotable';
import { ProveedoresCreate } from '../../dialogs/proveedores-create/proveedores-create';
import { CategoriasCreate } from '../../dialogs/categorias-create/categorias-create';
import { MatTooltipModule } from '@angular/material/tooltip';
@Component({
  selector: 'app-inventory',
  imports: [Layout, CommonModule, FontAwesomeModule, MatTooltipModule,],
  templateUrl: './inventory.html',
  styleUrl: './inventory.scss',
})
export class Inventory implements OnInit {
  // Iconos
  faWarning = faTriangleExclamation;
  faCalendar = faCalendarDays;
  faChart = faChartLine;
  faPenToSquare = faPenToSquare;
  faCubes = faCubes;
  faExport = faFileExport;
  faGear = faGear;
  faBell = faBell;
  faLayer = faLayerGroup;
  faBoxesPacking = faBoxesPacking

  // Pestañas
  vistaActiva: 'inventario' | 'movimientos' = 'movimientos';
  categoriaActiva: number = 1;

  // Categorías
  categorias: any[] = [];

  // Proveedores
  proveedores: any[] = [];

  // Datos de resumen
  stockCritico = 0;
  reposicionesRecientes = 0;
  valorTotal = 0;

  // Productos
  productos: Producto[] = [];

  // Movimientos
  movimientos: Movimiento[] = [];

  productosFiltrados: Producto[] = [];

  private readonly tz = 'America/Guatemala';

  constructor(
    readonly inventoryService: InventoryService,
    readonly http: HttpClient,
    readonly dialog: MatDialog,
    readonly proveedoresService: Supplier,
    readonly msg: MessageService
  ) {}

  ngOnInit(): void {
    this.initCategorias();
    this.filtrarProductos();
    this.cambiarCategoria(1);
    this.initKardex();
    this.initProveedores();
  }

  /**
   * Cambia la vista activa entre inventario y movimientos
   */
  cambiarVista(vista: 'inventario' | 'movimientos'): void {
    if (vista == 'movimientos') {
      this.initKardex();
    }else{
      this.initProductos();
    }
    this.vistaActiva = vista;
  }

  /**
   * Cambia la categoría activa y filtra productos
   */
  cambiarCategoria(idCategoria: number): void {
    this.categoriaActiva = idCategoria;
    if (idCategoria === 1) {
      this.initProductos();
    } else {
      this.filtrarProductos();
    }
  }

  /**
   * Filtra productos por categoría (usando idCategoria)
   */
  filtrarProductos(): void {
    if (this.categoriaActiva === 1) {
      this.productosFiltrados = this.productos;
    } else {
      this.productosFiltrados = this.productos.filter(
        (p: any) => p.categoria === this.categoriaActiva
      );
    }
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
  registrarMovimiento(): void {
    const dialogRef = this.dialog.open(AddKardexRecord, {
      width: '500px',
      disableClose: true,
    });

    dialogRef.afterClosed().subscribe((movimiento) => {
      if (movimiento) {
        this.inventoryService.registrarMovimiento(movimiento).subscribe({
          next: (res: any) => {
            this.msg.success('Movimiento registrado correctamente.');
            this.initKardex();
          },
          error: (err: any) => this.msg.error('Error al registrar movimiento.'),
        });
      }
    });
  }

  registrarProducto(): void {
    const dialogRef = this.dialog.open(AddProduct, {
      width: '640px',
      disableClose: true,
      data: {
        categorias: this.categorias,
        proveedores: this.proveedores,
      },
    });

    dialogRef.afterClosed().subscribe((producto) => {
      if (!producto) {
        this.msg.info('Registro cancelado.');
        return;
      }

      this.inventoryService.registrarProducto(producto).subscribe({
        next: () => {
          this.msg.success('Producto registrado correctamente.');
          this.initProductos();
        },
        error: () => this.msg.error('Error al registrar el producto.'),
      });
    });
  }

  private fmtDate(dt: any): string {
    const d = new Date(dt);
    return new Intl.DateTimeFormat('es-GT', {
      timeZone: this.tz,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(d);
  }

  private tsFilename(d: Date): string {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: this.tz,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).formatToParts(d);
    const get = (t: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === t)?.value ?? '00';
    return `${get('year')}${get('month')}${get('day')}_${get('hour')}${get('minute')}`;
  }

  /**
   * Exporta el reporte de movimientos
   */
  exportarReporte(): void {
    if (!this.movimientos || this.movimientos.length === 0) {
      this.msg.info('No hay movimientos para exportar.');
      return;
    }

    const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });

    const titulo = 'Historial de Movimientos';
    const generado = this.fmtDate(new Date());
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text(titulo, 40, 40);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Generado: ${generado}`, 40, 58);

    const body: RowInput[] = this.movimientos.map((m: any, i: number) => [
      i + 1,
      this.fmtDate(m.fecha),
      m.productoNombre ?? '',
      (m.tipo ?? '').toString().toUpperCase(),
      Number(m.cantidad ?? 0).toString(),
      m.usuario ?? '—',
      (m.motivo ?? '').toString(),
    ]);

    autoTable(doc, {
      startY: 72,
      head: [['#', 'Fecha', 'Producto', 'Tipo', 'Cantidad', 'Usuario', 'Observación']],
      body,
      styles: { fontSize: 9, cellPadding: 4, valign: 'middle' },
      headStyles: { fillColor: [33, 150, 243], textColor: 255 },
      columnStyles: {
        0: { cellWidth: 28, halign: 'right' },
        1: { cellWidth: 120 },
        2: { cellWidth: 220 },
        3: { cellWidth: 70 },
        4: { cellWidth: 70, halign: 'right' },
        5: { cellWidth: 100 },
        6: { cellWidth: 'auto', overflow: 'linebreak' },
      },
      margin: { left: 40, right: 40 },
      didDrawPage: (data) => {
        const page = doc.getNumberOfPages();
        doc.setFontSize(9);
        doc.text(
          `Página ${page}`,
          doc.internal.pageSize.getWidth() - 40,
          doc.internal.pageSize.getHeight() - 20,
          { align: 'right' }
        );
      },
    });

    const file = `reporte-movimientos_${this.tsFilename(new Date())}.pdf`;
    doc.save(file);
    this.msg.success('PDF generado.');
  }

  

  /**
   * Edita un producto del inventario
   */
  editarProducto(producto: Producto): void {
    const dialogRef = this.dialog.open(EditProduct, {
      width: '500px',
      disableClose: true,
      data: {
        producto,
        categorias: this.categorias,
        proveedores: this.proveedores,
      },
    });

    dialogRef.afterClosed().subscribe((payload) => {
      if (!payload) {
        this.msg.info('Edición cancelada.');
        return;
      }

      this.inventoryService.modificarProducto(producto.id, payload).subscribe({
        next: () => {
          this.msg.success('Producto actualizado correctamente.');
          this.initProductos();
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
  registrarMovimientoProducto(producto: Producto): void {
    const dialogRef = this.dialog.open(AddKardexRecord, {
      width: '500px',
      disableClose: true,
      data: { idProducto: producto.id, precioCompra: producto.precioCompra },
    });

    dialogRef.afterClosed().subscribe((movimiento) => {
      if (movimiento) {
        this.inventoryService.registrarMovimiento(movimiento).subscribe({
          next: (res: any) => {
            this.msg.success('Movimiento registrado:');
            this.initKardex();
            this.vistaActiva = 'movimientos';
          },
          error: (err: any) => this.msg.error('Error al registrar movimiento.'),
        });
      }
    });
  }

  initCategorias() {
    this.inventoryService.categorias().subscribe((response: any) => {
      if (response.data && Array.isArray(response.data)) {
        this.categorias = response.data.map((cat: any) => ({
          idCategoria: cat.idCategoria,
          nombre: cat.nombre,
        }));
      }
    });
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

        this.productosFiltrados = [...this.productos];

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

  initKardex() {
    return this.inventoryService.kardex().subscribe((response: any) => {
      const lista = Array.isArray(response) ? response : [response];

      this.movimientos = lista.map((mov: any) => {
        let tipoTexto = mov.tipoMovimiento;
        let tipoLimpio = '';

        if (typeof tipoTexto === 'string' && tipoTexto.includes('nombre=')) {
          const regex = /nombre=([\wÁÉÍÓÚáéíóú]+)/;
          const match = regex.exec(tipoTexto);
          tipoLimpio = match ? match[1].toLowerCase() : tipoTexto.toLowerCase();
        } else if (typeof tipoTexto === 'string') {
          tipoLimpio = tipoTexto.toLowerCase();
        }

        return {
          id: mov.idKardex,
          productoNombre: mov.nombreProducto,
          fecha: mov.fecha,
          tipo: tipoLimpio,
          cantidad: mov.cantidad,
          motivo: mov.observacion ?? '',
          usuario: mov.nombreUsuario ?? mov.usuario ?? '—',
          color: tipoLimpio === 'entrada' ? '#10b981' : '#ef4444',
        };
      });
    });
  }

  initProveedores() {
    this.proveedoresService.proveedores().subscribe((response: any) => {
      if (response.data && Array.isArray(response.data)) {
        this.proveedores = response.data.map((prov: any) => ({
          idProveedor: prov.idProveedor,
          nombre: prov.nombre,
        }));
      }
    });
  }

  openCrearProveedor(){    
  const dialogRef = this.dialog.open(ProveedoresCreate, {
      width: '500px',
      disableClose: true,
    });

    dialogRef.afterClosed().subscribe((proveedor) => {      
      if (proveedor) {
        this.inventoryService.registrarProveedor(proveedor).subscribe({
          next: (res: any) => {
            this.msg.success('Proveedor registrado correctamente.');
          },
          error: (err: any) => this.msg.error('Error al registrar proveedor.'),
        });
      }
    });
  }

  openCrearCategoria(){
    const dialogRef = this.dialog.open(CategoriasCreate, {
      width: '500px',
      disableClose: true,
    });

    dialogRef.afterClosed().subscribe((categoria) => {
      
      if (categoria) {
        this.inventoryService.registrarCategorias(categoria).subscribe({
          next: (res: any) => {
            this.msg.success('Proveedor registrado correctamente.');
          },
          error: (err: any) => this.msg.error('Error al registrar proveedor.'),
        });
      }
    });
  }
  }

