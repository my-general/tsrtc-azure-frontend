'use client';
import QRCode from "react-qr-code";

export default function Ticket({ ticketInfo, journeyInfo }) {
  // The qrCodeValue should now include the passenger count for the conductor
  const qrCodeValue = JSON.stringify({
    ticketId: ticketInfo.ticket_id,
    amount: ticketInfo.amount,
    passengers: ticketInfo.passenger_count, // <-- Include passenger count in QR data
    timestamp: ticketInfo.created_at,
    from: journeyInfo.from,
    to: journeyInfo.to
  });

  return (
    <div className="bg-white p-6 rounded-b-2xl shadow-lg border border-gray-100">
      
      {/* --- NEW: Prominently display the number of passengers --- */}
      <div className="text-center pb-4 border-b-2 border-dashed border-gray-300">
          <p className="text-sm text-gray-500">Number of Passengers</p>
          <p className="text-4xl font-bold text-blue-600">{ticketInfo.passenger_count}</p>
      </div>

      <div className="flex justify-between items-center my-4">
        <div>
          <p className="text-sm text-gray-500">From</p>
          <p className="font-bold text-lg text-gray-800">{journeyInfo.from}</p>
        </div>
        <div className="text-blue-500 font-semibold text-xl">→</div>
        <div>
          <p className="text-sm text-gray-500 text-right">To</p>
          <p className="font-bold text-lg text-gray-800 text-right">{journeyInfo.to}</p>
        </div>
      </div>
      
      <div className="my-6 p-4 bg-gray-50 rounded-lg flex justify-center">
        <QRCode value={qrCodeValue} size={192} />
      </div>

      <div className="space-y-2 text-sm text-gray-600">
        <div className="flex justify-between">
            <span>Ticket ID:</span>
            <span className="font-mono">{ticketInfo.ticket_id}</span>
        </div>
        <div className="flex justify-between">
            {/* --- UPDATED: Text clarified for group tickets --- */}
            <span>Total Amount Paid:</span>
            <span className="font-semibold text-black">₹{parseFloat(ticketInfo.amount).toFixed(2)}</span>
        </div>
         <div className="flex justify-between">
            <span>Date & Time:</span>
            <span className="font-semibold text-black">{new Date(ticketInfo.created_at).toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
}