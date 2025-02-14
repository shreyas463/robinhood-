# Robinhood Clone

A full-stack web application that clones core features of Robinhood, built with Next.js and Flask.

## Features
- Real-time stock price tracking
- Interactive stock charts using Chart.js
- Stock-related news feed
- User authentication
- Watchlist functionality
- Stock search and details

## Tech Stack
### Frontend
- Next.js (React framework)
- Chart.js for interactive graphs
- TailwindCSS for styling
- TypeScript for type safety

### Backend
- Flask (Python)
- SQLAlchemy for database management
- Alpha Vantage/Finnhub API for stock data
- News API for stock-related news

## Setup Instructions

### Backend Setup
1. Navigate to the backend directory:
```bash
cd backend
```

2. Create and activate a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Set up environment variables:
```bash
cp .env.example .env
# Add your API keys to .env file
```

5. Run the Flask server:
```bash
python app.py
```

### Frontend Setup
1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
# Add your API configuration to .env.local
```

4. Run the development server:
```bash
npm run dev
```

## API Keys Required
- Alpha Vantage API key (for stock data)
- Finnhub API key (for real-time stock updates)
- News API key (for stock-related news)

## Contributing
Feel free to submit issues and enhancement requests!

## Running the Project
1. Start the backend server:
   - Navigate to the `backend` directory and run `python app.py`.
2. Start the frontend server:
   - Navigate to the `frontend` directory and run `npm run dev`.
3. Access the application at `http://localhost:3000`.

## Troubleshooting
- Ensure all environment variables are correctly set in `.env` and `.env.local`.
- Check API key validity and quota limits.
- Verify that both backend and frontend servers are running without errors.
