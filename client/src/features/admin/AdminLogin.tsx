import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { apiClient } from '../../lib/axios';
import { Loader2 } from 'lucide-react';

interface LoginFormData {
  email: string;
  password: string;
}

const AdminLogin: React.FC = () => {
  const [location, navigate] = useLocation();
  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Check if we should redirect to /app after login
  const urlParams = new URLSearchParams(location.split('?')[1] || '');
  const redirectTo = urlParams.get('redirect') || '/admin';

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Using our configured apiClient which already has withCredentials set
      const response = await apiClient.post('/api/admin/login', formData);
      
      // Store the auth token and admin email for session management
      if (response.data.success && response.data.token) {
        // Store admin token and email for authentication
        localStorage.setItem('adminToken', response.data.token);
        localStorage.setItem('adminEmail', formData.email);
        
        // Clear browser history to prevent navigation to previous tabs
        // This ensures admin cannot go back to non-admin pages
        window.history.replaceState(null, '', window.location.href);
        
        // Clear the entire browser history stack
        const clearHistory = () => {
          // Replace current state and clear history
          window.history.replaceState({ adminSession: true }, '', '/admin');
          
          // Push a new state to establish admin as the base
          window.history.pushState({ adminSession: true }, '', '/admin');
        };
        
        clearHistory();
        
        // Redirect based on the redirect parameter or default to admin dashboard
        const target = redirectTo.startsWith('/') ? redirectTo : `/${redirectTo}`;
        navigate(target, { replace: true });
      } else {
        setError('Login failed. Please check your credentials.');
      }
    } catch (err: any) {
      if (err.response?.status === 423 && err.response?.data?.code === 'ADMIN_SESSION_ACTIVE') {
        // Another admin is already logged in
        setError(
          err.response.data.message + ' Only one admin can be logged in at a time.'
        );
      } else {
        setError(
          err.response?.data?.message || 'Login failed. Please check your credentials.'
        );
      }
    } finally {
      setLoading(false);
    }
  };



  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        fontFamily: "'Nunito', system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, 'Apple Color Emoji', 'Segoe UI Emoji'",
        color: '#2563EB',
        background: `
          radial-gradient(circle at center, rgba(255,255,255,.25) 0%, transparent 35%),
          radial-gradient(circle at center, rgba(255,255,255,.15) 0%, transparent 60%),
          linear-gradient(135deg, #1E4ED8 0%, #2563EB 55%, #ffffff 100%)
        `,
        backgroundSize: '400px 400px, 600px 600px, cover',
        backgroundRepeat: 'no-repeat'
      }}
    >
      <main 
        className="text-center relative text-white"
        style={{
          width: 'min(520px, 92vw)',
          padding: '56px 42px 54px',
          background: 'rgba(255, 255, 255, 0.12)',
          backdropFilter: 'blur(14px)',
          borderRadius: '18px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.25)'
        }}
        role="main"
        aria-label="Admin Login"
      >
        {/* Avatar */}
        <div 
          className="mx-auto mb-6 rounded-full flex items-center justify-center"
          style={{
            width: '92px',
            height: '92px',
            background: '#2563EB',
            boxShadow: '0 10px 30px rgba(0,0,0,.2) inset, 0 6px 18px rgba(0,0,0,.08)'
          }}
          aria-hidden="true"
        >
          <svg 
            viewBox="0 0 24 24" 
            xmlns="http://www.w3.org/2000/svg"
            style={{ width: '44px', height: '44px', fill: 'white', opacity: '.95' }}
          >
            <path d="M12 12c2.761 0 5-2.239 5-5s-2.239-5-5-5-5 2.239-5 5 2.239 5 5 5zm0 2c-4.418 0-8 2.239-8 5v1h16v-1c0-2.761-3.582-5-8-5z"/>
          </svg>
        </div>

        <h1 
          className="mb-9"
          style={{
            fontFamily: "'Montserrat', sans-serif",
            fontWeight: 300,
            letterSpacing: '.35em',
            textIndent: '.35em',
            fontSize: 'clamp(18px, 2.6vw, 28px)',
            margin: '6px 0 36px',
            color: 'white'
          }}
        >
          ADMIN LOGIN
        </h1>

        {error && (
          <div 
            className="mb-6 p-3 rounded-md flex items-center gap-2"
            style={{
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: 'rgba(255, 255, 255, 0.9)',
              fontSize: '0.875rem'
            }}
          >
            <svg 
              style={{ flexShrink: 0, width: '1rem', height: '1rem' }} 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="w-full">
          {/* Email Input */}
          <label 
            className="flex items-center gap-4 pb-4 mb-6"
            htmlFor="email"
            style={{
              borderBottom: '1px solid rgba(255,255,255,.65)',
              padding: '10px 2px 14px'
            }}
          >
            <svg 
              viewBox="0 0 24 24" 
              xmlns="http://www.w3.org/2000/svg" 
              aria-hidden="true"
              style={{ width: '20px', height: '20px', fill: 'white', opacity: '.9' }}
            >
              <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
            </svg>
            <input 
              id="email" 
              name="email" 
              type="email" 
              placeholder="Email ID" 
              required 
              value={formData.email}
              onChange={handleChange}
              className="w-full bg-transparent border-0 outline-none text-white text-base p-1"
              style={{
                caretColor: 'white'
              }}
            />
          </label>

          {/* Password Input */}
          <label 
            className="flex items-center gap-4 pb-4 mb-6"
            htmlFor="password"
            style={{
              borderBottom: '1px solid rgba(255,255,255,.65)',
              padding: '10px 2px 14px'
            }}
          >
            <svg 
              viewBox="0 0 24 24" 
              xmlns="http://www.w3.org/2000/svg" 
              aria-hidden="true"
              style={{ width: '20px', height: '20px', fill: 'white', opacity: '.9' }}
            >
              <path d="M12 17a2 2 0 100-4 2 2 0 000 4zm6-6h-1V9a5 5 0 10-10 0v2H6c-1.1 0-2 .9-2 2v7c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2v-7c0-1.1-.9-2-2-2zm-3 0H9V9a3 3 0 016 0v2z"/>
            </svg>
            <input 
              id="password" 
              name="password" 
              type="password" 
              placeholder="Password" 
              required 
              value={formData.password}
              onChange={handleChange}
              className="w-full bg-transparent border-0 outline-none text-white text-base p-1"
              style={{
                caretColor: 'white'
              }}
            />
          </label>

          <button 
            className="w-full border-0 text-white font-semibold py-4 px-5 rounded-md cursor-pointer transition-transform active:translate-y-px"
            type="submit"
            disabled={loading}
            style={{
              background: 'linear-gradient(90deg, #1E4ED8, #2563EB)',
              fontFamily: "'Montserrat', sans-serif",
              letterSpacing: '.25em',
              textIndent: '.25em',
              fontWeight: 600,
              boxShadow: '0 12px 26px rgba(0,0,0,.18)'
            }}
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Signing In...
              </span>
            ) : (
              'LOGIN'
            )}
          </button>
        </form>

        {/* Back to Home Button */}
        <div className="mt-6 text-center">
          <button 
            type="button"
            onClick={() => navigate('/')}
            className="text-white/70 underline hover:text-white bg-transparent border-0 cursor-pointer text-sm transition-colors"
          >
            ← Back to Home
          </button>
        </div>

      </main>

      <style>{`
        input::placeholder {
          color: rgba(255,255,255,.55);
        }
        input:focus, button:focus, a:focus {
          outline: 2px dashed rgba(255,255,255,.45);
          outline-offset: 3px;
        }
      `}</style>
     </div>
   );
 };

export default AdminLogin;
