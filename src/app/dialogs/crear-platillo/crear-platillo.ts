import { Component, Inject } from '@angular/core';
import {
  FormBuilder,
  Validators,
  ValidatorFn,
  AbstractControl,
  FormGroup,
  ReactiveFormsModule,
} from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { Producto } from '../../model/producto';
import { UNIDAD_CATEGORIES } from '../../model/unidad';

type CategoriaItem = { idCategoria: number; nombre: string };
interface CrearPlatilloData {
  productos: Producto[];
  categorias: CategoriaItem[];
  alergenos: AlergenoLite[];
}
type ProductoLite = { id: number; nombre: string; unidad?: string };
type IngredienteReceta = {
  idProducto: number;
  nombreProducto: string;
  cantidadMostrada: number;
  unidadMostrada: string;
  cantidadConsumida: number;
  unidadBase: string;
};
type AlergenoLite = {
  id: number;
  nombre: string;
  descripcion?: string;
  activo?: boolean;
  codigo?: string;
  icono?: string;
};

@Component({
  selector: 'app-crear-platillo',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
  ],
  templateUrl: './crear-platillo.html',
  styleUrl: './crear-platillo.scss',
})
export class CrearPlatillo {
  unidadCategories = UNIDAD_CATEGORIES;
  categorias: CategoriaItem[] = [];
  productos: ProductoLite[] = [];
  ingredientes: IngredienteReceta[] = [];
  alergenos: AlergenoLite[] = [];
  alergenosSeleccionados: number[] = [];
  form!: FormGroup;

  constructor(
    readonly fb: FormBuilder,
    readonly dialogRef: MatDialogRef<CrearPlatillo>,
    @Inject(MAT_DIALOG_DATA) public data: CrearPlatilloData
  ) {
    this.categorias = data?.categorias ?? [];
    this.productos = data?.productos ?? [];
    this.alergenos = data?.alergenos ?? [];

    this.form = this.fb.nonNullable.group({
      nombre: ['', [Validators.required, Validators.maxLength(120)]],
      idCategoria: [null, [Validators.required]],
      descripcion: ['', [Validators.maxLength(300)]],
      precioVenta: [null, [Validators.required, Validators.min(0.01)]],
      tiempoMin: [null, [Validators.required, Validators.min(1)]],
      imagen: ['', [this.urlOrEmptyValidator()]],
      activo: [true],
      idIngrediente: [null],
      cantidadMostrada: [null, [Validators.min(0.01)]],
      unidadMostrada: ['', [Validators.maxLength(30)]],
      cantidadConsumida: [null, [Validators.min(0.01)]],
      unidadBase: [''],
      idAlergeno: [null],
      alergenosIds: this.fb.nonNullable.control<number[]>([]),
    });

    if (this.categorias.length === 1) {
      this.form.patchValue({ idCategoria: this.categorias[0].idCategoria });
    }
    this.form.get('idIngrediente')?.valueChanges.subscribe((idProd) => {
      const prod = this.productos.find((p) => p.id === idProd);      
      this.form.patchValue({ unidadBase: prod?.unidad ?? '' });
    });
  }

  guardar(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    const v = this.form.getRawValue();
    const payload = {
      nombre: v.nombre,
      descripcion: v.descripcion || '',
      precioVenta: Number(v.precioVenta),
      tiempoMin: Number(v.tiempoMin),
      idCategoria: v.idCategoria,
      imagen: v.imagen || '',
      ingredientes: this.ingredientes,
      alergenosIds: this.alergenosSeleccionados,
    };

    this.dialogRef.close(payload);
  }

  private urlOrEmptyValidator(): ValidatorFn {
    return (control: AbstractControl) => {
      const value = (control.value ?? '').toString().trim();
      if (!value) return null;
      try {
        new URL(value);
        return null;
      } catch {
        return { url: true };
      }
    };
  }

  eliminarIngrediente(idProducto: number): void {
    this.ingredientes = this.ingredientes.filter((i) => i.idProducto !== idProducto);
  }

  trackByProdId = (_: number, p: ProductoLite) => p.id;
  trackByIngId = (_: number, i: IngredienteReceta) => i.idProducto;

  puedeAgregarIngrediente(): boolean {
    const f = this.form;
    return (
      !!f.value.idIngrediente &&
      !!f.value.cantidadMostrada &&
      Number(f.value.cantidadMostrada) > 0 &&
      !!(f.value.unidadMostrada ?? '').toString().trim() &&
      !!f.value.cantidadConsumida &&
      Number(f.value.cantidadConsumida) > 0
    );
  }

  agregarIngrediente(): void {
    const idProd = this.form.value.idIngrediente as number | null;
    const cant = Number(this.form.value.cantidadMostrada ?? 0);
    const unidad = (this.form.value.unidadMostrada ?? '').trim();
    const cantConsumida = Number(this.form.value.cantidadConsumida ?? 0);
    const unidadBase = (this.form.value.unidadBase ?? '').trim();

    if (!idProd || cant <= 0 || !unidad) return;

    const prod = this.productos.find((p) => p.id === idProd);
    if (!prod) return;

    const idx = this.ingredientes.findIndex((i) => i.idProducto === idProd);
    if (idx >= 0) {
      this.ingredientes[idx] = {
        ...this.ingredientes[idx],
        cantidadMostrada: Number((this.ingredientes[idx].cantidadMostrada + cant).toFixed(2)),
        unidadMostrada: unidad,
        cantidadConsumida: Number(cantConsumida.toFixed(2)),
        unidadBase: unidadBase,
      };
    } else {
      this.ingredientes.push({
        idProducto: prod.id,
        nombreProducto: prod.nombre,
        cantidadMostrada: Number(cant.toFixed(2)),
        unidadMostrada: unidad,
        cantidadConsumida: Number(cantConsumida.toFixed(2)),
        unidadBase: unidadBase,
      });
    }

    this.form.patchValue({
      idIngrediente: null,
      cantidadMostrada: null,
      unidadMostrada: '',
      cantidadConsumida: null,
      unidadBase: '',
    });
    this.form.get('idIngrediente')?.markAsPristine();
    this.form.get('cantidadMostrada')?.markAsPristine();
    this.form.get('unidadMostrada')?.markAsPristine();
    this.form.get('unidadMostrada')?.markAsPristine();
    this.form.get('cantidadConsumida')?.markAsPristine();
  }

  trackByAlergenoId = (_: number, a: AlergenoLite) => a.id;
  trackByIdSimple = (_: number, id: number) => id;

  puedeAgregarAlergeno(): boolean {
    const id = this.form.value.idAlergeno as number | null;
    return !!id && !this.alergenosSeleccionados.includes(id);
  }

  agregarAlergeno(): void {
    const id = this.form.value.idAlergeno as number | null;
    if (!id || this.alergenosSeleccionados.includes(id)) return;
    this.alergenosSeleccionados = [...this.alergenosSeleccionados, id];

    this.form.patchValue({ idAlergeno: null });
    this.form.get('idAlergeno')?.markAsPristine();
  }

  quitarAlergeno(id: number): void {
    this.alergenosSeleccionados = this.alergenosSeleccionados.filter((x) => x !== id);
  }

  nombreAlergeno(id: number): string {
    return this.alergenos.find((a) => a.id === id)?.nombre ?? `ID ${id}`;
  }
}
