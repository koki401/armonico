import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  Validators,
  ValidatorFn,
  AbstractControl,
  FormGroup,
  ReactiveFormsModule,
} from '@angular/forms';
import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialogModule,
  MatDialog,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { EditarAlergenosDialog } from '../editar-alergenos-dialog/editar-alergenos-dialog';
import { EditarIngredientesDialog } from '../editar-ingredientes-dialog/editar-ingredientes-dialog';
import { InventoryService } from '../../services/inventory';
import { Producto } from '../../model/producto';
import { PlatillosService } from '../../services/platillos';
import { MessageService } from '../../services/message';

@Component({
  selector: 'app-editar-platillo',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    EditarAlergenosDialog,
    EditarIngredientesDialog,
  ],
  templateUrl: './editar-platillo.html',
  styleUrl: './editar-platillo.scss',
})
export class EditarPlatillo {
  form!: FormGroup;
  categorias: { idCategoria: number; nombre: string }[] = [];
  platillo: any;
  productos: Producto[] = [];

  constructor(
    private readonly fb: FormBuilder,
    private readonly dialogRef: MatDialogRef<EditarPlatillo>,
    private readonly dialog: MatDialog,
    private readonly inventarioService: InventoryService,
    private readonly platilloService: PlatillosService,
    readonly msg: MessageService,
    @Inject(MAT_DIALOG_DATA) public data: { platillo: any; categorias: any[] }
  ) {
    this.categorias = (data?.categorias ?? []).filter((c: any) => Number(c.idCategoria) !== 1);
    this.platillo = data?.platillo ?? {};

    this.form = this.fb.nonNullable.group({
      nombre: [this.platillo?.nombre ?? '', [Validators.required, Validators.maxLength(120)]],
      idCategoria: [this.resolveCategoriaId(this.platillo), [Validators.required]], // 👈
      descripcion: [this.platillo?.descripcion ?? '', [Validators.maxLength(300)]],
      precioVenta: [
        this.platillo?.precioVenta ?? null,
        [Validators.required, Validators.min(0.01)],
      ],
      tiempoMin: [this.platillo?.tiempoMin ?? null, [Validators.required, Validators.min(1)]],
      imagen: [this.platillo?.imagen ?? '', [this.urlOrEmptyValidator()]],
      activo: [this.platillo?.activo ?? true],
    });
    this.initProductos();
  }

  guardar() {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    const v = this.form.getRawValue();
    const body = {
      nombre: v.nombre,
      descripcion: v.descripcion ?? '',
      precioVenta: Number(v.precioVenta),
      tiempoMin: Number(v.tiempoMin),
      imagen: v.imagen || '',
      activo: Boolean(v.activo),
      categoria: { idCategoria: Number(v.idCategoria) },
    };

    this.dialogRef.close(body);
  }

  cancelar() {
    this.dialogRef.close(null);
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

  private resolveCategoriaId(p: any): number | null {
    const raw = p?.idCategoria ?? p?.categoria?.idCategoria ?? null;
    return raw != null ? Number(raw) : null;
  }

  openEditarAlergenos() {
    const dlg = this.dialog.open(EditarAlergenosDialog, {
      width: '720px',
      disableClose: true,
      data: {
        idPlatillo: this.data?.platillo?.idPlatillo ?? this.data?.platillo?.id ?? null,
        nombre: this.form.get('nombre')?.value,
        // opcional: lista actual si la tienes
        // alergenosIds: this.data?.platillo?.alergenosIds ?? []
      },
    });

    dlg.afterClosed().subscribe((result) => {
      if (!result) return;
      // si el diálogo devuelve alergenos actualizados, puedes reflejarlos/localmente o recargar
      // this.data.platillo.alergenosIds = result.alergenosIds;
      // this.msg.success('Alérgenos actualizados'); // si usas un servicio de mensajes
    });
  }
  openEditarIngredientes(): void {
    const dlg = this.dialog.open(EditarIngredientesDialog, {
      width: '900px',
      data: {
        idPlatillo: this.platillo?.idPlatillo,
        nombre: this.platillo?.nombre,
        ingredientes: this.platillo?.ingredientes ?? [],
        productos: this.productos,
      },
    });

    dlg.afterClosed().subscribe((result) => {
      if (!result) return;

      if (Array.isArray(result.items)) {
  const payload = {
    idPlatillo: this.platillo.id ?? this.platillo.idPlatillo,
    items: result.items.map((i: any) => ({
      idProducto: i.idProducto,
      cantidadMostrada: i.cantidadMostrada,
      unidadMostrada: i.unidadMostrada,
      cantidadDescuento: i.cantidadDescuento,
      unidadDescuento: i.unidadDescuento
    }))
  };

  console.log(payload);
  this.platilloService.editarCategoria(this.platillo.id, payload).subscribe({
    next: (res: any) => {
      this.msg.success('Ingredientes actualizados correctamente.');
      
      this.platillo = {
        ...this.platillo,
        ingredientes: result.items.map((i: any) => {
          const productoExistente = this.platillo.ingredientes?.find((x: any) => x.idProducto === i.idProducto);
          const producto = this.productos.find((p: any) => p.idProducto === i.idProducto || p.id === i.idProducto);
          
          return {
            idProducto: i.idProducto,
            nombreProducto: i.nombreProducto ?? productoExistente?.nombreProducto ?? producto?.nombre ?? '',
            cantidadMostrada: i.cantidadMostrada,
            unidadMostrada: i.unidadMostrada,
            cantidadDescuento: i.cantidadDescuento,
            unidadDescuento: i.unidadDescuento
          };
        })
      };
    },
    error: (err: any) => this.msg.error('Error al actualizar los ingredientes.')
  });
}
    });
  }

  initProductos() {
    this.inventarioService.productos().subscribe({
      next: (resp: any) => {
        const list = Array.isArray(resp) ? resp : Array.isArray(resp?.data) ? resp.data : [];

        this.productos = list;
      },
      error: (err) => {
        this.productos = [];
        console.error('Error al cargar productos', err);
      },
    });
  }
}
