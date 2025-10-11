'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function MyTicketsPage() {
    const [tickets, setTickets] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const { token, isLoggedIn, isLoading: isAuthLoading } = useAuth();
    const router = useRouter();
    const API_URL = process.env.NEXT_PUBLIC_API_URL;

    useEffect(() => {
        if (isAuthLoading) {
            return; 
        }

        if (!isLoggedIn) {
            router.push('/login');
            return;
        }

        const fetchTickets = async () => {
            setIsLoading(true);
            setError('');
            try {
                const res = await fetch(`${API_URL}/api/user/tickets`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                if (!res.ok) throw new Error('Could not fetch your tickets. Please try again.');
                const data = await res.json();
                setTickets(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };

        if (token) {
            fetchTickets();
        }
    }, [isLoggedIn, token, isAuthLoading, router, API_URL]);

    if (isLoading || isAuthLoading) return (
        <div className="text-center mt-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading your tickets...</p>
        </div>
    );

    if (error) return <div className="text-center mt-10 text-red-500">{error}</div>;

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-3xl mx-auto p-4 sm:p-6">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-4xl font-bold text-gray-800">My Tickets</h1>
                    {/* --- THIS IS THE FIX --- */}
                    <Link href="/" className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg text-sm hover:bg-blue-700 transition-colors">
                        Book New Ticket
                    </Link>
                </div>
                {tickets.length === 0 ? (
                    <div className="text-center bg-white p-10 rounded-lg shadow-sm">
                        <p className="text-gray-500">You have no past tickets.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {tickets.map(ticket => (
                            <Link href={`/my-tickets/${ticket.ticket_id}`} key={ticket.ticket_id}>
                                <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200 hover:shadow-lg hover:border-blue-500 cursor-pointer transition-all duration-200">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="font-bold text-lg text-gray-800">
                                                {ticket.from_stop || 'N/A'} → {ticket.to_stop || 'N/A'}
                                            </p>
                                            <p className="text-sm text-gray-500 mt-1">
                                                Ticket ID: {ticket.ticket_id}
                                            </p>
                                        </div>
                                        <div className="text-right flex-shrink-0 ml-4">
                                            <p className="font-bold text-xl text-gray-900">
                                                ₹{parseFloat(ticket.amount).toFixed(2)}
                                            </p>
                                            <p className="text-xs text-gray-500 mt-1">
                                                {new Date(ticket.created_at).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
