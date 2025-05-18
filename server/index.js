const express = require('express');
const app = express();
const cors = require('cors');
const bcrypt = require('bcrypt');
const pool = require('./db');

app.use(cors());
app.use(express.json());

// In-memory data store
const buyers = [
    {
        id: 1,
        name: "John Doe",
        email: "john@example.com",
        password: "password123"
    }
];

const sellers = [
    {
        id: 1,
        name: "Jane Smith",
        email: "jane@example.com",
        password: "password123"
    }
];

const properties = [
    {
        id: 1,
        title: "Luxury Villa",
        description: "Beautiful villa with pool",
        price: 5000000,
        location: "Mumbai",
        category: "residential",
        image: "https://images.unsplash.com/photo-1512917774080-9991f681c3f1",
        seller_id: 1
    },
    {
        id: 2,
        seller_id: 1,
        title: 'Modern Apartment',
        description: 'Beautiful modern apartment in city center',
        location: 'Mumbai',
        category: 'Apartment',
        price: 7500000,
        bedrooms: 2,
        bathrooms: 2,
        area_sqft: 1200
    },
    {
        id: 3,
        seller_id: 1,
        title: 'Studio Apartment',
        description: 'Cozy studio in prime location',
        location: 'Bangalore',
        category: 'Apartment',
        price: 4500000,
        bedrooms: 1,
        bathrooms: 1,
        area_sqft: 600
    }
];

// In-memory data stores for additional features
const wishlists = {};
const wallets = {};
const ownedProperties = {};
const inquiries = [];
const transactions = [];

