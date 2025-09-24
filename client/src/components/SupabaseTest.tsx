import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const SupabaseTest: React.FC = () => {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState<string>('Testing Supabase connection...');

  useEffect(() => {
    const testConnection = async () => {
      try {
        // Test the connection by making a simple query
        const { data, error } = await supabase.from('app_users').select('count').limit(1);
        
        if (error) {
          throw error;
        }
        
        setStatus('success');
        setMessage('Supabase connection successful!');
      } catch (error) {
        console.error('Supabase connection error:', error);
        setStatus('error');
        setMessage(`Supabase connection failed: ${error instanceof Error ? error.message : String(error)}`);
      }
    };

    testConnection();
  }, []);

  return (
    <div className="p-4 max-w-md mx-auto mt-10 bg-white rounded-lg shadow-md">
      <h1 className="text-xl font-bold mb-4">Supabase Connection Test</h1>
      
      <div className={`p-3 rounded-md ${
        status === 'loading' ? 'bg-blue-100 text-blue-800' :
        status === 'success' ? 'bg-green-100 text-green-800' :
        'bg-red-100 text-red-800'
      }`}>
        <div className="flex items-center">
          {status === 'loading' && (
            <svg className="animate-spin h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          )}
          
          {status === 'success' && (
            <svg className="h-5 w-5 mr-2 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          )}
          
          {status === 'error' && (
            <svg className="h-5 w-5 mr-2 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          )}
          
          <span>{message}</span>
        </div>
      </div>
    </div>
  );
};

export default SupabaseTest;