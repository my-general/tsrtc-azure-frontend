import { Inter } from "next/font/google";
import "./globals.css";
import Script from 'next/script'; // Make sure you are using this from our previous fix
import { AuthProvider } from '../context/AuthContext'; // <-- 1. IMPORT THIS

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "TSRTC e-Ticket",
  description: "Onboard bus ticketing",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider> {/* <-- 2. ADD THIS WRAPPER */}
          {children}
        </AuthProvider> {/* <-- AND THIS CLOSING WRAPPER */}
        <Script 
          src="https://checkout.razorpay.com/v1/checkout.js" 
          strategy="lazyOnload" 
        />
      </body>
    </html>
  );
}