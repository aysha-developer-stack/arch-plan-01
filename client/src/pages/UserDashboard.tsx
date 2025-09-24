import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { useLocation } from "wouter";
import { 
  User, 
  Download, 
  Search, 
  LogOut, 
  CheckCircle,
  FileText,
  TrendingUp,
  Calendar,
  Clock,
  Award,
  Activity,
  BarChart3
} from "lucide-react";

interface UserData {
  id: string;
  email: string;
  name: string;
  firstName?: string;
  lastName?: string;
  status: string;
  downloadCount: number;
  joinDate?: string;
  lastLogin?: string;
  planViews?: number;
  favoriteCount?: number;
}

export default function UserDashboard() {
  const [, navigate] = useLocation();
  const [user, setUser] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Function to fetch latest download count from server
  const fetchUserDownloadCount = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch('/api/users/me/downloads', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUser(prevUser => {
          if (prevUser) {
            const updatedUser = { ...prevUser, downloadCount: data.downloadCount || 0 };
            // Update localStorage with new download count
            localStorage.setItem('user', JSON.stringify(updatedUser));
            return updatedUser;
          }
          return prevUser;
        });
      }
    } catch (error) {
      console.error('Error fetching user download count:', error);
    }
  };

  // Browser history security - prevent back button to login
  useEffect(() => {
    // Replace current history entry to prevent back navigation to login
    window.history.replaceState(null, '', '/dashboard');
    
    // Add a new history entry to prevent back button
    window.history.pushState(null, '', '/dashboard');
    
    // Handle browser back button
    const handlePopState = (event: PopStateEvent) => {
      // Prevent going back by pushing the current state again
      window.history.pushState(null, '', '/dashboard');
      event.preventDefault();
    };
    
    // Handle page visibility change (when user switches tabs/windows)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Verify user is still authenticated when page becomes visible
        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('user');
        if (!token || !userData) {
          // Force logout if authentication data is missing
          handleLogout();
        }
      }
    };
    
    // Add event listeners
    window.addEventListener('popstate', handlePopState);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Cleanup
    return () => {
      window.removeEventListener('popstate', handlePopState);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  useEffect(() => {
    // Get user data from localStorage
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        // Fetch latest download count from server
        fetchUserDownloadCount();
      } catch (error) {
        console.error('Error parsing user data:', error);
        // Redirect to login if user data is invalid
        window.location.href = '/login';
      }
    } else {
      // Redirect to login if no user data
      window.location.href = '/login';
    }
    setIsLoading(false);
  }, []);

  // Periodically refresh download count every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchUserDownloadCount();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    // Clear authentication data
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // Clear browser history to prevent back button access
    window.history.replaceState(null, '', '/login');
    
    // Navigate to login page
    window.location.replace('/login');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Alert className="max-w-md">
          <AlertDescription>
            Unable to load user data. Please log in again.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md shadow-lg border-b border-gray-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Search className="text-primary text-xl" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-black">ArchPlan</h1>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3 px-3 py-2 bg-gray-50 rounded-lg">
                <div className="w-8 h-8 bg-gradient-to-r from-[#2358DF] to-[#7a9cff] rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-semibold">
                      {user.name ? user.name.split(' ').map(n => n.charAt(0)?.toUpperCase()).join('').slice(0, 2) : 'UN'}
                    </span>
                  </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-gray-900">
                    {user.name || 'User Name'}
                  </p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={handleLogout} className="text-red-600 border-red-300 hover:bg-red-50 hover:border-red-300 hover:text-red-700">
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Welcome Section */}
          <div className="relative overflow-hidden bg-gradient-to-r from-[#2358DF] to-[#7a9cff] rounded-2xl p-8 text-white">
            <div className="absolute inset-0 bg-black/10"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-4xl font-bold mb-2">
                    Welcome {user.name ? user.name.split(' ')[0] : 'User'}! 👋
                  </h2>
                  <p className="text-white/90 text-lg">
                    Let's explore some amazing architectural plans.
                  </p>
                  <div className="mt-4 flex items-center space-x-4 text-sm text-white/80">
                    {/* <div className="flex items-center space-x-1">
                      <Clock className="w-4 h-4" />
                      <span>Last login: Today</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-4 h-4" />
                      <span>Member since 2024</span>
                    </div> */}
                  </div>
                </div>
                <div className="hidden md:block">
                  <div className="w-32 h-32 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm">
                    <Award className="w-16 h-16 text-yellow-300" />
                  </div>
                </div>
              </div>
            </div>
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-32 translate-x-32"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-24 -translate-x-24"></div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200 hover:shadow-lg transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-emerald-700">Account Status</CardTitle>
                <div className="p-2 bg-emerald-500 rounded-lg">
                  <CheckCircle className="h-4 w-4 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-emerald-600">Verified</div>
                <p className="text-xs text-emerald-600/70">
                  Full access enabled
                </p>
                <div className="mt-2">
                  <Progress value={100} className="h-2" />
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-[#ADC4F8]/20 to-[#2358DF]/20 border-[#2358DF]/30 hover:shadow-lg transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-[#2358DF]">Role</CardTitle>
                <div className="p-2 bg-[#2358DF] rounded-lg">
                  <User className="h-4 w-4 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-[#2358DF]">User</div>
                <p className="text-xs mt-3 text-[#2358DF]/70">
                  Standard access level
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-[#FEF08A]/20 to-[#EAB308]/20 border-[#EAB308]/30 hover:shadow-lg transition-all duration-300">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-[#EAB308]">Current Status</CardTitle>
                  <div className="p-2 bg-[#EAB308] rounded-lg">
                    <Activity className="h-4 w-4 text-white" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-[#EAB308]">Active</div>
                  <p className="text-xs mt-3 text-[#EAB308]/70">
                    User session active
                  </p>
                </CardContent>
              </Card>
          </div>
          <div className="flex justify-center">
            {/* Quick Actions */}
            <div className="w-full max-w-4xl">
              <Card className="bg-white/70 backdrop-blur-sm border-gray-200/50 shadow-xl">
                <CardHeader>
                  <CardTitle className="text-xl font-semibold text-gray-800">Quick Actions</CardTitle>
                  <CardDescription className="text-gray-600">
                    Explore our comprehensive collection of architectural plans
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Button 
                      className="h-24 flex flex-col items-center justify-center space-y-3 bg-gradient-to-r from-[#2358DF] to-[#7a9cff] hover:from-[#1a47c7] hover:to-[#9bb8f5] text-white shadow-lg hover:shadow-xl transition-all duration-300"
                      onClick={() => {
                        // Navigate to search with proper authentication context
                        navigate('/search');
                      }}
                    >
                      <Search className="h-8 w-8" />
                      <span className="font-medium">Advanced Search</span>
                    </Button>
                    <Button 
                      variant="outline"
                      className="h-24 flex flex-col items-center justify-center space-y-3 border-2 border-gray-300 hover:border-indigo-400 hover:bg-indigo-50 transition-all duration-300"
                      onClick={() => {
                        // Navigate to app with proper authentication context
                        navigate('/app');
                      }}
                    >
                      <FileText className="h-8 w-8 text-blue-600" />
                      <span className="font-medium text-gray-700">Browse Collection</span>
                    </Button>
                  </div>
                  <div className="mt-6 grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-gray-800">1,000,000+</div>
                      <div className="text-sm text-gray-600">Available Plans</div>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-gray-800">1000+</div>
                      <div className="text-sm text-gray-600">Categories</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>


          </div>

          {/* Account Information */}
          <Card className="bg-white/70 backdrop-blur-sm border-gray-200/50 shadow-xl">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-gray-800">Account Information</CardTitle>
              <CardDescription className="text-gray-600">
                Your account details 
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Full Name</label>
                    <div className="p-3 bg-gray-50 rounded-lg border">
                      <p className="text-gray-900 font-medium">{user.name || 'User Name'}</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Email Address</label>
                    <div className="p-3 bg-gray-50 rounded-lg border">
                      <p className="text-gray-900 font-medium">{user.email || 'user@example.com'}</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Account Status</label>
                    <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                      <Badge variant="default" className="bg-emerald-100 text-emerald-800 font-medium">
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Verified User
                      </Badge>
                    </div>
                  </div>
                  {/* <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Total Downloads</label>
                    <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <p className="text-blue-900 font-bold text-lg">{user.downloadCount || 0} architectural plans</p>
                    </div>
                  </div> */}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
