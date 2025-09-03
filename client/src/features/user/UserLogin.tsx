import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { useUserAuth } from '../../contexts/UserAuthContext';
import { Button, Flex } from '@radix-ui/themes';
import { EnvelopeClosedIcon, LockClosedIcon, ExclamationTriangleIcon } from '@radix-ui/react-icons';

interface LoginFormData {
  email: string;
  password: string;
}

interface UserStatus {
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
}

const UserLogin: React.FC = () => {
  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [userStatus, setUserStatus] = useState<UserStatus | null>(null);
  const { login, isLoading } = useUserAuth();
  const [, navigate] = useLocation();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear errors when user starts typing
    if (error) setError('');
    if (userStatus) setUserStatus(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setUserStatus(null);

    try {
      const result = await login(formData.email, formData.password);
      
      if (result.success) {
        // Clear browser history to prevent back navigation to login
        window.history.replaceState(null, '', '/app');
        navigate('/app'); // Navigate to main app
      } else {
        // Handle different error cases
        if (result.status === 'pending') {
          setUserStatus({ status: 'pending' });
        } else if (result.status === 'rejected') {
          setUserStatus({ 
            status: 'rejected', 
            rejectionReason: result.message 
          });
        } else {
          setError(result.message || 'Login failed. Please check your credentials.');
        }
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setError('Network error. Please check your connection and try again.');
    }
  };

  const renderStatusMessage = () => {
    if (!userStatus) return null;

    if (userStatus.status === 'pending') {
      return (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start gap-3">
            <ExclamationTriangleIcon className="text-yellow-600 w-5 h-5 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="text-yellow-800 font-medium mb-1">Account Pending Approval</h3>
              <p className="text-yellow-700 text-sm">
                Your account is waiting for admin approval. You will receive an email notification once your account is approved and you can log in.
              </p>
            </div>
          </div>
        </div>
      );
    }

    if (userStatus.status === 'rejected') {
      return (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start gap-3">
            <ExclamationTriangleIcon className="text-red-600 w-5 h-5 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="text-red-800 font-medium mb-1">Account Rejected</h3>
              <p className="text-red-700 text-sm mb-2">
                Your account has been rejected by the administrator.
              </p>
              {userStatus.rejectionReason && (
                <div className="bg-red-100 p-2 rounded text-red-800 text-sm">
                  <strong>Reason:</strong> {userStatus.rejectionReason}
                </div>
              )}
              <p className="text-red-700 text-sm mt-2">
                Please contact support if you believe this is an error.
              </p>
            </div>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h1>
          <p className="text-gray-600">Sign in to your account</p>
        </div>

        {renderStatusMessage()}

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <div className="relative">
              <EnvelopeClosedIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                placeholder="Enter your email"
                required
                disabled={isLoading}
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <div className="relative">
              <LockClosedIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                placeholder="Enter your password"
                required
                disabled={isLoading}
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <Flex align="center" gap="2">
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                Signing In...
              </Flex>
            ) : (
              'Sign In'
            )}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-600">
            Don't have an account?{' '}
            <button
              onClick={() => navigate('/user/signup')}
              className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
            >
              Sign up here
            </button>
          </p>
        </div>

        <div className="mt-4 text-center">
          <button
            onClick={() => navigate('/')}
            className="text-gray-500 hover:text-gray-700 text-sm transition-colors"
          >
            ← Back to Home
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserLogin;