-- Create the database
CREATE DATABASE bricks;

-- Connect to the database
\c bricks

-- Create buyer table
CREATE TABLE buyer (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone_number VARCHAR(20),
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create seller table
CREATE TABLE seller (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone_number VARCHAR(20),
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create property table
CREATE TABLE property (
    id SERIAL PRIMARY KEY,
    seller_id INTEGER REFERENCES seller(id),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    location VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    bedrooms INTEGER,
    bathrooms INTEGER,
    area_sqft DECIMAL(10,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert sample buyer
INSERT INTO buyer (first_name, last_name, email, phone_number, password)
VALUES ('John', 'Doe', 'john@example.com', '1234567890', '$2b$10$YourHashedPasswordHere');

-- Insert sample seller
INSERT INTO seller (first_name, last_name, email, phone_number, password)
VALUES ('Jane', 'Smith', 'jane@example.com', '0987654321', '$2b$10$YourHashedPasswordHere');

-- Insert sample properties
INSERT INTO property (seller_id, title, description, location, category, price, bedrooms, bathrooms, area_sqft)
VALUES 
(1, 'Modern Apartment', 'Beautiful modern apartment in city center', 'Mumbai', 'Apartment', 7500000, 2, 2, 1200),
(1, 'Luxury Villa', 'Spacious villa with garden', 'Delhi', 'Villa', 15000000, 4, 3, 2500),
(1, 'Studio Apartment', 'Cozy studio in prime location', 'Bangalore', 'Apartment', 4500000, 1, 1, 600); 