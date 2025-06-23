-- Create database tables for bakery

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    image_url VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Products table
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    category_id INTEGER REFERENCES categories(id),
    image_url VARCHAR(255),
    ingredients TEXT[],
    allergens TEXT[],
    nutritional_info JSONB,
    is_available BOOLEAN DEFAULT true,
    stock_quantity INTEGER DEFAULT 0,
    preparation_time INTEGER, -- in minutes
    is_featured BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Customers table
CREATE TABLE IF NOT EXISTS customers (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    address JSONB, -- {street, city, state, zip_code}
    date_of_birth DATE,
    preferences JSONB, -- dietary preferences, favorites, etc.
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER REFERENCES customers(id),
    order_number VARCHAR(20) UNIQUE NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending', -- pending, confirmed, preparing, ready, delivered, cancelled
    order_type VARCHAR(20) DEFAULT 'pickup', -- pickup, delivery
    scheduled_time TIMESTAMP,
    delivery_address JSONB,
    notes TEXT,
    payment_status VARCHAR(20) DEFAULT 'pending', -- pending, paid, refunded
    payment_method VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Order items table
CREATE TABLE IF NOT EXISTS order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id),
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL,
    subtotal DECIMAL(10, 2) NOT NULL,
    special_instructions TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Reviews table
CREATE TABLE IF NOT EXISTS reviews (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER REFERENCES customers(id),
    product_id INTEGER REFERENCES products(id),
    order_id INTEGER REFERENCES orders(id),
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    is_approved BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_available ON products(is_available);
CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_date ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_reviews_product ON reviews(product_id);

-- Insert sample categories
INSERT INTO categories (name, description) VALUES
('Breads', 'Fresh baked breads and loaves'),
('Pastries', 'Delicious pastries and croissants'),
('Cakes', 'Custom and ready-made cakes'),
('Cookies', 'Freshly baked cookies and biscuits'),
('Desserts', 'Special desserts and treats'),
('Seasonal', 'Seasonal and holiday specials')
ON CONFLICT (name) DO NOTHING;

-- Sample products
INSERT INTO products (name, description, price, category_id, ingredients, allergens, is_available, stock_quantity) VALUES
('Sourdough Bread', 'Traditional sourdough with crispy crust', 8.99, 1, ARRAY['flour', 'water', 'salt', 'sourdough starter'], ARRAY['gluten'], true, 20),
('Chocolate Croissant', 'Buttery croissant with dark chocolate', 4.50, 2, ARRAY['flour', 'butter', 'chocolate', 'eggs'], ARRAY['gluten', 'dairy', 'eggs'], true, 15),
('Birthday Cake', 'Custom birthday cake (8 inch)', 35.00, 3, ARRAY['flour', 'sugar', 'eggs', 'butter'], ARRAY['gluten', 'dairy', 'eggs'], true, 5),
('Chocolate Chip Cookies', 'Classic chocolate chip cookies (dozen)', 12.99, 4, ARRAY['flour', 'butter', 'chocolate chips', 'sugar'], ARRAY['gluten', 'dairy'], true, 30)
ON CONFLICT DO NOTHING;