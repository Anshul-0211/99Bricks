import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const BuyDash = () => {
  const navigate = useNavigate();
  const buyer = JSON.parse(localStorage.getItem('buyer'));
  const [properties, setProperties] = useState([]);
  const [filters, setFilters] = useState({
    city: '',
    state: '',
    category_id: '',
    min_price: '',
    max_price: ''
  });
  const [loading, setLoading] = useState(true);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [showInquiryModal, setShowInquiryModal] = useState(false);
  const [inquiryMessage, setInquiryMessage] = useState('');
  const [actionMessage, setActionMessage] = useState('');
  const [showWishlistModal, setShowWishlistModal] = useState(false);
  const [wishlist, setWishlist] = useState([]);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0);
  const [amountToAdd, setAmountToAdd] = useState('');
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [selectedPropertyForPurchase, setSelectedPropertyForPurchase] = useState(null);
  const [showOwnedPropertiesModal, setShowOwnedPropertiesModal] = useState(false);
  const [ownedProperties, setOwnedProperties] = useState([]);
  const [propertySellerDetails, setPropertySellerDetails] = useState({});
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    if (!buyer) {
      navigate('/');
      return;
    }
    fetchCategories();
    searchProperties();
    fetchWishlist();
    fetchWalletBalance();
    fetchOwnedProperties();
  }, [buyer, navigate]);

  const handleLogout = () => {
    localStorage.removeItem('buyer');
    navigate('/');
  };

  const handleFilterChange = (e) => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value
    });
  };

  const fetchCategories = async () => {
    try {
      const response = await axios.get('http://localhost:3000/api/categories');
      setCategories(response.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const searchProperties = async () => {
    try {
      let url = 'http://localhost:3000/api/properties?';
      const queryParams = new URLSearchParams();

      if (filters.city) queryParams.append('city', filters.city);
      if (filters.state) queryParams.append('state', filters.state);
      if (filters.category_id) queryParams.append('category_id', filters.category_id);
      if (filters.min_price) queryParams.append('min_price', filters.min_price);
      if (filters.max_price) queryParams.append('max_price', filters.max_price);

      const response = await axios.get(`${url}${queryParams.toString()}`);
      if (response.data.message === "No properties found matching your criteria") {
        setProperties([]);
      } else {
        setProperties(response.data.properties);
      }
    } catch (error) {
      console.error('Error fetching properties:', error);
      setProperties([]);
    }
  };

  useEffect(() => {
    if (buyer) {
      searchProperties();
    }
  }, [filters]);

  const fetchWishlist = async () => {
    try {
      const response = await axios.get(`http://localhost:3000/api/wishlist/${buyer.buyerid}`);
      setWishlist(response.data);
    } catch (error) {
      console.error('Error fetching wishlist:', error);
    }
  };

  const fetchWalletBalance = async () => {
    try {
      const response = await axios.get(`http://localhost:3000/api/wallet/${buyer.buyerid}`);
      setWalletBalance(response.data.balance);
    } catch (error) {
      console.error('Error fetching wallet balance:', error);
    }
  };

  const fetchOwnedProperties = async () => {
    try {
      const response = await axios.get(`http://localhost:3000/api/owned-properties/${buyer.buyerid}`);
      if (Array.isArray(response.data)) {
        setOwnedProperties(response.data);
      } else {
        setOwnedProperties([]);
      }
    } catch (error) {
      console.error('Error fetching owned properties:', error);
      setOwnedProperties([]);
    }
  };

  const handlePropertyAction = async (propertyId, action) => {
    try {
      switch (action) {
        case 'wishlist':
          await axios.post(`http://localhost:3000/api/properties/${propertyId}/wishlist`, { buyerId: buyer.buyerid });
          setActionMessage('Property added to wishlist!');
          fetchWishlist();
          break;
        case 'reject':
          setActionMessage('Property rejected!');
          break;
        case 'buy':
          setSelectedPropertyForPurchase(properties.find(p => p.propertyid === propertyId));
          setShowTransactionModal(true);
          break;
        case 'inquire':
          setSelectedProperty(properties.find(p => p.propertyid === propertyId));
          setShowInquiryModal(true);
          break;
      }
    } catch (error) {
      console.error('Error performing property action:', error);
      setActionMessage('Error performing action');
    }
  };

  const handleInquire = async () => {
    try {
      await axios.post(`http://localhost:3000/api/properties/${selectedProperty.propertyid}/inquire`, {
        message: inquiryMessage,
        buyerId: buyer.buyerid
      });
      setActionMessage('Inquiry sent successfully!');
      setShowInquiryModal(false);
      setInquiryMessage('');
    } catch (error) {
      console.error('Error sending inquiry:', error);
      setActionMessage('Error sending inquiry');
    }
  };

  const handleAddMoney = async () => {
    try {
      const response = await axios.post(`http://localhost:3000/api/wallet/${buyer.buyerid}/add`, {
        amount: parseFloat(amountToAdd)
      });
      setWalletBalance(response.data.balance);
      setAmountToAdd('');
      setActionMessage('Money added successfully!');
    } catch (error) {
      console.error('Error adding money:', error);
      setActionMessage('Error adding money');
    }
  };

  const handlePurchase = async () => {
    try {
      const response = await axios.post(`http://localhost:3000/api/properties/${selectedPropertyForPurchase.propertyid}/buy`, {
        buyerId: buyer.buyerid
      });
      setWalletBalance(response.data.new_balance);
      setActionMessage('Property purchased successfully!');
      setShowTransactionModal(false);
      await fetchOwnedProperties();
      searchProperties();
      setShowOwnedPropertiesModal(true);
    } catch (error) {
      console.error('Error purchasing property:', error);
      setActionMessage(error.response?.data?.message || 'Error purchasing property');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navbar */}
      <nav className="bg-black shadow-lg">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <span className="text-white text-xl font-bold">Buyer Dashboard</span>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowOwnedPropertiesModal(true)}
                className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-md transition duration-300"
              >
                Owned ({ownedProperties.length})
              </button>
              <button
                onClick={() => setShowWishlistModal(true)}
                className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-md transition duration-300"
              >
                Wishlist ({wishlist.length})
              </button>
              <button
                onClick={() => setShowWalletModal(true)}
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md transition duration-300"
              >
                Wallet: ₹{walletBalance.toLocaleString()}
              </button>
              <button
                onClick={handleLogout}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md transition duration-300"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-8 mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-4">
            Welcome, {buyer?.fname || 'Buyer'}!
          </h1>
          <p className="text-gray-600 mb-6">
            Search for properties that match your criteria
          </p>

          {/* Search Filters */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
            <div>
              <label className="block text-gray-700 mb-2">City</label>
              <input
                type="text"
                name="city"
                value={filters.city}
                onChange={handleFilterChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                placeholder="Enter city"
              />
            </div>
            <div>
              <label className="block text-gray-700 mb-2">State</label>
              <input
                type="text"
                name="state"
                value={filters.state}
                onChange={handleFilterChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                placeholder="Enter state"
              />
            </div>
            <div>
              <label className="block text-gray-700 mb-2">Category</label>
              <select
                name="category_id"
                value={filters.category_id}
                onChange={handleFilterChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              >
                <option value="">All Categories</option>
                {categories.map(category => (
                  <option key={category.categoryid} value={category.categoryid}>
                    {category.categoryname}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-gray-700 mb-2">Min Price</label>
              <input
                type="number"
                name="min_price"
                value={filters.min_price}
                onChange={handleFilterChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                placeholder="Min price"
                min="0"
              />
            </div>
            <div>
              <label className="block text-gray-700 mb-2">Max Price</label>
              <input
                type="number"
                name="max_price"
                value={filters.max_price}
                onChange={handleFilterChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                placeholder="Max price"
                min="0"
              />
            </div>
          </div>

          <button
            onClick={searchProperties}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-md transition duration-300"
          >
            Search Properties
          </button>
        </div>

        {/* Properties List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {properties.length === 0 ? (
            <div className="col-span-3 text-center py-10">
              <h3 className="text-2xl font-semibold text-gray-600">NO PROPERTY LISTED</h3>
              <p className="text-gray-500 mt-2">Check back later for new properties</p>
            </div>
          ) : (
            properties.map((property) => (
              <div key={property.propertyid} className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="p-4">
                  <h3 className="text-lg font-semibold">{property.name}</h3>
                  <p className="text-gray-600">{property.city}, {property.state}</p>
                  <p className="text-blue-600 font-bold">₹{property.price.toLocaleString()}</p>
                  <p className="text-sm text-gray-500">
                    {property.bedrooms} BHK • {property.bathrooms} Bath • {property.area_sqft} sq.ft
                  </p>
                  <p className="text-sm text-gray-500 mt-2">{property.description}</p>
                  <div className="mt-4 space-x-2">
                    <button
                      onClick={() => handlePropertyAction(property.propertyid, 'wishlist')}
                      className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600"
                    >
                      Wishlist
                    </button>
                    <button
                      onClick={() => handlePropertyAction(property.propertyid, 'inquire')}
                      className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                    >
                      Inquire
                    </button>
                    <button
                      onClick={() => handlePropertyAction(property.propertyid, 'buy')}
                      className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600"
                    >
                      Buy
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Wishlist Modal */}
      {showWishlistModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Your Wishlist</h2>
              <button
                onClick={() => setShowWishlistModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            {wishlist.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {wishlist.map(property => (
                  <div key={property.propertyid} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-xl font-semibold text-gray-800">{property.name}</h3>
                      <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-md text-sm">
                        ID: {property.propertyid}
                      </span>
                    </div>
                    <p className="text-gray-600 mb-2">{property.description}</p>
                    <div className="space-y-1">
                      <p className="text-gray-700"><span className="font-medium">Location:</span> {property.city}, {property.state}</p>
                      <p className="text-gray-700"><span className="font-medium">Price:</span> ₹{property.price.toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-600">
                Your wishlist is empty
              </div>
            )}
          </div>
        </div>
      )}

      {/* Wallet Modal */}
      {showWalletModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Your Wallet</h2>
              <button
                onClick={() => setShowWalletModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <div className="mb-6">
              <p className="text-xl font-semibold">Current Balance: ₹{walletBalance.toLocaleString()}</p>
            </div>
            <div className="flex gap-2">
              <input
                type="number"
                value={amountToAdd}
                onChange={(e) => setAmountToAdd(e.target.value)}
                placeholder="Enter amount"
                className="flex-1 border border-gray-300 rounded-md px-3 py-2"
              />
              <button
                onClick={handleAddMoney}
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md"
              >
                Add Money
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Transaction Modal */}
      {showTransactionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Confirm Purchase</h2>
              <button
                onClick={() => setShowTransactionModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-xl font-semibold text-gray-800">
                    {selectedPropertyForPurchase?.name}
                  </h3>
                  <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-md text-sm">
                    ID: {selectedPropertyForPurchase?.propertyid}
                  </span>
                </div>
                <p className="text-gray-600 mb-2">
                  {selectedPropertyForPurchase?.description}
                </p>
                <div className="space-y-2">
                  <p className="text-gray-700"><span className="font-medium">Location:</span> {selectedPropertyForPurchase?.city}, {selectedPropertyForPurchase?.state}</p>
                  <p className="text-gray-700"><span className="font-medium">Price:</span> ₹{selectedPropertyForPurchase?.price.toLocaleString()}</p>
                  <p className="text-gray-700"><span className="font-medium">Your Balance:</span> ₹{walletBalance.toLocaleString()}</p>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowTransactionModal(false)}
                  className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePurchase}
                  className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md"
                >
                  Confirm Purchase
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Owned Properties Modal */}
      {showOwnedPropertiesModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 max-w-6xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Your Owned Properties</h2>
              <button
                onClick={() => setShowOwnedPropertiesModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            {ownedProperties.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white border border-gray-300">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="py-2 px-4 border-b">Property ID</th>
                      <th className="py-2 px-4 border-b">Property Name</th>
                      <th className="py-2 px-4 border-b">Seller ID</th>
                      <th className="py-2 px-4 border-b">Seller Name</th>
                      <th className="py-2 px-4 border-b">Pincode</th>
                      <th className="py-2 px-4 border-b">Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ownedProperties.map(property => (
                      <tr key={property.propertyid} className="hover:bg-gray-50">
                        <td className="py-2 px-4 border-b text-center">{property.propertyid}</td>
                        <td className="py-2 px-4 border-b text-center">{property.property_name || 'Name not available'}</td>
                        <td className="py-2 px-4 border-b text-center">{property.sellerid}</td>
                        <td className="py-2 px-4 border-b text-center">{property.seller_name || 'Name not available'}</td>
                        <td className="py-2 px-4 border-b text-center">{property.pincode}</td>
                        <td className="py-2 px-4 border-b">
                          <div className="text-sm">
                            <p><strong>Bedrooms:</strong> {property.bedrooms}</p>
                            <p><strong>Bathrooms:</strong> {property.bathrooms}</p>
                            <p><strong>Area:</strong> {property.area_sqft} sq ft</p>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-600">
                <p className="text-xl font-semibold">No Properties Owned</p>
                <p className="mt-2">You haven't purchased any properties yet.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Inquiry Modal */}
      {showInquiryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-2xl font-bold">Send Inquiry</h2>
              <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-md text-sm">
                ID: {selectedProperty?.propertyid}
              </span>
            </div>
            <p className="text-gray-600 mb-4">
              Property: {selectedProperty?.name}
            </p>
            <textarea
              value={inquiryMessage}
              onChange={(e) => setInquiryMessage(e.target.value)}
              placeholder="Enter your message..."
              className="w-full border border-gray-300 rounded-md px-3 py-2 mb-4 h-32"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowInquiryModal(false)}
                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md"
              >
                Cancel
              </button>
              <button
                onClick={handleInquire}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md"
              >
                Send Inquiry
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Action Message */}
      {actionMessage && (
        <div className="fixed bottom-4 right-4 bg-green-500 text-white px-4 py-2 rounded-md shadow-lg">
          {actionMessage}
        </div>
      )}
    </div>
  );
};

export default BuyDash;