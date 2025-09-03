import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import Header from "@/components/Header";
import SearchInterface from "@/components/SearchInterface";
import type { UserType } from "@shared/schema";

export default function Home() {
  const { user } = useAuth({ skipAuthCheck: true }) as { user: UserType | undefined };

  // Browser history security - prevent back button to login
  useEffect(() => {
    // Replace current history entry to prevent back navigation to login
    window.history.replaceState(null, '', '/app');
    
    // Handle browser back button
    const handlePopState = (event: PopStateEvent) => {
      // Check if user is still authenticated
      const token = localStorage.getItem('token');
      const userData = localStorage.getItem('user');
      if (!token || !userData) {
        // Redirect to login if not authenticated
        window.location.replace('/login');
      } else {
        // Prevent going back by pushing the current state again
        window.history.pushState(null, '', '/app');
      }
      event.preventDefault();
    };
    
    // Add event listener
    window.addEventListener('popstate', handlePopState);
    
    // Cleanup
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-50">
      <Header user={user} />
      <SearchInterface />
    </div>
  );
}
