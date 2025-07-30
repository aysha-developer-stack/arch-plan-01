import { Button } from "@/components/ui/button";
import { Bell, Search } from "lucide-react";
import type { UserType } from "@shared/schema";

interface HeaderProps {
  user?: UserType;
  activeTab: "search" | "admin";
  onTabChange: (tab: "search" | "admin") => void;
}

export default function Header({ user, activeTab, onTabChange }: HeaderProps) {
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
              onClick={() => onTabChange("search")}
              className={`px-3 py-2 text-sm font-medium transition-colors ${
                activeTab === "search"
                  ? "text-primary border-b-2 border-primary"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Search Plans
            </button>
            <button
              onClick={() => onTabChange("admin")}
              className={`px-3 py-2 text-sm font-medium transition-colors ${
                activeTab === "admin"
                  ? "text-primary border-b-2 border-primary"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Admin Portal
            </button>
          </nav>

          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm">
              <Bell className="h-5 w-5" />
            </Button>
            
            {user?.profileImageUrl ? (
              <img
                src={user.profileImageUrl}
                alt="User profile"
                className="w-8 h-8 rounded-full object-cover"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-slate-300"></div>
            )}
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.location.href = "/api/logout"}
            >
              Logout
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
