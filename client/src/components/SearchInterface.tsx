import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Filter, X, Download, Sliders, Zap } from "lucide-react";
import PlanCard from "./PlanCard";
import type { PlanType } from "@shared/schema";

interface SearchFilters {
  lotSize: string;
  orientation: string;
  siteType: string;
  foundationType: string;
  storeys: string;
  councilArea: string;
  search: string;
}

export default function SearchInterface() {
  const [filters, setFilters] = useState<SearchFilters>({
    lotSize: "",
    orientation: "",
    siteType: "",
    foundationType: "",
    storeys: "",
    councilArea: "",
    search: "",
  });

  // Check if any filter has a value
  const hasActiveFilters = Object.values(filters).some(value => value !== "");

  const { data: plans = [], isLoading } = useQuery<PlanType[]>({
    queryKey: ["/api/plans/search", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) {
          params.append(key, value);
        }
      });

      const response = await fetch(`/api/plans/search?${params}`);
      if (!response.ok) {
        throw new Error("Failed to search plans");
      }
      return response.json();
    },
    enabled: hasActiveFilters, // Only run query when user has applied filters
  });

  const clearFilters = () => {
    setFilters({
      lotSize: "",
      orientation: "",
      siteType: "",
      foundationType: "",
      storeys: "",
      councilArea: "",
      search: "",
    });
  };

  const updateFilter = (key: keyof SearchFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Search Hero Section */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-slate-900 mb-4">Find Your Perfect Architectural Plan</h2>
        <p className="text-lg text-slate-600 max-w-2xl mx-auto">
          Search through thousands of professionally designed architectural plans based on your specific site requirements and preferences.
        </p>
      </div>

      {/* Advanced Search Filters */}
      <Card className="mb-8">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {/* Search Input */}
            <div className="xl:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-2">Search</label>
              <Input
                placeholder="Search plans..."
                value={filters.search}
                onChange={(e) => updateFilter("search", e.target.value)}
              />
            </div>

            {/* Lot Size Filter */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Lot Size</label>
              <Select value={filters.lotSize} onValueChange={(value) => updateFilter("lotSize", value === "Any Size" ? "" : value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Any Size" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Any Size">Any Size</SelectItem>
                  <SelectItem value="Small (< 400m²)">Small (&lt; 400m²)</SelectItem>
                  <SelectItem value="Medium (400-800m²)">Medium (400-800m²)</SelectItem>
                  <SelectItem value="Large (> 800m²)">Large (&gt; 800m²)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Orientation Filter */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Orientation</label>
              <Select value={filters.orientation} onValueChange={(value) => updateFilter("orientation", value === "Any Orientation" ? "" : value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Any Orientation" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Any Orientation">Any Orientation</SelectItem>
                  <SelectItem value="North Facing">North Facing</SelectItem>
                  <SelectItem value="South Facing">South Facing</SelectItem>
                  <SelectItem value="East Facing">East Facing</SelectItem>
                  <SelectItem value="West Facing">West Facing</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Site Type Filter */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Site Type</label>
              <Select value={filters.siteType} onValueChange={(value) => updateFilter("siteType", value === "Any Type" ? "" : value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Any Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Any Type">Any Type</SelectItem>
                  <SelectItem value="Levelled">Levelled</SelectItem>
                  <SelectItem value="Step Up">Step Up</SelectItem>
                  <SelectItem value="Step Down">Step Down</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Foundation Type Filter */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Foundation</label>
              <Select value={filters.foundationType} onValueChange={(value) => updateFilter("foundationType", value === "Any Foundation" ? "" : value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Any Foundation" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Any Foundation">Any Foundation</SelectItem>
                  <SelectItem value="Stumps">Stumps</SelectItem>
                  <SelectItem value="Slab">Slab</SelectItem>
                  <SelectItem value="Half Stump">Half Stump</SelectItem>
                  <SelectItem value="Half Slab">Half Slab</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Storeys Filter */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Number of Storeys</label>
              <Select value={filters.storeys} onValueChange={(value) => updateFilter("storeys", value === "Any" ? "" : value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Any" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Any">Any</SelectItem>
                  <SelectItem value="Single Storey">Single Storey</SelectItem>
                  <SelectItem value="Two Storey">Two Storey</SelectItem>
                  <SelectItem value="Three+ Storey">Three+ Storey</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Council Filter */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Council Area</label>
              <Select value={filters.councilArea} onValueChange={(value) => updateFilter("councilArea", value === "Any Council" ? "" : value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Any Council" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Any Council">Any Council</SelectItem>
                  <SelectItem value="Sydney City">Sydney City</SelectItem>
                  <SelectItem value="Melbourne City">Melbourne City</SelectItem>
                  <SelectItem value="Brisbane City">Brisbane City</SelectItem>
                  <SelectItem value="Perth City">Perth City</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Clear Filters */}
            <div className="flex items-end">
              <Button variant="outline" onClick={clearFilters} className="w-full">
                <X className="w-4 h-4 mr-2" />
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Search Results */}
      {hasActiveFilters ? (
        <>
          <div className="mb-6 flex justify-between items-center">
            <h3 className="text-xl font-semibold text-slate-900">
              Search Results ({plans.length} plans found)
            </h3>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <div className="w-full h-48 bg-slate-200"></div>
                  <CardContent className="p-6">
                    <div className="h-4 bg-slate-200 rounded mb-2"></div>
                    <div className="h-3 bg-slate-200 rounded mb-4"></div>
                    <div className="flex space-x-2">
                      <div className="flex-1 h-8 bg-slate-200 rounded"></div>
                      <div className="flex-1 h-8 bg-slate-200 rounded"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : plans.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Search className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-900 mb-2">No plans found</h3>
                <p className="text-slate-600 mb-4">Try adjusting your search filters to find more plans.</p>
                <Button variant="outline" onClick={clearFilters}>
                  <X className="w-4 h-4 mr-2" />
                  Clear Filters
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {plans.map((plan) => (
                <PlanCard key={plan._id?.toString() || plan.id} plan={plan} />
              ))}
            </div>
          )}
        </>
      ) : (
        <Card>
          <CardContent className="p-12">
            <div className="text-center mb-8">
              <Search className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-slate-900 mb-4">Ready to Find Your Perfect Plan?</h3>
              <p className="text-slate-600 max-w-2xl mx-auto">
                Use the search filters above to find architectural plans that match your specific requirements.
                Search by keywords, lot size, orientation, site type, and more.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Advanced Filters */}
              <div className="text-center">
                <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                  <Sliders className="w-8 h-8 text-blue-600" />
                </div>
                <h4 className="text-lg font-semibold text-slate-900 mb-2">Advanced Filters</h4>
                <p className="text-slate-600 text-sm">
                  Filter by lot size, orientation, site type, foundation, storeys, and council area to find exactly what you need.
                </p>
              </div>

              {/* Smart Search */}
              <div className="text-center">
                <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <Zap className="w-8 h-8 text-green-600" />
                </div>
                <h4 className="text-lg font-semibold text-slate-900 mb-2">Smart Search</h4>
                <p className="text-slate-600 text-sm">
                  Intelligent keyword search that finds plans based on features and architectural styles.
                </p>
              </div>

              {/* Instant Download */}
              <div className="text-center">
                <div className="mx-auto w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                  <Download className="w-8 h-8 text-purple-600" />
                </div>
                <h4 className="text-lg font-semibold text-slate-900 mb-2">Instant Download</h4>
                <p className="text-slate-600 text-sm">
                  Download plans immediately. Get high-quality PDF files ready for construction.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
