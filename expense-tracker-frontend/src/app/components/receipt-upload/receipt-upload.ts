import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-receipt-upload',
  imports: [CommonModule],
  template: `
    <div class="glass-card upload-container">
      <h2 style="margin-bottom: 1rem; text-align: center;">Upload Receipt</h2>
      <p style="color: var(--text-muted); text-align: center; margin-bottom: 2rem;">
        Upload a receipt image and let AI extract the details automatically.
      </p>
      
      <div 
        class="drop-zone" 
        [class.dragging]="isDragging"
        (dragover)="onDragOver($event)"
        (dragleave)="onDragLeave($event)"
        (drop)="onDrop($event)"
        (click)="fileInput.click()">
        
        <input 
          type="file" 
          #fileInput 
          style="display: none;" 
          (change)="onFileSelected($event)" 
          accept="image/*">
          
        <div class="drop-content" *ngIf="!isUploading">
          <svg style="width: 48px; height: 48px; margin-bottom: 1rem; color: var(--primary-color);" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
          </svg>
          <p>Drag and drop your receipt here</p>
          <p style="font-size: 0.8rem; color: var(--text-muted); margin-top: 0.5rem;">or click to browse</p>
        </div>
        
        <div class="drop-content" *ngIf="isUploading">
          <div class="spinner"></div>
          <p style="margin-top: 1rem;">Analyzing receipt...</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .upload-container {
      max-width: 600px;
      margin: 4rem auto;
    }
    .drop-zone {
      border: 2px dashed var(--glass-border);
      border-radius: var(--radius-lg);
      padding: 4rem 2rem;
      text-align: center;
      cursor: pointer;
      transition: var(--transition);
      background: rgba(15, 23, 42, 0.4);
    }
    .drop-zone:hover, .drop-zone.dragging {
      border-color: var(--primary-color);
      background: rgba(59, 130, 246, 0.1);
    }
    .drop-content {
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    .spinner {
      border: 4px solid rgba(255, 255, 255, 0.1);
      border-left-color: var(--primary-color);
      border-radius: 50%;
      width: 40px;
      height: 40px;
      animation: spin 1s linear infinite;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `]
})
export class ReceiptUpload {
  isDragging = false;
  isUploading = false;
  
  private api = inject(ApiService);
  private router = inject(Router);

  onDragOver(event: DragEvent) {
    event.preventDefault();
    this.isDragging = true;
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    this.isDragging = false;
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    this.isDragging = false;
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.handleFile(files[0]);
    }
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.handleFile(file);
    }
  }

  handleFile(file: File) {
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file.');
      return;
    }
    
    this.isUploading = true;
    this.api.uploadReceipt(file).subscribe({
      next: (response) => {
        this.isUploading = false;
        // Pass data via state to the verify form
        this.router.navigate(['/verify'], { state: { data: response } });
      },
      error: (err) => {
        this.isUploading = false;
        console.error('Upload failed', err);
        alert('Failed to process receipt.');
      }
    });
  }
}
