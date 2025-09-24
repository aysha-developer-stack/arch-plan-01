import React, { useState } from 'react';
import { apiClient } from '../lib/axios';
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

interface SignupFormProps {
  onSuccess?: () => void;
  onSwitchToLogin?: () => void;
}

export const SignupForm: React.FC<SignupFormProps> = ({ onSuccess, onSwitchToLogin }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

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

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match' });
      setIsLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters long' });
      setIsLoading(false);
      return;
    }

    try {
      const response = await apiClient.post('/api/auth/register', {
        email: formData.email,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        firstName: formData.firstName,
        lastName: formData.lastName
      });

      if (response.data.success) {
        setMessage({ 
          type: 'success', 
          text: 'Registration successful! Please wait for admin approval before logging in.' 
        });
        setFormData({
          email: '',
          password: '',
          confirmPassword: '',
          firstName: '',
          lastName: ''
        });
        if (onSuccess) {
          setTimeout(onSuccess, 2000);
        }
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Registration failed. Please try again.';
      setMessage({ type: 'error', text: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="glass-card w-full max-w-lg mx-auto text-center" style={{ padding: '56px 42px 54px', position: 'relative' }} role="main" aria-label="User Signup">
      {/* Avatar */}
      <div className="glass-avatar mx-auto mb-6" aria-hidden="true">
        <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="glass-avatar-icon">
          <path d="M12 12c2.761 0 5-2.239 5-5s-2.239-5-5-5-5 2.239-5 5 2.239 5 5 5zm0 2c-4.418 0-8 2.239-8 5v1h16v-1c0-2.761-3.582-5-8-5z"/>
        </svg>
      </div>

      {/* Title */}
      <h1 className="glass-title">CREATE ACCOUNT</h1>

      {/* Form */}
      <form onSubmit={handleSubmit} className="w-full" autoComplete="on">
        {/* Name Inputs Row */}
        <div className="flex gap-3 mb-4">
          {/* First Name Input */}
          <label className="glass-input-row-no-icon flex-1" htmlFor="firstName">
            <input
              id="firstName"
              name="firstName"
              type="text"
              placeholder="First Name"
              className="glass-input"
              value={formData.firstName}
              onChange={handleInputChange}
              required
            />
          </label>

          {/* Last Name Input */}
          <label className="glass-input-row-no-icon flex-1" htmlFor="lastName">
            <input
              id="lastName"
              name="lastName"
              type="text"
              placeholder="Last Name"
              className="glass-input"
              value={formData.lastName}
              onChange={handleInputChange}
              required
            />
          </label>
        </div>

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
            minLength={6}
          />
        </label>

        {/* Confirm Password Input */}
        <label className="glass-input-row" htmlFor="confirmPassword">
          <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="glass-icon" aria-hidden="true">
            <path d="M12 17a2 2 0 100-4 2 2 0 000 4zm6-6h-1V9a5 5 0 10-10 0v2H6c-1.1 0-2 .9-2 2v7c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2v-7c0-1.1-.9-2-2-2zm-3 0H9V9a3 3 0 016 0v2z"/>
          </svg>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            placeholder="Confirm Password"
            className="glass-input"
            value={formData.confirmPassword}
            onChange={handleInputChange}
            required
          />
        </label>

        {/* Alert Messages */}
        {message && (
          <div className={`glass-alert ${message.type}`}>
            {message.type === 'success' ? (
              <CheckCircle className="h-4 w-4" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            <div>{message.text}</div>
          </div>
        )}

        {/* Submit Button */}
        <button className="glass-btn" type="submit" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" style={{ display: 'inline', marginRight: '8px' }} />
              CREATING ACCOUNT...
            </>
          ) : (
            'CREATE ACCOUNT'
          )}
        </button>
      </form>

      {/* Switch to Login */}
      <div style={{ marginTop: '24px', textAlign: 'center' }}>
        <p style={{ fontSize: '14px', color: 'var(--glass-white-70)' }}>
          Already have an account?{' '}
          <button
            type="button"
            onClick={onSwitchToLogin}
            className="glass-link"
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px' }}
          >
            Sign in
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
