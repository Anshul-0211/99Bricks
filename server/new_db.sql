-- Buyer table
CREATE TABLE Buyer (
    BuyerID SERIAL PRIMARY KEY,
    FName VARCHAR(100) NOT NULL,
    LName VARCHAR(100) NOT NULL,
    Email VARCHAR(255) NOT NULL UNIQUE,
    Phone VARCHAR(10) NOT NULL CHECK (length(Phone) = 10 AND Phone ~ '^[0-9]+$'),
    City VARCHAR(100) NOT NULL,
    State VARCHAR(100) NOT NULL,
    Country VARCHAR(100) NOT NULL,
    Money DECIMAL(12,2) NOT NULL DEFAULT 0.00 CHECK (Money >= 0),
    Pincode VARCHAR(6) NOT NULL CHECK (length(Pincode) = 6 AND Pincode ~ '^[0-9]+$'),
    Password VARCHAR(255) NOT NULL,
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Seller table
CREATE TABLE Seller (
    SellerID SERIAL PRIMARY KEY,
    FName VARCHAR(100) NOT NULL,
    LName VARCHAR(100) NOT NULL,
    Email VARCHAR(255) NOT NULL UNIQUE,
    Phone VARCHAR(10) NOT NULL CHECK (length(Phone) = 10 AND Phone ~ '^[0-9]+$'),
    City VARCHAR(100) NOT NULL,
    State VARCHAR(100) NOT NULL,
    Country VARCHAR(100) NOT NULL,
    Pincode VARCHAR(6) NOT NULL CHECK (length(Pincode) = 6 AND Pincode ~ '^[0-9]+$'),
    Password VARCHAR(255) NOT NULL,
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Category table
CREATE TABLE Category (
    CategoryID SERIAL PRIMARY KEY,
    CategoryName VARCHAR(100) NOT NULL UNIQUE
);

-- Property table
CREATE TABLE Property (
    PropertyID SERIAL PRIMARY KEY,
    SellerID INTEGER NOT NULL REFERENCES Seller(SellerID) ON DELETE CASCADE,
    CategoryID INTEGER NOT NULL REFERENCES Category(CategoryID) ON DELETE RESTRICT,
    Name VARCHAR(255) NOT NULL,
    Price DECIMAL(12,2) NOT NULL CHECK (Price > 0),
    City VARCHAR(100) NOT NULL,
    State VARCHAR(100) NOT NULL,
    Country VARCHAR(100) NOT NULL,
    Pincode VARCHAR(6) NOT NULL CHECK (length(Pincode) = 6 AND Pincode ~ '^[0-9]+$'),
    Description TEXT,
    IsAvailable BOOLEAN DEFAULT TRUE,
    Bedrooms INTEGER,
    Bathrooms INTEGER,
    Area_sqft DECIMAL(10,2),
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Wishlist table
CREATE TABLE Wishlist (
    WishlistID SERIAL PRIMARY KEY,
    BuyerID INTEGER NOT NULL REFERENCES Buyer(BuyerID) ON DELETE CASCADE,
    PropertyID INTEGER NOT NULL REFERENCES Property(PropertyID) ON DELETE CASCADE,
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(BuyerID, PropertyID)
);

-- Transaction table
CREATE TABLE Transaction (
    TransactionID SERIAL PRIMARY KEY,
    BuyerID INTEGER NOT NULL REFERENCES Buyer(BuyerID) ON DELETE RESTRICT,
    PropertyID INTEGER NOT NULL REFERENCES Property(PropertyID) ON DELETE RESTRICT,
    SellerID INTEGER NOT NULL REFERENCES Seller(SellerID) ON DELETE RESTRICT,
    Date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    Price DECIMAL(12,2) NOT NULL CHECK (Price > 0)
);

-- OwnedProperties table
CREATE TABLE OwnedProperties (
    PropertyID INTEGER NOT NULL REFERENCES Property(PropertyID) ON DELETE RESTRICT,
    BuyerID INTEGER NOT NULL REFERENCES Buyer(BuyerID) ON DELETE RESTRICT,
    SellerID INTEGER NOT NULL REFERENCES Seller(SellerID) ON DELETE RESTRICT,
    Property_Name VARCHAR(255) NOT NULL,
    PropertyCity VARCHAR(100) NOT NULL,
    Property_State VARCHAR(100) NOT NULL,
    Property_Country VARCHAR(100) NOT NULL,
    Pincode VARCHAR(6) NOT NULL CHECK (length(Pincode) = 6 AND Pincode ~ '^[0-9]+$'),
    PurchaseDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (PropertyID)
);

-- Inquiry table (not explicitly defined in your tables but needed for the logic)
CREATE TABLE Inquiry (
    InquiryID SERIAL PRIMARY KEY,
    BuyerID INTEGER NOT NULL REFERENCES Buyer(BuyerID) ON DELETE CASCADE,
    PropertyID INTEGER NOT NULL REFERENCES Property(PropertyID) ON DELETE CASCADE,
    SellerID INTEGER NOT NULL REFERENCES Seller(SellerID) ON DELETE CASCADE,
    Message TEXT NOT NULL,
    Date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Relationship tables as defined in your schema

-- Contains relationship
CREATE TABLE Contains (
    PropertyID INTEGER NOT NULL REFERENCES Property(PropertyID) ON DELETE CASCADE,
    SellerID INTEGER NOT NULL REFERENCES Seller(SellerID) ON DELETE CASCADE,
    WishlistID INTEGER NOT NULL REFERENCES Wishlist(WishlistID) ON DELETE CASCADE,
    BuyerID INTEGER NOT NULL REFERENCES Buyer(BuyerID) ON DELETE CASCADE,
    PRIMARY KEY (PropertyID, WishlistID)
);

-- Completes relationship
CREATE TABLE Completes (
    BuyerID INTEGER NOT NULL REFERENCES Buyer(BuyerID) ON DELETE CASCADE,
    TransactionID INTEGER NOT NULL REFERENCES Transaction(TransactionID) ON DELETE CASCADE,
    PRIMARY KEY (BuyerID, TransactionID)
);

-- Involved relationship
CREATE TABLE Involved (
    TransactionID INTEGER NOT NULL REFERENCES Transaction(TransactionID) ON DELETE CASCADE,
    PropertyID INTEGER NOT NULL REFERENCES Property(PropertyID) ON DELETE CASCADE,
    SellerID INTEGER NOT NULL REFERENCES Seller(SellerID) ON DELETE CASCADE,
    PRIMARY KEY (TransactionID, PropertyID, SellerID)
);

-- Concerns relationship
CREATE TABLE Concerns (
    InquiryID INTEGER NOT NULL REFERENCES Inquiry(InquiryID) ON DELETE CASCADE,
    PropertyID INTEGER NOT NULL REFERENCES Property(PropertyID) ON DELETE CASCADE,
    SellerID INTEGER NOT NULL REFERENCES Seller(SellerID) ON DELETE CASCADE,
    BuyerID INTEGER NOT NULL REFERENCES Buyer(BuyerID) ON DELETE CASCADE,
    PRIMARY KEY (InquiryID, PropertyID, SellerID, BuyerID)
);

-- ClassifiedAs relationship
CREATE TABLE ClassifiedAs (
    PropertyID INTEGER NOT NULL REFERENCES Property(PropertyID) ON DELETE CASCADE,
    SellerID INTEGER NOT NULL REFERENCES Seller(SellerID) ON DELETE CASCADE,
    CategoryID INTEGER NOT NULL REFERENCES Category(CategoryID) ON DELETE CASCADE,
    PRIMARY KEY (PropertyID, CategoryID)
);

-- Insert default categories
INSERT INTO Category (CategoryName) VALUES 
('Residential'),
('Commercial'),
('Industrial'),
('Land'),
('Apartment'),
('Villa'),
('Warehouse'); 