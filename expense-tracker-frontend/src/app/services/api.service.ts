import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private http = inject(HttpClient);
  private baseUrl = 'http://localhost:8000';

  uploadReceipt(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post(`${this.baseUrl}/receipts/upload`, formData);
  }

  getExpenses(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/expenses`);
  }

  saveExpense(data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/expenses`, data);
  }

  getCategories(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/categories`);
  }
}