// Authentication Endpoints
app.post('/api/seller/register', async (req, res) => {
    const client = await pool.connect();
    try {
        const { fname, lname, email, phone, city, state, country, pincode, password } = req.body;
        
        // Input validation
        if (!email || !password || !fname || !lname || !phone || !city || !state || !country || !pincode) {
            return res.status(400).json({ message: 'All fields are required' });
        }
        
        if (!/^\d{10}$/.test(phone)) {
            return res.status(400).json({ message: 'Phone number must be 10 digits' });
        }
        
        if (!/^\d{6}$/.test(pincode)) {
            return res.status(400).json({ message: 'Pincode must be 6 digits' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        
        await client.query('BEGIN');

        const insertQuery = `
            INSERT INTO Seller (FName, LName, Email, Phone, City, State, Country, Pincode, Password)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING SellerID, FName, LName, Email
        `;
        
        const result = await client.query(insertQuery, 
            [fname, lname, email, phone, city, state, country, pincode, hashedPassword]
        );
        
        await client.query('COMMIT');
        
        res.json({
            message: 'Registration successful',
            seller: result.rows[0]
        });
    } catch (error) {
        await client.query('ROLLBACK');
        if (error.constraint === 'seller_email_key') {
            return res.status(400).json({ message: 'Email already exists' });
        }
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    } finally {
        client.release();
    }
});

app.post('/api/buyer/register', async (req, res) => {
    const client = await pool.connect();
    try {
        const { fname, lname, email, phone, city, state, country, pincode, password } = req.body;
        
        // Input validation
        if (!email || !password || !fname || !lname || !phone || !city || !state || !country || !pincode) {
            return res.status(400).json({ message: 'All fields are required' });
        }
        
        if (!/^\d{10}$/.test(phone)) {
            return res.status(400).json({ message: 'Phone number must be 10 digits' });
        }
        
        if (!/^\d{6}$/.test(pincode)) {
            return res.status(400).json({ message: 'Pincode must be 6 digits' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        
        await client.query('BEGIN');

        const insertQuery = `
            INSERT INTO Buyer (FName, LName, Email, Phone, City, State, Country, Pincode, Password)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING BuyerID, FName, LName, Email
        `;
        
        const result = await client.query(insertQuery, 
            [fname, lname, email, phone, city, state, country, pincode, hashedPassword]
        );
        
        await client.query('COMMIT');
        
        res.json({
            message: 'Registration successful',
            buyer: result.rows[0]
        });
    } catch (error) {
        await client.query('ROLLBACK');
        if (error.constraint === 'buyer_email_key') {
            return res.status(400).json({ message: 'Email already exists' });
        }
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    } finally {
        client.release();
    }
});

app.post('/api/seller/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }

        const query = 'SELECT * FROM Seller WHERE Email = $1';
        const result = await pool.query(query, [email]);
        
        if (result.rows.length === 0) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const seller = result.rows[0];
        const validPassword = await bcrypt.compare(password, seller.password);
        
        if (!validPassword) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Don't send password in response
        delete seller.password;
        res.json({ 
            message: 'Login successful', 
            seller
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

app.post('/api/buyer/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }

        const query = 'SELECT * FROM Buyer WHERE Email = $1';
        const result = await pool.query(query, [email]);
        
        if (result.rows.length === 0) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const buyer = result.rows[0];
        const validPassword = await bcrypt.compare(password, buyer.password);
        
        if (!validPassword) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Don't send password in response
        delete buyer.password;
        res.json({ 
            message: 'Login successful', 
            buyer
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Property Management Endpoints
app.post('/api/properties', async (req, res) => {
    const client = await pool.connect();
    try {
        const { 
            seller_id, category_id, name, price, city, state, country, 
            pincode, description, bedrooms, bathrooms, area_sqft 
        } = req.body;

        // Enhanced input validation
        if (!seller_id || !category_id || !name || !price || !city || !state || !country || !pincode) {
            return res.status(400).json({ message: 'Required fields missing' });
        }

        // Validate numeric fields
        if (isNaN(parseFloat(price)) || parseFloat(price) <= 0) {
            return res.status(400).json({ message: 'Invalid price' });
        }

        if (bedrooms && (isNaN(parseInt(bedrooms)) || parseInt(bedrooms) < 0)) {
            return res.status(400).json({ message: 'Invalid number of bedrooms' });
        }

        if (bathrooms && (isNaN(parseInt(bathrooms)) || parseInt(bathrooms) < 0)) {
            return res.status(400).json({ message: 'Invalid number of bathrooms' });
        }

        if (area_sqft && (isNaN(parseFloat(area_sqft)) || parseFloat(area_sqft) <= 0)) {
            return res.status(400).json({ message: 'Invalid area' });
        }

        // Validate pincode
        if (!/^\d{6}$/.test(pincode)) {
            return res.status(400).json({ message: 'Pincode must be 6 digits' });
        }

        await client.query('BEGIN');

        // Verify seller exists
        const sellerCheck = await client.query('SELECT SellerID FROM Seller WHERE SellerID = $1', [seller_id]);
        if (sellerCheck.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: 'Seller not found' });
        }

        // Verify category exists
        const categoryCheck = await client.query('SELECT CategoryID FROM Category WHERE CategoryID = $1', [category_id]);
        if (categoryCheck.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: 'Category not found' });
        }

        // Insert property with parsed numeric values
        const insertPropertyQuery = `
            INSERT INTO Property (
                SellerID, CategoryID, Name, Price, City, State, Country, 
                Pincode, Description, Bedrooms, Bathrooms, Area_sqft
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
            RETURNING PropertyID
        `;
        
        const propertyResult = await client.query(insertPropertyQuery, [
            seller_id,
            category_id,
            name,
            parseFloat(price),
            city,
            state,
            country,
            pincode,
            description,
            bedrooms ? parseInt(bedrooms) : null,
            bathrooms ? parseInt(bathrooms) : null,
            area_sqft ? parseFloat(area_sqft) : null
        ]);

        // Create ClassifiedAs relationship
        const propertyId = propertyResult.rows[0].propertyid;
        await client.query(
            'INSERT INTO ClassifiedAs (PropertyID, SellerID, CategoryID) VALUES ($1, $2, $3)',
            [propertyId, seller_id, category_id]
        );

        await client.query('COMMIT');
        
        res.json({
            message: 'Property added successfully',
            property_id: propertyId
        });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    } finally {
        client.release();
    }
});

app.get('/api/properties', async (req, res) => {
    try {
        const { city, state, category_id, min_price, max_price } = req.query;
        
        let query = `
            SELECT 
                p.*,
                c.CategoryName,
                s.FName as seller_fname,
                s.LName as seller_lname,
                s.Email as seller_email,
                s.Phone as seller_phone
            FROM Property p
            JOIN Category c ON p.CategoryID = c.CategoryID
            JOIN Seller s ON p.SellerID = s.SellerID
            WHERE p.IsAvailable = true
        `;
        
        const params = [];
        if (city) {
            params.push(city);
            query += ` AND p.City ILIKE $${params.length}`;
        }
        if (state) {
            params.push(state);
            query += ` AND p.State ILIKE $${params.length}`;
        }
        if (category_id) {
            params.push(parseInt(category_id));
            query += ` AND p.CategoryID = $${params.length}`;
    }
        if (min_price) {
            params.push(parseFloat(min_price));
            query += ` AND p.Price >= $${params.length}`;
        }
        if (max_price) {
            params.push(parseFloat(max_price));
            query += ` AND p.Price <= $${params.length}`;
        }

        query += ' ORDER BY p.CreatedAt DESC';

        const result = await pool.query(query, params);
        
        if (result.rows.length === 0) {
            return res.json({ 
                message: "No properties found matching your criteria", 
                properties: [] 
            });
        }
    
        res.json({
            message: "Properties retrieved successfully",
            count: result.rows.length,
            properties: result.rows
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

app.get('/api/seller-properties/:sellerId', async (req, res) => {
    try {
        const { sellerId } = req.params;
        
        const query = `
            SELECT p.*, c.CategoryName
            FROM Property p
            JOIN Category c ON p.CategoryID = c.CategoryID
            WHERE p.SellerID = $1
        `;
        
        const result = await pool.query(query, [sellerId]);
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Wishlist Management
app.post('/api/properties/:propertyId/wishlist', async (req, res) => {
    const client = await pool.connect();
    try {
        const { propertyId } = req.params;
        const { buyerId } = req.body;

        await client.query('BEGIN');

        // Insert into Wishlist
        const wishlistQuery = `
            INSERT INTO Wishlist (BuyerID, PropertyID)
            VALUES ($1, $2)
            RETURNING WishlistID
        `;
        const wishlistResult = await client.query(wishlistQuery, [buyerId, propertyId]);
        
        // Get property seller
        const propertyQuery = 'SELECT SellerID FROM Property WHERE PropertyID = $1';
        const propertyResult = await client.query(propertyQuery, [propertyId]);
        
        // Insert into Contains relationship
        await client.query(
            'INSERT INTO Contains (PropertyID, SellerID, WishlistID, BuyerID) VALUES ($1, $2, $3, $4)',
            [propertyId, propertyResult.rows[0].sellerid, wishlistResult.rows[0].wishlistid, buyerId]
        );

        await client.query('COMMIT');
    
    res.json({ message: 'Property added to wishlist' });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    } finally {
        client.release();
    }
});

app.get('/api/wishlist/:buyerId', async (req, res) => {
    try {
        const { buyerId } = req.params;
        
        const query = `
            SELECT p.*, c.CategoryName
            FROM Property p
            JOIN Category c ON p.CategoryID = c.CategoryID
            JOIN Wishlist w ON p.PropertyID = w.PropertyID
            WHERE w.BuyerID = $1
        `;
        
        const result = await pool.query(query, [buyerId]);
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Wallet Management
app.get('/api/wallet/:buyerId', async (req, res) => {
    try {
        const { buyerId } = req.params;
        
        const query = 'SELECT Money as balance FROM Buyer WHERE BuyerID = $1';
        const result = await pool.query(query, [buyerId]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Buyer not found' });
        }
        
        res.json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

app.post('/api/wallet/:buyerId/add', async (req, res) => {
    const client = await pool.connect();
    try {
        const { buyerId } = req.params;
    const { amount } = req.body;
    
        if (!amount || amount <= 0) {
            return res.status(400).json({ message: 'Invalid amount' });
        }

        await client.query('BEGIN');

        const query = `
            UPDATE Buyer 
            SET Money = Money + $1 
            WHERE BuyerID = $2
            RETURNING Money as balance
        `;
        
        const result = await client.query(query, [amount, buyerId]);
        
        if (result.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: 'Buyer not found' });
        }

        await client.query('COMMIT');
        
        res.json(result.rows[0]);
    } catch (error) {
        await client.query('ROLLBACK');
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    } finally {
        client.release();
    }
});

// Property Purchase
app.post('/api/properties/:propertyId/buy', async (req, res) => {
    const client = await pool.connect();
    try {
        const { propertyId } = req.params;
        const { buyerId } = req.body;

        if (!buyerId) {
            return res.status(400).json({ message: 'Buyer ID is required' });
        }

        await client.query('BEGIN');

        // Get property details with seller info
        const propertyQuery = `
            SELECT 
                p.*,
                s.SellerID,
                s.FName as seller_fname,
                s.LName as seller_lname
            FROM Property p
            JOIN Seller s ON p.SellerID = s.SellerID
            WHERE p.PropertyID = $1 AND p.IsAvailable = true
            FOR UPDATE
        `;
        const propertyResult = await client.query(propertyQuery, [propertyId]);

        if (propertyResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: 'Property not found or not available' });
    }

        const property = propertyResult.rows[0];

        // Check if buyer exists and get their balance
        const buyerQuery = 'SELECT BuyerID, Money, FName, LName FROM Buyer WHERE BuyerID = $1 FOR UPDATE';
        const buyerResult = await client.query(buyerQuery, [buyerId]);

        if (buyerResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: 'Buyer not found' });
    }

        const buyer = buyerResult.rows[0];
        if (buyer.money < property.price) {
            await client.query('ROLLBACK');
        return res.status(400).json({
                message: 'Insufficient balance',
            required: property.price,
                available: buyer.money
        });
    }

        // Create transaction
        const transactionQuery = `
            INSERT INTO Transaction (BuyerID, PropertyID, SellerID, Price)
            VALUES ($1, $2, $3, $4)
            RETURNING TransactionID
        `;
        const transactionResult = await client.query(transactionQuery, 
            [buyerId, propertyId, property.sellerid, property.price]
        );

        // Update buyer's balance
        await client.query(
            'UPDATE Buyer SET Money = Money - $1 WHERE BuyerID = $2',
            [property.price, buyerId]
        );

        // Mark property as unavailable
        await client.query(
            'UPDATE Property SET IsAvailable = false WHERE PropertyID = $1',
            [propertyId]
        );

    // Add to owned properties
        await client.query(`
            INSERT INTO OwnedProperties (
                PropertyID, BuyerID, SellerID, Property_Name,
                PropertyCity, Property_State, Property_Country, Pincode
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `, [
            propertyId,
            buyerId,
            property.sellerid,
            property.name,
            property.city,
            property.state,
            property.country,
            property.pincode
        ]);

        // Create relationships
        await client.query(
            'INSERT INTO Completes (BuyerID, TransactionID) VALUES ($1, $2)',
            [buyerId, transactionResult.rows[0].transactionid]
        );

        await client.query(
            'INSERT INTO Involved (TransactionID, PropertyID, SellerID) VALUES ($1, $2, $3)',
            [transactionResult.rows[0].transactionid, propertyId, property.sellerid]
        );

        await client.query('COMMIT');

        // Get updated balance
        const updatedBalanceResult = await pool.query(
            'SELECT Money as balance FROM Buyer WHERE BuyerID = $1',
            [buyerId]
        );

    res.json({
        message: 'Purchase successful',
            transaction_id: transactionResult.rows[0].transactionid,
            property_name: property.name,
            seller_name: `${property.seller_fname} ${property.seller_lname}`,
            amount_paid: property.price,
            new_balance: updatedBalanceResult.rows[0].balance
    });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    } finally {
        client.release();
    }
});

// Inquiry Management
app.post('/api/properties/:propertyId/inquire', async (req, res) => {
    const client = await pool.connect();
    try {
        const { propertyId } = req.params;
        const { buyerId, message } = req.body;

        if (!message) {
            return res.status(400).json({ message: 'Message is required' });
        }

        await client.query('BEGIN');

        // Get property seller
        const propertyQuery = 'SELECT SellerID FROM Property WHERE PropertyID = $1';
        const propertyResult = await client.query(propertyQuery, [propertyId]);
        
        if (propertyResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: 'Property not found' });
        }

        // Create inquiry
        const inquiryQuery = `
            INSERT INTO Inquiry (BuyerID, PropertyID, SellerID, Message)
            VALUES ($1, $2, $3, $4)
            RETURNING InquiryID
        `;
        const inquiryResult = await client.query(inquiryQuery, 
            [buyerId, propertyId, propertyResult.rows[0].sellerid, message]
        );

        // Create relationship
        await client.query(`
            INSERT INTO Concerns (InquiryID, PropertyID, SellerID, BuyerID)
            VALUES ($1, $2, $3, $4)
        `, [
            inquiryResult.rows[0].inquiryid,
            propertyId,
            propertyResult.rows[0].sellerid,
            buyerId
        ]);

        await client.query('COMMIT');
        
    res.json({ message: 'Inquiry sent successfully' });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    } finally {
        client.release();
    }
});

app.get('/api/seller-inquiries/:sellerId', async (req, res) => {
    try {
        const { sellerId } = req.params;
        
        const query = `
            SELECT i.*, 
                   p.Name as property_title,
                   b.FName || ' ' || b.LName as buyer_name
            FROM Inquiry i
            JOIN Property p ON i.PropertyID = p.PropertyID
            JOIN Buyer b ON i.BuyerID = b.BuyerID
            WHERE i.SellerID = $1
            ORDER BY i.Date DESC
        `;
    
        const result = await pool.query(query, [sellerId]);
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Category Management Endpoints
app.get('/api/categories', async (req, res) => {
    try {
        const query = 'SELECT * FROM Category ORDER BY CategoryName';
        const result = await pool.query(query);
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

app.post('/api/categories', async (req, res) => {
    const client = await pool.connect();
    try {
        const { categoryName } = req.body;
    
        if (!categoryName) {
            return res.status(400).json({ message: 'Category name is required' });
    }
    
        await client.query('BEGIN');
        
        const query = `
            INSERT INTO Category (CategoryName)
            VALUES ($1)
            RETURNING *
        `;
        
        const result = await client.query(query, [categoryName]);
        await client.query('COMMIT');
        
        res.json({
            message: 'Category added successfully',
            category: result.rows[0]
        });
    } catch (error) {
        await client.query('ROLLBACK');
        if (error.constraint === 'category_categoryname_key') {
            return res.status(400).json({ message: 'Category already exists' });
        }
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    } finally {
        client.release();
    }
});

// Get Owned Properties
app.get('/api/owned-properties/:buyerId', async (req, res) => {
    try {
        const { buyerId } = req.params;
        
        const query = `
            SELECT op.*, p.Description, p.Bedrooms, p.Bathrooms, p.Area_sqft,
                   s.FName || ' ' || s.LName as seller_name
            FROM OwnedProperties op
            JOIN Property p ON op.PropertyID = p.PropertyID
            JOIN Seller s ON op.SellerID = s.SellerID
            WHERE op.BuyerID = $1
            ORDER BY op.PurchaseDate DESC
        `;
        
        const result = await pool.query(query, [buyerId]);
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get single property details
app.get('/api/properties/:propertyId', async (req, res) => {
    try {
        const { propertyId } = req.params;
        
        const query = `
            SELECT p.*, c.CategoryName
            FROM Property p
            JOIN Category c ON p.CategoryID = c.CategoryID
            WHERE p.PropertyID = $1
        `;
        
        const result = await pool.query(query, [propertyId]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Property not found' });
        }
        
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error fetching property details:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete property endpoint
app.delete('/api/properties/:propertyId', async (req, res) => {
    const client = await pool.connect();
    try {
        const { propertyId } = req.params;
        const { sellerId } = req.query;

        await client.query('BEGIN');

        // First verify if property exists and belongs to the seller
        const checkQuery = `
            SELECT IsAvailable 
            FROM Property 
            WHERE PropertyID = $1 AND SellerID = $2
        `;
        const checkResult = await client.query(checkQuery, [propertyId, sellerId]);

        if (checkResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: 'Property not found or unauthorized' });
        }

        if (!checkResult.rows[0].isavailable) {
            await client.query('ROLLBACK');
            return res.status(400).json({ message: 'Cannot delete sold property' });
        }

        // Delete related records first
        await client.query('DELETE FROM ClassifiedAs WHERE PropertyID = $1', [propertyId]);
        await client.query('DELETE FROM Wishlist WHERE PropertyID = $1', [propertyId]);
        
        // Finally delete the property
        await client.query('DELETE FROM Property WHERE PropertyID = $1 AND SellerID = $2', [propertyId, sellerId]);

        await client.query('COMMIT');
        res.json({ message: 'Property deleted successfully' });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error deleting property:', error);
        res.status(500).json({ message: 'Server error' });
    } finally {
        client.release();
    }
});

app.get('/api/seller-transactions/:sellerId', async (req, res) => {
    try {
        const { sellerId } = req.params;
        const { page = 1, limit = 10 } = req.query;
        const offset = (page - 1) * limit;
        
        // First verify if the seller exists
        const sellerCheck = await pool.query('SELECT SellerID FROM Seller WHERE SellerID = $1', [sellerId]);
        if (sellerCheck.rows.length === 0) {
            return res.status(404).json({ message: 'Seller not found' });
        }

        // Get total count for pagination
        const countQuery = `
            SELECT COUNT(*) 
            FROM Transaction 
            WHERE SellerID = $1
        `;
        const totalCount = await pool.query(countQuery, [sellerId]);

        const query = `
            SELECT 
                t.TransactionID,
                t.Price as amount,
                TO_CHAR(t.Date, 'YYYY-MM-DD HH24:MI:SS') as transaction_date,
                p.PropertyID,
                p.Name as property_title,
                p.Description as property_description,
                p.Bedrooms,
                p.Bathrooms,
                p.Area_sqft,
                c.CategoryName as property_category,
                CONCAT(p.Address, ', ', p.City, ', ', p.State, ' ', p.Pincode) as property_location,
                b.BuyerID,
                CONCAT(b.FName, ' ', b.LName) as buyer_name,
                b.Email as buyer_email,
                b.Phone as buyer_phone
            FROM Transaction t
            JOIN Property p ON t.PropertyID = p.PropertyID
            JOIN Category c ON p.CategoryID = c.CategoryID
            JOIN Buyer b ON t.BuyerID = b.BuyerID
            WHERE t.SellerID = $1
            ORDER BY t.Date DESC
            LIMIT $2 OFFSET $3
        `;
        
        const result = await pool.query(query, [sellerId, limit, offset]);
        
        // Format the response with pagination info
        const response = {
            transactions: result.rows.map(row => ({
                ...row,
                amount: parseFloat(row.amount).toFixed(2), // Ensure consistent price formatting
                property_details: {
                    id: row.propertyid,
                    title: row.property_title,
                    description: row.property_description,
                    location: row.property_location,
                    category: row.property_category,
                    specifications: {
                        bedrooms: row.bedrooms,
                        bathrooms: row.bathrooms,
                        area_sqft: row.area_sqft
                    }
                },
                buyer_details: {
                    id: row.buyerid,
                    name: row.buyer_name,
                    email: row.buyer_email,
                    phone: row.buyer_phone
                }
            })),
            pagination: {
                total: parseInt(totalCount.rows[0].count),
                page: parseInt(page),
                limit: parseInt(limit),
                total_pages: Math.ceil(totalCount.rows[0].count / limit)
            }
        };
        
        res.json(response);
    } catch (error) {
        console.error('Error fetching seller transactions:', error);
        res.status(500).json({ 
            message: 'Server error',
            error: error.message 
        });
    }
});

app.get('/api/seller-sold-properties/:sellerId', async (req, res) => {
    const client = await pool.connect();
    try {
        const { sellerId } = req.params;
        console.log('Fetching sold properties for seller:', sellerId);
        
        // First verify if the seller exists
        const sellerCheck = await client.query('SELECT SellerID FROM Seller WHERE SellerID = $1', [sellerId]);
        console.log('Seller check result:', sellerCheck.rows);
        
        if (sellerCheck.rows.length === 0) {
            console.log('Seller not found:', sellerId);
            return res.status(404).json({ 
                message: 'Seller not found',
                error: `No seller found with ID: ${sellerId}`
            });
        }

        // Updated query to match your schema
        const query = `
            SELECT DISTINCT
                p.PropertyID as propertyid,
                p.Name as property_name,
                t.TransactionID as transactionid,
                t.Date as transaction_date,
                t.Price as transaction_price,
                CONCAT(b.FName, ' ', b.LName) as buyer_name
            FROM Property p
            JOIN Transaction t ON (p.PropertyID = t.PropertyID AND p.SellerID = t.SellerID)
            JOIN Completes c ON (t.PropertyID = c.PropertyID AND t.TransactionID = c.TransactionID)
            JOIN Buyer b ON c.BuyerID = b.BuyerID
            WHERE p.SellerID = $1 AND p.IsAvailable = false
            ORDER BY t.Date DESC
        `;
        
        console.log('Executing query:', query);
        console.log('Query parameters:', [sellerId]);
        
        const result = await client.query(query, [sellerId]);
        console.log('Query result:', result.rows);

        if (result.rows.length === 0) {
            return res.json({
                message: 'No sold properties found',
                properties: []
            });
        }
        
        res.json(result.rows);
    } catch (error) {
        console.error('Detailed error in fetching sold properties:', {
            error: error.message,
            stack: error.stack,
            sellerId: req.params.sellerId
        });
        res.status(500).json({ 
            message: 'Server error', 
            error: error.message,
            details: 'Error occurred while fetching sold properties'
        });
    } finally {
        client.release();
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
