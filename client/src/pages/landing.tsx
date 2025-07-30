import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Shield, Download, Upload } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <Search className="text-primary text-2xl" />
              <h1 className="text-xl font-bold text-slate-900">ArchPlan</h1>
            </div>
            <Button onClick={() => window.location.href = "/api/login"}>
              Admin Login
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <h2 className="text-4xl font-bold text-slate-900 mb-6">
            Professional Architectural Plans Database
          </h2>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto mb-8">
            Search through thousands of professionally designed architectural plans 
            based on your specific site requirements and preferences.
          </p>
          <Button 
            size="lg"
            onClick={() => window.location.href = "/api/login"}
          >
            Get Started
          </Button>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
          <Card>
            <CardContent className="p-6 text-center">
              <Search className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Advanced Search</h3>
              <p className="text-slate-600">
                Find plans by lot size, orientation, site type, and more filters
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <Download className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Instant Download</h3>
              <p className="text-slate-600">
                Download PDF plans immediately after finding the perfect match
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <Shield className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Secure Management</h3>
              <p className="text-slate-600">
                Professional admin portal for secure plan upload and management
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
