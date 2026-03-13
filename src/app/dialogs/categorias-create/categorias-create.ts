import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { CategoriaCombo } from '../../model/categoriacombo';
@Component({
  selector: 'app-categorias-create',
  standalone: true,
  imports: [
    MatDialogModule, ReactiveFormsModule,
    MatFormFieldModule, MatInputModule, MatButtonModule, MatCheckboxModule
  ],
  templateUrl: './categorias-create.html',
  styleUrl: './categorias-create.scss'
})
export class CategoriasCreate {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<CategoriaCombo>);
  data = inject(MAT_DIALOG_DATA, { optional: true }) as { preset?: any } | null;

  loading = false;

  form = this.fb.group({
    nombre: ['', [Validators.required, Validators.maxLength(120)]],
    descripcion: ['', [Validators.maxLength(300)]],
    activo: [true]
  });

  guardar(): void {
    if (this.form.invalid || this.loading) return;
    this.loading = true;
    this.dialogRef.close(this.form.value);
  }
}
