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
import { MatSlideToggleModule } from '@angular/material/slide-toggle';


@Component({
  selector: 'app-edit-product',
  standalone: true,
  providers: [provideNativeDateAdapter(), { provide: MAT_DATE_LOCALE, useValue: 'es-ES' }],
  imports: [
    CommonModule, ReactiveFormsModule, MatDialogModule, MatFormFieldModule,
    MatInputModule, MatSelectModule, MatButtonModule, MatDatepickerModule, MatNativeDateModule,
    MatSlideToggleModule
  ],
  templateUrl: './edit-product.html',
  styleUrl: './edit-product.scss'
})
export class EditProduct implements OnInit {
  form!: FormGroup;
  categorias: Array<{ idCategoria: number; nombre: string }> = [];
  proveedores: Array<{ idProveedor: number; nombre: string }> = [];

  constructor(
    readonly fb: FormBuilder,
    readonly dialogRef: MatDialogRef<EditProduct>,
    @Inject(MAT_DIALOG_DATA) public data: { producto: any; categorias?: any[]; proveedores?: any[] }
  ) {}

  ngOnInit(): void {
    // construir form
    this.form = this.fb.group(
      {
        nombre: ['', [Validators.required, Validators.maxLength(120)]],
        descripcion: ['', [Validators.maxLength(500)]],
        idCategoria: [null, Validators.required],
        precioVenta: [null, [Validators.required, Validators.min(0.01)]],
        precioCompra: [null, [Validators.required, Validators.min(0.01)]],
        unidad: ['', [Validators.required, Validators.maxLength(50)]],
        stockActual: [0, [Validators.required, Validators.min(0)]],
        stockMinimo: [0, [Validators.required, Validators.min(0)]],
        idProveedor: [null, Validators.required],
        ubicacion: ['', [Validators.maxLength(120), Validators.required]],
        fechavencimiento: [null, Validators.required],
        activo: [true],
        id:['']
      },
      { validators: [this.precioVentaNoMenorQueCompra()] }
    );

    // combos
    if (this.data?.categorias) this.categorias = this.data.categorias;
    if (this.data?.proveedores) this.proveedores = this.data.proveedores;

    // precargar valores
    const p = this.data?.producto ?? {};  
    this.form.patchValue({
      id: p.id ?? null,
      nombre: p.nombre ?? '',
      descripcion: p.descripcion ?? '',
      idCategoria: p.categoria?.idCategoria ?? p.idCategoria ?? null,
      precioVenta: p.precioVenta ?? null,
      precioCompra: p.precioCompra ?? null,
      unidad: p.unidad ?? '',
      stockActual: p.stockActual ?? 0,
      stockMinimo: p.stockMinimo ?? 0,
      idProveedor: p.proveedor?.idProveedor ?? p.idProveedor ?? null,
      ubicacion: p.ubicacion ?? '',
      fechavencimiento: this.toDate(p.fechavencimiento),
      activo: p.activo ?? true
    });
  }

  // Validador de grupo
  private precioVentaNoMenorQueCompra() {
    return (group: AbstractControl): ValidationErrors | null => {
      const compra = Number(group.get('precioCompra')?.value);
      const venta  = Number(group.get('precioVenta')?.value);
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

  private toDate(d: any): Date | null {
    if (!d) return null;
    const date = d instanceof Date ? d : new Date(d);
    return isNaN(date.getTime()) ? null : date;
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

    const payload: any = {
      id: v.id,
      nombre: v.nombre,
      descripcion: v.descripcion,
      precioVenta: Number(v.precioVenta),
      precioCompra: Number(v.precioCompra),
      unidad: v.unidad,
      stockActual: Number(v.stockActual),
      stockMinimo: Number(v.stockMinimo),
      ubicacion: v.ubicacion,
      fechavencimiento: this.toIsoDateOnly(v.fechavencimiento),
      categoria: v.idCategoria != null ? { idCategoria: v.idCategoria } : undefined,
      proveedor: v.idProveedor != null ? { idProveedor: v.idProveedor } : undefined,
      activo: !!v.activo,
    };

    Object.keys(payload).forEach(k => payload[k] === undefined && delete payload[k]);

    this.dialogRef.close(payload);
  }
}
