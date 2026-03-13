import { Component, OnInit, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { InventoryService } from '../../services/inventory';
@Component({
  selector: 'app-add-kardex-record',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatButtonModule,
  ],
  templateUrl: './add-kardex-record.html',
  styleUrl: './add-kardex-record.scss',
})
export class AddKardexRecord implements OnInit {
  form!: FormGroup;
  usuario: any = null;
  idUsuario: number = 0;
  productos: Array<{ idProducto: number; nombre: string }> = [];

  constructor(
    readonly fb: FormBuilder,
    readonly dialogRef: MatDialogRef<AddKardexRecord>,
    readonly inventoryService: InventoryService,
    @Inject(MAT_DIALOG_DATA)
    public data: { idProducto?: number | string; precioCompra?: number | string }
  ) {}

  ngOnInit() {
    console.log(this.toIsoInTimeZone(this.now(), 'America/Guatemala'));
    
    this.idUsuario = this.userInfoId();
    const incomingId = this.data?.idProducto ? Number(this.data.idProducto) : null;
    const incomingprice = this.data?.precioCompra ? Number(this.data.precioCompra) : null;

    this.form = this.fb.group({
      idProducto: [incomingId, Validators.required],
      idTipo: [1, Validators.required],
      cantidad: [0, [Validators.required, Validators.min(0.01)]],
      costoUnitario: [incomingprice ?? 0, [Validators.required, Validators.min(0)]],
      observacion: [''],
      fecha: [this.now(), Validators.required],
      idUsuario: [this.idUsuario, Validators.required],
    });

    this.inventoryService.productos().subscribe((res: any) => {
      const list = res?.data ?? res ?? [];
      this.productos = list.map((p: any) => ({
        idProducto: Number(p.idProducto ?? p.id),
        nombre: p.nombre,
      }));

      if (incomingId != null) {
        this.form.get('idProducto')!.setValue(Number(incomingId), { emitEvent: false });
      }
    });
  }

  private toIsoInTimeZone(dt: Date | string, timeZone: string): string {
    const d = typeof dt === 'string' ? new Date(dt) : dt;
    if (!(d instanceof Date) || Number.isNaN(d.getTime())) return '';
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).formatToParts(d);

    const get = (type: Intl.DateTimeFormatPartTypes) =>
      parts.find((p) => p.type === type)?.value ?? '00';

    const yyyy = get('year');
    const mm = get('month');
    const dd = get('day');
    const hh = get('hour');
    const mi = get('minute');
    const ss = get('second');

    return `${yyyy}-${mm}-${dd}T${hh}:${mi}:${ss}`;
  }

  private now(): Date {
    const d = new Date();
    d.setSeconds(0, 0);
    return d;
  }

  guardar() {
    if (this.form.invalid) return;

    const v = this.form.value;

    const payload = {
      idProducto: Number(v.idProducto),
      idTipo: Number(v.idTipo),
      cantidad: Number(v.cantidad),
      costoUnitario: Number(v.costoUnitario),
      observacion: (v.observacion ?? '').trim() || null,
      fecha: this.toIsoInTimeZone(v.fecha, 'America/Guatemala'),
      idUsuario: Number(v.idUsuario),
    };

    this.dialogRef.close(payload);
  }

  userInfoId() {
    const data = localStorage.getItem('usuario');
    if (data) {
      this.usuario = JSON.parse(data);
    }
    return this.usuario.idUsuario;
  }
}
