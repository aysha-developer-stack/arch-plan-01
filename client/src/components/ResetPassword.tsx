import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Loader2, Lock, Eye, EyeOff } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/lib/supabase";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [, navigate] = useLocation();

  useEffect(() => {
    const hash = window.location.hash;
    const params = new URLSearchParams(hash.substring(1));
    const accessToken = params.get('access_token');
    if (accessToken) {
      setToken(accessToken);
    }
  }, []);

  const validateForm = (): string | null => {
    if (!password) return "Password is required";
    if (password.length < 6) return "Password must be at least 6 characters long";
    if (password !== confirmPassword) return "Passwords do not match";
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationError = validateForm();
    if (validationError) {
      setMessage({ type: 'error', text: validationError });
      return;
    }

    if (!token) {
      setMessage({ type: 'error', text: 'Invalid or expired password reset link.' });
      return;
    }

    setIsLoading(true);
    setMessage(null);

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setMessage({ type: 'error', text: error.message });
    } else {
      setMessage({ type: 'success', text: 'Your password has been updated successfully. You can now log in.' });
      setTimeout(() => navigate('/login'), 3000);
    }

    setIsLoading(false);
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
        aria-label="Reset Password"
      >
        <h1 
          className="mb-4 text-white"
          style={{
            fontFamily: "'Montserrat', sans-serif",
            fontWeight: 300,
            letterSpacing: '.35em',
            textIndent: '.35em',
            fontSize: 'clamp(18px, 2.6vw, 28px)',
          }}
        >
          CREATE A NEW PASSWORD
        </h1>
        <p className="mb-8 text-white/80">
          Choose a strong password you haven’t used before.
        </p>

        <form onSubmit={handleSubmit} className="w-full">
          <div className="relative mb-6">
            <label 
              className="grid grid-cols-[24px_1fr] items-center gap-4 py-3 px-1"
              style={{
                borderBottom: '1px solid rgba(255,255,255,.65)'
              }}
              htmlFor="password"
            >
              <Lock className="w-5 h-5 text-white opacity-90" aria-hidden="true" />
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="New Password"
                required
                disabled={isLoading}
                className="w-full bg-transparent border-0 outline-none text-white text-base py-2 px-1"
                style={{
                  caretColor: 'white'
                }}
              />
            </label>
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-transparent border-0 cursor-pointer"
            >
              {showPassword ? <EyeOff className="w-5 h-5 text-white/70" /> : <Eye className="w-5 h-5 text-white/70" />}
            </button>
          </div>

          <div className="relative mb-6">
            <label 
              className="grid grid-cols-[24px_1fr] items-center gap-4 py-3 px-1"
              style={{
                borderBottom: '1px solid rgba(255,255,255,.65)'
              }}
              htmlFor="confirmPassword"
            >
              <Lock className="w-5 h-5 text-white opacity-90" aria-hidden="true" />
              <input
                id="confirmPassword"
                name="confirmPassword"
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm New Password"
                required
                disabled={isLoading}
                className="w-full bg-transparent border-0 outline-none text-white text-base py-2 px-1"
                style={{
                  caretColor: 'white'
                }}
              />
            </label>
          </div>

          {message && (
            <div className="mb-6">
              <Alert className={message.type === 'success' ? 'border-green-200 bg-green-50 text-green-800' : 'border-red-200 bg-red-50 text-red-800'}>
                <AlertDescription>
                  {message.text}
                </AlertDescription>
              </Alert>
            </div>
          )}

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
                Updating...
              </span>
            ) : (
              'UPDATE PASSWORD'
            )}
          </button>
        </form>
      </main>
    </div>
  );
}
