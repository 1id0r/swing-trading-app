-- File: /sql/schema.sql
-- PostgreSQL Schema for Trading App

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(30) PRIMARY KEY,
    firebase_uid VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) NOT NULL,
    display_name VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User Settings table
CREATE TABLE IF NOT EXISTS user_settings (
    id VARCHAR(30) PRIMARY KEY,
    user_id VARCHAR(30) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    default_currency VARCHAR(3) DEFAULT 'USD',
    display_currency VARCHAR(3) DEFAULT 'USD',
    tax_rate DECIMAL(5,2) DEFAULT 25.0,
    default_fee DECIMAL(10,2) DEFAULT 9.99,
    theme VARCHAR(20) DEFAULT 'dark',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id)
);

-- Trades table
CREATE TABLE IF NOT EXISTS trades (
    id VARCHAR(30) PRIMARY KEY,
    user_id VARCHAR(30) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    ticker VARCHAR(10) NOT NULL,
    company VARCHAR(255) NOT NULL,
    action VARCHAR(4) NOT NULL CHECK (action IN ('BUY', 'SELL')),
    shares DECIMAL(10,6) NOT NULL,
    price_per_share DECIMAL(10,4) NOT NULL,
    fee DECIMAL(10,2) DEFAULT 0,
    currency VARCHAR(3) DEFAULT 'USD',
    logo VARCHAR(500),
    date TIMESTAMP NOT NULL,
    total_value DECIMAL(15,2) NOT NULL,
    total_cost DECIMAL(15,2) NOT NULL,
    realized_pnl DECIMAL(15,2),
    cost_basis DECIMAL(15,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Positions table
CREATE TABLE IF NOT EXISTS positions (
    id VARCHAR(30) PRIMARY KEY,
    user_id VARCHAR(30) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    ticker VARCHAR(10) NOT NULL,
    company VARCHAR(255) NOT NULL,
    logo VARCHAR(500),
    currency VARCHAR(3) DEFAULT 'USD',
    total_shares DECIMAL(10,6) NOT NULL,
    average_price DECIMAL(10,4) NOT NULL,
    total_cost DECIMAL(15,2) NOT NULL,
    current_price DECIMAL(10,4),
    last_price_update TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, ticker)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_trades_user_id ON trades(user_id);
CREATE INDEX IF NOT EXISTS idx_trades_ticker ON trades(ticker);
CREATE INDEX IF NOT EXISTS idx_trades_date ON trades(date);
CREATE INDEX IF NOT EXISTS idx_trades_user_ticker ON trades(user_id, ticker);
CREATE INDEX IF NOT EXISTS idx_positions_user_id ON positions(user_id);
CREATE INDEX IF NOT EXISTS idx_users_firebase_uid ON users(firebase_uid);

-- Create update timestamp function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_settings_updated_at 
    BEFORE UPDATE ON user_settings 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_trades_updated_at 
    BEFORE UPDATE ON trades 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_positions_updated_at 
    BEFORE UPDATE ON positions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();