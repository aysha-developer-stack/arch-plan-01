import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Shield, Download, Upload, ArrowRight, CheckCircle } from "lucide-react";
import { useLocation } from "wouter";

export default function Landing() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white/95 backdrop-blur-sm border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Search className="text-primary text-xl" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">ArchPlan</h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                onClick={() => navigate('/app')}
                className="hidden sm:inline-flex"
              >
                Search Plans
              </Button>
              <Button onClick={() => navigate('/admin/login')}>
                Admin Portal
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <div className="inline-flex items-center px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium mb-6">
            <CheckCircle className="w-4 h-4 mr-2" />
            Trusted by Architecture Professionals
          </div>
          <h2 className="text-5xl md:text-6xl font-bold text-slate-900 mb-6 leading-tight">
            Professional Architectural
            <span className="text-primary block">Plans Database</span>
          </h2>
          <p className="text-xl text-slate-600 max-w-4xl mx-auto mb-10 leading-relaxed">
            Discover and access thousands of professionally designed architectural plans 
            tailored to your specific site requirements, orientation, and design preferences. 
            Simplify your project workflow with advanced search capabilities and fast, one-click downloads.
          </p>
          <div className="flex flex-col items-center gap-6 justify-center">
            <Button 
              size="lg"
              onClick={() => navigate('/app')}
              className="text-lg px-12 py-6 h-auto bg-primary hover:bg-primary/90 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
            >
              Get Started - Search Plans
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <div className="text-sm text-slate-500">
              Looking for admin access? 
              <button 
                onClick={() => navigate('/admin/login')}
                className="text-primary hover:text-primary/80 underline ml-1"
              >
                Click here
              </button>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-20">
          <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Search className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-slate-900">Intelligent Search</h3>
              <p className="text-slate-600 leading-relaxed">
                Advanced filtering by lot size, orientation, site conditions, architectural style, 
                and building requirements for precise results.
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Download className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-slate-900">Instant Access</h3>
              <p className="text-slate-600 leading-relaxed">
                Download high-quality PDF plans, CAD files, and documentation 
                immediately upon finding your perfect architectural match.
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Shield className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-slate-900">Enterprise Security</h3>
              <p className="text-slate-600 leading-relaxed">
                Professional-grade admin portal with secure authentication, 
                role-based access, and comprehensive plan management tools.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-slate-900 text-white mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 bg-primary/20 rounded-lg">
                  <Search className="text-primary text-xl" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">ArchPlan</h3>
                </div>
              </div>
              <p className="text-slate-400 max-w-md leading-relaxed">
              Simplify your project workflow with advanced search capabilities and fast, one-click downloads.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Platform</h4>
              <ul className="space-y-2 text-slate-400">
                <li><button onClick={() => navigate('/app')} className="hover:text-white transition-colors">Search Plans</button></li>
                <li><button onClick={() => navigate('/admin/login')} className="hover:text-white transition-colors">Admin Portal</button></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-slate-400">
                <li><a href="#" className="hover:text-white transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-800 mt-8 pt-8 text-center text-slate-400">
            <p>&copy; 2025 ArchPlan. Your Trusted Platform for Smart Architectural Planning.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
