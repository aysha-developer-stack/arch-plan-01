import { Button } from "@/components/ui/button";
import { Bell, Search } from "lucide-react";
import { useLocation } from "wouter";
import type { UserType } from "@shared/schema";

interface HeaderProps {
  user?: UserType;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

export default function Header({ user, activeTab, onTabChange }: HeaderProps) {
  const [, setLocation] = useLocation();

  const handleAdminClick = () => {
    // Redirect to admin login page
    setLocation('/admin/login');
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Search className="text-primary text-2xl" />
              <h1 className="text-xl font-bold text-slate-900">ArchPlan</h1>
            </div>
          </div>
          
          <nav className="hidden md:flex items-center space-x-6">
            <button 
              onClick={() => onTabChange?.('search')}
              className={`px-3 py-2 text-sm font-medium ${activeTab === 'search' ? 'text-primary border-b-2 border-primary' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Search Plans
            </button>
            <button
              onClick={handleAdminClick}
              className={`px-3 py-2 text-sm font-medium ${activeTab === 'admin' ? 'text-primary border-b-2 border-primary' : 'text-slate-500 hover:text-slate-700'}`}
            >
              {user ? 'Admin Dashboard' : 'Admin Login'}
            </button>
          </nav>

          <div className="flex items-center space-x-4">
            <Button className="bg-transparent hover:bg-slate-100 p-2">
              <Bell className="h-5 w-5" />
            </Button>
            
            {/* {user?.profileImageUrl ? (
              <img
                src={user.profileImageUrl}
                alt="User profile"
                className="w-8 h-8 rounded-full object-cover"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-slate-300"></div>
            )} */}
            
            {/* <Button
              onClick={() => setLocation("/logout")}
            >
              Logout
            </Button> */}
          </div>
        </div>
      </div>
    </header>
  );
}
