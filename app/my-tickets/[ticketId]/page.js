'use client';

import { useEffect, useState } from 'react';
import React from 'react';
import { useAuth } from '../../../context/AuthContext';
import Ticket from '../../../app/Ticket';
import Link from 'next/link'; // <-- 1. IMPORT THE LINK COMPONENT

export default function TicketDetailPage({ params }) {
    const resolvedParams = React.use(params);
    const { ticketId } = resolvedParams;

    const { token, isLoggedIn, isLoading: isAuthLoading } = useAuth();
    const [ticket, setTicket] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const API_URL = process.env.NEXT_PUBLIC_API_URL;

    useEffect(() => {
        if (isAuthLoading) {
            return; 
        }
        if (!isLoggedIn) {
            window.location.href = '/login';
            return;
        }

        const fetchTicketDetails = async () => {
            if (!token) return;
            try {
                const res = await fetch(`${API_URL}/api/tickets/${ticketId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (!res.ok) throw new Error('Ticket not found or invalid.');
                const data = await res.json();
                setTicket(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };

        fetchTicketDetails();

    }, [isLoggedIn, token, ticketId, API_URL, isAuthLoading]);

    if (isLoading || isAuthLoading) return <div className="text-center mt-10">Loading Ticket...</div>;
    if (error) return <div className="text-center mt-10 text-red-500">{error}</div>;
    if (!ticket) return null;

    return (
         <div className="min-h-screen bg-gray-100 py-8 px-4">
            <div className="max-w-md mx-auto">
                <div className="mb-4">
                    {/* --- 2. THIS IS THE FIX --- */}
                    <Link href="/my-tickets" className="text-blue-600 hover:underline">
                        ← Back to All Tickets
                    </Link>
                </div>
                <Ticket 
                    ticketInfo={ticket} 
                    journeyInfo={{ from: ticket.from_stop, to: ticket.to_stop }} 
                />
            </div>
        </div>
    );
}
