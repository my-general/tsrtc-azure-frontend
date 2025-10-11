'use client';

import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/navigation'; // Import the router

export default function LoginPage() {
    const [mobileNumber, setMobileNumber] = useState('');
    const [otp, setOtp] = useState('');
    const [step, setStep] = useState(1); // 1 for mobile number, 2 for OTP
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const { login } = useAuth();
    const router = useRouter(); // Initialize the router
    const API_URL = process.env.NEXT_PUBLIC_API_URL;

    const handleGetOtp = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        try {
            const res = await fetch(`${API_URL}/api/auth/login-or-register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ mobileNumber }),
            });
            if (!res.ok) throw new Error('Failed to send OTP. Please try again.');
            setStep(2);
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        try {
            const res = await fetch(`${API_URL}/api/auth/verify-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ mobileNumber, otp }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Invalid OTP.');
            
            login(data.accessToken); // Login successful!
            
            // --- THIS IS THE FIX ---
            // Redirect to the home page instead of my-tickets
            router.push('/');

        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-lg">
                <div className="text-center mb-8">
                    <div className="inline-block bg-orange-100 p-3 rounded-full mb-4">
                        <span className="text-orange-600 text-3xl">🔑</span>
                    </div>
                    <h2 className="text-3xl font-bold text-gray-800">
                        {step === 1 ? 'Login or Sign Up' : 'Verify Your Number'}
                    </h2>
                    <p className="text-gray-500 mt-2">
                        {step === 1 ? 'Enter your mobile number to get started.' : `Enter the 6-digit OTP sent to ${mobileNumber}`}
                    </p>
                </div>
                {step === 1 ? (
                    <form onSubmit={handleGetOtp} className="space-y-6">
                        <div>
                            <label htmlFor="mobile" className="block text-sm font-semibold text-gray-700">10-Digit Mobile Number</label>
                            <input
                                id="mobile"
                                type="tel"
                                value={mobileNumber}
                                onChange={(e) => setMobileNumber(e.target.value)}
                                placeholder="e.g., 9876543210"
                                required
                                className="w-full mt-2 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                            />
                        </div>
                        <button type="submit" disabled={isLoading} className="w-full py-3 bg-orange-600 text-white font-bold rounded-lg hover:bg-orange-700 disabled:bg-gray-400 transition-all transform hover:scale-[1.02] active:scale-[0.98]">
                            {isLoading ? 'Sending...' : 'Get OTP'}
                        </button>
                    </form>
                ) : (
                    <form onSubmit={handleVerifyOtp} className="space-y-6">
                        <div>
                            <label htmlFor="otp" className="block text-sm font-semibold text-gray-700">OTP Code</label>
                            <input
                                id="otp"
                                type="text"
                                inputMode="numeric"
                                pattern="\d{6}"
                                maxLength="6"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value)}
                                placeholder="123456"
                                required
                                className="w-full mt-2 p-3 border border-gray-300 rounded-lg text-center tracking-[0.5em] focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                            />
                        </div>
                        <button type="submit" disabled={isLoading} className="w-full py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-all transform hover:scale-[1.02] active:scale-[0.98]">
                            {isLoading ? 'Verifying...' : 'Verify & Login'}
                        </button>
                    </form>
                )}
                 {error && <p className="mt-6 text-center text-red-600 font-medium">{error}</p>}
                 
                 {step === 2 && (
                     <button onClick={() => setStep(1)} className="w-full mt-4 text-center text-sm text-gray-500 hover:text-gray-800">
                         Back to enter mobile number
                     </button>
                 )}
            </div>
        </div>
    );
}