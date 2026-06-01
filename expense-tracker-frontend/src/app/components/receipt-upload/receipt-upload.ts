import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ApiService } from '../../services/api.service';

const MAX_FILE_SIZE_MB = 5;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

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
          accept="image/jpeg,image/png,image/webp">
          
        <div class="drop-content" *ngIf="!isUploading">
          <svg style="width: 48px; height: 48px; margin-bottom: 1rem; color: var(--primary-color);" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
          </svg>
          <p>Drag and drop your receipt here</p>
          <p style="font-size: 0.8rem; color: var(--text-muted); margin-top: 0.5rem;">or click to browse</p>
          <p style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.75rem;">
            JPEG, PNG, WebP • Max ${MAX_FILE_SIZE_MB}MB
          </p>
        </div>
        
        <div class="drop-content" *ngIf="isUploading">
          <div class="spinner"></div>
          <p style="margin-top: 1rem;">Analyzing receipt with AI...</p>
          <p style="font-size: 0.8rem; color: var(--text-muted); margin-top: 0.5rem;">This may take a few seconds</p>
        </div>
      </div>

      <!-- Error message -->
      <div *ngIf="errorMessage" class="error-banner">
        <svg style="width: 20px; height: 20px; flex-shrink: 0;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
        </svg>
        <span>{{ errorMessage }}</span>
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
    .error-banner {
      margin-top: 1.5rem;
      padding: 1rem 1.25rem;
      background: rgba(239, 68, 68, 0.1);
      border: 1px solid rgba(239, 68, 68, 0.3);
      border-radius: var(--radius-md);
      color: var(--danger-color);
      display: flex;
      align-items: center;
      gap: 0.75rem;
      font-size: 0.9rem;
      animation: fadeIn 0.3s ease;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(-8px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `]
})
export class ReceiptUpload {
  isDragging = false;
  isUploading = false;
  errorMessage: string | null = null;
  
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
    this.errorMessage = null;

    // --- Client-side security validation ---
    
    // 1. Check file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      this.errorMessage = `Invalid file type "${file.type || 'unknown'}". Please upload a JPEG, PNG, or WebP image.`;
      return;
    }

    // 2. Check file size
    if (file.size > MAX_FILE_SIZE_BYTES) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
      this.errorMessage = `File too large (${sizeMB} MB). Maximum allowed size is ${MAX_FILE_SIZE_MB} MB.`;
      return;
    }

    // 3. Check if file is empty
    if (file.size === 0) {
      this.errorMessage = 'The selected file is empty.';
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
        
        // Show specific error from backend if available
        if (err.error?.detail) {
          this.errorMessage = err.error.detail;
        } else if (err.status === 429) {
          this.errorMessage = 'Too many uploads. Please wait a moment and try again.';
        } else {
          this.errorMessage = 'Failed to process receipt. Please try again.';
        }
      }
    });
  }
}
