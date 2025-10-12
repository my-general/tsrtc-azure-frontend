'use client';

import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [step, setStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const { login } = useAuth();
    const router = useRouter();
    const API_URL = process.env.NEXT_PUBLIC_API_URL;

    const handleGetOtp = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        try {
            const res = await fetch(`${API_URL}/api/auth/login-or-register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to send OTP. Please try again.');
            }
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
                body: JSON.stringify({ email, otp }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Invalid OTP.');
            
            login(data.accessToken);
            router.push('/');

        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-orange-50 py-4 px-4 sm:py-8">
            <div className="max-w-md mx-auto bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
                {/* Header - Matching Homepage Style */}
                <div className="bg-gradient-to-r from-blue-600 to-orange-600 p-4 sm:p-6 text-white">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4">
                        <h1 className="text-xl sm:text-2xl font-bold text-center sm:text-left">TSRTC e-Ticket</h1>
                        <div className="flex justify-center">
                            <Link href="/" className="text-xs sm:text-sm px-3 py-1.5 bg-orange-500 rounded-md hover:bg-orange-600 transition-colors">
                                ← Back Home
                            </Link>
                        </div>
                    </div>
                    <p className="text-center text-blue-100 font-medium text-sm sm:text-base">
                        {step === 1 ? 'Login to Book Tickets' : 'Verify Your Email'}
                    </p>
                </div>

                {/* Login Form */}
                <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                    {error && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-red-700 text-sm text-center">{error}</p>
                        </div>
                    )}

                    {step === 1 ? (
                        <form onSubmit={handleGetOtp} className="space-y-4">
                            <div className="space-y-2">
                                <label htmlFor="email" className="block text-sm font-semibold text-gray-700 flex items-center">
                                    <span className="bg-blue-100 text-blue-600 p-1 rounded mr-2">✉️</span>
                                    Email Address
                                </label>
                                <input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="passenger@example.com"
                                    required
                                    className="w-full p-3 bg-white border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm sm:text-base"
                                />
                            </div>
                            
                            <button 
                                type="submit" 
                                disabled={isLoading}
                                className="w-full py-3 px-4 bg-orange-500 text-white font-bold rounded-lg hover:bg-orange-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-sm sm:text-base"
                            >
                                {isLoading ? 'Sending OTP...' : 'Get OTP'}
                            </button>
                        </form>
                    ) : (
                        <form onSubmit={handleVerifyOtp} className="space-y-4">
                            <div className="space-y-2">
                                <label htmlFor="otp" className="block text-sm font-semibold text-gray-700 flex items-center">
                                    <span className="bg-green-100 text-green-600 p-1 rounded mr-2">🔢</span>
                                    Enter 6-digit OTP
                                </label>
                                <input
                                    id="otp"
                                    type="text"
                                    inputMode="numeric"
                                    maxLength="6"
                                    value={otp}
                                    onChange={(e) => {
                                        const value = e.target.value.replace(/\D/g, '');
                                        setOtp(value);
                                    }}
                                    placeholder="000000"
                                    required
                                    className="w-full p-3 text-center bg-white border border-gray-300 rounded-lg tracking-[0.5em] text-xl font-bold text-gray-900 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                                />
                                <p className="text-xs text-gray-500 text-center mt-2">
                                    Enter the code sent to <span className="font-medium">{email}</span>
                                </p>
                            </div>

                            <div className="space-y-3">
                                <button 
                                    type="submit" 
                                    disabled={isLoading || otp.length !== 6}
                                    className="w-full py-3 px-4 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-sm sm:text-base"
                                >
                                    {isLoading ? 'Verifying...' : 'Verify & Login'}
                                </button>

                                <button 
                                    type="button"
                                    onClick={handleGetOtp}
                                    disabled={isLoading}
                                    className="w-full py-2 text-gray-600 font-medium rounded-lg hover:bg-gray-50 disabled:text-gray-400 transition-all duration-300 border border-gray-200 text-sm"
                                >
                                    Resend OTP
                                </button>
                            </div>
                        </form>
                    )}

                    {/* Back Button */}
                    {step === 2 && (
                        <button 
                            onClick={() => setStep(1)}
                            className="w-full py-2 text-gray-500 hover:text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-all duration-300 flex items-center justify-center space-x-2 border border-gray-200 text-sm"
                        >
                            <span>←</span>
                            <span>Back to email</span>
                        </button>
                    )}

                    {/* Features Info - Matching Homepage Style */}
                    <div className="mt-6 pt-4 border-t border-gray-200">
                        <div className="grid grid-cols-3 gap-3 text-center text-xs text-gray-600">
                            <div className="space-y-1">
                                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mx-auto">
                                    <span className="text-blue-600 text-sm">🎫</span>
                                </div>
                                <p className="font-medium">Easy Booking</p>
                            </div>
                            <div className="space-y-1">
                                <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center mx-auto">
                                    <span className="text-orange-600 text-sm">⚡</span>
                                </div>
                                <p className="font-medium">Quick Login</p>
                            </div>
                            <div className="space-y-1">
                                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mx-auto">
                                    <span className="text-green-600 text-sm">🔒</span>
                                </div>
                                <p className="font-medium">Secure</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Support Info */}
                <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
                    <p className="text-center text-gray-500 text-xs">
                        Need help? <a href="mailto:support@tsrtc.com" className="text-orange-600 hover:text-orange-700 font-medium">Contact Support</a>
                    </p>
                </div>
            </div>
        </div>
    );
}
