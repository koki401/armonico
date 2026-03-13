import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PlatillosService } from '../../services/platillos';
import { Layout } from '../../shared/layout/layout';
import { PuntoVentaService } from '../../services/punto-venta';
import { TipoPedido } from '../../model/tipoPedido';
import { Mesa } from '../../model/mesa';
import { MessageService } from '../../services/message';
import { PedidoDetalle } from '../../dialogs/pedido-detalle/pedido-detalle';
import { MatDialog } from '@angular/material/dialog';
import { filter, switchMap, from, map, concatMap, toArray } from 'rxjs';

interface Ingrediente {
  idProducto: number;
  nombreProducto: string;
  cantidadMostrada: number;
  unidadMostrada: string;
  cantidadDescuento: number;
  unidadDescuento: string;
}

interface Product {
  id: number;
  nombre: string;
  descripcion: string;
  precioVenta: number;
  tiempoMin: number;
  categoriaNombre: string;
  idCategoria: number;
  imagen: string;
  activo: boolean;
  ingredientes: Ingrediente[];
  alergenos: string[];
  numIngredientes: number;
}

interface OrderItem extends Product {
  quantity: number;
}

@Component({
  selector: 'app-punto-venta',
  standalone: true,
  imports: [Layout, CommonModule, FormsModule],
  templateUrl: './punto-venta.html',
  styleUrls: ['./punto-venta.scss'],
})
export class PuntoVenta implements OnInit {
  selectedCategory: string = 'Todas';
  searchTerm: string = '';
  orderItems: OrderItem[] = [];
  products: Product[] = [];
  categories: string[] = ['Todas'];
  loading: boolean = false;
  error: string = '';
  orderPanelCollapsed: boolean = false;
  estados: any;
  tipos: TipoPedido[] = [];
  serviceType: number | null = null;
  mesas: Mesa[] = [];
  tableNumber: number | null = null;
  nota: string = '';
  habilitarNota = false;
  contador = 0;

  trackTipoPedido(index: number, t: TipoPedido) {
    return t.idTipo;
  }

  constructor(
    readonly platillosService: PlatillosService,
    readonly puntoVentaService: PuntoVentaService,
    readonly msg: MessageService,
    readonly dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadProducts();
    this.loadEstados();
    this.loadTipos();
    this.loadMesas();
  }

  readonly idUsuario: number | null = (() => {
    try {
      return JSON.parse(localStorage.getItem('usuario') || 'null')?.idUsuario ?? null;
    } catch {
      return null;
    }
  })();

  loadProducts(): void {
    this.loading = true;
    this.error = '';

    this.platillosService.getPlatillosActivos().subscribe({
      next: (data) => {
        this.products = data.filter((p: Product) => p.activo);
        this.extractCategories();
        this.loading = false;
      },
      error: (err) => {
        console.error('Error al cargar productos:', err);
        this.error = 'Error al cargar los productos';
        this.loading = false;
      },
    });
  }

  loadEstados(): void {
    this.puntoVentaService.getServicios().subscribe({
      next: (data) => {
        this.estados = data;
      },
    });
  }

  loadTipos(): void {
    this.puntoVentaService.getTipos().subscribe({
      next: (data) => {
        this.tipos = data ?? [];
      },
      error: (err) => console.error('Error cargando tipos', err),
    });
  }

  loadMesas(): void {
    this.puntoVentaService.getMesas().subscribe({
      next: (data: Mesa[]) => {
        this.mesas = data.filter((m) => m.activa).sort((a, b) => a.idMesa - b.idMesa);
      },
    });
  }

  get mesaSeleccionada(): Mesa | undefined {
    return this.mesas.find((m) => m.idMesa === Number(this.tableNumber));
  }

  trackTipo = (_: number, t: TipoPedido) => t.idTipo;

  submit(): void {
    if (this.serviceType == null) return;
    const payload = {
      idTipo: this.serviceType,
    };
  }

