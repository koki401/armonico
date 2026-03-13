import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';

import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-edit-categoria-combo',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
  ],
  templateUrl: './edit-categoria-combo.html',
  styleUrl: './edit-categoria-combo.scss',
})
export class EditCategoriaCombo implements OnInit {
  form!: FormGroup;

  constructor(
    readonly fb: FormBuilder,
    readonly dialogRef: MatDialogRef<EditCategoriaCombo>,
    @Inject(MAT_DIALOG_DATA) public data: { categoria?: any }
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      nombre: ['', [Validators.required, Validators.maxLength(120)]],
      descripcion: ['', [Validators.maxLength(500)]],
    });

    const c = this.data?.categoria;
    if (c) {
      this.form.patchValue({
        nombre: c.nombre ?? '',
        descripcion: c.descripcion ?? '',
      });
    }
  }

  guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { nombre, descripcion } = this.form.value;
    this.dialogRef.close({ nombre, descripcion });
  }
}
