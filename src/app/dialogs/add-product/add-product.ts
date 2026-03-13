import { Component, OnInit, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import {
  MatNativeDateModule,
  provideNativeDateAdapter,
  MAT_DATE_LOCALE,
} from '@angular/material/core';
import { MatSliderModule } from '@angular/material/slider';

@Component({
  selector: 'app-add-product',
  standalone: true,
  providers: [provideNativeDateAdapter(), { provide: MAT_DATE_LOCALE, useValue: 'es-ES' }],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatSliderModule,
  ],
  templateUrl: './add-product.html',
  styleUrls: ['./add-product.scss'],
})
export class AddProduct implements OnInit {
  form!: FormGroup;

  categorias: Array<{ idCategoria: number; nombre: string }> = [];
  proveedores: Array<{ idProveedor: number; nombre: string }> = [];

  constructor(
    readonly fb: FormBuilder,
    readonly dialogRef: MatDialogRef<AddProduct>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group(
      {
        nombre: ['', [Validators.required, Validators.maxLength(120)]],
        descripcion: ['', [Validators.maxLength(500)]],
        idCategoria: [null, Validators.required],

        precioVenta: [null, [Validators.required, Validators.min(0.01)]],
        precioCompra: [null, [Validators.required, Validators.min(0.01)]],
        unidad: ['', [Validators.required, Validators.maxLength(50)]],
        margenPct: this.fb.nonNullable.control(20),

        stockActual: [0, [Validators.required, Validators.min(0)]],
        stockMinimo: [0, [Validators.required, Validators.min(0)]],
        idProveedor: [null, Validators.required],
        ubicacion: ['', [Validators.maxLength(120), Validators.required]],
        fechavencimiento: [null, Validators.required],
      },
      { validators: [this.precioVentaNoMenorQueCompra()] }
    );

    const margenCtrl = this.form.get('margenPct')!;
    const compraCtrl = this.form.get('precioCompra')!;
    margenCtrl.disable({ emitEvent: false });

    const toggleMargen = (val: any) => {
      const compra = Number(val);
      const habilitar = Number.isFinite(compra) && compra > 0;
      if (habilitar && margenCtrl.disabled) margenCtrl.enable({ emitEvent: false });
      if (!habilitar && margenCtrl.enabled) margenCtrl.disable({ emitEvent: false });
    };
    toggleMargen(compraCtrl.value);
    compraCtrl.valueChanges.subscribe(toggleMargen);

    if (this.data?.categorias) {
      this.categorias = this.data.categorias.filter(
        (c: any) => c.nombre?.toLowerCase() !== 'todos'
      );
    }
    if (this.data?.proveedores) this.proveedores = this.data.proveedores;

    margenCtrl.valueChanges.subscribe(() => this.actualizarPrecioVentaDesdeMargen());
    compraCtrl.valueChanges.subscribe(() => this.actualizarPrecioVentaDesdeMargen());
  }

  /** Validador: precioVenta >= precioCompra */
  private precioVentaNoMenorQueCompra() {
    return (group: AbstractControl): ValidationErrors | null => {
      const compra = Number(group.get('precioCompra')?.value);
      const venta = Number(group.get('precioVenta')?.value);

      if (!isFinite(compra) || !isFinite(venta)) return null;

      const ok = venta >= compra;
      const ctrlVenta = group.get('precioVenta');

      if (!ok) {
        ctrlVenta?.setErrors({ ...(ctrlVenta?.errors ?? {}), menorQueCompra: true });
        return { precioVentaMenorQueCompra: true };
      } else {
        if (ctrlVenta?.errors && 'menorQueCompra' in ctrlVenta.errors) {
          const { menorQueCompra, ...rest } = ctrlVenta.errors;
          ctrlVenta.setErrors(Object.keys(rest).length ? rest : null);
        }
        return null;
      }
    };
  }

  private actualizarPrecioVentaDesdeMargen(): void {
    const compra = Number(this.form.get('precioCompra')?.value);
    const margen = Number(this.form.get('margenPct')?.value);

    if (!isFinite(compra) || compra <= 0 || !isFinite(margen)) return;

    const sugerido = this.redondear2(compra * (1 + margen / 100));
    if (Number(this.form.get('precioVenta')?.value) !== sugerido) {
      this.form.get('precioVenta')?.setValue(sugerido, { emitEvent: false });
      this.form.updateValueAndValidity({ emitEvent: false });
    }
  }

  private redondear2(n: number): number {
    return Math.round((n + Number.EPSILON) * 100) / 100;
  }

  private toIsoDateOnly(d: Date | string): string {
    const date = typeof d === 'string' ? new Date(d) : d;
    if (!(date instanceof Date) || isNaN(date.getTime())) return '';
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  guardar(): void {
    
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const v = this.form.value;

    const payload = {
      nombre: v.nombre,
      descripcion: v.descripcion,
      idCategoria: v.idCategoria,
      precioVenta: Number(v.precioVenta),
      stockActual: Number(v.stockActual),
      stockMinimo: Number(v.stockMinimo),
      unidad: v.unidad,
      idProveedor: v.idProveedor,
      ubicacion: v.ubicacion,
      precioCompra: Number(v.precioCompra),
      fechavencimiento: this.toIsoDateOnly(v.fechavencimiento),
      activo: true,
    };

    this.dialogRef.close(payload);
  }
}
