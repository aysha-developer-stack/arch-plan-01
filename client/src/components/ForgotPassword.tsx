import { useState } from "react";
import { Loader2, Mail, ArrowLeft } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useUserAuth } from "@/contexts/UserAuthContext";

export default function ForgotPassword() {
  const { forgotPassword } = useUserAuth();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
  };

  const validateForm = (): string | null => {
    if (!email.trim()) return "Email is required";
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return "Please enter a valid email address";
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

    const { success, message: errorMessage } = await forgotPassword(email);

    if (success) {
      setMessage({ 
        type: 'success', 
        text: "If an account exists with this email, you'll receive a password reset link shortly. Please check your inbox and spam folder."
      });
    } else {
      setMessage({ 
        type: 'error', 
        text: errorMessage || "An error occurred. Please try again."
      });
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
        aria-label="Forgot Password"
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
          RESET YOUR PASSWORD
        </h1>
        <p className="mb-8 text-white/80">
          Enter the email address associated with your account, and we’ll send you a link to reset your password.
        </p>

        <form onSubmit={handleSubmit} className="w-full">
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
              value={email}
              onChange={handleInputChange}
              placeholder="Enter your email address"
              required
              disabled={isLoading}
              className="w-full bg-transparent border-0 outline-none text-white text-base py-2 px-1"
              style={{
                caretColor: 'white'
              }}
            />
          </label>

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
                Sending...
              </span>
            ) : (
              'SEND RESET LINK'
            )}
          </button>
        </form>
        <div className="mt-6">
          <button 
            type="button"
            onClick={() => window.location.href = '/login'}
            className="text-white/70 underline hover:text-white bg-transparent border-0 cursor-pointer text-sm flex items-center justify-center w-full"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Login
          </button>
        </div>
      </main>
    </div>
  );
}
