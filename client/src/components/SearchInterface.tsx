import { useState, useMemo, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useDebounce } from "../hooks/useDebounce";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Filter, X, Download, Sliders, Zap, Upload, FileText } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
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
  const [showAllOutdoorFeatures, setShowAllOutdoorFeatures] = useState(false);
  const [showAllIndoorFeatures, setShowAllIndoorFeatures] = useState(false);

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
                <Select value={filters.houseType} onValueChange={(value) => updateFilter("houseType", value === "All Types" ? "" : value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All Types">All Types</SelectItem>
                    <SelectItem value="House">House</SelectItem>
                    <SelectItem value="Townhouse">Townhouse</SelectItem>
                    <SelectItem value="Apartment & Unit">Apartment & Unit</SelectItem>
                    <SelectItem value="Villa">Villa</SelectItem>
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
                  step="0.1"
                  placeholder="e.g., 22.5"
                  value={filters.roofPitch}
                  onChange={(e) => {
                     const value = e.target.value;
                     const numValue = parseFloat(value);
                     
                     // Only allow values between 0 and 35, or empty string
                     // Also limit to 1 decimal place to match step="0.1"
                     if (value === '' || (numValue >= 0 && numValue <= 35 && /^\d*\.?\d{0,1}$/.test(value))) {
                       updateFilter("roofPitch", value);
                     }
                   }}
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
                  <SelectItem value="North-East Facing">North-East Facing</SelectItem>
                  <SelectItem value="East Facing">East Facing</SelectItem>
                  <SelectItem value="South-East Facing">South-East Facing</SelectItem>
                  <SelectItem value="South Facing">South Facing</SelectItem>
                  <SelectItem value="South-West Facing">South-West Facing</SelectItem>
                  <SelectItem value="West Facing">West Facing</SelectItem>
                  <SelectItem value="North-West Facing">North-West Facing</SelectItem>
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
              <SearchableSelect 
                value={filters.councilArea} 
                onValueChange={(value) => updateFilter("councilArea", value === "Any Council" ? "" : value)}
                placeholder="Search or select council area..."
                searchPlaceholder="Search councils..."
              >
                  <SelectItem value="Any Council" className="font-medium text-slate-700">Any Council Area</SelectItem>
                  <div className="border-t border-gray-200 my-1"></div>
                  <SelectItem value="NSW_HEADER" disabled className="font-extrabold text-slate-900 pointer-events-none bg-slate-50">
                    New South Wales (NSW)
                  </SelectItem>
                  <SelectItem value="Albury City Council">Albury City Council</SelectItem>
                  <SelectItem value="Armidale Regional Council">Armidale Regional Council</SelectItem>
                  <SelectItem value="Ballina Shire Council">Ballina Shire Council</SelectItem>
                  <SelectItem value="Balranald Shire Council">Balranald Shire Council</SelectItem>
                  <SelectItem value="Bathurst Regional Council">Bathurst Regional Council</SelectItem>
                  <SelectItem value="Bayside Council">Bayside Council</SelectItem>
                  <SelectItem value="Bega Valley Shire Council">Bega Valley Shire Council</SelectItem>
                  <SelectItem value="Bellingen Shire Council">Bellingen Shire Council</SelectItem>
                  <SelectItem value="Berrigan Shire Council">Berrigan Shire Council</SelectItem>
                  <SelectItem value="Bland Shire Council">Bland Shire Council</SelectItem>
                  <SelectItem value="Blayney Shire Council">Blayney Shire Council</SelectItem>
                  <SelectItem value="Blue Mountains City Council">Blue Mountains City Council</SelectItem>
                  <SelectItem value="Bogan Shire Council">Bogan Shire Council</SelectItem>
                  <SelectItem value="Bourke Shire Council">Bourke Shire Council</SelectItem>
                  <SelectItem value="Brewarrina Shire Council">Brewarrina Shire Council</SelectItem>
                  <SelectItem value="Broken Hill City Council">Broken Hill City Council</SelectItem>
                  <SelectItem value="Burwood Council">Burwood Council</SelectItem>
                  <SelectItem value="Byron Shire Council">Byron Shire Council</SelectItem>
                  <SelectItem value="Cabonne Shire Council">Cabonne Shire Council</SelectItem>
                  <SelectItem value="Camden Council">Camden Council</SelectItem>
                  <SelectItem value="Campbelltown City Council">Campbelltown City Council</SelectItem>
                  <SelectItem value="Canada Bay City Council">Canada Bay City Council</SelectItem>
                  <SelectItem value="Canterbury-Bankstown Council">Canterbury-Bankstown Council</SelectItem>
                  <SelectItem value="Carrathool Shire Council">Carrathool Shire Council</SelectItem>
                  <SelectItem value="Central Coast Council">Central Coast Council</SelectItem>
                  <SelectItem value="Central Darling Shire Council">Central Darling Shire Council</SelectItem>
                  <SelectItem value="Cessnock City Council">Cessnock City Council</SelectItem>
                  <SelectItem value="Clarence Valley Council">Clarence Valley Council</SelectItem>
                  <SelectItem value="Cobar Shire Council">Cobar Shire Council</SelectItem>
                  <SelectItem value="Coffs Harbour City Council">Coffs Harbour City Council</SelectItem>
                  <SelectItem value="Coolamon Shire Council">Coolamon Shire Council</SelectItem>
                  <SelectItem value="Coonamble Shire Council">Coonamble Shire Council</SelectItem>
                  <SelectItem value="Cootamundra-Gundagai Regional Council">Cootamundra-Gundagai Regional Council</SelectItem>
                  <SelectItem value="Cowra Shire Council">Cowra Shire Council</SelectItem>
                  <SelectItem value="Cumberland Council">Cumberland Council</SelectItem>
                  <SelectItem value="Dubbo Regional Council">Dubbo Regional Council</SelectItem>
                  <SelectItem value="Dungog Shire Council">Dungog Shire Council</SelectItem>
                  <SelectItem value="Edward River Council">Edward River Council</SelectItem>
                  <SelectItem value="Eurobodalla Shire Council">Eurobodalla Shire Council</SelectItem>
                  <SelectItem value="Fairfield City Council">Fairfield City Council</SelectItem>
                  <SelectItem value="Federation Council">Federation Council</SelectItem>
                  <SelectItem value="Forbes Shire Council">Forbes Shire Council</SelectItem>
                  <SelectItem value="Georges River Council">Georges River Council</SelectItem>
                  <SelectItem value="Gilgandra Shire Council">Gilgandra Shire Council</SelectItem>
                  <SelectItem value="Glen Innes Severn Council">Glen Innes Severn Council</SelectItem>
                  <SelectItem value="Goulburn Mulwaree Council">Goulburn Mulwaree Council</SelectItem>
                  <SelectItem value="Griffith City Council">Griffith City Council</SelectItem>
                  <SelectItem value="Gunnedah Shire Council">Gunnedah Shire Council</SelectItem>
                  <SelectItem value="Gwydir Shire Council">Gwydir Shire Council</SelectItem>
                  <SelectItem value="Harden Shire Council">Harden Shire Council</SelectItem>
                  <SelectItem value="Hawkesbury City Council">Hawkesbury City Council</SelectItem>
                  <SelectItem value="Hay Shire Council">Hay Shire Council</SelectItem>
                  <SelectItem value="Hilltops Council">Hilltops Council</SelectItem>
                  <SelectItem value="Hornsby Shire Council">Hornsby Shire Council</SelectItem>
                  <SelectItem value="Hunter's Hill Council">Hunter's Hill Council</SelectItem>
                  <SelectItem value="Inner West Council">Inner West Council</SelectItem>
                  <SelectItem value="Inverell Shire Council">Inverell Shire Council</SelectItem>
                  <SelectItem value="Junee Shire Council">Junee Shire Council</SelectItem>
                  <SelectItem value="Kempsey Shire Council">Kempsey Shire Council</SelectItem>
                  <SelectItem value="Kiama Municipal Council">Kiama Municipal Council</SelectItem>
                  <SelectItem value="Ku-ring-gai Council">Ku-ring-gai Council</SelectItem>
                  <SelectItem value="Kyogle Council">Kyogle Council</SelectItem>
                  <SelectItem value="Lachlan Shire Council">Lachlan Shire Council</SelectItem>
                  <SelectItem value="Lake Macquarie City Council">Lake Macquarie City Council</SelectItem>
                  <SelectItem value="Lane Cove Council">Lane Cove Council</SelectItem>
                  <SelectItem value="Leeton Shire Council">Leeton Shire Council</SelectItem>
                  <SelectItem value="Lismore City Council">Lismore City Council</SelectItem>
                  <SelectItem value="Lithgow City Council">Lithgow City Council</SelectItem>
                  <SelectItem value="Liverpool City Council">Liverpool City Council</SelectItem>
                  <SelectItem value="Liverpool Plains Shire Council">Liverpool Plains Shire Council</SelectItem>
                  <SelectItem value="Lockhart Shire Council">Lockhart Shire Council</SelectItem>
                  <SelectItem value="Maitland City Council">Maitland City Council</SelectItem>
                  <SelectItem value="Mid-Coast Council">Mid-Coast Council</SelectItem>
                  <SelectItem value="Mid-Western Regional Council">Mid-Western Regional Council</SelectItem>
                  <SelectItem value="Moree Plains Shire Council">Moree Plains Shire Council</SelectItem>
                  <SelectItem value="Mosman Council">Mosman Council</SelectItem>
                  <SelectItem value="Murray River Council">Murray River Council</SelectItem>
                  <SelectItem value="Murrumbidgee Council">Murrumbidgee Council</SelectItem>
                  <SelectItem value="Muswellbrook Shire Council">Muswellbrook Shire Council</SelectItem>
                  <SelectItem value="Nambucca Valley Council">Nambucca Valley Council</SelectItem>
                  <SelectItem value="Narrabri Shire Council">Narrabri Shire Council</SelectItem>
                  <SelectItem value="Narrandera Shire Council">Narrandera Shire Council</SelectItem>
                  <SelectItem value="Narromine Shire Council">Narromine Shire Council</SelectItem>
                  <SelectItem value="Newcastle City Council">Newcastle City Council</SelectItem>
                  <SelectItem value="North Sydney Council">North Sydney Council</SelectItem>
                  <SelectItem value="Northern Beaches Council">Northern Beaches Council</SelectItem>
                  <SelectItem value="Oberon Council">Oberon Council</SelectItem>
                  <SelectItem value="Orange City Council">Orange City Council</SelectItem>
                  <SelectItem value="Parkes Shire Council">Parkes Shire Council</SelectItem>
                  <SelectItem value="Parramatta City Council">Parramatta City Council</SelectItem>
                  <SelectItem value="Penrith City Council">Penrith City Council</SelectItem>
                  <SelectItem value="Port Macquarie-Hastings Council">Port Macquarie-Hastings Council</SelectItem>
                  <SelectItem value="Port Stephens Council">Port Stephens Council</SelectItem>
                  <SelectItem value="Queanbeyan-Palerang Regional Council">Queanbeyan-Palerang Regional Council</SelectItem>
                  <SelectItem value="Randwick City Council">Randwick City Council</SelectItem>
                  <SelectItem value="Richmond Valley Council">Richmond Valley Council</SelectItem>
                  <SelectItem value="Ryde City Council">Ryde City Council</SelectItem>
                  <SelectItem value="Shellharbour City Council">Shellharbour City Council</SelectItem>
                  <SelectItem value="Shoalhaven City Council">Shoalhaven City Council</SelectItem>
                  <SelectItem value="Singleton Council">Singleton Council</SelectItem>
                  <SelectItem value="Snowy Monaro Regional Council">Snowy Monaro Regional Council</SelectItem>
                  <SelectItem value="Snowy Valleys Council">Snowy Valleys Council</SelectItem>
                  <SelectItem value="Strathfield Council">Strathfield Council</SelectItem>
                  <SelectItem value="Sutherland Shire Council">Sutherland Shire Council</SelectItem>
                  <SelectItem value="Sydney City Council">Sydney City Council</SelectItem>
                  <SelectItem value="Tamworth Regional Council">Tamworth Regional Council</SelectItem>
                  <SelectItem value="Temora Shire Council">Temora Shire Council</SelectItem>
                  <SelectItem value="Tenterfield Shire Council">Tenterfield Shire Council</SelectItem>
                  <SelectItem value="The Hills Shire Council">The Hills Shire Council</SelectItem>
                  <SelectItem value="Tweed Shire Council">Tweed Shire Council</SelectItem>
                  <SelectItem value="Unincorporated Far West NSW">Unincorporated Far West NSW</SelectItem>
                  <SelectItem value="Upper Hunter Shire Council">Upper Hunter Shire Council</SelectItem>
                  <SelectItem value="Upper Lachlan Shire Council">Upper Lachlan Shire Council</SelectItem>
                  <SelectItem value="Uralla Shire Council">Uralla Shire Council</SelectItem>
                  <SelectItem value="Wagga Wagga City Council">Wagga Wagga City Council</SelectItem>
                  <SelectItem value="Walcha Council">Walcha Council</SelectItem>
                  <SelectItem value="Walgett Shire Council">Walgett Shire Council</SelectItem>
                  <SelectItem value="Warren Shire Council">Warren Shire Council</SelectItem>
                  <SelectItem value="Warrumbungle Shire Council">Warrumbungle Shire Council</SelectItem>
                  <SelectItem value="Waverley Council">Waverley Council</SelectItem>
                  <SelectItem value="Weddin Shire Council">Weddin Shire Council</SelectItem>
                  <SelectItem value="Wentworth Shire Council">Wentworth Shire Council</SelectItem>
                  <SelectItem value="Willoughby City Council">Willoughby City Council</SelectItem>
                  <SelectItem value="Wingecarribee Shire Council">Wingecarribee Shire Council</SelectItem>
                  <SelectItem value="Wollondilly Shire Council">Wollondilly Shire Council</SelectItem>
                  <SelectItem value="Wollongong City Council">Wollongong City Council</SelectItem>
                  <SelectItem value="Woollahra Municipal Council">Woollahra Municipal Council</SelectItem>
                  <SelectItem value="Yass Valley Council">Yass Valley Council</SelectItem>
                  
                  <div className="border-t border-gray-200 my-1"></div>
                  <SelectItem value="VIC_HEADER" disabled className="font-extrabold text-slate-900 pointer-events-none bg-slate-50">
                    Victoria (VIC)
                  </SelectItem>
                  <SelectItem value="Alpine Shire Council">Alpine Shire Council</SelectItem>
                  <SelectItem value="Ararat Rural City Council">Ararat Rural City Council</SelectItem>
                  <SelectItem value="Ballarat City Council">Ballarat City Council</SelectItem>
                  <SelectItem value="Banyule City Council">Banyule City Council</SelectItem>
                  <SelectItem value="Bass Coast Shire Council">Bass Coast Shire Council</SelectItem>
                  <SelectItem value="Baw Baw Shire Council">Baw Baw Shire Council</SelectItem>
                  <SelectItem value="Bayside City Council">Bayside City Council</SelectItem>
                  <SelectItem value="Benalla Rural City Council">Benalla Rural City Council</SelectItem>
                  <SelectItem value="Boroondara City Council">Boroondara City Council</SelectItem>
                  <SelectItem value="Brimbank City Council">Brimbank City Council</SelectItem>
                  <SelectItem value="Buloke Shire Council">Buloke Shire Council</SelectItem>
                  <SelectItem value="Campaspe Shire Council">Campaspe Shire Council</SelectItem>
                  <SelectItem value="Cardinia Shire Council">Cardinia Shire Council</SelectItem>
                  <SelectItem value="Casey City Council">Casey City Council</SelectItem>
                  <SelectItem value="Central Goldfields Shire Council">Central Goldfields Shire Council</SelectItem>
                  <SelectItem value="Colac Otway Shire Council">Colac Otway Shire Council</SelectItem>
                  <SelectItem value="Corangamite Shire Council">Corangamite Shire Council</SelectItem>
                  <SelectItem value="Darebin City Council">Darebin City Council</SelectItem>
                  <SelectItem value="East Gippsland Shire Council">East Gippsland Shire Council</SelectItem>
                  <SelectItem value="Frankston City Council">Frankston City Council</SelectItem>
                  <SelectItem value="Gannawarra Shire Council">Gannawarra Shire Council</SelectItem>
                  <SelectItem value="Glen Eira City Council">Glen Eira City Council</SelectItem>
                  <SelectItem value="Glenelg Shire Council">Glenelg Shire Council</SelectItem>
                  <SelectItem value="Golden Plains Shire Council">Golden Plains Shire Council</SelectItem>
                  <SelectItem value="Greater Bendigo City Council">Greater Bendigo City Council</SelectItem>
                  <SelectItem value="Greater Dandenong City Council">Greater Dandenong City Council</SelectItem>
                  <SelectItem value="Greater Geelong City Council">Greater Geelong City Council</SelectItem>
                  <SelectItem value="Greater Shepparton City Council">Greater Shepparton City Council</SelectItem>
                  <SelectItem value="Hepburn Shire Council">Hepburn Shire Council</SelectItem>
                  <SelectItem value="Hindmarsh Shire Council">Hindmarsh Shire Council</SelectItem>
                  <SelectItem value="Hobsons Bay City Council">Hobsons Bay City Council</SelectItem>
                  <SelectItem value="Horsham Rural City Council">Horsham Rural City Council</SelectItem>
                  <SelectItem value="Hume City Council">Hume City Council</SelectItem>
                  <SelectItem value="Indigo Shire Council">Indigo Shire Council</SelectItem>
                  <SelectItem value="Kingston City Council">Kingston City Council</SelectItem>
                  <SelectItem value="Knox City Council">Knox City Council</SelectItem>
                  <SelectItem value="Latrobe City Council">Latrobe City Council</SelectItem>
                  <SelectItem value="Loddon Shire Council">Loddon Shire Council</SelectItem>
                  <SelectItem value="Macedon Ranges Shire Council">Macedon Ranges Shire Council</SelectItem>
                  <SelectItem value="Manningham City Council">Manningham City Council</SelectItem>
                  <SelectItem value="Maribyrnong City Council">Maribyrnong City Council</SelectItem>
                  <SelectItem value="Maroondah City Council">Maroondah City Council</SelectItem>
                  <SelectItem value="Melbourne City Council">Melbourne City Council</SelectItem>
                  <SelectItem value="Melton City Council">Melton City Council</SelectItem>
                  <SelectItem value="Mildura Rural City Council">Mildura Rural City Council</SelectItem>
                  <SelectItem value="Mitchell Shire Council">Mitchell Shire Council</SelectItem>
                  <SelectItem value="Moira Shire Council">Moira Shire Council</SelectItem>
                  <SelectItem value="Monash City Council">Monash City Council</SelectItem>
                  <SelectItem value="Moonee Valley City Council">Moonee Valley City Council</SelectItem>
                  <SelectItem value="Moorabool Shire Council">Moorabool Shire Council</SelectItem>
                  <SelectItem value="Moreland City Council">Moreland City Council</SelectItem>
                  <SelectItem value="Mornington Peninsula Shire Council">Mornington Peninsula Shire Council</SelectItem>
                  <SelectItem value="Mount Alexander Shire Council">Mount Alexander Shire Council</SelectItem>
                  <SelectItem value="Moyne Shire Council">Moyne Shire Council</SelectItem>
                  <SelectItem value="Murrindindi Shire Council">Murrindindi Shire Council</SelectItem>
                  <SelectItem value="Nillumbik Shire Council">Nillumbik Shire Council</SelectItem>
                  <SelectItem value="Northern Grampians Shire Council">Northern Grampians Shire Council</SelectItem>
                  <SelectItem value="Port Phillip City Council">Port Phillip City Council</SelectItem>
                  <SelectItem value="Pyrenees Shire Council">Pyrenees Shire Council</SelectItem>
                  <SelectItem value="Queenscliffe Borough Council">Queenscliffe Borough Council</SelectItem>
                  <SelectItem value="South Gippsland Shire Council">South Gippsland Shire Council</SelectItem>
                  <SelectItem value="Southern Grampians Shire Council">Southern Grampians Shire Council</SelectItem>
                  <SelectItem value="Stonnington City Council">Stonnington City Council</SelectItem>
                  <SelectItem value="Strathbogie Shire Council">Strathbogie Shire Council</SelectItem>
                  <SelectItem value="Surf Coast Shire Council">Surf Coast Shire Council</SelectItem>
                  <SelectItem value="Swan Hill Rural City Council">Swan Hill Rural City Council</SelectItem>
                  <SelectItem value="Towong Shire Council">Towong Shire Council</SelectItem>
                  <SelectItem value="Wangaratta Rural City Council">Wangaratta Rural City Council</SelectItem>
                  <SelectItem value="Warrnambool City Council">Warrnambool City Council</SelectItem>
                  <SelectItem value="Wellington Shire Council">Wellington Shire Council</SelectItem>
                  <SelectItem value="West Wimmera Shire Council">West Wimmera Shire Council</SelectItem>
                  <SelectItem value="Whitehorse City Council">Whitehorse City Council</SelectItem>
                  <SelectItem value="Whittlesea City Council">Whittlesea City Council</SelectItem>
                  <SelectItem value="Wodonga City Council">Wodonga City Council</SelectItem>
                  <SelectItem value="Wyndham City Council">Wyndham City Council</SelectItem>
                  <SelectItem value="Yarra City Council">Yarra City Council</SelectItem>
                  <SelectItem value="Yarra Ranges Shire Council">Yarra Ranges Shire Council</SelectItem>
                  
                  <div className="border-t border-gray-200 my-1"></div>
                  <SelectItem value="QLD_HEADER" disabled className="font-extrabold text-slate-900 pointer-events-none bg-slate-50">
                    Queensland (QLD)
                  </SelectItem>
                  <SelectItem value="Aurukun Shire Council">Aurukun Shire Council</SelectItem>
                  <SelectItem value="Balonne Shire Council">Balonne Shire Council</SelectItem>
                  <SelectItem value="Banana Shire Council">Banana Shire Council</SelectItem>
                  <SelectItem value="Barcaldine Regional Council">Barcaldine Regional Council</SelectItem>
                  <SelectItem value="Barcoo Shire Council">Barcoo Shire Council</SelectItem>
                  <SelectItem value="Blackall-Tambo Regional Council">Blackall-Tambo Regional Council</SelectItem>
                  <SelectItem value="Boulia Shire Council">Boulia Shire Council</SelectItem>
                  <SelectItem value="Brisbane City Council">Brisbane City Council</SelectItem>
                  <SelectItem value="Bulloo Shire Council">Bulloo Shire Council</SelectItem>
                  <SelectItem value="Bundaberg Regional Council">Bundaberg Regional Council</SelectItem>
                  <SelectItem value="Burdekin Shire Council">Burdekin Shire Council</SelectItem>
                  <SelectItem value="Burke Shire Council">Burke Shire Council</SelectItem>
                  <SelectItem value="Cairns Regional Council">Cairns Regional Council</SelectItem>
                  <SelectItem value="Carpentaria Shire Council">Carpentaria Shire Council</SelectItem>
                  <SelectItem value="Cassowary Coast Regional Council">Cassowary Coast Regional Council</SelectItem>
                  <SelectItem value="Central Highlands Regional Council">Central Highlands Regional Council</SelectItem>
                  <SelectItem value="Charters Towers Regional Council">Charters Towers Regional Council</SelectItem>
                  <SelectItem value="Cherbourg Aboriginal Shire Council">Cherbourg Aboriginal Shire Council</SelectItem>
                  <SelectItem value="Cloncurry Shire Council">Cloncurry Shire Council</SelectItem>
                  <SelectItem value="Cook Shire Council">Cook Shire Council</SelectItem>
                  <SelectItem value="Croydon Shire Council">Croydon Shire Council</SelectItem>
                  <SelectItem value="Diamantina Shire Council">Diamantina Shire Council</SelectItem>
                  <SelectItem value="Doomadgee Aboriginal Shire Council">Doomadgee Aboriginal Shire Council</SelectItem>
                  <SelectItem value="Douglas Shire Council">Douglas Shire Council</SelectItem>
                  <SelectItem value="Etheridge Shire Council">Etheridge Shire Council</SelectItem>
                  <SelectItem value="Flinders Shire Council">Flinders Shire Council</SelectItem>
                  <SelectItem value="Fraser Coast Regional Council">Fraser Coast Regional Council</SelectItem>
                  <SelectItem value="Gladstone Regional Council">Gladstone Regional Council</SelectItem>
                  <SelectItem value="Gold Coast City Council">Gold Coast City Council</SelectItem>
                  <SelectItem value="Goondiwindi Regional Council">Goondiwindi Regional Council</SelectItem>
                  <SelectItem value="Gympie Regional Council">Gympie Regional Council</SelectItem>
                  <SelectItem value="Hinchinbrook Shire Council">Hinchinbrook Shire Council</SelectItem>
                  <SelectItem value="Hope Vale Aboriginal Shire Council">Hope Vale Aboriginal Shire Council</SelectItem>
                  <SelectItem value="Ipswich City Council">Ipswich City Council</SelectItem>
                  <SelectItem value="Isaac Regional Council">Isaac Regional Council</SelectItem>
                  <SelectItem value="Kowanyama Aboriginal Shire Council">Kowanyama Aboriginal Shire Council</SelectItem>
                  <SelectItem value="Livingstone Shire Council">Livingstone Shire Council</SelectItem>
                  <SelectItem value="Lockhart River Aboriginal Shire Council">Lockhart River Aboriginal Shire Council</SelectItem>
                  <SelectItem value="Lockyer Valley Regional Council">Lockyer Valley Regional Council</SelectItem>
                  <SelectItem value="Logan City Council">Logan City Council</SelectItem>
                  <SelectItem value="Longreach Regional Council">Longreach Regional Council</SelectItem>
                  <SelectItem value="Mackay Regional Council">Mackay Regional Council</SelectItem>
                  <SelectItem value="Mapoon Aboriginal Shire Council">Mapoon Aboriginal Shire Council</SelectItem>
                  <SelectItem value="Maranoa Regional Council">Maranoa Regional Council</SelectItem>
                  <SelectItem value="Mareeba Shire Council">Mareeba Shire Council</SelectItem>
                  <SelectItem value="McKinlay Shire Council">McKinlay Shire Council</SelectItem>
                  <SelectItem value="Moreton Bay Regional Council">Moreton Bay Regional Council</SelectItem>
                  <SelectItem value="Mornington Shire Council">Mornington Shire Council</SelectItem>
                  <SelectItem value="Mount Isa City Council">Mount Isa City Council</SelectItem>
                  <SelectItem value="Murweh Shire Council">Murweh Shire Council</SelectItem>
                  <SelectItem value="Napranum Aboriginal Shire Council">Napranum Aboriginal Shire Council</SelectItem>
                  <SelectItem value="North Burnett Regional Council">North Burnett Regional Council</SelectItem>
                  <SelectItem value="Northern Peninsula Area Regional Council">Northern Peninsula Area Regional Council</SelectItem>
                  <SelectItem value="Noosa Shire Council">Noosa Shire Council</SelectItem>
                  <SelectItem value="Palm Island Aboriginal Shire Council">Palm Island Aboriginal Shire Council</SelectItem>
                  <SelectItem value="Paroo Shire Council">Paroo Shire Council</SelectItem>
                  <SelectItem value="Pormpuraaw Aboriginal Shire Council">Pormpuraaw Aboriginal Shire Council</SelectItem>
                  <SelectItem value="Quilpie Shire Council">Quilpie Shire Council</SelectItem>
                  <SelectItem value="Redland City Council">Redland City Council</SelectItem>
                  <SelectItem value="Richmond Shire Council">Richmond Shire Council</SelectItem>
                  <SelectItem value="Rockhampton Regional Council">Rockhampton Regional Council</SelectItem>
                  <SelectItem value="Scenic Rim Regional Council">Scenic Rim Regional Council</SelectItem>
                  <SelectItem value="Somerset Regional Council">Somerset Regional Council</SelectItem>
                  <SelectItem value="South Burnett Regional Council">South Burnett Regional Council</SelectItem>
                  <SelectItem value="Southern Downs Regional Council">Southern Downs Regional Council</SelectItem>
                  <SelectItem value="Sunshine Coast Council">Sunshine Coast Council</SelectItem>
                  <SelectItem value="TableLands Regional Council">TableLands Regional Council</SelectItem>
                  <SelectItem value="Toowoomba Regional Council">Toowoomba Regional Council</SelectItem>
                  <SelectItem value="Torres Shire Council">Torres Shire Council</SelectItem>
                  <SelectItem value="Torres Strait Island Regional Council">Torres Strait Island Regional Council</SelectItem>
                  <SelectItem value="Townsville City Council">Townsville City Council</SelectItem>
                  <SelectItem value="Weipa Town Authority">Weipa Town Authority</SelectItem>
                  <SelectItem value="Western Downs Regional Council">Western Downs Regional Council</SelectItem>
                  <SelectItem value="Whitsunday Regional Council">Whitsunday Regional Council</SelectItem>
                  <SelectItem value="Winton Shire Council">Winton Shire Council</SelectItem>
                  <SelectItem value="Woorabinda Aboriginal Shire Council">Woorabinda Aboriginal Shire Council</SelectItem>
                  <SelectItem value="Wujal Wujal Aboriginal Shire Council">Wujal Wujal Aboriginal Shire Council</SelectItem>
                  <SelectItem value="Yarrabah Aboriginal Shire Council">Yarrabah Aboriginal Shire Council</SelectItem>
                  
                  <div className="border-t border-gray-200 my-1"></div>
                  <SelectItem value="WA_HEADER" disabled className="font-extrabold text-slate-900 pointer-events-none bg-slate-50">
                    Western Australia (WA)
                  </SelectItem>
                  <SelectItem value="Albany, City of">Albany, City of</SelectItem>
                  <SelectItem value="Armadale, City of">Armadale, City of</SelectItem>
                  <SelectItem value="Ashburton Shire">Ashburton Shire</SelectItem>
                  <SelectItem value="Augusta-Margaret River, Shire of">Augusta-Margaret River, Shire of</SelectItem>
                  <SelectItem value="Bassendean, Town of">Bassendean, Town of</SelectItem>
                  <SelectItem value="Bayswater, City of">Bayswater, City of</SelectItem>
                  <SelectItem value="Belmont, City of">Belmont, City of</SelectItem>
                  <SelectItem value="Beverley, Shire of">Beverley, Shire of</SelectItem>
                  <SelectItem value="Boddington, Shire of">Boddington, Shire of</SelectItem>
                  <SelectItem value="Boyup Brook, Shire of">Boyup Brook, Shire of</SelectItem>
                  <SelectItem value="Bridgetown-Greenbushes, Shire of">Bridgetown-Greenbushes, Shire of</SelectItem>
                  <SelectItem value="Broome, Shire of">Broome, Shire of</SelectItem>
                  <SelectItem value="Broomehill-Tambellup, Shire of">Broomehill-Tambellup, Shire of</SelectItem>
                  <SelectItem value="Bruce Rock, Shire of">Bruce Rock, Shire of</SelectItem>
                  <SelectItem value="Bunbury, City of">Bunbury, City of</SelectItem>
                  <SelectItem value="Busselton, City of">Busselton, City of</SelectItem>
                  <SelectItem value="Cambridge, Town of">Cambridge, Town of</SelectItem>
                  <SelectItem value="Canning, City of">Canning, City of</SelectItem>
                  <SelectItem value="Capel, Shire of">Capel, Shire of</SelectItem>
                  <SelectItem value="Carnamah, Shire of">Carnamah, Shire of</SelectItem>
                  <SelectItem value="Carnarvon, Shire of">Carnarvon, Shire of</SelectItem>
                  <SelectItem value="Chapman Valley, Shire of">Chapman Valley, Shire of</SelectItem>
                  <SelectItem value="Chittering, Shire of">Chittering, Shire of</SelectItem>
                  <SelectItem value="Claremont, Town of">Claremont, Town of</SelectItem>
                  <SelectItem value="Cockburn, City of">Cockburn, City of</SelectItem>
                  <SelectItem value="Collie, Shire of">Collie, Shire of</SelectItem>
                  <SelectItem value="Coolgardie, Shire of">Coolgardie, Shire of</SelectItem>
                  <SelectItem value="Coorow, Shire of">Coorow, Shire of</SelectItem>
                  <SelectItem value="Corrigin, Shire of">Corrigin, Shire of</SelectItem>
                  <SelectItem value="Cottesloe, Town of">Cottesloe, Town of</SelectItem>
                  <SelectItem value="Cranbrook, Shire of">Cranbrook, Shire of</SelectItem>
                  <SelectItem value="Cue, Shire of">Cue, Shire of</SelectItem>
                  <SelectItem value="Cunderdin, Shire of">Cunderdin, Shire of</SelectItem>
                  <SelectItem value="Dalwallinu, Shire of">Dalwallinu, Shire of</SelectItem>
                  <SelectItem value="Dandaragan, Shire of">Dandaragan, Shire of</SelectItem>
                  <SelectItem value="Dardanup, Shire of">Dardanup, Shire of</SelectItem>
                  <SelectItem value="Denmark, Shire of">Denmark, Shire of</SelectItem>
                  <SelectItem value="Derby-West Kimberley, Shire of">Derby-West Kimberley, Shire of</SelectItem>
                  <SelectItem value="Donnybrook-Balingup, Shire of">Donnybrook-Balingup, Shire of</SelectItem>
                  <SelectItem value="Dowerin, Shire of">Dowerin, Shire of</SelectItem>
                  <SelectItem value="Dumbleyung, Shire of">Dumbleyung, Shire of</SelectItem>
                  <SelectItem value="Dundas, Shire of">Dundas, Shire of</SelectItem>
                  <SelectItem value="East Fremantle, Town of">East Fremantle, Town of</SelectItem>
                  <SelectItem value="East Pilbara, Shire of">East Pilbara, Shire of</SelectItem>
                  <SelectItem value="Esperance, Shire of">Esperance, Shire of</SelectItem>
                  <SelectItem value="Exmouth, Shire of">Exmouth, Shire of</SelectItem>
                  <SelectItem value="Fremantle, City of">Fremantle, City of</SelectItem>
                  <SelectItem value="Geraldton, City of">Geraldton, City of</SelectItem>
                  <SelectItem value="Gingin, Shire of">Gingin, Shire of</SelectItem>
                  <SelectItem value="Gnowangerup, Shire of">Gnowangerup, Shire of</SelectItem>
                  <SelectItem value="Goomalling, Shire of">Goomalling, Shire of</SelectItem>
                  <SelectItem value="Gosnells, City of">Gosnells, City of</SelectItem>
                  <SelectItem value="Greater Geraldton, City of">Greater Geraldton, City of</SelectItem>
                  <SelectItem value="Halls Creek, Shire of">Halls Creek, Shire of</SelectItem>
                  <SelectItem value="Harvey, Shire of">Harvey, Shire of</SelectItem>
                  <SelectItem value="Irwin, Shire of">Irwin, Shire of</SelectItem>
                  <SelectItem value="Jandakot, City of">Jandakot, City of</SelectItem>
                  <SelectItem value="Jerramungup, Shire of">Jerramungup, Shire of</SelectItem>
                  <SelectItem value="Joondalup, City of">Joondalup, City of</SelectItem>
                  <SelectItem value="Kalamunda, City of">Kalamunda, City of</SelectItem>
                  <SelectItem value="Kalgoorlie-Boulder, City of">Kalgoorlie-Boulder, City of</SelectItem>
                  <SelectItem value="Karratha, City of">Karratha, City of</SelectItem>
                  <SelectItem value="Katanning, Shire of">Katanning, Shire of</SelectItem>
                  <SelectItem value="Kellerberrin, Shire of">Kellerberrin, Shire of</SelectItem>
                  <SelectItem value="Kent, Shire of">Kent, Shire of</SelectItem>
                  <SelectItem value="Kojonup, Shire of">Kojonup, Shire of</SelectItem>
                  <SelectItem value="Kondinin, Shire of">Kondinin, Shire of</SelectItem>
                  <SelectItem value="Koorda, Shire of">Koorda, Shire of</SelectItem>
                  <SelectItem value="Kulin, Shire of">Kulin, Shire of</SelectItem>
                  <SelectItem value="Kwinana, Town of">Kwinana, Town of</SelectItem>
                  <SelectItem value="Lake Grace, Shire of">Lake Grace, Shire of</SelectItem>
                  <SelectItem value="Laverton, Shire of">Laverton, Shire of</SelectItem>
                  <SelectItem value="Leonora, Shire of">Leonora, Shire of</SelectItem>
                  <SelectItem value="Mandurah, City of">Mandurah, City of</SelectItem>
                  <SelectItem value="Manjimup, Shire of">Manjimup, Shire of</SelectItem>
                  <SelectItem value="Meekatharra, Shire of">Meekatharra, Shire of</SelectItem>
                  <SelectItem value="Melville, City of">Melville, City of</SelectItem>
                  <SelectItem value="Menzies, Shire of">Menzies, Shire of</SelectItem>
                  <SelectItem value="Merredin, Shire of">Merredin, Shire of</SelectItem>
                  <SelectItem value="Mingenew, Shire of">Mingenew, Shire of</SelectItem>
                  <SelectItem value="Moora, Shire of">Moora, Shire of</SelectItem>
                  <SelectItem value="Morawa, Shire of">Morawa, Shire of</SelectItem>
                  <SelectItem value="Mount Magnet, Shire of">Mount Magnet, Shire of</SelectItem>
                  <SelectItem value="Mount Marshall, Shire of">Mount Marshall, Shire of</SelectItem>
                  <SelectItem value="Mukinbudin, Shire of">Mukinbudin, Shire of</SelectItem>
                  <SelectItem value="Mundaring, Shire of">Mundaring, Shire of</SelectItem>
                  <SelectItem value="Murchison, Shire of">Murchison, Shire of</SelectItem>
                  <SelectItem value="Murray, Shire of">Murray, Shire of</SelectItem>
                  <SelectItem value="Narembeen, Shire of">Narembeen, Shire of</SelectItem>
                  <SelectItem value="Narrogin, Shire of">Narrogin, Shire of</SelectItem>
                  <SelectItem value="Nedlands, City of">Nedlands, City of</SelectItem>
                  <SelectItem value="Ngaanyatjarraku, Shire of">Ngaanyatjarraku, Shire of</SelectItem>
                  <SelectItem value="Northam, Shire of">Northam, Shire of</SelectItem>
                  <SelectItem value="Northampton, Shire of">Northampton, Shire of</SelectItem>
                  <SelectItem value="Nungarin, Shire of">Nungarin, Shire of</SelectItem>
                  <SelectItem value="Peppermint Grove, Shire of">Peppermint Grove, Shire of</SelectItem>
                  <SelectItem value="Perth, City of">Perth, City of</SelectItem>
                  <SelectItem value="Pingelly, Shire of">Pingelly, Shire of</SelectItem>
                  <SelectItem value="Plantagenet, Shire of">Plantagenet, Shire of</SelectItem>
                  <SelectItem value="Port Hedland, Town of">Port Hedland, Town of</SelectItem>
                  <SelectItem value="Quairading, Shire of">Quairading, Shire of</SelectItem>
                  <SelectItem value="Ravensthorpe, Shire of">Ravensthorpe, Shire of</SelectItem>
                  <SelectItem value="Rockingham, City of">Rockingham, City of</SelectItem>
                  <SelectItem value="Sandstone, Shire of">Sandstone, Shire of</SelectItem>
                  <SelectItem value="Serpentine-Jarrahdale, Shire of">Serpentine-Jarrahdale, Shire of</SelectItem>
                  <SelectItem value="Shark Bay, Shire of">Shark Bay, Shire of</SelectItem>
                  <SelectItem value="South Perth, City of">South Perth, City of</SelectItem>
                  <SelectItem value="Stirling, City of">Stirling, City of</SelectItem>
                  <SelectItem value="Subiaco, City of">Subiaco, City of</SelectItem>
                  <SelectItem value="Swan, City of">Swan, City of</SelectItem>
                  <SelectItem value="Tammin, Shire of">Tammin, Shire of</SelectItem>
                  <SelectItem value="Three Springs, Shire of">Three Springs, Shire of</SelectItem>
                  <SelectItem value="Toodyay, Shire of">Toodyay, Shire of</SelectItem>
                  <SelectItem value="Trayning, Shire of">Trayning, Shire of</SelectItem>
                  <SelectItem value="Upper Gascoyne, Shire of">Upper Gascoyne, Shire of</SelectItem>
                  <SelectItem value="Victoria Park, Town of">Victoria Park, Town of</SelectItem>
                  <SelectItem value="Victoria Plains, Shire of">Victoria Plains, Shire of</SelectItem>
                  <SelectItem value="Vincent, City of">Vincent, City of</SelectItem>
                  <SelectItem value="Wagin, Shire of">Wagin, Shire of</SelectItem>
                  <SelectItem value="Wanneroo, City of">Wanneroo, City of</SelectItem>
                  <SelectItem value="Waroona, Shire of">Waroona, Shire of</SelectItem>
                  <SelectItem value="West Arthur, Shire of">West Arthur, Shire of</SelectItem>
                  <SelectItem value="Westonia, Shire of">Westonia, Shire of</SelectItem>
                  <SelectItem value="Wickepin, Shire of">Wickepin, Shire of</SelectItem>
                  <SelectItem value="Williams, Shire of">Williams, Shire of</SelectItem>
                  <SelectItem value="Wiluna, Shire of">Wiluna, Shire of</SelectItem>
                  <SelectItem value="Wongan-Ballidu, Shire of">Wongan-Ballidu, Shire of</SelectItem>
                  <SelectItem value="Woodanilling, Shire of">Woodanilling, Shire of</SelectItem>
                  <SelectItem value="Wyndham-East Kimberley, Shire of">Wyndham-East Kimberley, Shire of</SelectItem>
                  <SelectItem value="Yalgoo, Shire of">Yalgoo, Shire of</SelectItem>
                  <SelectItem value="Yilgarn, Shire of">Yilgarn, Shire of</SelectItem>
                  <SelectItem value="York, Shire of">York, Shire of</SelectItem>
                  
                  <div className="border-t border-gray-200 my-1"></div>
                  <SelectItem value="SA_HEADER" disabled className="font-extrabold text-slate-900 pointer-events-none bg-slate-50">
                    South Australia (SA)
                  </SelectItem>
                  <SelectItem value="Adelaide, City of">Adelaide, City of</SelectItem>
                  <SelectItem value="Adelaide Hills Council">Adelaide Hills Council</SelectItem>
                  <SelectItem value="Adelaide Plains Council">Adelaide Plains Council</SelectItem>
                  <SelectItem value="Alexandrina Council">Alexandrina Council</SelectItem>
                  <SelectItem value="Barossa Council">Barossa Council</SelectItem>
                  <SelectItem value="Barunga West District Council">Barunga West District Council</SelectItem>
                  <SelectItem value="Berri Barmera Council">Berri Barmera Council</SelectItem>
                  <SelectItem value="Burnside, City of">Burnside, City of</SelectItem>
                  <SelectItem value="Campbelltown, City of">Campbelltown, City of</SelectItem>
                  <SelectItem value="Cedar Creek District Council">Cedar Creek District Council</SelectItem>
                  <SelectItem value="Charles Sturt, City of">Charles Sturt, City of</SelectItem>
                  <SelectItem value="Clare and Gilbert Valleys Council">Clare and Gilbert Valleys Council</SelectItem>
                  <SelectItem value="Cleve District Council">Cleve District Council</SelectItem>
                  <SelectItem value="Coober Pedy District Council">Coober Pedy District Council</SelectItem>
                  <SelectItem value="Coorong District Council">Coorong District Council</SelectItem>
                  <SelectItem value="Copper Coast District Council">Copper Coast District Council</SelectItem>
                  <SelectItem value="Elliston District Council">Elliston District Council</SelectItem>
                  <SelectItem value="Flinders Ranges Council">Flinders Ranges Council</SelectItem>
                  <SelectItem value="Franklin Harbour District Council">Franklin Harbour District Council</SelectItem>
                  <SelectItem value="Gawler, Town of">Gawler, Town of</SelectItem>
                  <SelectItem value="Goyder Regional Council">Goyder Regional Council</SelectItem>
                  <SelectItem value="Grant District Council">Grant District Council</SelectItem>
                  <SelectItem value="Holdfast Bay, City of">Holdfast Bay, City of</SelectItem>
                  <SelectItem value="Kangaroo Island Council">Kangaroo Island Council</SelectItem>
                  <SelectItem value="Karoonda East Murray District Council">Karoonda East Murray District Council</SelectItem>
                  <SelectItem value="Kimba District Council">Kimba District Council</SelectItem>
                  <SelectItem value="Kingston District Council">Kingston District Council</SelectItem>
                  <SelectItem value="Light Regional Council">Light Regional Council</SelectItem>
                  <SelectItem value="Lower Eyre Peninsula District Council">Lower Eyre Peninsula District Council</SelectItem>
                  <SelectItem value="Loxton Waikerie District Council">Loxton Waikerie District Council</SelectItem>
                  <SelectItem value="Mallala District Council">Mallala District Council (now Adelaide Plains Council)</SelectItem>
                  <SelectItem value="Marion, City of">Marion, City of</SelectItem>
                  <SelectItem value="Mid Murray Council">Mid Murray Council</SelectItem>
                  <SelectItem value="Mitcham, City of">Mitcham, City of</SelectItem>
                  <SelectItem value="Mount Barker District Council">Mount Barker District Council</SelectItem>
                  <SelectItem value="Mount Gambier, City of">Mount Gambier, City of</SelectItem>
                  <SelectItem value="Mount Remarkable District Council">Mount Remarkable District Council</SelectItem>
                  <SelectItem value="Murray Bridge, Rural City of">Murray Bridge, Rural City of</SelectItem>
                  <SelectItem value="Naracoorte Lucindale Council">Naracoorte Lucindale Council</SelectItem>
                  <SelectItem value="Northern Areas Council">Northern Areas Council</SelectItem>
                  <SelectItem value="Norwood Payneham & St Peters, City of">Norwood Payneham & St Peters, City of</SelectItem>
                  <SelectItem value="Onkaparinga, City of">Onkaparinga, City of</SelectItem>
                  <SelectItem value="Orroroo Carrieton District Council">Orroroo Carrieton District Council</SelectItem>
                  <SelectItem value="Peterborough District Council">Peterborough District Council</SelectItem>
                  <SelectItem value="Playford, City of">Playford, City of</SelectItem>
                  <SelectItem value="Port Adelaide Enfield, City of">Port Adelaide Enfield, City of</SelectItem>
                  <SelectItem value="Port Augusta, City of">Port Augusta, City of</SelectItem>
                  <SelectItem value="Port Lincoln, City of">Port Lincoln, City of</SelectItem>
                  <SelectItem value="Port Pirie Regional Council">Port Pirie Regional Council</SelectItem>
                  <SelectItem value="Prospect, City of">Prospect, City of</SelectItem>
                  <SelectItem value="Renmark Paringa Council">Renmark Paringa Council</SelectItem>
                  <SelectItem value="Robe District Council">Robe District Council</SelectItem>
                  <SelectItem value="Roxby Council">Roxby Council</SelectItem>
                  <SelectItem value="Salisbury, City of">Salisbury, City of</SelectItem>
                  <SelectItem value="Southern Mallee District Council">Southern Mallee District Council</SelectItem>
                  <SelectItem value="Streaky Bay District Council">Streaky Bay District Council</SelectItem>
                  <SelectItem value="Tatiara District Council">Tatiara District Council</SelectItem>
                  <SelectItem value="Tea Tree Gully, City of">Tea Tree Gully, City of</SelectItem>
                  <SelectItem value="Tumby Bay District Council">Tumby Bay District Council</SelectItem>
                  <SelectItem value="Unley, City of">Unley, City of</SelectItem>
                  <SelectItem value="Victor Harbor, City of">Victor Harbor, City of</SelectItem>
                  <SelectItem value="Wakefield Regional Council">Wakefield Regional Council</SelectItem>
                  <SelectItem value="Walkerville, Town of">Walkerville, Town of</SelectItem>
                  <SelectItem value="Wattle Range Council">Wattle Range Council</SelectItem>
                  <SelectItem value="West Torrens, City of">West Torrens, City of</SelectItem>
                  <SelectItem value="Whyalla, City of">Whyalla, City of</SelectItem>
                  <SelectItem value="Wudinna District Council">Wudinna District Council</SelectItem>
                  <SelectItem value="Yorke Peninsula Council">Yorke Peninsula Council</SelectItem>
                  
                  <div className="border-t border-gray-200 my-1"></div>
                  <SelectItem value="TAS_HEADER" disabled className="font-extrabold text-slate-900 pointer-events-none bg-slate-50">
                    Tasmania (TAS)
                  </SelectItem>
                  <SelectItem value="Break O'Day Council">Break O'Day Council</SelectItem>
                  <SelectItem value="Brighton Council">Brighton Council</SelectItem>
                  <SelectItem value="Burnie City Council">Burnie City Council</SelectItem>
                  <SelectItem value="Central Coast Council">Central Coast Council</SelectItem>
                  <SelectItem value="Central Highlands Council">Central Highlands Council</SelectItem>
                  <SelectItem value="Circular Head Council">Circular Head Council</SelectItem>
                  <SelectItem value="Clarence City Council">Clarence City Council</SelectItem>
                  <SelectItem value="Derwent Valley Council">Derwent Valley Council</SelectItem>
                  <SelectItem value="Devonport City Council">Devonport City Council</SelectItem>
                  <SelectItem value="Dorset Council">Dorset Council</SelectItem>
                  <SelectItem value="Flinders Council">Flinders Council</SelectItem>
                  <SelectItem value="George Town Council">George Town Council</SelectItem>
                  <SelectItem value="Glamorgan Spring Bay Council">Glamorgan Spring Bay Council</SelectItem>
                  <SelectItem value="Glenorchy City Council">Glenorchy City Council</SelectItem>
                  <SelectItem value="Hobart City Council">Hobart City Council</SelectItem>
                  <SelectItem value="Huon Valley Council">Huon Valley Council</SelectItem>
                  <SelectItem value="Kentish Council">Kentish Council</SelectItem>
                  <SelectItem value="King Island Council">King Island Council</SelectItem>
                  <SelectItem value="Kingborough Council">Kingborough Council</SelectItem>
                  <SelectItem value="Latrobe Council">Latrobe Council</SelectItem>
                  <SelectItem value="Launceston City Council">Launceston City Council</SelectItem>
                  <SelectItem value="Meander Valley Council">Meander Valley Council</SelectItem>
                  <SelectItem value="Northern Midlands Council">Northern Midlands Council</SelectItem>
                  <SelectItem value="Sorell Council">Sorell Council</SelectItem>
                  <SelectItem value="Southern Midlands Council">Southern Midlands Council</SelectItem>
                  <SelectItem value="Tasman Council">Tasman Council</SelectItem>
                  <SelectItem value="Waratah–Wynyard Council">Waratah–Wynyard Council</SelectItem>
                  <SelectItem value="West Coast Council">West Coast Council</SelectItem>
                  <SelectItem value="West Tamar Council">West Tamar Council</SelectItem>
                  
                  <div className="border-t border-gray-200 my-1"></div>
                  <SelectItem value="NT_HEADER" disabled className="font-extrabold text-slate-900 pointer-events-none bg-slate-50">
                    Northern Territory (NT)
                  </SelectItem>
                  <SelectItem value="Alice Springs Town Council">Alice Springs Town Council</SelectItem>
                  <SelectItem value="Barkly Regional Council">Barkly Regional Council</SelectItem>
                  <SelectItem value="Belyuen Community Government Council">Belyuen Community Government Council</SelectItem>
                  <SelectItem value="Central Desert Regional Council">Central Desert Regional Council</SelectItem>
                  <SelectItem value="City of Darwin">City of Darwin</SelectItem>
                  <SelectItem value="City of Palmerston">City of Palmerston</SelectItem>
                  <SelectItem value="East Arnhem Regional Council">East Arnhem Regional Council</SelectItem>
                  <SelectItem value="Katherine Town Council">Katherine Town Council</SelectItem>
                  <SelectItem value="Litchfield Council">Litchfield Council</SelectItem>
                  <SelectItem value="MacDonnell Regional Council">MacDonnell Regional Council</SelectItem>
                  <SelectItem value="Roper Gulf Regional Council">Roper Gulf Regional Council</SelectItem>
                  <SelectItem value="Tiwi Islands Regional Council">Tiwi Islands Regional Council</SelectItem>
                  <SelectItem value="Victoria Daly Regional Council">Victoria Daly Regional Council</SelectItem>
                  <SelectItem value="Wagait Shire Council">Wagait Shire Council</SelectItem>
                  <SelectItem value="West Arnhem Regional Council">West Arnhem Regional Council</SelectItem>
                  <SelectItem value="West Daly Regional Council">West Daly Regional Council</SelectItem>
                  
                  <div className="border-t border-gray-200 my-1"></div>
                  <SelectItem value="ACT_HEADER" disabled className="font-extrabold text-slate-900 pointer-events-none bg-slate-50">
                    Australian Capital Territory (ACT)
                  </SelectItem>
                  <SelectItem value="Australian Capital Territory Government">Australian Capital Territory Government</SelectItem>
              </SearchableSelect>
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
          
          {/* Outdoor Features Section */}
          <div className="space-y-6">
            <div className="border-b border-slate-200 pb-4">
              <h4 className="text-lg font-semibold text-slate-900 mb-2">Outdoor Features</h4>
              <p className="text-sm text-slate-600">Select applicable outdoor amenities and features</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                'Swimming pool',
                'Balcony',
                'Garage',
                'Outdoor area / Alfresco',
                'Carport',
                'Deck',
                'Pergola',
                'Patio',
                'Verandah',
                'Courtyard',
                'Shed / Workshop',
                'Garden / Landscaped yard',
                'Rainwater tank',
                'Solar panels',
                'Driveway',
                'Fence / Gated entry',
                'BBQ area',
                'Fire pit',
                'Spa / Hot tub',
                'Play area / Playground',
                'Rumpus area (outdoor)',
                'Greenhouse / Veggie patch',
                'Clothesline (Hills Hoist)'
              ].slice(0, showAllOutdoorFeatures ? undefined : 6).map((feature) => (
                <div key={feature} className="flex items-center space-x-2">
                  <Checkbox
                    id={`outdoor-${feature.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}`}
                    checked={filters.outdoorFeatures.includes(feature)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        updateFilter("outdoorFeatures", [...filters.outdoorFeatures, feature]);
                      } else {
                        updateFilter("outdoorFeatures", filters.outdoorFeatures.filter(f => f !== feature));
                      }
                    }}
                  />
                  <Label
                    htmlFor={`outdoor-${feature.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}`}
                    className="text-sm font-normal cursor-pointer"
                  >
                    {feature}
                  </Label>
                </div>
              ))}
            </div>
            
            <button
              type="button"
              onClick={() => setShowAllOutdoorFeatures(!showAllOutdoorFeatures)}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1 mt-4"
            >
              {showAllOutdoorFeatures ? 'Show less outdoor features' : 'Show more outdoor features'}
              <svg className={`w-4 h-4 transition-transform ${showAllOutdoorFeatures ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>

          {/* Indoor Features Section */}
          <div className="space-y-6">
            <div className="border-b border-slate-200 pb-4">
              <h4 className="text-lg font-semibold text-slate-900 mb-2">Indoor Features</h4>
              <p className="text-sm text-slate-600">Select applicable indoor amenities and features</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                'Ensuite',
                'Study / Home office',
                'Alarm system',
                'Floorboards',
                'Rumpus room (indoor)',
                'Dishwasher',
                'Built-in robes',
                'Broadband / NBN',
                'Gym / Fitness room',
                'Workshop (indoor)',
                'Air conditioning',
                'Heating system (ducted / split)',
                'Fireplace',
                'Ceiling fans',
                'Open-plan living',
                'Pantry / Butler\'s pantry',
                'Walk-in wardrobe',
                'Media room / Theatre room',
                'Laundry (internal)',
                'Smart home system',
                'Storage room'
              ].slice(0, showAllIndoorFeatures ? undefined : 6).map((feature) => (
                <div key={feature} className="flex items-center space-x-2">
                  <Checkbox
                    id={`indoor-${feature.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}`}
                    checked={filters.indoorFeatures.includes(feature)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        updateFilter("indoorFeatures", [...filters.indoorFeatures, feature]);
                      } else {
                        updateFilter("indoorFeatures", filters.indoorFeatures.filter(f => f !== feature));
                      }
                    }}
                  />
                  <Label
                    htmlFor={`indoor-${feature.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}`}
                    className="text-sm font-normal cursor-pointer"
                  >
                    {feature}
                  </Label>
                </div>
              ))}
            </div>
            
            <button
              type="button"
              onClick={() => setShowAllIndoorFeatures(!showAllIndoorFeatures)}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1 mt-4"
            >
              {showAllIndoorFeatures ? 'Show less indoor features' : 'Show more indoor features'}
              <svg className={`w-4 h-4 transition-transform ${showAllIndoorFeatures ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
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
