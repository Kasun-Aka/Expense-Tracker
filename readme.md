# Expense Tracker 💸

A personal expense tracking system that lets users upload receipts and automatically extracts expense data using AI. The project is designed to reduce manual expense entry, provide monthly spending insights, and leverage modern web and AI technologies.

---

## 🌟 Core Features

- **Receipt Upload**: Upload receipt images for processing.
- **AI-Powered Data Extraction**: Automatically extracts Merchant, Date, Amount, and Line Items using Google Gemini AI.
- **Manual Correction & Confirmation**: Users can review, correct, and confirm the extracted data.
- **Multi-Currency Support**: Automatically converts foreign currencies to LKR using live exchange rates.
- **Monthly Summary & Insights**: Track spending with categorized expenses.

## 🛠 Technology Stack

The project's technology stack has evolved from the original concept and currently uses:

### Frontend
- **Angular + TypeScript**: Strong typing, enterprise-grade structure, and reactive forms.
- Handles receipt upload UI, expense forms, charts, and reports.

### Backend
- **Python + FastAPI**: Fast, async, and clean API design.
- Handles the AI pipeline, expense processing, business rules, and security.

### AI / OCR
- **Google Gemini API**: Replaced the original Tesseract/OpenCV approach for more accurate and intelligent text extraction from receipts.

### Database
- **Microsoft SQL Server**: Robust relational database for strong consistency and financial data reliability (using `pyodbc` and SQLAlchemy).

---

## 📂 Folder Structure

- **`expense-tracker-backend/`**: Contains the FastAPI application, models, database configurations, and Gemini AI integration.
- **`expense-tracker-frontend/`**: Contains the Angular frontend application.

---

## 🚀 Getting Started

### Prerequisites
- Node.js & npm (for Angular frontend)
- Python 3.9+ (for FastAPI backend)
- Microsoft SQL Server
- Google Gemini API Key

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd expense-tracker-backend
   ```
2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows use: venv\Scripts\activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Configure environment variables. Create a `.env` file in the backend directory based on the following:
   ```env
   DATABASE_URL=mssql+pyodbc://<user>:<password>@localhost/<db_name>?driver=ODBC+Driver+17+for+SQL+Server
   GEMINI_API_KEY=your_gemini_api_key_here
   ```
5. Run the FastAPI development server:
   ```bash
   uvicorn app.main:app --reload
   ```

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd expense-tracker-frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Angular development server:
   ```bash
   npm start
   ```
4. Access the application at `http://localhost:4200`.

---

## 💡 How It Works

1. **Upload**: User uploads a receipt image via the Angular frontend.
2. **AI Analysis**: The FastAPI backend sends the image to Google Gemini, which extracts structured data.
3. **Review**: The parsed data (Merchant, Date, Amount, Line Items) is returned to the user for verification.
4. **Currency Conversion**: If the receipt is not in LKR, the backend automatically fetches the latest exchange rate and calculates the LKR equivalent.
5. **Storage**: Upon confirmation, the expense is saved to the SQL Server database.

---
_🚧 This project is actively under development._
