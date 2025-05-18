import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const SellDash = () => {
  const navigate = useNavigate();
  const [seller, setSeller] = useState(() => {
    const savedSeller = localStorage.getItem('seller');
    console.log('Loaded seller data:', savedSeller);
    try {
      const parsed = JSON.parse(savedSeller);
      console.log('Parsed seller data:', parsed);
      // Extract the seller object from the response if it exists
      const sellerData = parsed?.seller || parsed;
      console.log('Extracted seller data:', sellerData);
      return sellerData;
    } catch (error) {
      console.error('Error parsing seller data:', error);
      return null;
    }
  });
  const [properties, setProperties] = useState([]);
  const [inquiries, setInquiries] = useState([]);
  const [soldProperties, setSoldProperties] = useState([]);
  const [isSoldPropertiesLoading, setIsSoldPropertiesLoading] = useState(false);
  const [soldPropertiesError, setSoldPropertiesError] = useState(null);
  const [showAddPropertyModal, setShowAddPropertyModal] = useState(false);
  const [showInquiriesModal, setShowInquiriesModal] = useState(false);
  const [showSoldPropertiesModal, setShowSoldPropertiesModal] = useState(false);
  const [newProperty, setNewProperty] = useState({
    name: '',
    category_id: '',
    price: '',
    city: '',
    state: '',
    country: '',
    pincode: '',
    description: '',
    bedrooms: '',
    bathrooms: '',
    area_sqft: ''
  });
  const [inquiryResponse, setInquiryResponse] = useState('');
  const [selectedInquiry, setSelectedInquiry] = useState(null);
  const [categories, setCategories] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [transactionsPerPage] = useState(10);

  useEffect(() => {
    console.log('Current seller state:', seller);
    if (!seller || !seller.sellerid) {
      console.log('No valid seller data found, redirecting to login');
      localStorage.removeItem('seller');
      navigate('/');
    } else {
      console.log('Fetching data for seller ID:', seller.sellerid);
      fetchProperties();
      fetchInquiries();
      fetchSoldProperties();
      fetchCategories();
    }
  }, [seller, navigate]);

  const fetchProperties = async () => {
    try {
      const response = await axios.get(`http://localhost:3000/api/seller-properties/${seller.sellerid}`);
      // Filter out properties that are not available (sold)
      setProperties(response.data.filter(property => property.isavailable));
    } catch (error) {
      console.error('Error fetching properties:', error);
    }
  };

  const fetchInquiries = async () => {
    try {
      const response = await axios.get(`http://localhost:3000/api/seller-inquiries/${seller.sellerid}`);
      setInquiries(response.data);
    } catch (error) {
      console.error('Error fetching inquiries:', error);
    }
  };

  const fetchSoldProperties = async () => {
    try {
      console.log('Fetching sold properties for seller:', seller.sellerid);
      setIsSoldPropertiesLoading(true);
      setSoldPropertiesError(null);
      
      if (!seller || !seller.sellerid) {
        throw new Error('No seller ID available. Please log in again.');
      }

      const response = await axios.get(`http://localhost:3000/api/seller-sold-properties/${seller.sellerid}`);
      console.log('Sold properties response:', response.data);
      
      // Handle both array response and object response with properties field
      const properties = Array.isArray(response.data) ? response.data : response.data.properties || [];
      setSoldProperties(properties);
      
      if (properties.length === 0) {
        console.log('No sold properties found for seller:', seller.sellerid);
      }
    } catch (error) {
      console.error('Error fetching sold properties:', {
        error: error.message,
        response: error.response?.data,
        status: error.response?.status,
        sellerId: seller.sellerid
      });
      
      // Set a user-friendly error message
      const errorMessage = error.response?.data?.error || 
                         error.response?.data?.message || 
                         error.message || 
                         'Failed to load sold properties';
      setSoldPropertiesError(errorMessage);
      
      // If the error is due to invalid seller ID, redirect to login
      if (error.response?.status === 404 && error.response?.data?.message === 'Seller not found') {
        console.log('Invalid seller ID, redirecting to login...');
        localStorage.removeItem('seller');
        navigate('/');
      }
    } finally {
      setIsSoldPropertiesLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await axios.get('http://localhost:3000/api/categories');
      setCategories(response.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleAddProperty = async (e) => {
    e.preventDefault();
    
    // Validate seller ID
    if (!seller || !seller.sellerid) {
      console.error('No valid seller ID found');
      alert('Please log in again to add a property');
      navigate('/');
      return;
    }

    // Validate required fields
    const requiredFields = ['name', 'category_id', 'price', 'city', 'state', 'country', 'pincode'];
    const missingFields = requiredFields.filter(field => !newProperty[field]);
    if (missingFields.length > 0) {
      alert(`Please fill in all required fields: ${missingFields.join(', ')}`);
      return;
    }

    // Validate numeric fields
    if (isNaN(parseFloat(newProperty.price)) || parseFloat(newProperty.price) <= 0) {
      alert('Please enter a valid price');
      return;
    }

    if (newProperty.bedrooms && (isNaN(parseInt(newProperty.bedrooms)) || parseInt(newProperty.bedrooms) < 0)) {
      alert('Please enter a valid number of bedrooms');
      return;
    }

    if (newProperty.bathrooms && (isNaN(parseInt(newProperty.bathrooms)) || parseInt(newProperty.bathrooms) < 0)) {
      alert('Please enter a valid number of bathrooms');
      return;
    }

    if (newProperty.area_sqft && (isNaN(parseFloat(newProperty.area_sqft)) || parseFloat(newProperty.area_sqft) <= 0)) {
      alert('Please enter a valid area');
      return;
    }

    // Validate pincode
    if (!/^\d{6}$/.test(newProperty.pincode)) {
      alert('Pincode must be 6 digits');
      return;
    }

    try {
      console.log('Submitting property with data:', {
        ...newProperty,
        seller_id: seller.sellerid
      });

      const propertyData = {
        ...newProperty,
        seller_id: seller.sellerid,
        price: parseFloat(newProperty.price),
        bedrooms: newProperty.bedrooms ? parseInt(newProperty.bedrooms) : null,
        bathrooms: newProperty.bathrooms ? parseInt(newProperty.bathrooms) : null,
        area_sqft: newProperty.area_sqft ? parseFloat(newProperty.area_sqft) : null,
        category_id: parseInt(newProperty.category_id)
      };

      const response = await axios.post('http://localhost:3000/api/properties', propertyData);
      console.log('Property added successfully:', response.data);
      
      setShowAddPropertyModal(false);
      setNewProperty({
        name: '',
        category_id: '',
        price: '',
        city: '',
        state: '',
        country: '',
        pincode: '',
        description: '',
        bedrooms: '',
        bathrooms: '',
        area_sqft: ''
      });
      fetchProperties();
    } catch (error) {
      console.error('Error adding property:', error);
      alert(error.response?.data?.message || 'Error adding property');
    }
  };

  const handleRemoveProperty = async (propertyId) => {
    try {
        // First check if property is available
        const propertyResponse = await axios.get(`http://localhost:3000/api/properties/${propertyId}`);
        const property = propertyResponse.data;

        if (!property.isavailable) {
            alert('This property has been sold and cannot be removed. It will be hidden from your dashboard but kept for transaction records.');
            setProperties(prevProperties => prevProperties.filter(p => p.isavailable));
            return;
        }

        // If property is available, proceed with deletion
        await axios.delete(`http://localhost:3000/api/properties/${propertyId}?sellerId=${seller.sellerid}`);
        
        // Update the properties list
        setProperties(prevProperties => prevProperties.filter(p => p.propertyid !== propertyId));
        alert('Property removed successfully');
    } catch (error) {
        console.error('Error removing property:', error);
        alert(error.response?.data?.message || 'Error removing property');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('seller');
    navigate('/');
  };

  const handleSendResponse = async (inquiryId) => {
    try {
      await axios.post(`http://localhost:3000/api/inquiries/${inquiryId}/respond`, {
        seller_id: seller.sellerid,
        message: inquiryResponse
      });
      
      // Refresh inquiries to get the updated conversation
      fetchInquiries();
      setInquiryResponse('');
      setSelectedInquiry(null);
    } catch (error) {
      console.error('Error sending response:', error);
      alert(error.response?.data?.message || 'Error sending response');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navbar */}
      <nav className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-800">Seller Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowAddPropertyModal(true)}
                className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
              >
                Add Property
              </button>
              <button
                onClick={() => setShowInquiriesModal(true)}
                className="bg-yellow-500 text-white px-4 py-2 rounded-lg hover:bg-yellow-600"
              >
                Inquiries ({inquiries.length})
              </button>
              <button
                onClick={() => setShowSoldPropertiesModal(true)}
                className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600"
              >
                Sold Properties ({soldProperties.length})
              </button>
              <button
                onClick={handleLogout}
                className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold mb-6">Your Properties</h2>
        {properties.length === 0 ? (
          <div className="text-center py-10 bg-white rounded-lg shadow">
            <h3 className="text-xl font-semibold text-gray-600">No Properties Listed</h3>
            <p className="text-gray-500 mt-2">Click the Add Property button to list your first property!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {properties.map((property) => (
              <div key={property.propertyid} className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="p-4">
                  <h3 className="text-lg font-semibold">{property.name}</h3>
                  <p className="text-gray-600">{property.city}, {property.state}</p>
                  <p className="text-blue-600 font-bold">₹{property.price}</p>
                  <p className="text-sm text-gray-500 mb-4">{property.categoryname}</p>
                  <div className="text-sm text-gray-500 mb-4">
                    {property.bedrooms && <span>{property.bedrooms} BHK • </span>}
                    {property.bathrooms && <span>{property.bathrooms} Bath • </span>}
                    {property.area_sqft && <span>{property.area_sqft} sq.ft</span>}
                  </div>
                  <button
                    onClick={() => handleRemoveProperty(property.propertyid)}
                    className="w-full bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition-colors"
                  >
                    Remove Property
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Property Modal */}
      {showAddPropertyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Add New Property</h2>
            <form onSubmit={handleAddProperty}>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Property Name</label>
                <input
                  type="text"
                  name="name"
                  value={newProperty.name}
                  onChange={(e) => setNewProperty({ ...newProperty, name: e.target.value })}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Category</label>
                <select
                  name="category_id"
                  value={newProperty.category_id}
                  onChange={(e) => setNewProperty({ ...newProperty, category_id: e.target.value })}
                  className="w-full p-2 border rounded"
                  required
                >
                  <option value="">Select Category</option>
                  {categories.map(category => (
                    <option key={category.categoryid} value={category.categoryid}>
                      {category.categoryname}
                    </option>
                  ))}
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Price (₹)</label>
                <input
                  type="number"
                  name="price"
                  value={newProperty.price}
                  onChange={(e) => setNewProperty({ ...newProperty, price: e.target.value })}
                  className="w-full p-2 border rounded"
                  required
                  min="0"
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">City</label>
                <input
                  type="text"
                  name="city"
                  value={newProperty.city}
                  onChange={(e) => setNewProperty({ ...newProperty, city: e.target.value })}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">State</label>
                <input
                  type="text"
                  name="state"
                  value={newProperty.state}
                  onChange={(e) => setNewProperty({ ...newProperty, state: e.target.value })}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Country</label>
                <input
                  type="text"
                  name="country"
                  value={newProperty.country}
                  onChange={(e) => setNewProperty({ ...newProperty, country: e.target.value })}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Pincode</label>
                <input
                  type="text"
                  name="pincode"
                  value={newProperty.pincode}
                  onChange={(e) => setNewProperty({ ...newProperty, pincode: e.target.value })}
                  className="w-full p-2 border rounded"
                  required
                  pattern="[0-9]{6}"
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Description</label>
                <textarea
                  name="description"
                  value={newProperty.description}
                  onChange={(e) => setNewProperty({ ...newProperty, description: e.target.value })}
                  className="w-full p-2 border rounded"
                  rows="3"
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="mb-4">
                  <label className="block text-gray-700 mb-2">Bedrooms</label>
                  <input
                    type="number"
                    name="bedrooms"
                    value={newProperty.bedrooms}
                    onChange={(e) => setNewProperty({ ...newProperty, bedrooms: e.target.value })}
                    className="w-full p-2 border rounded"
                    min="0"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700 mb-2">Bathrooms</label>
                  <input
                    type="number"
                    name="bathrooms"
                    value={newProperty.bathrooms}
                    onChange={(e) => setNewProperty({ ...newProperty, bathrooms: e.target.value })}
                    className="w-full p-2 border rounded"
                    min="0"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700 mb-2">Area (sq.ft)</label>
                  <input
                    type="number"
                    name="area_sqft"
                    value={newProperty.area_sqft}
                    onChange={(e) => setNewProperty({ ...newProperty, area_sqft: e.target.value })}
                    className="w-full p-2 border rounded"
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => setShowAddPropertyModal(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Add Property
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Inquiries Modal */}
      {showInquiriesModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Inquiries</h2>
              <button
                onClick={() => {
                  setShowInquiriesModal(false);
                  setSelectedInquiry(null);
                  setInquiryResponse('');
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <div className="space-y-4">
              {inquiries.map((inquiry) => (
                <div 
                  key={inquiry.id} 
                  className={`border p-4 rounded-lg transition-colors ${
                    selectedInquiry?.id === inquiry.id ? 'bg-blue-50 border-blue-200' : 'bg-gray-50'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-semibold text-gray-800">Property: {inquiry.property_title}</p>
                      <p className="text-gray-600">From: {inquiry.buyer_name}</p>
                    </div>
                    <p className="text-sm text-gray-500">
                      {new Date(inquiry.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="mt-2 space-y-2">
                    <div className="bg-white p-3 rounded-lg border">
                      <p className="text-gray-800">{inquiry.message}</p>
                    </div>
                    {inquiry.responses && inquiry.responses.map((response, index) => (
                      <div key={index} className="bg-blue-50 p-3 rounded-lg border border-blue-100 ml-4">
                        <p className="text-gray-800">{response.message}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(response.created_at).toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3">
                    {selectedInquiry?.id === inquiry.id ? (
                      <div className="space-y-2">
                        <textarea
                          value={inquiryResponse}
                          onChange={(e) => setInquiryResponse(e.target.value)}
                          placeholder="Type your response..."
                          className="w-full p-2 border rounded-lg resize-none"
                          rows="3"
                        />
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => {
                              setSelectedInquiry(null);
                              setInquiryResponse('');
                            }}
                            className="px-3 py-1 text-gray-600 hover:text-gray-800"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleSendResponse(inquiry.id)}
                            disabled={!inquiryResponse.trim()}
                            className="bg-blue-500 text-white px-4 py-1 rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Send Response
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setSelectedInquiry(inquiry)}
                        className="text-blue-500 hover:text-blue-600"
                      >
                        Reply to inquiry
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {inquiries.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <p>No inquiries yet</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Sold Properties Modal */}
      {showSoldPropertiesModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg w-full max-w-4xl max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Sold Properties</h2>
              <button
                onClick={() => {
                  console.log('Closing sold properties modal');
                  setShowSoldPropertiesModal(false);
                  setSoldPropertiesError(null);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            
            {isSoldPropertiesLoading ? (
              <div className="text-center py-8">
                <p className="text-gray-600">Loading sold properties...</p>
              </div>
            ) : soldPropertiesError ? (
              <div className="text-center py-8">
                <p className="text-red-500">{soldPropertiesError}</p>
                <button
                  onClick={() => {
                    console.log('Retrying sold properties fetch');
                    fetchSoldProperties();
                  }}
                  className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                >
                  Retry
                </button>
              </div>
            ) : soldProperties.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No properties have been sold yet</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white border border-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 border-b border-gray-200 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Property ID
                      </th>
                      <th className="px-6 py-3 border-b border-gray-200 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Property Name
                      </th>
                      <th className="px-6 py-3 border-b border-gray-200 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Buyer Name
                      </th>
                      <th className="px-6 py-3 border-b border-gray-200 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Transaction ID
                      </th>
                      <th className="px-6 py-3 border-b border-gray-200 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Sale Price
                      </th>
                      <th className="px-6 py-3 border-b border-gray-200 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Sale Date
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {soldProperties.map((property) => {
                      console.log('Rendering sold property:', property);
                      return (
                        <tr key={property.propertyid} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {property.propertyid}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {property.property_name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {property.buyer_name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {property.transactionid}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            ₹{property.transaction_price?.toLocaleString() || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {property.transaction_date ? new Date(property.transaction_date).toLocaleDateString() : 'N/A'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
            
            <button
              onClick={() => setShowSoldPropertiesModal(false)}
              className="mt-6 bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 w-full"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SellDash;