  extractCategories(): void {
    const categoriesSet = new Set<string>();
    this.products.forEach((product) => {
      if (product.categoriaNombre) {
        categoriesSet.add(product.categoriaNombre);
      }
    });
    this.categories = ['Todas', ...Array.from(categoriesSet).sort()];
  }

  get filteredProducts(): Product[] {
    return this.products.filter((product) => {
      const matchesCategory =
        this.selectedCategory === 'Todas' || product.categoriaNombre === this.selectedCategory;
      const matchesSearch = product.nombre.toLowerCase().includes(this.searchTerm.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }

  get totalAmount(): number {
    return this.orderItems.reduce((sum, item) => sum + item.precioVenta * item.quantity, 0);
  }

  selectCategory(category: string): void {
    this.selectedCategory = category;
  }

  toggleOrderPanel(): void {
    this.orderPanelCollapsed = !this.orderPanelCollapsed;
  }

  addToOrder(product: Product): void {
    if (!product.activo) return;

    const existingItem = this.orderItems.find((item) => item.id === product.id);

    if (existingItem) {
      existingItem.quantity++;
    } else {
      this.orderItems.push({ ...product, quantity: 1 });
    }

    if (this.orderPanelCollapsed) {
      this.orderPanelCollapsed = false;
    }
  }

  removeFromOrder(itemId: number): void {
    this.orderItems = this.orderItems.filter((item) => item.id !== itemId);
  }

  increaseQuantity(itemId: number): void {
    const item = this.orderItems.find((i) => i.id === itemId);
    if (item) {
      item.quantity++;
    }
  }

  decreaseQuantity(itemId: number): void {
    const item = this.orderItems.find((i) => i.id === itemId);
    if (item) {
      if (item.quantity > 1) {
        item.quantity--;
      } else {
        this.removeFromOrder(itemId);
      }
    }
  }

  processOrder(): void {
    const order = {
      idTipo: this.serviceType,
      idMesa: this.tableNumber,
      idMesero: this.idUsuario,
      notaGeneral: this.nota,
      estadoActual: 1,
      total: this.totalAmount,
    };

    console.log('Procesando orden:', order);

    this.puntoVentaService.guardarPedido(order).subscribe({
      next: (res) => {
        this.msg.success('Pedido creado');
        const dialogRef = this.dialog.open(PedidoDetalle, {
          width: '590px',
          disableClose: true,
          data: {
            orderItems: this.orderItems,
            idPedido: res.idPedido,
          },
        });

        dialogRef
          .afterClosed()
          .pipe(
            filter((pedidoDetalle: any) => !!pedidoDetalle), 
            switchMap((pedidoDetalle: any) => {
              const idPedido = res.idPedido;
            console.log(pedidoDetalle);
            
              const notaGeneral = (pedidoDetalle.nota ?? null) as string | null;

              const detalles$ = from(pedidoDetalle.orderItems || []).pipe(
                map((it: any) => ({
                  idPlatillo: it.id, 
                  cantidad: it.quantity ?? 1,
                  precioUnitario: it.precioVenta,
                  nota: notaGeneral,
                  estadoCocina: 1,
                })),
                concatMap((dto) => this.puntoVentaService.guardarPedidoDetalle(idPedido, dto)),
                toArray() 
              );

              return detalles$;
            })
          )
          .subscribe({
            next: (_res) => this.msg.success('Detalles agregados al pedido.'),
            error: () => this.msg.error('No fue posible agregar los detalles.'),
          });
      },
      error: () => {
        this.msg.error('Fallo creación de pedido');
      },
    });
  }

  cancelOrder(): void {
    if (confirm('¿Está seguro de cancelar la orden?')) {
      this.orderItems = [];
      this.tableNumber = null;
    }
  }

  trackByProductId(index: number, product: Product): number {
    return product.id;
  }

  trackByOrderItemId(index: number, item: OrderItem): number {
    return item.id;
  }

  isMesaSelected(): boolean {
    const seleccionado = this.tipos.find((t) => t.idTipo === this.serviceType);
    return (seleccionado?.nombre ?? '').toLowerCase() === 'mesa';
  }
}
