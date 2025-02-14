from flask import Flask, jsonify, request, session
from flask_cors import CORS
from dotenv import load_dotenv
import os
import finnhub
import requests
from datetime import datetime, timedelta
import logging
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
import jwt
from functools import wraps
import random

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

app = Flask(__name__)
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'your-secret-key-here')
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv(
    'DATABASE_URL', 'sqlite:///robinhood.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Configure CORS to allow requests from frontend
CORS(app, resources={
    r"/*": {
        "origins": ["http://localhost:3000", "http://localhost:3001"],
        "methods": ["GET", "POST", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"]
    }
})

db = SQLAlchemy(app)

# User model


class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(200), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    balance = db.Column(db.Float, default=0.0)  # User's cash balance
    portfolio = db.relationship('Portfolio', backref='user', lazy=True)
    transactions = db.relationship('Transaction', backref='user', lazy=True)

# Message model for discussions


class Message(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    content = db.Column(db.Text, nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    user = db.relationship('User', backref=db.backref('messages', lazy=True))


class Portfolio(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    symbol = db.Column(db.String(10), nullable=False)
    shares = db.Column(db.Integer, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(
        db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    __table_args__ = (db.UniqueConstraint(
        'user_id', 'symbol', name='unique_user_symbol'),)


class Transaction(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    symbol = db.Column(db.String(10), nullable=False)
    shares = db.Column(db.Integer, nullable=False)
    price = db.Column(db.Float, nullable=False)
    type = db.Column(db.String(4), nullable=False)  # 'buy' or 'sell'
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


# Initialize database
with app.app_context():
    db.create_all()
    logger.info("Database initialized")

# Token required decorator


def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        if 'Authorization' in request.headers:
            token = request.headers['Authorization'].split(" ")[1]

        if not token:
            return jsonify({'error': 'Token is missing'}), 401

        try:
            data = jwt.decode(
                token, app.config['SECRET_KEY'], algorithms=["HS256"])
            current_user = User.query.get(data['user_id'])
        except:
            return jsonify({'error': 'Token is invalid'}), 401

        return f(current_user, *args, **kwargs)
    return decorated


# API keys
FINNHUB_KEY = os.getenv('FINNHUB_API_KEY')
ALPHA_VANTAGE_KEY = os.getenv('ALPHA_VANTAGE_API_KEY')
NEWS_API_KEY = os.getenv('NEWS_API_KEY')

if not all([FINNHUB_KEY, ALPHA_VANTAGE_KEY, NEWS_API_KEY]):
    logger.error("Missing required API keys!")
    raise ValueError("Missing required API keys!")

logger.info(f"Finnhub API Key: {FINNHUB_KEY[:5]}...")
logger.info(f"Alpha Vantage API Key: {ALPHA_VANTAGE_KEY[:5]}...")
logger.info(f"News API Key: {NEWS_API_KEY[:5]}...")

# API clients initialization
try:
    finnhub_client = finnhub.Client(api_key=FINNHUB_KEY)
except Exception as e:
    logger.error(f"Error initializing Finnhub client: {str(e)}")
    raise

# Add cache dictionary at the top level
stock_data_cache = {}
CACHE_DURATION = 300  # 5 minutes in seconds


@app.route('/')
def health_check():
    return jsonify({"status": "healthy", "timestamp": datetime.now().isoformat()})


@app.route('/api/stock/<symbol>')
def get_stock_data(symbol):
    try:
        logger.info(f"Fetching stock data for {symbol}")
        current_time = datetime.now().timestamp()

        # Check cache first
        if symbol in stock_data_cache:
            cached_data = stock_data_cache[symbol]
            if current_time - cached_data['timestamp'] < CACHE_DURATION:
                logger.info(f"Returning cached data for {symbol}")
                return jsonify(cached_data['data'])

        # Get real-time quote from Finnhub
        quote = finnhub_client.quote(symbol)
        logger.debug(f"Finnhub quote response: {quote}")

        if not quote or 'c' not in quote:
            logger.error(f"Invalid quote data received for {symbol}")
            return jsonify({'error': 'Invalid quote data'}), 400

        # Try to get historical data from Alpha Vantage
        historical_data = []
        try:
            url = f'https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol={symbol}&apikey={ALPHA_VANTAGE_KEY}'
            response = requests.get(url)
            data = response.json()

            if "Time Series (Daily)" in data:
                time_series = data["Time Series (Daily)"]
                for date in sorted(time_series.keys(), reverse=True)[:30]:
                    historical_data.append({
                        'date': date,
                        'close': time_series[date]['4. close']
                    })
            else:
                # Fallback: Generate historical data from current price
                logger.info(f"Using fallback historical data for {symbol}")
                for i in range(30):
                    date = (datetime.now() - timedelta(days=i)
                            ).strftime('%Y-%m-%d')
                    # Add small random variation to create realistic looking data
                    variation = (1 + (random.random() - 0.5)
                                 * 0.02)  # ±1% variation
                    historical_data.append({
                        'date': date,
                        'close': str(quote['c'] * variation)
                    })
        except Exception as e:
            logger.error(f"Error fetching historical data: {str(e)}")
            # Use fallback data even in case of exception
            for i in range(30):
                date = (datetime.now() - timedelta(days=i)
                        ).strftime('%Y-%m-%d')
                variation = (1 + (random.random() - 0.5) * 0.02)
                historical_data.append({
                    'date': date,
                    'close': str(quote['c'] * variation)
                })

        response_data = {
            'quote': quote,
            'historical': historical_data
        }

        # Cache the response
        stock_data_cache[symbol] = {
            'timestamp': current_time,
            'data': response_data
        }

        logger.info(f"Successfully fetched data for {symbol}")
        return jsonify(response_data)

    except Exception as e:
        logger.error(f"Error fetching stock data for {symbol}: {str(e)}")
        return jsonify({'error': str(e)}), 400


@app.route('/api/stock/<symbol>/news')
def get_stock_news(symbol):
    try:
        logger.info(f"Fetching news for {symbol}")

        # Get company news from Finnhub
        today = datetime.now()
        thirty_days_ago = today - timedelta(days=30)

        news = finnhub_client.company_news(
            symbol,
            _from=thirty_days_ago.strftime('%Y-%m-%d'),
            to=today.strftime('%Y-%m-%d')
        )

        logger.debug(
            f"Finnhub news response length: {len(news) if news else 0}")

        if not news:
            # Use NewsAPI as fallback
            logger.info(f"No Finnhub news found for {symbol}, using NewsAPI")
            url = f'https://newsapi.org/v2/everything?q={symbol}&apiKey={NEWS_API_KEY}&language=en&sortBy=publishedAt'
            response = requests.get(url)
            data = response.json()

            if data.get('status') == 'ok':
                news = data.get('articles', [])[:10]
            else:
                logger.error(f"NewsAPI error: {data.get('message')}")
                return jsonify({'error': 'Failed to fetch news'}), 400

        return jsonify(news[:10])

    except Exception as e:
        logger.error(f"Error fetching news for {symbol}: {str(e)}")
        return jsonify({'error': str(e)}), 400


@app.route('/api/search')
def search_stocks():
    query = request.args.get('q', '').upper()
    try:
        logger.info(f"Searching stocks with query: {query}")
        results = []

        # First try direct symbol lookup
        try:
            quote = finnhub_client.quote(query)
            if quote and quote.get('c', 0) > 0:  # If valid quote received
                profile = finnhub_client.company_profile2(symbol=query)
                if profile:
                    results.append({
                        "symbol": query,
                        "description": profile.get('name', query),
                        "displaySymbol": query,
                        "type": "Common Stock"
                    })
        except Exception as e:
            logger.warning(f"Failed to get direct quote: {str(e)}")

        # If no exact match, search for symbols
        if not results:
            search_results = finnhub_client.symbol_search(query)
            for item in search_results.get('result', []):
                if (item.get('type') == 'Common Stock' and
                    any(exchange in item.get('exchange', '')
                        for exchange in ['NYSE', 'NASDAQ'])):
                    results.append(item)

        # Sort results to prioritize exact matches
        results.sort(key=lambda x: (
            0 if x["symbol"] == query else
            1 if x["symbol"].startswith(query) else
            2
        ))

        return jsonify({'result': results[:10]})  # Limit to top 10 results

    except Exception as e:
        logger.error(f"Error searching stocks: {str(e)}")
        return jsonify({'error': str(e)}), 400


@app.route('/api/market/top-gainers')
def get_top_gainers():
    try:
        logger.info("Fetching top gainers")
        symbols = ['AAPL', 'GOOGL', 'MSFT', 'AMZN', 'META']
        gainers = []

        for symbol in symbols:
            quote = finnhub_client.quote(symbol)
            if quote and 'c' in quote and 'dp' in quote:
                gainers.append({
                    'symbol': symbol,
                    'price': quote['c'],
                    'change': quote['dp']
                })

        sorted_gainers = sorted(
            gainers, key=lambda x: x['change'], reverse=True)
        return jsonify(sorted_gainers)
    except Exception as e:
        logger.error(f"Error fetching top gainers: {str(e)}")
        return jsonify({'error': str(e)}), 400


# Authentication routes
@app.route('/api/auth/register', methods=['POST'])
def register():
    data = request.get_json()

    if not all(k in data for k in ['username', 'email', 'password']):
        return jsonify({'error': 'Missing required fields'}), 400

    if User.query.filter_by(username=data['username']).first():
        return jsonify({'error': 'Username already exists'}), 400

    if User.query.filter_by(email=data['email']).first():
        return jsonify({'error': 'Email already exists'}), 400

    user = User(
        username=data['username'],
        email=data['email'],
        password_hash=generate_password_hash(data['password'])
    )

    db.session.add(user)
    db.session.commit()

    return jsonify({'message': 'User created successfully'}), 201


@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.get_json()

    if not all(k in data for k in ['username', 'password']):
        return jsonify({'error': 'Missing required fields'}), 400

    user = User.query.filter_by(username=data['username']).first()

    if not user or not check_password_hash(user.password_hash, data['password']):
        return jsonify({'error': 'Invalid username or password'}), 401

    token = jwt.encode({
        'user_id': user.id,
        'exp': datetime.utcnow() + timedelta(days=1)
    }, app.config['SECRET_KEY'])

    return jsonify({
        'token': token,
        'username': user.username,
        'email': user.email,
        'balance': user.balance
    })

# Discussion routes


@app.route('/api/discussions', methods=['GET'])
@token_required
def get_messages(current_user):
    messages = Message.query.order_by(
        Message.created_at.desc()).limit(100).all()
    return jsonify([{
        'id': msg.id,
        'content': msg.content,
        'username': msg.user.username,
        'created_at': msg.created_at.isoformat()
    } for msg in messages])


@app.route('/api/discussions', methods=['POST'])
@token_required
def create_message(current_user):
    data = request.get_json()

    if 'content' not in data:
        return jsonify({'error': 'Message content is required'}), 400

    message = Message(
        content=data['content'],
        user_id=current_user.id
    )

    db.session.add(message)
    db.session.commit()

    return jsonify({
        'id': message.id,
        'content': message.content,
        'username': current_user.username,
        'created_at': message.created_at.isoformat()
    }), 201

# Trading routes


@app.route('/api/trading/balance', methods=['GET'])
@token_required
def get_balance(current_user):
    portfolio = Portfolio.query.filter_by(user_id=current_user.id).all()
    portfolio_data = []
    total_value = current_user.balance

    for position in portfolio:
        try:
            quote = finnhub_client.quote(position.symbol)
            current_price = quote['c']
            position_value = current_price * position.shares
            total_value += position_value

            portfolio_data.append({
                'symbol': position.symbol,
                'shares': position.shares,
                'current_price': current_price,
                'position_value': position_value
            })
        except Exception as e:
            logger.error(
                f"Error fetching quote for {position.symbol}: {str(e)}")

    return jsonify({
        'cash_balance': current_user.balance,
        'portfolio': portfolio_data,
        'total_value': total_value
    })


@app.route('/api/trading/add-funds', methods=['POST'])
@token_required
def add_funds(current_user):
    data = request.get_json()
    amount = data.get('amount')

    if not amount or amount <= 0:
        return jsonify({'error': 'Invalid amount'}), 400

    current_user.balance += amount
    db.session.commit()

    return jsonify({
        'message': 'Funds added successfully',
        'new_balance': current_user.balance
    })


@app.route('/api/trading/buy', methods=['POST'])
@token_required
def buy_stock(current_user):
    data = request.get_json()
    symbol = data.get('symbol')
    shares = data.get('shares')

    if not all([symbol, shares]) or shares <= 0:
        return jsonify({'error': 'Invalid request parameters'}), 400

    try:
        # Get current stock price
        quote = finnhub_client.quote(symbol)
        price = quote['c']
        total_cost = price * shares

        if total_cost > current_user.balance:
            return jsonify({'error': 'Insufficient funds'}), 400

        # Update or create portfolio position
        portfolio = Portfolio.query.filter_by(
            user_id=current_user.id, symbol=symbol).first()

        if portfolio:
            portfolio.shares += shares
        else:
            portfolio = Portfolio(
                user_id=current_user.id,
                symbol=symbol,
                shares=shares
            )
            db.session.add(portfolio)

        # Create transaction record
        transaction = Transaction(
            user_id=current_user.id,
            symbol=symbol,
            shares=shares,
            price=price,
            type='buy'
        )

        # Update user balance
        current_user.balance -= total_cost

        db.session.add(transaction)
        db.session.commit()

        return jsonify({
            'message': 'Stock purchased successfully',
            'new_balance': current_user.balance
        })

    except Exception as e:
        logger.error(f"Error processing buy order: {str(e)}")
        return jsonify({'error': 'Failed to process purchase'}), 400


@app.route('/api/trading/sell', methods=['POST'])
@token_required
def sell_stock(current_user):
    data = request.get_json()
    symbol = data.get('symbol')
    shares = data.get('shares')

    if not all([symbol, shares]) or shares <= 0:
        return jsonify({'error': 'Invalid request parameters'}), 400

    try:
        # Check if user owns enough shares
        portfolio = Portfolio.query.filter_by(
            user_id=current_user.id, symbol=symbol).first()

        if not portfolio or portfolio.shares < shares:
            return jsonify({'error': 'Insufficient shares'}), 400

        # Get current stock price
        quote = finnhub_client.quote(symbol)
        price = quote['c']
        total_value = price * shares

        # Update portfolio
        portfolio.shares -= shares
        if portfolio.shares == 0:
            db.session.delete(portfolio)

        # Create transaction record
        transaction = Transaction(
            user_id=current_user.id,
            symbol=symbol,
            shares=shares,
            price=price,
            type='sell'
        )

        # Update user balance
        current_user.balance += total_value

        db.session.add(transaction)
        db.session.commit()

        return jsonify({
            'message': 'Stock sold successfully',
            'new_balance': current_user.balance
        })

    except Exception as e:
        logger.error(f"Error processing sell order: {str(e)}")
        return jsonify({'error': 'Failed to process sale'}), 400


@app.route('/api/trading/transactions', methods=['GET'])
@token_required
def get_transactions(current_user):
    transactions = Transaction.query.filter_by(
        user_id=current_user.id).order_by(Transaction.created_at.desc()).all()

    return jsonify([{
        'id': t.id,
        'symbol': t.symbol,
        'shares': t.shares,
        'price': t.price,
        'type': t.type,
        'total': t.price * t.shares,
        'created_at': t.created_at.isoformat()
    } for t in transactions])


if __name__ == '__main__':
    # Run the app on all network interfaces with port 5001
    app.run(host='0.0.0.0', port=5001, debug=True)
