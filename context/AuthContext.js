'use client';

import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [token, setToken] = useState(null);
    const [isLoading, setIsLoading] = useState(true); // To check initial auth status

    useEffect(() => {
        // When the app loads, check if a token exists in localStorage
        const storedToken = localStorage.getItem('tsrtc_auth_token');
        if (storedToken) {
            setToken(storedToken);
        }
        setIsLoading(false);
    }, []);

    const login = (newToken) => {
        setToken(newToken);
        localStorage.setItem('tsrtc_auth_token', newToken);
    };

    const logout = () => {
        setToken(null);
        localStorage.removeItem('tsrtc_auth_token');
        // We might want to redirect the user to the home page here
        window.location.href = '/'; 
    };

    const value = {
        token,
        isLoggedIn: !!token,
        isLoading,
        login,
        logout,
    };

    return (
        <AuthContext.Provider value={value}>
            {!isLoading && children}
        </AuthContext.Provider>
    );
};

// Custom hook to easily use the auth context in any component
export const useAuth = () => {
    return useContext(AuthContext);
};
