import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Filter, X } from "lucide-react";
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
              <Select value={filters.lotSize} onValueChange={(value) => updateFilter("lotSize", value)}>
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
              <Select value={filters.orientation} onValueChange={(value) => updateFilter("orientation", value)}>
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
              <Select value={filters.siteType} onValueChange={(value) => updateFilter("siteType", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Any Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Any Type">Any Type</SelectItem>
                  <SelectItem value="Flat Site">Flat Site</SelectItem>
                  <SelectItem value="Sloping Site">Sloping Site</SelectItem>
                  <SelectItem value="Corner Lot">Corner Lot</SelectItem>
                  <SelectItem value="Narrow Lot">Narrow Lot</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Foundation Type Filter */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Foundation</label>
              <Select value={filters.foundationType} onValueChange={(value) => updateFilter("foundationType", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Any Foundation" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Any Foundation">Any Foundation</SelectItem>
                  <SelectItem value="Slab on Ground">Slab on Ground</SelectItem>
                  <SelectItem value="Suspended Slab">Suspended Slab</SelectItem>
                  <SelectItem value="Basement">Basement</SelectItem>
                  <SelectItem value="Pier & Beam">Pier & Beam</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Storeys Filter */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Number of Storeys</label>
              <Select value={filters.storeys} onValueChange={(value) => updateFilter("storeys", value)}>
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
              <Select value={filters.councilArea} onValueChange={(value) => updateFilter("councilArea", value)}>
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
            <p className="text-slate-600">Try adjusting your search filters to find more plans.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <PlanCard key={plan.id} plan={plan} />
          ))}
        </div>
      )}
    </div>
  );
}
