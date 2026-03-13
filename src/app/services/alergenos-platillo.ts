import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../app/assets/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AlergenosPlatillo {

  constructor(readonly http:HttpClient){}

  crearPlatillo(body:any):Observable<any>{
    const apiUrl = environment.production ? 'https://armonico.fly.dev' : '/api';
    const token = localStorage.getItem('token') || '';
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    });
    return this.http.post(`${apiUrl}/platillos/alergenos/guardar`, body, {
      headers,
    });
  }
  
}
