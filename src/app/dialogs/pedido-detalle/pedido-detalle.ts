import { Component, Inject, signal, computed, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

export type MetodoPago = 'EFECTIVO' | 'TARJETA' | 'DIGITAL';

export interface OrderItem {
  precioVenta?: number; precio?: number; price?: number; unitPrice?: number;
  cantidad?: number; qty?: number; quantity?: number;
  [k: string]: any;
}

export interface PedidoDetalleData {
  idPedido:number;
  orderItems: OrderItem[];
  nota?: string;
  metodo?: MetodoPago;
}

export interface PedidoDetalleResult {
  orderItems: OrderItem[];
}

@Component({
  selector: 'app-pedido-detalle',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    ReactiveFormsModule
  ],
  templateUrl: './pedido-detalle.html',
  styleUrls: ['./pedido-detalle.scss']
})
export class PedidoDetalle {
  metodo = signal<MetodoPago>('EFECTIVO');
  idPedido:number = 0;
  nota = signal<string>('');
  private items = signal<OrderItem[]>([]);

  notaCtrl = new FormControl<string>('', { nonNullable: true });

  total = computed(() => this.items().reduce((acc, it) => {
    const precio = it.precioVenta ?? it.precio ?? it.price ?? it.unitPrice ?? 0;
    const cantidad = it.cantidad ?? it.qty ?? it.quantity ?? 1;
    return acc + (Number(precio) || 0) * (Number(cantidad) || 0);
  }, 0));

  botonTexto = computed(() =>
    `Confirmar Pago - ${this.total().toLocaleString('es-GT', {
      style: 'currency',
      currency: 'GTQ',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`
  );

  constructor(
    private dialogRef: MatDialogRef<PedidoDetalle, PedidoDetalleResult>,
    @Inject(MAT_DIALOG_DATA) data: PedidoDetalleData,
    private destroyRef: DestroyRef
  ) {
    this.idPedido = data.idPedido;
    console.log(data);
    
    this.items.set(data?.orderItems ?? []);
    if (data?.metodo) this.metodo.set(data.metodo);
    this.nota.set(data?.nota ?? '');
    this.notaCtrl.setValue(this.nota());

    this.notaCtrl.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(v => this.nota.set(v ?? ''));
  }

  seleccionar(m: MetodoPago) {
    this.metodo.set(m);
  }

  confirmar() {
    const result: PedidoDetalleResult = {
      orderItems: this.items()
    };
    this.dialogRef.close(result);
  }

  cerrar() {
    this.dialogRef.close();
  }

  isActivo(m: MetodoPago) {
    return this.metodo() === m;
  }
}
