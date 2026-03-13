import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, Validators, FormGroup, FormControl, ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { UNIDAD_CATEGORIES, UnidadCategoria } from '../../model/unidad';

type IngredienteBackend = {
  idProducto: number;
  nombreProducto: string;
  cantidadMostrada: number;
  unidadMostrada: string;
  cantidadDescuento?: number;
  unidadDescuento?: string;
  cantidadConsumida?: number;
  unidad?: string;
};

type IngredienteItem = {
  idProducto: number;
  nombreProducto: string;
  cantidadMostrada: number;
  unidadMostrada: string;
  cantidadConsumida: number; 
  unidad: string;
};

@Component({
  selector: 'app-editar-ingredientes-dialog',
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
  templateUrl: './editar-ingredientes-dialog.html',
  styleUrls: ['./editar-ingredientes-dialog.scss']
})
export class EditarIngredientesDialog {
  productos: { idProducto: number; nombre: string; unidad?: string }[] = [];
  unidadCategorias: readonly UnidadCategoria[] = UNIDAD_CATEGORIES;
  ingredientes: IngredienteItem[] = [];
  
  ingForm: FormGroup<{
    idProducto: FormControl<number | null>;
    cantidadMostrada: FormControl<number | null>;
    unidadMostrada: FormControl<string | null>;
    cantidadConsumida: FormControl<number | null>; 
    unidad: FormControl<string | null>;
  }>;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<EditarIngredientesDialog>,
    @Inject(MAT_DIALOG_DATA) public data: {
      productos?: { idProducto: number; nombre: string; unidad?: string }[],
      ingredientes?: IngredienteBackend[]
    }
  ) {
    this.productos = data?.productos ?? [];
    this.ingredientes = (data?.ingredientes ?? []).map(ing => this.normalizarIngrediente(ing));
    
    this.ingForm = this.fb.group({
      idProducto: this.fb.control<number | null>(null, { validators: [Validators.required] }),
      cantidadMostrada: this.fb.control<number | null>(null, { validators: [Validators.required, Validators.min(0.01)] }),
      unidadMostrada: this.fb.control<string | null>(null, { validators: [Validators.required] }),
      cantidadConsumida: this.fb.control<number | null>(null, { validators: [Validators.required, Validators.min(0.01)] }),
      unidad: this.fb.control<string | null>({ value: null, disabled: true }),
    });

    this.ingForm.get('idProducto')?.valueChanges.subscribe(idProd => {
      const prod = this.productos.find(p => p.idProducto === idProd);
      this.ingForm.patchValue({ unidad: prod?.unidad ?? '' });
    });
  }

  private normalizarIngrediente(ing: IngredienteBackend): IngredienteItem {
    return {
      idProducto: ing.idProducto,
      nombreProducto: ing.nombreProducto,
      cantidadMostrada: ing.cantidadMostrada,
      unidadMostrada: ing.unidadMostrada,
      cantidadConsumida: ing.cantidadDescuento ?? ing.cantidadConsumida ?? 0,
      unidad: ing.unidadDescuento ?? ing.unidad ?? ''
    };
  }

  get count(): number { 
    return this.ingredientes.length; 
  }

  agregar() {
    if (this.ingForm.invalid) { 
      this.ingForm.markAllAsTouched(); 
      return; 
    }
    
    const { idProducto, cantidadMostrada, unidadMostrada, cantidadConsumida } = this.ingForm.value;
    const unidad = this.ingForm.get('unidad')?.value;
    
    const prod = this.productos.find(p => p.idProducto === Number(idProducto));
    if (!prod) return;
    
    const idx = this.ingredientes.findIndex(i => i.idProducto === Number(idProducto));
    if (idx >= 0) {
      this.ingredientes[idx] = {
        ...this.ingredientes[idx],
        cantidadMostrada: Number(cantidadMostrada),
        unidadMostrada: String(unidadMostrada),
        cantidadConsumida: Number(cantidadConsumida),
        unidad: String(unidad ?? prod.unidad ?? '')
      };
    } else {
      this.ingredientes.push({
        idProducto: Number(idProducto),
        nombreProducto: prod.nombre,
        cantidadMostrada: Number(cantidadMostrada),
        unidadMostrada: String(unidadMostrada),
        cantidadConsumida: Number(cantidadConsumida),
        unidad: String(unidad ?? prod.unidad ?? '')
      });
    }
    
    this.ingForm.reset();
  }

  quitar(item: IngredienteItem) {
    this.ingredientes = this.ingredientes.filter(i => i.idProducto !== item.idProducto);
  }

  guardar() {
    this.dialogRef.close({
      items: this.ingredientes.map(i => ({
        idProducto: i.idProducto,
        cantidadMostrada: i.cantidadMostrada,
        unidadMostrada: i.unidadMostrada,
        cantidadDescuento: i.cantidadConsumida,
        unidadDescuento: i.unidad,
        cantidadConsumida: i.cantidadConsumida,
        unidad: i.unidad,
        nombreProducto:i.nombreProducto
      }))
    });
  }

  cancelar() { 
    this.dialogRef.close(null); 
  }
}