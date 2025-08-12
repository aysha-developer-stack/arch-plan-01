import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { apiClient } from '../../lib/axios';
import { Button, Flex } from '@radix-ui/themes';
import { LockClosedIcon, EnvelopeClosedIcon } from '@radix-ui/react-icons';

interface LoginFormData {
  email: string;
  password: string;
}

const AdminLogin: React.FC = () => {
  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [, navigate] = useLocation();

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
      if (response.data.message === 'Login successful') {
        // Admin login uses HTTP-only cookies, so no token in response
        localStorage.setItem('adminEmail', formData.email);
        navigate('/admin');
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
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #f5f7fa 0%, #e4e8f0 100%)',
      padding: '1rem'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '420px',
        backgroundColor: 'white',
        borderRadius: '12px',
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
        overflow: 'hidden',
        position: 'relative',
      }}>
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '6px',
          background: 'linear-gradient(90deg, #4f46e5 0%, #7c3aed 100%)',
        }} />
        <div style={{ padding: '2.5rem 2rem' }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{
              margin: '0 auto 1rem',
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              backgroundColor: '#f0f5ff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginLeft: 'auto',
              marginRight: 'auto',
              marginBottom: '1.25rem'
            }}>
              <LockClosedIcon style={{ width: '28px', height: '28px', color: '#4f46e5' }} />
            </div>
            <h1 style={{
              fontSize: '1.5rem',
              fontWeight: 600,
              color: '#111827',
              marginBottom: '0.5rem',
              lineHeight: '1.2'
            }}>
              Welcome Back
            </h1>
            <p style={{
              color: '#6b7280',
              fontSize: '0.9375rem',
              lineHeight: '1.5',
              maxWidth: '320px',
              margin: '0 auto'
            }}>
              Sign in to access your admin dashboard
            </p>
          </div>

          {error && (
            <div style={{
              padding: '0.75rem 1rem',
              backgroundColor: '#fef2f2',
              borderLeft: '4px solid #ef4444',
              borderRadius: '0.375rem',
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.875rem',
              color: '#b91c1c'
            }}>
              <svg style={{ flexShrink: 0, width: '1.25rem', height: '1.25rem' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '1.5rem' }}>
              <label htmlFor="email" style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: 500,
                color: '#374151',
                marginBottom: '0.5rem'
              }}>
                Email
              </label>
              <div style={{ position: 'relative' }}>
                <div style={{
                  position: 'absolute',
                  left: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#9ca3af',
                  pointerEvents: 'none'
                }}>
                  <EnvelopeClosedIcon width="18" height="18" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  style={{
                    width: '100%',
                    padding: '0.625rem 0.75rem 0.625rem 2.5rem',
                    fontSize: '0.9375rem',
                    lineHeight: '1.5',
                    color: '#111827',
                    backgroundColor: '#fff',
                    backgroundClip: 'padding-box',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.5rem',
                    transition: 'border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out',
                    outline: 'none'
                  }}
                  onFocus={(e: React.FocusEvent<HTMLInputElement>) => {
                    e.target.style.borderColor = '#818cf8';
                    e.target.style.boxShadow = '0 0 0 3px rgba(129, 140, 248, 0.2)';
                  }}
                  onBlur={(e: React.FocusEvent<HTMLInputElement>) => {
                    e.target.style.borderColor = '#d1d5db';
                    e.target.style.boxShadow = 'none';
                  }}
                />
            </div>

            </div>

            <div style={{ marginTop: '1.5rem', position: 'relative' }}>
              <div style={{
                position: 'absolute',
                left: '0.75rem',
                top: 0,
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                pointerEvents: 'none'
              }}>
                <LockClosedIcon width="16" height="16" style={{
                  position: 'relative',
                  top: '-12px' // Slight vertical adjustment
                }} />
              </div>
              <input
                name="password"
                type="password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleChange}
                required
                style={{
                  padding: '0.75rem 1rem 0.75rem 2.75rem',
                  width: '100%',
                  borderRadius: '0.5rem',
                  border: '1px solid #d1d5db',
                  fontSize: '0.9375rem',
                  lineHeight: '1.5',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                  marginBottom: '1.5rem'
                }}
                onFocus={(e: React.FocusEvent<HTMLInputElement>) => {
                  e.target.style.borderColor = '#3b82f6';
                  e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.2)';
                }}
                onBlur={(e: React.FocusEvent<HTMLInputElement>) => {
                  e.target.style.borderColor = '#d1d5db';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>

            <Button 
              type="submit" 
              disabled={loading} 
              style={{ 
                width: '100%',
                padding: '0.75rem',
                fontSize: '1rem',
                fontWeight: 500,
                backgroundColor: '#4f46e5',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                transition: 'background-color 0.2s',
                ...(loading ? {
                  opacity: 0.7,
                  cursor: 'not-allowed'
                } : {})
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.currentTarget.style.backgroundColor = '#4338ca';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#4f46e5';
              }}
            >
              {loading ? 'Logging in...' : 'Sign in'}
            </Button>
          </form>

          {/* Browse Plans Button */}
          <div style={{ marginTop: '1rem', textAlign: 'center' }}>
            <Button 
              type="button"
              onClick={() => navigate('/app')}
              style={{
                width: '100%',
                padding: '0.625rem',
                fontSize: '0.875rem',
                fontWeight: 400,
                backgroundColor: 'transparent',
                color: '#6b7280',
                border: '1px solid #d1d5db',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f9fafb';
                e.currentTarget.style.borderColor = '#9ca3af';
                e.currentTarget.style.color = '#374151';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.borderColor = '#d1d5db';
                e.currentTarget.style.color = '#6b7280';
              }}
            >
              Browse Plans
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
