'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link'; // Add this import
import Ticket from './Ticket';
import { useAuth } from '../context/AuthContext';

export default function HomePageWrapper() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your journey planner...</p>
        </div>
      </div>
    }>
      <HomePage />
    </Suspense>
  );
}

function HomePage() {
  const searchParams = useSearchParams();
  const { isLoggedIn, token, logout } = useAuth();
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  // State for data
  const [allRoutes, setAllRoutes] = useState([]);
  const [stops, setStops] = useState([]);
  const [fareInfo, setFareInfo] = useState(null);
  const [ticketData, setTicketData] = useState(null);

  // State for user selections
  const [selectedRoute, setSelectedRoute] = useState('');
  const [selectedFrom, setSelectedFrom] = useState('');
  const [selectedTo, setSelectedTo] = useState('');
  const [passengerCount, setPassengerCount] = useState(1);
  
  // State for UI
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState('');
  const [routeFromUrl, setRouteFromUrl] = useState(null);

  // Effect to handle initial load (QR mode or Manual mode)
  useEffect(() => {
    const routeParam = searchParams.get('routeId');
    const stopParam = searchParams.get('currentStop');
    
    if (routeParam) {
      setRouteFromUrl(routeParam);
      setSelectedRoute(routeParam);
      if (stopParam) setSelectedFrom(stopParam);
    } else {
      const fetchRoutes = async () => {
        setIsLoading(true);
        try {
          const res = await fetch(`${API_URL}/api/routes`);
          if (!res.ok) throw new Error('Could not fetch routes.');
          setAllRoutes(await res.json());
        } catch (err) {
          setError(err.message);
        } finally {
          setIsLoading(false);
        }
      };
      fetchRoutes();
    }
  }, [searchParams, API_URL]);

  // Effect to fetch stops when a route is selected
  useEffect(() => {
    let isMounted = true;
    if (!selectedRoute) {
      setStops([]);
      setSelectedFrom('');
      setSelectedTo('');
      return;
    }
    const fetchStopsForRoute = async () => {
      setIsLoading(true);
      setStops([]); 
      if (!routeFromUrl) {
          setSelectedFrom('');
          setSelectedTo('');
      }
      try {
        const res = await fetch(`${API_URL}/api/routes/${selectedRoute}/stops`);
        if (!res.ok) throw new Error(`Failed to fetch stops for route ${selectedRoute}`);
        const data = await res.json();
        if (isMounted) setStops(data);
      } catch (err) {
        if (isMounted) setError(err.message);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    fetchStopsForRoute();
    return () => { isMounted = false; };
  }, [selectedRoute, routeFromUrl, API_URL]);

  // Handle calculating the initial fare for a single passenger
  const handleCalculateFare = async () => {
    if (!selectedRoute || !selectedFrom || !selectedTo) {
      setError('Please select a route, starting point, and destination.');
      return;
    }
    if (selectedFrom === selectedTo) {
      setError('Start and destination cannot be the same.');
      return;
    }
    setIsLoading(true);
    setError('');
    setFareInfo(null);
    setTicketData(null);
    setPassengerCount(1);
    try {
      const res = await fetch(`${API_URL}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          routeId: selectedRoute, fromStopName: selectedFrom, toStopName: selectedTo, passengerCount: 1,
        }),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Could not calculate fare.');
      }
      const data = await res.json();
      setFareInfo({ ...data, singleFare: data.amount });
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle the final payment process
  const handlePayment = async () => {
    if (!isLoggedIn) {
      setError("Please login to book a ticket.");
      return;
    }

    const orderRes = await fetch(`${API_URL}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          routeId: selectedRoute, fromStopName: selectedFrom, toStopName: selectedTo, passengerCount,
        }),
    });
    const orderData = await orderRes.json();
    if (!orderRes.ok) {
        setError(orderData.error || 'Could not create final order.');
        return;
    }

    const options = {
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      amount: orderData.amount,
      currency: orderData.currency,
      name: "TSRTC e-Ticket",
      description: `Ticket for ${passengerCount} passenger(s) from ${selectedFrom} to ${selectedTo}`,
      order_id: orderData.id,
      handler: async function (response) {
        setIsVerifying(true);
        setError('');
        try {
          const res = await fetch(`${API_URL}/api/payment/verify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({
                ...response,
                fromStop: selectedFrom,
                toStop: selectedTo,
                passengerCount: passengerCount
            })
          });
          const result = await res.json();
          if (result.status === 'success') {
            setTicketData(result.ticket);
            setFareInfo(null);
          } else {
            setError('Payment verification failed.');
          }
        } catch (err) {
          setError('Payment verification failed.');
        } finally {
          setIsVerifying(false);
        }
      },
      prefill: { name: "Passenger", email: "passenger@example.com", contact: "9999999999" },
      theme: { color: "#F37254" },
      modal: { ondismiss: function() { if(!ticketData) setError('Payment was cancelled.'); } }
    };
    
    const rzp = new window.Razorpay(options);
    rzp.open();
  };
  
  const handleNewBooking = () => { window.location.reload(); };
  const getStopKey = (stop, prefix, index) => { return `${prefix}-${selectedRoute}-${stop.stop_sequence}-${index}`.replace(/\s+/g, '-'); };
  
  const handlePassengerChange = (amount) => {
    const newCount = passengerCount + amount;
    if (newCount >= 1 && newCount <= 10) {
        setPassengerCount(newCount);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-orange-50 py-4 px-4 sm:py-8">
      <div className="max-w-md mx-auto bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
        <div className="bg-gradient-to-r from-blue-600 to-orange-600 p-4 sm:p-6 text-white">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4">
              <h1 className="text-xl sm:text-2xl font-bold text-center sm:text-left">TSRTC e-Ticket</h1>
              {isLoggedIn ? (
                  <div className="flex justify-center sm:justify-end gap-2">
                      {/* FIXED: Replaced <a> with <Link> for My Tickets */}
                      <Link href="/my-tickets" className="text-xs sm:text-sm px-2 sm:px-3 py-1.5 border border-blue-300 rounded-md hover:bg-blue-500 transition-colors">
                          My Tickets
                      </Link>
                      <button onClick={logout} className="text-xs sm:text-sm px-2 sm:px-3 py-1.5 bg-orange-500 rounded-md hover:bg-orange-600 transition-colors">Logout</button>
                  </div>
              ) : (
                  <div className="flex justify-center">
                    {/* FIXED: Replaced <a> with <Link> for Login */}
                    <Link href="/login" className="px-4 py-2 bg-orange-500 text-white font-bold rounded-lg hover:bg-orange-600 transition-colors text-sm sm:text-base">
                        Login
                    </Link>
                  </div>
              )}
          </div>
          {selectedRoute && ( <p className="text-center text-blue-100 font-medium text-sm sm:text-base">Bus No: <span className="font-bold">{selectedRoute}</span></p> )}
        </div>
        {isLoggedIn ? (
          ticketData ? (
            <div>
              <Ticket ticketInfo={ticketData} journeyInfo={{ from: selectedFrom, to: selectedTo, passengerCount: ticketData.passenger_count }} />
              <div className="p-4 sm:p-6">
                <button onClick={handleNewBooking} className="w-full py-3 px-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold rounded-lg hover:from-blue-600 hover:to-blue-700 transition-colors text-sm sm:text-base">Book Another Ticket</button>
              </div>
            </div>
          ) : (
            <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                {!routeFromUrl && (
                  <div className="space-y-2">
                    <label htmlFor="route" className="block text-sm font-semibold text-gray-700 flex items-center"><span className="bg-blue-100 text-blue-600 p-1 rounded mr-2">🚌</span>Select Bus Route</label>
                    <select 
                      id="route" 
                      value={selectedRoute} 
                      onChange={(e) => setSelectedRoute(e.target.value)} 
                      className="w-full p-3 bg-white border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm sm:text-base"
                      disabled={isLoading}
                    >
                      <option value="" className="text-gray-500">Choose your route...</option>
                      {allRoutes.map((route) => (
                        <option key={route.route_id} value={route.route_id} className="text-gray-900">
                          {route.route_id} - {route.route_name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-4">
                  <div className="space-y-2">
                    <label htmlFor="from" className="block text-sm font-semibold text-gray-700 flex items-center"><span className="bg-green-100 text-green-600 p-1 rounded mr-2">📍</span>From</label>
                    <select 
                      id="from" 
                      value={selectedFrom} 
                      onChange={(e) => setSelectedFrom(e.target.value)} 
                      className="w-full p-3 bg-white border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors text-sm sm:text-base"
                      disabled={!stops.length || isLoading}
                    >
                      <option value="" className="text-gray-500">Select start...</option>
                      {stops.map((stop, index) => (
                        <option key={getStopKey(stop, 'from', index)} value={stop.stop_name} className="text-gray-900">
                          {stop.stop_name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="to" className="block text-sm font-semibold text-gray-700 flex items-center"><span className="bg-red-100 text-red-600 p-1 rounded mr-2">🎯</span>To</label>
                    <select 
                      id="to" 
                      value={selectedTo} 
                      onChange={(e) => setSelectedTo(e.target.value)} 
                      className="w-full p-3 bg-white border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors text-sm sm:text-base"
                      disabled={!stops.length || isLoading}
                    >
                      <option value="" className="text-gray-500">Select destination...</option>
                      {stops.map((stop, index) => (
                        <option key={getStopKey(stop, 'to', index)} value={stop.stop_name} className="text-gray-900">
                          {stop.stop_name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <button 
                  onClick={handleCalculateFare} 
                  disabled={isLoading || !selectedRoute || !selectedFrom || !selectedTo} 
                  className="w-full py-3 px-4 bg-orange-500 text-white font-bold rounded-lg hover:bg-orange-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-sm sm:text-base"
                >
                  {isLoading && !fareInfo ? 'Calculating...' : 'Calculate Fare'}
                </button>
                {error && (<p className="text-red-500 text-center text-sm sm:text-base">{error}</p>)}

                {fareInfo && (
                  <div className="mt-4 sm:mt-6 p-4 sm:p-5 bg-green-50 border-l-4 border-green-500 rounded-lg">
                    <div className="flex justify-between items-center mb-4">
                        <label className="font-semibold text-gray-800 text-base sm:text-lg">Passengers</label>
                        <div className="flex items-center space-x-3">
                            <button 
                              onClick={() => handlePassengerChange(-1)} 
                              disabled={passengerCount <= 1} 
                              className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gray-200 text-gray-700 font-bold text-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                            >
                              -
                            </button>
                            <span className="text-lg sm:text-xl font-bold w-6 sm:w-8 text-center">{passengerCount}</span>
                            <button 
                              onClick={() => handlePassengerChange(1)} 
                              disabled={passengerCount >= 10} 
                              className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gray-200 text-gray-700 font-bold text-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                            >
                              +
                            </button>
                        </div>
                    </div>
                    <div className="border-t border-gray-200 pt-3 sm:pt-4">
                        <div className="flex justify-between items-baseline">
                            <span className="text-gray-600 text-sm sm:text-base">Total Fare:</span>
                            <p className="text-2xl sm:text-3xl font-bold text-gray-900">₹{((fareInfo.singleFare * passengerCount) / 100).toFixed(2)}</p>
                        </div>
                    </div>
                    <button 
                      onClick={handlePayment} 
                      disabled={isVerifying} 
                      className="w-full mt-4 py-3 px-4 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-sm sm:text-base"
                    >
                      {isVerifying ? 'Verifying...' : 'Pay Now & Get Ticket'}
                    </button>
                  </div>
                )}
            </div>
          )
        ) : (
          <div className="p-6 sm:p-8 text-center">
            <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-3 sm:mb-4">Welcome to TSRTC e-Ticketing</h2>
            <p className="text-gray-600 mb-4 sm:mb-6 text-sm sm:text-base">Please log in to book and manage your tickets.</p>
            {/* FIXED: Replaced <a> with <Link> for Login/Sign Up */}
            <Link href="/login" className="w-full inline-block py-3 px-6 bg-orange-600 text-white font-bold rounded-lg hover:bg-orange-700 transition-colors text-sm sm:text-base">
                Login or Sign Up
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
