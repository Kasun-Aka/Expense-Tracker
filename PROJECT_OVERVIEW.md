# PROJECT 2 — Expense Tracker with OCR

## 1. What is this project?
A personal expense tracking system that lets users upload receipts and automatically extracts expense data using OCR.

## 2. Core Goals
- Reduce manual expense entry
- Provide monthly spending insights
- Learn AI/OCR integration
- Build finance-grade backend logic

## 3. High-Level Architecture
[ Angular Frontend ]
       |
  REST API
       v
[ FastAPI Backend ]
       |
 OCR Processing
       v
[ Tesseract + OpenCV ]
       |
       v
[ PostgreSQL Database ]

## 4. Technology Choices
- **Frontend – Angular + TypeScript**: Strong typing, Enterprise structure, Reactive forms (perfect for finance). Used for Receipt upload UI, Expense forms, Charts & reports, Validation.
- **Backend – Python + FastAPI**: Perfect for AI/OCR, Async, fast, Clean API design. Used for OCR pipeline, Expense processing, Business rules, Auth & security.
- **OCR – Tesseract + OpenCV**: Free, Offline, Proven tech. Used for Text extraction from receipts, Preprocessing images.
- **Database – PostgreSQL**: Strong consistency, SQL analytics, Financial data reliability.

## 5. OCR Flow (Important)
1. User uploads receipt
2. Image preprocessed (grayscale, threshold)
3. OCR extracts raw text
4. Parser extracts: Merchant, Date, Amount
5. User confirms data
6. Stored in DB

## 6. Core Features (MVP)
- Upload receipt image
- OCR extraction
- Manual correction
- Expense categories
- Monthly summary
- CSV export

## 7. Data Model
- users
- receipts
- expenses
- categories

## 8. Folder Structure
**Backend (FastAPI)**
app/
├── api/
├── services/
│   ├── ocr.py
│   ├── parser.py
├── models/
├── main.py

**Frontend (Angular)**
src/app/
├── modules/
│   ├── expenses/
│   ├── receipts/
│   ├── dashboard/

## 9. How We Achieve the Goals
- AI reduces user effort
- User verification ensures accuracy
- SQL enables analytics
- OCR integration proves applied AI skills
