import { useState, useMemo, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useDebounce } from "../hooks/useDebounce";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Filter, X, Download, Sliders, Zap, Upload, FileText } from "lucide-react";
import PlanCard from "./PlanCard";
import type { PlanType } from "@shared/schema";

interface SearchFilters {
  keyword: string;
  lotSize: string;
  lotSizeMin: string;
  lotSizeMax: string;
  orientation: string;
  siteType: string;
  foundationType: string;
  storeys: string;
  councilArea: string;
  search: string;
  bedrooms: string;
  houseType: string;
  constructionType: string;
  planType: string;
  plotLength: string;
  plotWidth: string;
  coveredArea: string;
  roadPosition: string;
  builderName: string;
  toilets: string;
  livingAreas: string;
  totalBuildingHeight: string;
  roofPitch: string;
  outdoorFeatures: string[];
  indoorFeatures: string[];
}

export default function SearchInterface() {
  const [filters, setFilters] = useState<SearchFilters>({
    keyword: "",
    lotSize: "",
    lotSizeMin: "",
    lotSizeMax: "",
    orientation: "",
    siteType: "",
    foundationType: "",
    storeys: "",
    councilArea: "",
    search: "",
    bedrooms: "",
    houseType: "",
    constructionType: "",
    planType: "",
    plotLength: "",
    plotWidth: "",
    coveredArea: "",
    roadPosition: "",
    builderName: "",
    toilets: "",
    livingAreas: "",
    totalBuildingHeight: "",
    roofPitch: "",
    outdoorFeatures: [],
    indoorFeatures: [],
  });

  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  // Debounce filters to reduce API calls while user is typing
  const debouncedFilters = useDebounce(filters, 300);

  // Check if any filter has a value
  const hasActiveFilters = useMemo(() => {
    return Object.entries(debouncedFilters).some(([key, value]) => {
      if (Array.isArray(value)) {
        return value.length > 0;
      }
      return value !== "";
    });
  }, [debouncedFilters]);

  const { data: plans = [], isLoading } = useQuery<PlanType[]>({
    queryKey: ["/api/plans/search", debouncedFilters],
    queryFn: async () => {
      const params = new URLSearchParams();
      Object.entries(debouncedFilters).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          // Handle array values
          if (value.length > 0) {
            value.forEach(item => params.append(key, item));
          }
        } else if (value && typeof value === 'string' && value.trim() !== "") {
          // Handle string values
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
    staleTime: 5 * 60 * 1000, // Cache results for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
  });

  const clearFilters = useCallback(() => {
    setFilters({
      keyword: "",
      lotSize: "",
      lotSizeMin: "",
      lotSizeMax: "",
      orientation: "",
      siteType: "",
      foundationType: "",
      storeys: "",
      councilArea: "",
      search: "",
      bedrooms: "",
      houseType: "",
      constructionType: "",
      planType: "",
      plotLength: "",
      plotWidth: "",
      coveredArea: "",
      roadPosition: "",
      builderName: "",
      toilets: "",
      livingAreas: "",
      totalBuildingHeight: "",
      roofPitch: "",
      outdoorFeatures: [],
      indoorFeatures: [],
    });
  }, []);

  const updateFilter = useCallback((key: keyof SearchFilters, value: string | string[]) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const newFiles = Array.from(files);
      setUploadedFiles(prev => [...prev, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const clearAllFiles = () => {
    setUploadedFiles([]);
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
          <div className="space-y-6">
            {/* Keyword Search - First Input */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Search Keywords</label>
              <Input
                placeholder="Enter keywords to search plans..."
                value={filters.keyword}
                onChange={(e) => updateFilter("keyword", e.target.value)}
                className="text-lg"
              />
            </div>
            
            {/* Basic Search Filters */}
            <div className="border-b border-slate-200 pb-4">
              <h4 className="text-lg font-semibold text-slate-900 mb-2">Basic Information</h4>
              <p className="text-sm text-slate-600">Essential plan details and identification</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {/* General Search Input */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">General Search</label>
                <Input
                  placeholder="Search by title, description, builder name..."
                  value={filters.search}
                  onChange={(e) => updateFilter("search", e.target.value)}
                />
              </div>
              
              {/* Plan Type Filter */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Plan Type</label>
                <Select value={filters.planType} onValueChange={(value) => updateFilter("planType", value === "Any Plan Type" ? "" : value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Any Plan Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Any Plan Type">Any Plan Type</SelectItem>
                    <SelectItem value="Residential - Single Family">Residential - Single Family</SelectItem>
                    <SelectItem value="Residential - Multi Family">Residential - Multi Family</SelectItem>
                    <SelectItem value="Commercial">Commercial</SelectItem>
                    <SelectItem value="Industrial">Industrial</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {/* Builder Name Filter */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Builder / Designer</label>
                <Input
                  placeholder="Builder or designer name"
                  value={filters.builderName}
                  onChange={(e) => updateFilter("builderName", e.target.value)}
                />
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
              
              {/* House Type Filter */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">House Type</label>
                <Select value={filters.houseType} onValueChange={(value) => updateFilter("houseType", value === "Any Type" ? "" : value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Any Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Any Type">Any Type</SelectItem>
                    <SelectItem value="Single Dwelling">Single Dwelling</SelectItem>
                    <SelectItem value="Duplex">Duplex</SelectItem>
                    <SelectItem value="Townhouse">Townhouse</SelectItem>
                    <SelectItem value="Unit">Unit</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {/* Total Building Height */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Total Building Height (m)</label>
                <Input
                  type="number"
                  min="0"
                  max="1000"
                  step="0.01"
                  placeholder="e.g., 8.5"
                  value={filters.totalBuildingHeight}
                  onChange={(e) => updateFilter("totalBuildingHeight", e.target.value)}
                />
              </div>
              
              {/* Roof Pitch */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Roof Pitch (degrees)</label>
                <Input
                  type="number"
                  min="0"
                  max="35"
                  placeholder="e.g., 22"
                  value={filters.roofPitch}
                  onChange={(e) => updateFilter("roofPitch", e.target.value)}
                />
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
            </div>
            
            {/* Site & Plot Details Section */}
            <div className="border-b border-slate-200 pb-4">
              <h4 className="text-lg font-semibold text-slate-900 mb-2">Site & Plot Details</h4>
              <p className="text-sm text-slate-600">Land specifications and site characteristics</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">

            {/* Lot Size Min Filter */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Lot Size Min (m²)</label>
              <Input
                type="number"
                min="0"
                placeholder="e.g., 300"
                value={filters.lotSizeMin}
                onChange={(e) => updateFilter("lotSizeMin", e.target.value)}
              />
            </div>
            
            {/* Lot Size Max Filter */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Lot Size Max (m²)</label>
              <Input
                type="number"
                min="0"
                placeholder="e.g., 800"
                value={filters.lotSizeMax}
                onChange={(e) => updateFilter("lotSizeMax", e.target.value)}
              />
            </div>
            
            {/* Plot Length */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Plot Length (m)</label>
              <Input
                type="number"
                min="0"
                step="0.01"
                placeholder="e.g., 20.5"
                value={filters.plotLength}
                onChange={(e) => updateFilter("plotLength", e.target.value)}
              />
            </div>
            
            {/* Plot Width */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Plot Width (m)</label>
              <Input
                type="number"
                min="0"
                step="0.01"
                placeholder="e.g., 15.5"
                value={filters.plotWidth}
                onChange={(e) => updateFilter("plotWidth", e.target.value)}
              />
            </div>
            
            {/* Covered Area */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Covered Area (m²)</label>
              <Input
                type="number"
                min="0"
                step="0.01"
                placeholder="e.g., 150.5"
                value={filters.coveredArea}
                onChange={(e) => updateFilter("coveredArea", e.target.value)}
              />
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

            {/* Road Position Filter */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Road Position</label>
              <Select value={filters.roadPosition} onValueChange={(value) => updateFilter("roadPosition", value === "Any Position" ? "" : value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Any Position" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Any Position">Any Position</SelectItem>
                  <SelectItem value="Length Side">Length Side</SelectItem>
                  <SelectItem value="Width Side">Width Side</SelectItem>
                  <SelectItem value="Corner Plot">Corner Plot</SelectItem>
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
          </div>
          
          {/* Room Configuration Section */}
          <div className="border-b border-slate-200 pb-4">
            <h4 className="text-lg font-semibold text-slate-900 mb-2">Room Configuration</h4>
            <p className="text-sm text-slate-600">Interior layout and room specifications</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {/* Bedrooms Filter */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Bedrooms</label>
              <Input
                type="number"
                min="0"
                placeholder="e.g., 3"
                value={filters.bedrooms}
                onChange={(e) => updateFilter("bedrooms", e.target.value)}
              />
            </div>

            {/* Toilets Filter */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Toilets</label>
              <Input
                type="number"
                min="0"
                placeholder="e.g., 2"
                value={filters.toilets}
                onChange={(e) => updateFilter("toilets", e.target.value)}
              />
            </div>

            {/* Living Areas Filter */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Living Areas</label>
              <Input
                type="number"
                min="0"
                placeholder="e.g., 1"
                value={filters.livingAreas}
                onChange={(e) => updateFilter("livingAreas", e.target.value)}
              />
            </div>
            
            {/* Construction Type Filter */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Construction</label>
              <Select value={filters.constructionType} onValueChange={(value) => updateFilter("constructionType", value === "Any Construction" ? "" : value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Any Construction" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Any Construction">Any Construction</SelectItem>
                  <SelectItem value="Hebel">Hebel</SelectItem>
                  <SelectItem value="Cladding">Cladding</SelectItem>
                  <SelectItem value="Brick">Brick</SelectItem>
                  <SelectItem value="NRG">NRG</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Features Section */}
          <div className="border-b border-slate-200 pb-4">
            <h4 className="text-lg font-semibold text-slate-900 mb-2">Features</h4>
            <p className="text-sm text-slate-600">Indoor and outdoor amenities</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Outdoor Features */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Outdoor Features</label>
              <Input
                placeholder="e.g., Pool, Garden, Patio (comma-separated)"
                value={filters.outdoorFeatures.join(", ")}
                onChange={(e) => updateFilter("outdoorFeatures", e.target.value.split(",").map(f => f.trim()).filter(f => f))}
              />
            </div>
            
            {/* Indoor Features */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Indoor Features</label>
              <Input
                placeholder="e.g., Fireplace, Walk-in Closet, Study (comma-separated)"
                value={filters.indoorFeatures.join(", ")}
                onChange={(e) => updateFilter("indoorFeatures", e.target.value.split(",").map(f => f.trim()).filter(f => f))}
              />
            </div>
          </div>

          {/* Clear Filters Button */}
          {hasActiveFilters && (
            <div className="flex justify-end mt-6">
              <Button variant="outline" onClick={clearFilters}>
                <X className="w-4 h-4 mr-2" />
                Clear All Filters
              </Button>
            </div>
          )}
          </div>
        </CardContent>
      </Card>

      {/* Search Results */}
      {hasActiveFilters ? (
        <div>
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
        </div>
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
