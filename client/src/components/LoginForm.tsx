import React, { useState } from 'react';
import { useUserAuth } from '../contexts/UserAuthContext';
import { CheckCircle, AlertCircle, Loader2, Clock, XCircle } from 'lucide-react';

interface LoginFormProps {
  onSwitchToSignup?: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onSwitchToSignup }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'pending' | 'rejected'; text: string; rejectionReason?: string } | null>(null);
  
  const { login } = useUserAuth();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    try {
      const result = await login(formData.email, formData.password);
      
      if (result.success) {
        setMessage({ 
          type: 'success', 
          text: 'Login successful! Redirecting...' 
        });
        // The auth context will handle the redirect
      } else {
        if (result.status === 'pending') {
          setMessage({ 
            type: 'pending', 
            text: 'Your account is pending approval. Please wait for admin approval before logging in.' 
          });
        } else if (result.status === 'rejected') {
          setMessage({ 
            type: 'rejected', 
            text: 'Your account has been rejected.',
            rejectionReason: result.message?.includes('rejected:') ? result.message.split('rejected:')[1].trim() : undefined
          });
        } else {
          setMessage({ 
            type: 'error', 
            text: result.message || 'Login failed. Please check your credentials.' 
          });
        }
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Login failed. Please try again.';
      const status = error.response?.data?.status;
      
      if (status === 'pending') {
        setMessage({ 
          type: 'pending', 
          text: 'Your account is pending approval. Please wait for admin approval before logging in.' 
        });
      } else if (status === 'rejected') {
        setMessage({ 
          type: 'rejected', 
          text: 'Your account has been rejected.',
          rejectionReason: error.response?.data?.rejectionReason
        });
      } else {
        setMessage({ 
          type: 'error', 
          text: errorMessage 
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const getAlertIcon = () => {
    switch (message?.type) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-red-600" />;
    }
  };

  const getAlertClass = () => {
    switch (message?.type) {
      case 'success':
        return 'border-green-200 bg-green-50';
      case 'pending':
        return 'border-yellow-200 bg-yellow-50';
      case 'rejected':
        return 'border-red-200 bg-red-50';
      default:
        return 'border-red-200 bg-red-50';
    }
  };

  const getTextClass = () => {
    switch (message?.type) {
      case 'success':
        return 'text-green-800';
      case 'pending':
        return 'text-yellow-800';
      case 'rejected':
        return 'text-red-800';
      default:
        return 'text-red-800';
    }
  };

  return (
    <main className="glass-card w-full max-w-lg mx-auto text-center" style={{ padding: '56px 42px 54px', position: 'relative' }} role="main" aria-label="User Login">
      {/* Avatar */}
      <div className="glass-avatar mx-auto mb-6" aria-hidden="true">
        <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="glass-avatar-icon">
          <path d="M12 12c2.761 0 5-2.239 5-5s-2.239-5-5-5-5 2.239-5 5 2.239 5 5 5zm0 2c-4.418 0-8 2.239-8 5v1h16v-1c0-2.761-3.582-5-8-5z"/>
        </svg>
      </div>

      {/* Title */}
      <h1 className="glass-title">USER LOGIN</h1>

      {/* Form */}
      <form onSubmit={handleSubmit} className="w-full" autoComplete="on">
        {/* Email Input */}
        <label className="glass-input-row" htmlFor="email">
          <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="glass-icon" aria-hidden="true">
            <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
          </svg>
          <input
            id="email"
            name="email"
            type="email"
            placeholder="Email ID"
            className="glass-input"
            value={formData.email}
            onChange={handleInputChange}
            required
          />
        </label>

        {/* Password Input */}
        <label className="glass-input-row" htmlFor="password">
          <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="glass-icon" aria-hidden="true">
            <path d="M12 17a2 2 0 100-4 2 2 0 000 4zm6-6h-1V9a5 5 0 10-10 0v2H6c-1.1 0-2 .9-2 2v7c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2v-7c0-1.1-.9-2-2-2zm-3 0H9V9a3 3 0 016 0v2z"/>
          </svg>
          <input
            id="password"
            name="password"
            type="password"
            placeholder="Password"
            className="glass-input"
            value={formData.password}
            onChange={handleInputChange}
            required
          />
        </label>

        {/* Alert Messages */}
        {message && (
          <div className={`glass-alert ${message.type}`}>
            {getAlertIcon()}
            <div>
              {message.text}
              {message.rejectionReason && (
                <div style={{ marginTop: '8px', padding: '8px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '4px', fontSize: '14px' }}>
                  <strong>Reason:</strong> {message.rejectionReason}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Submit Button */}
        <button className="glass-btn" type="submit" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" style={{ display: 'inline', marginRight: '8px' }} />
              SIGNING IN...
            </>
          ) : (
            'LOGIN'
          )}
        </button>
      </form>

      {/* Switch to Signup */}
      <div style={{ marginTop: '24px', textAlign: 'center' }}>
        <p style={{ fontSize: '14px', color: 'var(--glass-white-70)' }}>
          Don't have an account?{' '}
          <button
            type="button"
            onClick={onSwitchToSignup}
            className="glass-link"
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px' }}
          >
            Sign up
          </button>
        </p>
      </div>

      {/* Back to Home */}
      <div style={{ marginTop: '16px', textAlign: 'center' }}>
        <button
          type="button"
          onClick={() => window.location.href = '/'}
          className="glass-link"
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', color: 'var(--glass-white-70)' }}
        >
          ← Back to Home
        </button>
      </div>
    </main>
  );
};
