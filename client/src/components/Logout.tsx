import React, { useEffect } from 'react';
import { useLocation } from 'wouter';
import apiClient from '../setupAxios.js';
// Using native HTML elements with Tailwind CSS instead of MUI

interface LogoutResponse {
    message?: string;
    error?: string;
}

const Logout: React.FC = () => {
    const [, setLocation] = useLocation();

    const handleLogout = async () => {
        try {
            const response = await apiClient.post<LogoutResponse>('/auth/logout');

            // Clear client-side authentication state
            localStorage.removeItem('authToken');
            localStorage.removeItem('userData');

            // Clear apiClient default headers if set
            delete apiClient.defaults.headers.common['Authorization'];

            setLocation('/');
        } catch (error) {
            console.error('Logout failed:', error);
            // Handle error (show toast/notification)
        }
    };

    // Optional: Auto-logout when component mounts
    useEffect(() => {
        handleLogout();
    }, []);

    return (
        <div className="max-w-sm mx-auto mt-8">
            <div className="flex flex-col items-center p-4 shadow-lg rounded-lg bg-white">
                <h1 className="text-xl font-semibold mb-4">
                    Logging out...
                </h1>
                <p className="text-gray-600 mb-6 text-center">
                    Please wait while we securely log you out.
                </p>

                {/* Only show if not using auto-logout */}
                <button
                    className="bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-4 rounded transition-colors"
                    onClick={handleLogout}
                >
                    Click here if not redirected
                </button>
            </div>
        </div>
    );
};

export default Logout;
