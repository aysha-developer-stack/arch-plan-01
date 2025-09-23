import { useState } from "react";
import { Loader2, AlertCircle, Clock, XCircle, Mail, Lock, User } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { apiClient } from "@/lib/axios";

interface LoginFormData {
  email: string;
  password: string;
}

interface LoginResponse {
  success: boolean;
  message: string;
  status?: 'pending' | 'rejected' | 'approved';
  user?: {
    id: string;
    email: string;
    name: string;
    status: string;
    downloadCount: number;
    token: string;
  };
}

export default function UserLogin() {
  const [formData, setFormData] = useState<LoginFormData>({
    email: "",
    password: ""
  });
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'warning'; text: string; status?: string } | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = (): string | null => {
    if (!formData.email.trim()) return "Email is required";
    if (!formData.password) return "Password is required";
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) return "Please enter a valid email address";
    
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationError = validateForm();
    if (validationError) {
      setMessage({ type: 'error', text: validationError });
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      const response = await apiClient.post<LoginResponse>('/api/users/login', {
        email: formData.email.trim().toLowerCase(),
        password: formData.password
      });

      if (response.data.success && response.data.user) {
        // Store token and user info
        localStorage.setItem('token', response.data.user.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        
        setMessage({ 
          type: 'success', 
          text: 'Login successful! Redirecting...' 
        });

        // Redirect to dashboard after short delay with history security
        setTimeout(() => {
          // Clear browser history to prevent back navigation to login
          window.history.replaceState(null, '', '/dashboard');
          window.location.replace('/dashboard');
        }, 1500);
      } else {
        setMessage({ 
          type: 'error', 
          text: response.data.message || 'Login failed' 
        });
      }
    } catch (error: any) {
      const errorResponse = error.response?.data;
      const errorMessage = errorResponse?.message || 'Login failed. Please try again.';
      const status = errorResponse?.status;

      if (status === 'pending') {
        setMessage({ 
          type: 'warning', 
          text: errorMessage,
          status: 'pending'
        });
      } else if (status === 'rejected') {
        setMessage({ 
          type: 'error', 
          text: errorMessage,
          status: 'rejected'
        });
      } else {
        setMessage({ type: 'error', text: errorMessage });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-red-600" />;
    }
  };

  const getStatusAlert = (message: { type: string; text: string; status?: string }) => {
    if (message.status === 'pending') {
      return (
        <Alert className="border-yellow-200 bg-yellow-50">
          <Clock className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            <div className="space-y-2">
              <p className="font-medium">Account Pending Approval</p>
              <p>{message.text}</p>
              <p className="text-sm">Please wait for an administrator to review and approve your account.</p>
            </div>
          </AlertDescription>
        </Alert>
      );
    }

    if (message.status === 'rejected') {
      return (
        <Alert className="border-red-200 bg-red-50">
          <XCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <div className="space-y-2">
              <p className="font-medium">Account Rejected</p>
              <p>{message.text}</p>
              <p className="text-sm">Please contact support if you believe this is an error.</p>
            </div>
          </AlertDescription>
        </Alert>
      );
    }

    return (
      <Alert className={message.type === 'success' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
        {getStatusIcon(message.status)}
        <AlertDescription className={message.type === 'success' ? 'text-green-800' : 'text-red-800'}>
          {message.text}
        </AlertDescription>
      </Alert>
    );
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center"
      style={{
        fontFamily: "'Nunito', system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, 'Apple Color Emoji', 'Segoe UI Emoji'",
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
        className="w-full max-w-md mx-4 text-center relative text-white p-14 rounded-2xl"
        style={{
          background: 'rgba(255, 255, 255, 0.12)',
          backdropFilter: 'blur(14px)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.25)'
        }}
        role="main" 
        aria-label="Customer Login"
      >
        {/* Avatar */}
        <div 
          className="w-24 h-24 mx-auto mb-6 rounded-full flex items-center justify-center"
          style={{
            background: '#2563EB',
            boxShadow: '0 10px 30px rgba(0,0,0,.2) inset, 0 6px 18px rgba(0,0,0,.08)'
          }}
          aria-hidden="true"
        >
          <User className="w-11 h-11 text-white opacity-95" />
        </div>

        {/* Title */}
        <h1 
          className="mb-9 text-white"
          style={{
            fontFamily: "'Montserrat', sans-serif",
            fontWeight: 300,
            letterSpacing: '.35em',
            textIndent: '.35em',
            fontSize: 'clamp(18px, 2.6vw, 28px)',
            margin: '6px 0 36px'
          }}
        >
          LOGIN
        </h1>

        {/* Form */}
        <form onSubmit={handleSubmit} className="w-full">
          {/* Email Input */}
          <label 
            className="grid grid-cols-[24px_1fr] items-center gap-4 py-3 px-1 mb-6"
            style={{
              borderBottom: '1px solid rgba(255,255,255,.65)'
            }}
            htmlFor="email"
          >
            <Mail className="w-5 h-5 text-white opacity-90" aria-hidden="true" />
            <input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="Email ID"
              required
              disabled={isLoading}
              className="w-full bg-transparent border-0 outline-none text-white text-base py-2 px-1"
              style={{
                caretColor: 'white'
              }}
            />
          </label>

          {/* Password Input */}
          <label 
            className="grid grid-cols-[24px_1fr] items-center gap-4 py-3 px-1 mb-6"
            style={{
              borderBottom: '1px solid rgba(255,255,255,.65)'
            }}
            htmlFor="password"
          >
            <Lock className="w-5 h-5 text-white opacity-90" aria-hidden="true" />
            <input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleInputChange}
              placeholder="Password"
              required
              disabled={isLoading}
              className="w-full bg-transparent border-0 outline-none text-white text-base py-2 px-1"
              style={{
                caretColor: 'white'
              }}
            />
          </label>



          {/* Alert Messages */}
          {message && (
            <div className="mb-6">
              {getStatusAlert(message)}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full border-0 text-white font-semibold py-4 px-5 rounded-md cursor-pointer transition-transform active:translate-y-px"
            style={{
              background: 'linear-gradient(90deg, #1E4ED8, #2563EB)',
              fontFamily: "'Montserrat', sans-serif",
              letterSpacing: '.25em',
              textIndent: '.25em',
              fontWeight: 600,
              boxShadow: '0 12px 26px rgba(0,0,0,.18)'
            }}
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Signing In...
              </span>
            ) : (
              'LOGIN'
            )}
          </button>

          {/* Links */}
          <div className="mt-6 space-y-2">
            <div className="text-sm" style={{ color: 'rgba(255,255,255,.7)' }}>
              Don't have an account?{' '}
              <button 
                type="button"
                onClick={() => window.location.href = '/signup'}
                className="text-white/70 underline hover:text-white bg-transparent border-0 cursor-pointer"
              >
                Sign up
              </button>
            </div>
            <div>
              <button 
                type="button"
                onClick={() => window.location.href = '/admin/login'}
                className="text-white/70 underline hover:text-white bg-transparent border-0 cursor-pointer text-sm"
              >
                Admin Login
              </button>
            </div>
            <div className="text-sm" style={{ color: 'rgba(255,255,255,.7)' }}>
              <button 
                type="button"
                onClick={() => window.location.href = '/'}
                className="text-white/70 underline hover:text-white bg-transparent border-0 cursor-pointer text-sm"
              >
                ← Back to Home
              </button>
            </div>
          </div>
        </form>
      </main>

      <style>{`
        input::placeholder {
          color: rgba(255,255,255,.55);
        }
        input:focus, button:focus, a:focus {
          outline: 2px dashed rgba(255,255,255,.45);
          outline-offset: 3px;
        }
        input[type="checkbox"]:checked {
          background: white;
        }
        input[type="checkbox"]:checked::after {
          content: "";
          width: 9px;
          height: 9px;
          background: #2563EB;
        }
        @media (max-width: 420px) {
          .meta {
            flex-direction: column;
            align-items: flex-start;
            gap: 10px;
          }
        }
      `}</style>
    </div>
  );
}
