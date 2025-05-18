import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const OverSeller = ({ closeOverlay }) => {
    const navigate = useNavigate();
    const [isLogin, setIsLogin] = useState(true);
    const [formData, setFormData] = useState({
        fname: '',
        lname: '',
        email: '',
        phone: '',
        city: '',
        state: '',
        country: '',
        pincode: '',
        password: ''
    });
    const [error, setError] = useState('');

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            // Email validation
            const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[com]{3}$/;
            if (!emailRegex.test(formData.email)) {
                setError('Email must be in the format example@domain.com');
                return;
            }

            if (isLogin) {
                const response = await axios.post('http://localhost:3000/api/seller/login', {
                    email: formData.email,
                    password: formData.password
                });
                localStorage.setItem('seller', JSON.stringify(response.data.seller));
                navigate('/seller-dashboard');
            } else {
                // Validate phone and pincode
                if (!/^\d{10}$/.test(formData.phone)) {
                    setError('Phone number must be 10 digits');
                    return;
                }
                if (!/^\d{6}$/.test(formData.pincode)) {
                    setError('Pincode must be 6 digits');
                    return;
                }

                const response = await axios.post('http://localhost:3000/api/seller/register', formData);
                localStorage.setItem('seller', JSON.stringify(response.data.seller));
                navigate('/seller-dashboard');
            }
        } catch (error) {
            setError(error.response?.data?.message || 'An error occurred');
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white p-8 rounded-lg w-full max-w-md">
                <div className="flex justify-between mb-4">
                    <h2 className="text-2xl font-bold">{isLogin ? 'Seller Login' : 'Seller Registration'}</h2>
                    <button onClick={closeOverlay} className="text-gray-500 hover:text-gray-700">×</button>
                </div>

                {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</div>}

                <form onSubmit={handleSubmit} className="space-y-4">
                    {!isLogin && (
                        <>
                            <div>
                                <label className="block text-gray-700 mb-2">First Name</label>
                                <input
                                    type="text"
                                    name="fname"
                                    value={formData.fname}
                                    onChange={handleChange}
                                    className="w-full p-2 border rounded"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-gray-700 mb-2">Last Name</label>
                                <input
                                    type="text"
                                    name="lname"
                                    value={formData.lname}
                                    onChange={handleChange}
                                    className="w-full p-2 border rounded"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-gray-700 mb-2">Phone</label>
                                <input
                                    type="tel"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    className="w-full p-2 border rounded"
                                    pattern="[0-9]{10}"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-gray-700 mb-2">City</label>
                                <input
                                    type="text"
                                    name="city"
                                    value={formData.city}
                                    onChange={handleChange}
                                    className="w-full p-2 border rounded"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-gray-700 mb-2">State</label>
                                <input
                                    type="text"
                                    name="state"
                                    value={formData.state}
                                    onChange={handleChange}
                                    className="w-full p-2 border rounded"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-gray-700 mb-2">Country</label>
                                <input
                                    type="text"
                                    name="country"
                                    value={formData.country}
                                    onChange={handleChange}
                                    className="w-full p-2 border rounded"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-gray-700 mb-2">Pincode</label>
                                <input
                                    type="text"
                                    name="pincode"
                                    value={formData.pincode}
                                    onChange={handleChange}
                                    className="w-full p-2 border rounded"
                                    pattern="[0-9]{6}"
                                    required
                                />
                            </div>
                        </>
                    )}
                    <div>
                        <label className="block text-gray-700 mb-2">Email</label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            className="w-full p-2 border rounded"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-gray-700 mb-2">Password</label>
                        <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            className="w-full p-2 border rounded"
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600"
                    >
                        {isLogin ? 'Login' : 'Register'}
                    </button>
                </form>

                <p className="mt-4 text-center">
                    {isLogin ? "Don't have an account? " : "Already have an account? "}
                    <button
                        onClick={() => setIsLogin(!isLogin)}
                        className="text-blue-500 hover:text-blue-700"
                    >
                        {isLogin ? 'Register' : 'Login'}
                    </button>
                </p>
            </div>
        </div>
    );
};

export default OverSeller;
