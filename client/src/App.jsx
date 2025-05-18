import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import HomeNav from './components/HomeNav';
import aprt from './assets/aprt.png';
import OverSeller from './components/overSeller';
import OverBuyer from './components/overBuyer';
import BuyDash from './pages/BuyDash';
import SellDash from './pages/SellDash';

function App() {
  const [isSellerOverlayVisible, setIsSellerOverlayVisible] = useState(false);
  const [isBuyerOverlayVisible, setIsBuyerOverlayVisible] = useState(false);

  const handleSellerClick = () => {
    setIsSellerOverlayVisible(true);
  };

  const closeSellerOverlay = () => {
    setIsSellerOverlayVisible(false);
  };

  const handleBuyerClick = () => {
    setIsBuyerOverlayVisible(true);
  };

  const closeBuyerOverlay = () => {
    setIsBuyerOverlayVisible(false);
  };

  return (
    <Router>
      <Routes>
        <Route path="/" element={
          <div className="bg-gradient-to-t from-black to-indigo-900 min-h-screen flex flex-col text-blue-400">
            <div><HomeNav /></div>
            <div className="Herosection flex flex-row items-center justify-between p-8 mt-20">
              <div className="text-section w-1/2 text-left ">
                <h1 className="text-8xl font-bold font-outfit text-white ">99</h1>
                <h1 className="text-9xl font-bold font-outfit mb-4 text-white">Bricks</h1>
                <div className="button-group mt-6 flex gap-4">
                  <button 
                    className="bg-transparent text-white px-6 py-2 rounded border border-white hover:bg-green-400 hover:text-black hover:border-black"
                    onClick={handleSellerClick}
                  >
                    Seller
                  </button>
                  <button 
                    className="bg-white text-black px-6 py-2 rounded border border-black hover:bg-green-400 hover:text-black hover:border-white"
                    onClick={handleBuyerClick}
                  >
                    Buyer
                  </button>
                </div>
              </div>
              <div className="image-section w-1/2 flex justify-center">
                <img src={aprt} alt="Hero" className="w-3/4 " />
              </div>
            </div>

            {isSellerOverlayVisible && (
              <OverSeller closeOverlay={closeSellerOverlay} />
            )}
            {isBuyerOverlayVisible && (
              <OverBuyer closeOverlay={closeBuyerOverlay} />
            )}
          </div>
        } />
        <Route path="/buyer-dashboard" element={
          <ProtectedRoute>
            <BuyDash />
          </ProtectedRoute>
        } />
        <Route path="/seller-dashboard" element={
          <ProtectedRoute>
            <SellDash />
          </ProtectedRoute>
        } />
      </Routes>
    </Router>
  );
}

// Protected Route component
const ProtectedRoute = ({ children }) => {
  const buyer = localStorage.getItem('buyer');
  const seller = localStorage.getItem('seller');

  if (!buyer && !seller) {
    return <Navigate to="/" />;
  }

  return children;
};

export default App;
