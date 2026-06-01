import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ReceiptUploadResponse {
  receipt_id: number;
  filename: string;
  merchant: string | null;
  amount: number | null;
  date: string | null;
  currency: string;
  category: string | null;
  confidence_score: number | null;
  line_items: string | null;
}

export interface ReceiptOut {
  id: number;
  filename: string;
  merchant: string | null;
  amount: number | null;
  receipt_date: string | null;
  currency: string | null;
  category: string | null;
  confidence_score: number | null;
  line_items: string | null;
  processed: boolean;
  created_at: string;
}

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private http = inject(HttpClient);
  private baseUrl = 'http://localhost:8000';

  uploadReceipt(file: File): Observable<ReceiptUploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<ReceiptUploadResponse>(`${this.baseUrl}/receipts/upload`, formData);
  }

  getReceipts(): Observable<ReceiptOut[]> {
    return this.http.get<ReceiptOut[]>(`${this.baseUrl}/receipts`);
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
