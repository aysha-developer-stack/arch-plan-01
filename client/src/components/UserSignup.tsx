import { useState } from "react";
import { Loader2, CheckCircle, AlertCircle, User, Mail, Lock } from "lucide-react";
import { apiClient } from "@/lib/axios";

interface SignupFormData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

interface SignupResponse {
  success: boolean;
  message: string;
  user?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    status: string;
  };
}

export default function UserSignup() {
  const [formData, setFormData] = useState<SignupFormData>({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: ""
  });
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isRegistered, setIsRegistered] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = (): string | null => {
    if (!formData.firstName.trim()) return "First name is required";
    if (!formData.lastName.trim()) return "Last name is required";
    if (!formData.email.trim()) return "Email is required";
    if (!formData.password) return "Password is required";
    if (formData.password.length < 6) return "Password must be at least 6 characters";
    if (formData.password !== formData.confirmPassword) return "Passwords do not match";
    
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
      const response = await apiClient.post<SignupResponse>('/api/users/signup', {
        name: `${formData.firstName.trim()} ${formData.lastName.trim()}`,
        email: formData.email.trim().toLowerCase(),
        password: formData.password
      });

      if (response.data.success) {
        setIsRegistered(true);
        setMessage({ 
          type: 'success', 
          text: response.data.message 
        });
        // Clear form
        setFormData({
          firstName: "",
          lastName: "",
          email: "",
          password: "",
          confirmPassword: ""
        });
      } else {
        setMessage({ 
          type: 'error', 
          text: response.data.message || 'Registration failed' 
        });
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Registration failed. Please try again.';
      setMessage({ type: 'error', text: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  if (isRegistered) {
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
          aria-label="Registration Success"
        >
          {/* Success Avatar */}
          <div 
            className="w-24 h-24 mx-auto mb-6 rounded-full flex items-center justify-center"
            style={{
              background: '#10B981',
              boxShadow: '0 10px 30px rgba(0,0,0,.2) inset, 0 6px 18px rgba(0,0,0,.08)'
            }}
            aria-hidden="true"
          >
            <CheckCircle className="w-11 h-11 text-white opacity-95" />
          </div>

          {/* Title */}
          <h1 
            className="mb-6 text-white"
            style={{
              fontFamily: "'Montserrat', sans-serif",
              fontWeight: 300,
              letterSpacing: '.35em',
              textIndent: '.35em',
              fontSize: 'clamp(18px, 2.6vw, 28px)'
            }}
          >
            SUCCESS!
          </h1>

          {/* Success Message */}
          <div className="mb-8 space-y-4">
            <p className="text-white text-lg font-medium">Registration Successful!</p>
            <div 
              className="p-4 rounded-lg text-white/90 text-sm leading-relaxed"
              style={{
                background: 'rgba(16, 185, 129, 0.2)',
                border: '1px solid rgba(16, 185, 129, 0.3)'
              }}
            >
              Thank you for registering! Your account is currently pending admin approval.
              You will receive an email notification once an administrator reviews and approves your account.
            </div>
          </div>

          {/* Go to Login Button */}
          <button
            onClick={() => window.location.href = '/login'}
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
            GO TO LOGIN
          </button>
        </main>
      </div>
    );
  }

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
        aria-label="User Signup"
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
          SIGN UP
        </h1>

        {/* Form */}
        <form onSubmit={handleSubmit} className="w-full">
          {/* Name Fields */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <label 
              className="grid grid-cols-1 items-center gap-2 py-3 px-1"
              style={{
                borderBottom: '1px solid rgba(255,255,255,.65)'
              }}
              htmlFor="firstName"
            >
              <input
                id="firstName"
                name="firstName"
                type="text"
                value={formData.firstName}
                onChange={handleInputChange}
                placeholder="First Name"
                required
                disabled={isLoading}
                className="w-full bg-transparent border-0 outline-none text-white text-base py-2 px-1"
                style={{
                  caretColor: 'white'
                }}
              />
            </label>
            <label 
              className="grid grid-cols-1 items-center gap-2 py-3 px-1"
              style={{
                borderBottom: '1px solid rgba(255,255,255,.65)'
              }}
              htmlFor="lastName"
            >
              <input
                id="lastName"
                name="lastName"
                type="text"
                value={formData.lastName}
                onChange={handleInputChange}
                placeholder="Last Name"
                required
                disabled={isLoading}
                className="w-full bg-transparent border-0 outline-none text-white text-base py-2 px-1"
                style={{
                  caretColor: 'white'
                }}
              />
            </label>
          </div>

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

          {/* Confirm Password Input */}
          <label 
            className="grid grid-cols-[24px_1fr] items-center gap-4 py-3 px-1 mb-6"
            style={{
              borderBottom: '1px solid rgba(255,255,255,.65)'
            }}
            htmlFor="confirmPassword"
          >
            <Lock className="w-5 h-5 text-white opacity-90" aria-hidden="true" />
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              placeholder="Confirm Password"
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
              <div 
                className="p-4 rounded-lg flex items-start gap-3"
                style={{
                  background: message.type === 'success' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                  border: `1px solid ${message.type === 'success' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                  color: 'white'
                }}
              >
                {message.type === 'success' ? (
                  <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                )}
                <span className="text-sm">{message.text}</span>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full border-0 text-white font-semibold py-4 px-5 rounded-md cursor-pointer transition-transform active:translate-y-px mb-6"
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
                Creating Account...
              </span>
            ) : (
              'CREATE ACCOUNT'
            )}
          </button>

          {/* Sign In Link */}
          <div className="text-sm" style={{ color: 'rgba(255,255,255,.7)' }}>
            Already have an account?{' '}
            <button 
              type="button"
              onClick={() => window.location.href = '/login'}
              className="text-white/70 underline hover:text-white bg-transparent border-0 cursor-pointer"
            >
              Sign in
            </button>
          </div>

          {/* Back to Home Link */}
          <div className="text-sm" style={{ color: 'rgba(255,255,255,.7)' }}>
            <button 
              type="button"
              onClick={() => window.location.href = '/'}
              className="text-white/70 underline hover:text-white bg-transparent border-0 cursor-pointer"
            >
              ← Back to Home
            </button>
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
        @media (max-width: 420px) {
          .grid-cols-2 {
            grid-template-columns: 1fr;
            gap: 0;
          }
        }
      `}</style>
    </div>
  );
}
