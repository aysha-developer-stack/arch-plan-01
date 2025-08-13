import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { apiClient } from "@/lib/axios";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger
} from "@/components/ui/dialog";
import {
  Search,
  Filter,
  Download,
  Eye,
  Upload,
  Home,
  User,
  FileText,
  LogOut,
  Plus,
  Trash2,
  Edit,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  RefreshCw,
  BarChart3,
  TrendingUp,
  HardDrive,
  CloudUpload,
  X
} from "lucide-react";

import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import type { PlanType } from "@shared/schema";

interface AdminStats {
  totalPlans: number;
  totalDownloads: number;
  recentUploads: number;
}

interface UploadFormData {
  title: string;
  description: string;
  planType: string;
  storeys: string;
  lotSize: string;
  orientation: string;
  siteType: string;
  foundationType: string;
  councilArea: string;
  plotLength: string;
  plotWidth: string;
  coveredArea: string;
  roadPosition: string;
  builderName: string;
  houseType: string;
  bedrooms: string;
  toilets: string;
  livingAreas: string;
  constructionType: string[];
  file: File | null;
}

export default function AdminInterface() {
  // Per-user download count state
  const [userDownloads, setUserDownloads] = useState<number | null>(null);

  useEffect(() => {
    const fetchUserDownloads = async () => {
      try {
        const response = await apiClient.get("/users/me/downloads");
        setUserDownloads(response.data.downloadCount || 0);
      } catch (error) {
        const err = error as { response?: { status?: number } };
        // Don't show error if not authenticated (user might not be logged in yet)
        if (err.response?.status !== 401) {
          console.error("Failed to fetch user download count", err);
        }
        setUserDownloads(null);
      }
    };

    fetchUserDownloads();
  }, []);
  // Total Downloads state for dashboard card
  const [totalDownloads, setTotalDownloads] = useState(0);
  useEffect(() => {
    fetch("/api/plans/total-downloads")
      .then((res) => res.json())
      .then((data) => setTotalDownloads(data.totalDownloads || 0))
      .catch((err) => console.error("Failed to fetch total downloads", err));
  }, []);
  const { toast: showToast } = useToast();
  const queryClient = useQueryClient();
  const [uploadForm, setUploadForm] = useState<UploadFormData>({
    title: "",
    description: "",
    planType: "",
    storeys: "",
    lotSize: "",
    orientation: "",
    siteType: "",
    foundationType: "",
    councilArea: "",
    plotLength: "",
    plotWidth: "",
    coveredArea: "",
    roadPosition: "",
    builderName: "",
    houseType: "",
    bedrooms: "3",
    toilets: "2",
    livingAreas: "1",
    constructionType: [],
    file: null,
  });

  // Fetch admin stats
  const { data: stats } = useQuery<AdminStats>({
    queryKey: ["/api/admin/stats"],
    retry: false,
  });

  // Fetch admin plans
  const { data: plans = [], isLoading: plansLoading } = useQuery<PlanType[]>({
    queryKey: ["/api/admin/plans"],
    retry: false,
  });

  // Upload plan mutation
  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      return await apiRequest("POST", "/api/admin/plans", formData);
    },
    onSuccess: () => {
      showToast({
        title: "Success",
        description: "Plan uploaded successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/plans"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      // Reset form
      setUploadForm({
        title: "",
        description: "",
        planType: "",
        storeys: "",
        lotSize: "",
        orientation: "",
        siteType: "",
        foundationType: "",
        councilArea: "",
        plotLength: "",
        plotWidth: "",
        coveredArea: "",
        roadPosition: "",
        builderName: "",
        houseType: "",
        bedrooms: "3",
        toilets: "2",
        livingAreas: "1",
        constructionType: [],
        file: null,
      });
      resetFileInput();
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        showToast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      showToast({
        title: "Upload Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete plan mutation
  const deleteMutation = useMutation({
    mutationFn: async (planId: string) => {
      return await apiRequest("DELETE", `/api/admin/plans/${planId}`);
    },
    onSuccess: () => {
      showToast({
        title: "Success",
        description: "Plan deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/plans"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        showToast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      showToast({
        title: "Delete Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleUpload = (e: React.FormEvent) => {
    e.preventDefault();

    if (!uploadForm.file) {
      showToast({
        title: "Error",
        description: "Please select a PDF file to upload",
        variant: "destructive",
      });
      return;
    }

    const formData = new FormData();

    // Only append non-empty values and handle proper data types
    if (uploadForm.file) formData.append("file", uploadForm.file);
    if (uploadForm.title.trim()) formData.append("title", uploadForm.title.trim());
    if (uploadForm.description.trim()) formData.append("description", uploadForm.description.trim());
    if (uploadForm.planType.trim()) formData.append("planType", uploadForm.planType.trim());

    // storeys is required as number in schema
    if (uploadForm.storeys.trim()) formData.append("storeys", uploadForm.storeys.trim());

    // Optional fields - only append if they have values
    if (uploadForm.lotSize.trim()) formData.append("lotSize", uploadForm.lotSize.trim());
    if (uploadForm.orientation.trim()) formData.append("orientation", uploadForm.orientation.trim());
    if (uploadForm.siteType.trim()) formData.append("siteType", uploadForm.siteType.trim());
    if (uploadForm.foundationType.trim()) formData.append("foundationType", uploadForm.foundationType.trim());
    if (uploadForm.councilArea.trim()) formData.append("councilArea", uploadForm.councilArea.trim());
    
    // New fields
    if (uploadForm.plotLength.trim()) formData.append("plotLength", uploadForm.plotLength.trim());
    if (uploadForm.plotWidth.trim()) formData.append("plotWidth", uploadForm.plotWidth.trim());
    if (uploadForm.coveredArea.trim()) formData.append("coveredArea", uploadForm.coveredArea.trim());
    if (uploadForm.roadPosition.trim()) formData.append("roadPosition", uploadForm.roadPosition.trim());
    if (uploadForm.builderName.trim()) formData.append("builderName", uploadForm.builderName.trim());
    if (uploadForm.houseType.trim()) formData.append("houseType", uploadForm.houseType.trim());
    if (uploadForm.bedrooms.trim()) formData.append("bedrooms", uploadForm.bedrooms.trim());
    if (uploadForm.toilets.trim()) formData.append("toilets", uploadForm.toilets.trim());
    if (uploadForm.livingAreas.trim()) formData.append("livingAreas", uploadForm.livingAreas.trim());
    
    // Handle construction type
    if (uploadForm.constructionType.length > 0) {
      formData.append("constructionType", uploadForm.constructionType[0]);
    }

    uploadMutation.mutate(formData);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type === "application/pdf") {
        setUploadForm(prev => ({ ...prev, file }));
      } else {
        showToast({
          title: "Invalid File",
          description: "Please select a PDF file",
          variant: "destructive",
        });
        // Reset the input
        e.target.value = "";
      }
    }
  };

  const resetFileInput = () => {
    const fileInput = document.getElementById("file-upload") as HTMLInputElement;
    if (fileInput) {
      fileInput.value = "";
    }
  };

  // PDF Viewer State
  const [isPdfViewerOpen, setIsPdfViewerOpen] = useState(false);
  const [currentPdfUrl, setCurrentPdfUrl] = useState<string | null>(null);
  const [pdfViewerKey, setPdfViewerKey] = useState(0);
  const [isLoadingPdf, setIsLoadingPdf] = useState(false);
  const [lastRequestedPdfId, setLastRequestedPdfId] = useState<string | null>(null);
  const [pdfLoadTimeout, setPdfLoadTimeout] = useState<NodeJS.Timeout | null>(null);

  // Get the toast function from useToast hook - using showToast to avoid name conflicts

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Admin Sidebar */}
      <div className="w-64 bg-white shadow-sm border-r border-slate-200">
        <div className="p-6">
          <div className="flex items-center space-x-2 mb-8">
            <BarChart3 className="text-primary text-xl" />
            <h2 className="text-lg font-semibold text-slate-900">Admin Portal</h2>
          </div>
        </div>
      </div>

      {/* Admin Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          <Tabs defaultValue="dashboard" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
              <TabsTrigger value="manage">Manage Plans</TabsTrigger>
              <TabsTrigger value="upload">Upload Plans</TabsTrigger>
            </TabsList>

            {/* Dashboard */}
            <TabsContent value="dashboard" className="space-y-8">
              <div>
                <h3 className="text-2xl font-bold text-slate-900 mb-2">Dashboard Overview</h3>
                <p className="text-slate-600">Monitor your architectural plans database performance</p>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Per-user downloads */}
                {/* <Card>
    <CardContent className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-600 mb-1">Your Downloads</p>
          <p className="text-2xl font-bold text-slate-900">
            {userDownloads !== null ? userDownloads : <span className="text-slate-400">—</span>}
          </p>
        </div>
        <div className="bg-orange-100 p-3 rounded-lg">
          <User className="text-orange-600 text-xl" />
        </div>
      </div>
    </CardContent>
  </Card> */}
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-slate-600 mb-1">Total Plans</p>
                        <p className="text-2xl font-bold text-slate-900">
                          {stats?.totalPlans || 0}
                        </p>
                      </div>
                      <div className="bg-blue-100 p-3 rounded-lg">
                        <FileText className="text-blue-600 text-xl" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-slate-600 mb-1">Total Downloads</p>
                        <p className="text-2xl font-bold text-slate-900">
                          {totalDownloads}
                        </p>
                      </div>
                      <div className="bg-green-100 p-3 rounded-lg">
                        <Download className="text-green-600 text-xl" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-slate-600 mb-1">Recent Uploads</p>
                        <p className="text-2xl font-bold text-slate-900">
                          {stats?.recentUploads || 0}
                        </p>
                      </div>
                      <div className="bg-purple-100 p-3 rounded-lg">
                        <TrendingUp className="text-purple-600 text-xl" />
                      </div>
                    </div>
                  </CardContent>
                </Card>


              </div>
            </TabsContent>
            {/* Upload Plans */}
            <TabsContent value="upload" className="space-y-6">
              <div>
                <h3 className="text-2xl font-bold text-slate-900 mb-2">Upload New Plans</h3>
                <p className="text-slate-600">Add architectural plans to the database with proper metadata</p>
              </div>

              <Card>
                <CardContent className="p-6">
                  <form onSubmit={handleUpload} className="space-y-6">
                    {/* File Upload */}
                    <div>
                      <Label className="text-sm font-medium text-slate-700 mb-4 block">Upload PDF Plans</Label>
                      <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:border-primary transition-colors">
                        <CloudUpload className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                        <p className="text-lg font-medium text-slate-700 mb-2">Drop PDF files here or click to browse</p>
                        <p className="text-sm text-slate-500 mb-4">Maximum file size: 50MB per file</p>
                        <Input
                          type="file"
                          accept=".pdf"
                          onChange={handleFileChange}
                          className="hidden"
                          id="file-upload"
                        />
                        <Button type="button" onClick={() => document.getElementById("file-upload")?.click()}>
                          Browse Files
                        </Button>
                        {uploadForm.file && (
                          <p className="mt-2 text-sm text-green-600">Selected: {uploadForm.file.name}</p>
                        )}
                      </div>
                    </div>

                    {/* Plan Metadata */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <Label htmlFor="title">Plan Title</Label>
                        <Input
                          id="title"
                          value={uploadForm.title}
                          onChange={(e) => setUploadForm(prev => ({ ...prev, title: e.target.value }))}
                          placeholder="e.g., Modern Family Home"
                          required
                        />
                      </div>

                      <div>
                        <Label htmlFor="planType">Plan Type</Label>
                        <Select
                          value={uploadForm.planType}
                          onValueChange={(value) => setUploadForm(prev => ({ ...prev, planType: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select Plan Type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Residential - Single Family">Residential - Single Family</SelectItem>
                            <SelectItem value="Residential - Multi Family">Residential - Multi Family</SelectItem>
                            <SelectItem value="Commercial">Commercial</SelectItem>
                            <SelectItem value="Industrial">Industrial</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="storeys">Number of Storeys</Label>
                        <Select
                          value={uploadForm.storeys}
                          onValueChange={(value) => setUploadForm(prev => ({ ...prev, storeys: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select Storeys" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">Single Storey</SelectItem>
                            <SelectItem value="2">Two Storey</SelectItem>
                            <SelectItem value="3">Three Storey</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="lotSize">Lot Size Category</Label>
                        <Select
                          value={uploadForm.lotSize}
                          onValueChange={(value) => setUploadForm(prev => ({ ...prev, lotSize: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select Lot Size" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Small (< 400m²)">Small (&lt; 400m²)</SelectItem>
                            <SelectItem value="Medium (400-800m²)">Medium (400-800m²)</SelectItem>
                            <SelectItem value="Large (> 800m²)">Large (&gt; 800m²)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="orientation">Preferred Orientation</Label>
                        <Select
                          value={uploadForm.orientation}
                          onValueChange={(value) => setUploadForm(prev => ({ ...prev, orientation: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select Orientation" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="North Facing">North Facing</SelectItem>
                            <SelectItem value="South Facing">South Facing</SelectItem>
                            <SelectItem value="East Facing">East Facing</SelectItem>
                            <SelectItem value="West Facing">West Facing</SelectItem>
                            <SelectItem value="Any Orientation">Any Orientation</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Site Type Filter */}
                      <div>
                        <Label htmlFor="siteType">Site Type</Label>
                        <Select
                          value={uploadForm.siteType}
                          onValueChange={(value) => setUploadForm(prev => ({ ...prev, siteType: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select Site Type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Levelled">Levelled</SelectItem>
                            <SelectItem value="Step Up">Step Up</SelectItem>
                            <SelectItem value="Step Down">Step Down</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Foundation Type Filter */}
                      <div>
                        <Label htmlFor="foundationType">Foundation</Label>
                        <Select
                          value={uploadForm.foundationType}
                          onValueChange={(value) => setUploadForm(prev => ({ ...prev, foundationType: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select Foundation" />
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

                      <div>
                        <Label htmlFor="councilArea">Council Area</Label>
                        <Select
                          value={uploadForm.councilArea}
                          onValueChange={(value) => setUploadForm(prev => ({ ...prev, councilArea: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select Council" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Sydney City">Sydney City</SelectItem>
                            <SelectItem value="Melbourne City">Melbourne City</SelectItem>
                            <SelectItem value="Brisbane City">Brisbane City</SelectItem>
                            <SelectItem value="Perth City">Perth City</SelectItem>
                            <SelectItem value="Adelaide City">Adelaide City</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="plotLength">Plot Length (m)</Label>
                        <Input
                          id="plotLength"
                          type="number"
                          step="0.01"
                          value={uploadForm.plotLength}
                          onChange={(e) => setUploadForm(prev => ({ ...prev, plotLength: e.target.value }))}
                          placeholder="e.g., 20.5"
                        />
                      </div>

                      <div>
                        <Label htmlFor="plotWidth">Plot Width (m)</Label>
                        <Input
                          id="plotWidth"
                          type="number"
                          step="0.01"
                          value={uploadForm.plotWidth}
                          onChange={(e) => setUploadForm(prev => ({ ...prev, plotWidth: e.target.value }))}
                          placeholder="e.g., 15.2"
                        />
                      </div>

                      <div>
                        <Label htmlFor="coveredArea">Covered Area (sq.m)</Label>
                        <Input
                          id="coveredArea"
                          type="number"
                          step="0.01"
                          value={uploadForm.coveredArea}
                          onChange={(e) => setUploadForm(prev => ({ ...prev, coveredArea: e.target.value }))}
                          placeholder="e.g., 150.75"
                        />
                      </div>

                      <div>
                        <Label htmlFor="roadPosition">Road Position</Label>
                        <Select
                          value={uploadForm.roadPosition}
                          onValueChange={(value) => setUploadForm(prev => ({ ...prev, roadPosition: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select Road Position" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Length Side">Length Side</SelectItem>
                            <SelectItem value="Width Side">Width Side</SelectItem>
                            <SelectItem value="Corner Plot">Corner Plot</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="builderName">Builder / Designer Name</Label>
                        <Input
                          id="builderName"
                          value={uploadForm.builderName}
                          onChange={(e) => setUploadForm(prev => ({ ...prev, builderName: e.target.value }))}
                          placeholder="e.g., John Smith Architects"
                        />
                      </div>

                      <div>
                        <Label htmlFor="houseType">House Type</Label>
                        <Select
                          value={uploadForm.houseType}
                          onValueChange={(value) => setUploadForm(prev => ({ ...prev, houseType: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select House Type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Single Dwelling">Single Dwelling</SelectItem>
                            <SelectItem value="Duplex">Duplex</SelectItem>
                            <SelectItem value="Townhouse">Townhouse</SelectItem>
                            <SelectItem value="Unit">Unit</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                      <div>
                        <Label htmlFor="bedrooms">Bedrooms</Label>
                        <Input
                          id="bedrooms"
                          type="number"
                          min="0"
                          max="70"
                          value={uploadForm.bedrooms}
                          onChange={(e) => setUploadForm(prev => ({ ...prev, bedrooms: e.target.value }))}
                          placeholder="3"
                        />
                      </div>

                      <div>
                        <Label htmlFor="toilets">Toilets/Bathrooms</Label>
                        <Input
                          id="toilets"
                          type="number"
                          min="0"
                          max="70"
                          value={uploadForm.toilets}
                          onChange={(e) => setUploadForm(prev => ({ ...prev, toilets: e.target.value }))}
                          placeholder="2"
                        />
                      </div>

                      <div>
                        <Label htmlFor="livingAreas">Living Areas</Label>
                        <Input
                          id="livingAreas"
                          type="number"
                          min="0"
                          max="70"
                          value={uploadForm.livingAreas}
                          onChange={(e) => setUploadForm(prev => ({ ...prev, livingAreas: e.target.value }))}
                          placeholder="1"
                        />
                      </div>
                    </div>

                    <div className="mt-6">
                      <Label htmlFor="constructionType">Type of Construction</Label>
                      <Select
                        value={uploadForm.constructionType.length > 0 ? uploadForm.constructionType[0] : ""}
                        onValueChange={(value) => setUploadForm(prev => ({ ...prev, constructionType: [value] }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select Construction Type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Hebel">Hebel</SelectItem>
                          <SelectItem value="Cladding">Cladding</SelectItem>
                          <SelectItem value="Brick">Brick</SelectItem>
                          <SelectItem value="NRG">NRG</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={uploadForm.description}
                        onChange={(e) => setUploadForm(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Detailed description of the architectural plan..."
                        rows={4}
                      />
                    </div>

                    <div className="flex justify-end space-x-4">
                      <Button type="button" variant="outline">
                        Cancel
                      </Button>
                      <Button type="submit" disabled={uploadMutation.isPending}>
                        <Upload className="w-4 h-4 mr-2" />
                        {uploadMutation.isPending ? "Uploading..." : "Upload Plan"}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Manage Plans Tab */}
            <TabsContent value="manage" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <FileText className="w-5 h-5" />
                    <span>Manage Plans</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {plansLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  ) : plans.length === 0 ? (
                    <div className="text-center py-8">
                      <FileText className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                      <p className="text-slate-600">No plans uploaded yet</p>
                      <p className="text-sm text-slate-500">Upload your first plan to get started</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Title</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Storeys</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Downloads</TableHead>
                            <TableHead>Uploaded</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {plans.map((plan) => (
                            <TableRow key={plan._id.toString()}>
                              <TableCell className="font-medium">{plan.title}</TableCell>
                              <TableCell>{plan.planType}</TableCell>
                              <TableCell>{plan.storeys}</TableCell>
                              <TableCell>
                                <Badge variant={plan.status === 'active' ? 'default' : 'secondary'}>
                                  {plan.status}
                                </Badge>
                              </TableCell>
                              <TableCell>{plan.downloadCount || 0}</TableCell>
                              <TableCell>{new Date(plan.createdAt).toLocaleDateString()}</TableCell>
                              <TableCell className="text-right">
                                <div className="flex items-center justify-end space-x-2">
                                  {/* View Details Dialog */}
                                  <Dialog>
                                    <DialogTrigger asChild>
                                      <Button variant="outline" size="sm">
                                        <Eye className="w-4 h-4" />
                                      </Button>
                                    </DialogTrigger>
                                    <DialogContent className="max-w-2xl">
                                      <DialogHeader>
                                        <DialogTitle>{plan.title}</DialogTitle>
                                        <DialogDescription>
                                          View detailed information about this plan
                                        </DialogDescription>
                                      </DialogHeader>
                                      <div className="grid grid-cols-2 gap-4 py-4">
                                        <div>
                                          <strong>Plan Type:</strong> {plan.planType || 'N/A'}
                                        </div>
                                        <div>
                                          <strong>Storeys:</strong> {plan.storeys}
                                        </div>
                                        <div>
                                          <strong>Bedrooms:</strong> {plan.bedrooms || 'N/A'}
                                        </div>
                                        <div>
                                          <strong>Toilets:</strong> {plan.toilets || 'N/A'}
                                        </div>
                                        <div>
                                          <strong>Living Areas:</strong> {plan.livingAreas || 'N/A'}
                                        </div>
                                        <div>
                                          <strong>House Type:</strong> {plan.houseType || 'N/A'}
                                        </div>
                                        <div>
                                          <strong>Lot Size:</strong> {plan.lotSize || 'N/A'}
                                        </div>
                                        <div>
                                          <strong>Orientation:</strong> {plan.orientation || 'N/A'}
                                        </div>
                                        <div>
                                          <strong>Plot Length (m):</strong> {plan.plotLength || 'N/A'}
                                        </div>
                                        <div>
                                          <strong>Plot Width (m):</strong> {plan.plotWidth || 'N/A'}
                                        </div>
                                        <div>
                                          <strong>Covered Area (sq.m):</strong> {plan.coveredArea || 'N/A'}
                                        </div>
                                        <div>
                                          <strong>Road Position:</strong> {plan.roadPosition || 'N/A'}
                                        </div>
                                        <div>
                                          <strong>Site Type:</strong> {plan.siteType || 'N/A'}
                                        </div>
                                        <div>
                                          <strong>Foundation:</strong> {plan.foundationType || 'N/A'}
                                        </div>
                                        <div>
                                          <strong>Construction Type:</strong> {Array.isArray(plan.constructionType) ? plan.constructionType.join(', ') : plan.constructionType || 'N/A'}
                                        </div>
                                        <div>
                                          <strong>Builder/Designer:</strong> {plan.builderName || 'N/A'}
                                        </div>
                                        <div>
                                          <strong>Council Area:</strong> {plan.councilArea || 'N/A'}
                                        </div>
                                        <div>
                                          <strong>Downloads:</strong> {plan.downloadCount || 0}
                                        </div>
                                        <div>
                                          <strong>File Size:</strong> {plan.fileSize ? `${(plan.fileSize / 1024 / 1024).toFixed(2)} MB` : 'N/A'}
                                        </div>
                                        <div>
                                          <strong>Status:</strong>
                                          <Badge variant={plan.status === 'active' ? 'default' : 'secondary'} className="ml-2">
                                            {plan.status}
                                          </Badge>
                                        </div>
                                      </div>
                                      {plan.description && (
                                        <div className="mt-4">
                                          <strong>Description:</strong>
                                          <p className="mt-1 text-slate-600">{plan.description}</p>
                                        </div>
                                      )}
                                    </DialogContent>
                                  </Dialog>

                                  {/* Download PDF Button */}
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      const planId = plan._id.toString();
                                      const fileName = `${plan.title || 'plan'}.pdf`;
                                      
                                      // Create direct download link
                                      const link = document.createElement('a');
                                      link.href = `/api/plans/${planId}/download`;
                                      link.download = fileName;
                                      link.target = '_blank'; // Open in new tab as fallback
                                      
                                      // Trigger download
                                      document.body.appendChild(link);
                                      link.click();
                                      document.body.removeChild(link);

                                      showToast({
                                        title: "Download Started",
                                        description: `${plan.title} is downloading to your Downloads folder.`,
                                      });
                                    }}
                                  >
                                    <Download className="w-4 h-4 mr-1" /> Download
                                  </Button>

                                  {/* Delete Button */}
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      if (window.confirm(`Are you sure you want to delete "${plan.title}"? This action cannot be undone.`)) {
                                        deleteMutation.mutate(plan._id.toString());
                                      }
                                    }}
                                    disabled={deleteMutation.isPending}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* PDF Viewer Modal */}
      <Dialog
        open={isPdfViewerOpen}
        onOpenChange={(open) => {
          console.log('🔄 PDF Modal onOpenChange:', open);
          setIsPdfViewerOpen(open);
          // Clean up loading state when modal closes
          if (!open) {
            setIsLoadingPdf(false);
            setLastRequestedPdfId(null);
            console.log('🧹 Cleaned up PDF modal state');
          }
        }}
      >
        <DialogContent className="max-w-6xl h-[90vh] p-0">
          <DialogHeader className="sr-only">
            <DialogTitle>PDF Viewer</DialogTitle>
            <DialogDescription>
              View and interact with the selected PDF document
            </DialogDescription>
          </DialogHeader>
          <div className="h-full flex flex-col">
            <div className="flex items-center justify-between p-4 border-b bg-white">
              <h3 className="text-lg font-semibold">PDF Viewer</h3>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (currentPdfUrl) {
                      console.log('🔄 Refreshing PDF:', currentPdfUrl);
                      // Force refresh by updating the URL
                      const refreshUrl = currentPdfUrl + (currentPdfUrl.includes('?') ? '&' : '?') + 'refresh=' + Date.now();
                      setCurrentPdfUrl(refreshUrl);
                      setIsLoadingPdf(true);
                      setLastRequestedPdfId('refresh');

                      showToast({
                        title: "Refreshing",
                        description: "Reloading PDF...",
                      });
                    }
                  }}
                >
                  <RefreshCw className={`w-4 h-4 mr-1 ${isLoadingPdf ? 'animate-spin' : ''}`} />
                  {isLoadingPdf ? 'Loading...' : 'Refresh'}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    console.log('❌ Closing PDF modal');
                    setIsPdfViewerOpen(false);
                    // Clean up state
                    setIsLoadingPdf(false);
                    setLastRequestedPdfId(null);
                  }}
                  className="text-gray-600 hover:text-gray-900"
                >
                  <X className="w-4 h-4 mr-1" /> Close
                </Button>
              </div>
            </div>

            <div className="h-[calc(100%-60px)] w-full bg-white relative">
              {currentPdfUrl ? (
                <>
                  {isLoadingPdf && (
                    <div className="absolute inset-0 bg-white/90 flex items-center justify-center z-20">
                      <div className="text-center">
                        <RefreshCw className="w-8 h-8 mx-auto mb-2 animate-spin text-blue-500" />
                        <p className="text-sm text-gray-600">Loading PDF...</p>
                      </div>
                    </div>
                  )}
                  <iframe
                    key={`pdf-${currentPdfUrl}`}
                    src={currentPdfUrl}
                    className="w-full h-full border-0 bg-white"
                    title="PDF Viewer"
                    allow="fullscreen"
                    sandbox="allow-same-origin"
                    onLoad={() => {
                      console.log('✅ PDF iframe loaded successfully for URL:', currentPdfUrl);
                      setIsLoadingPdf(false);
                      setLastRequestedPdfId(null);
                      showToast({
                        title: "PDF Loaded",
                        description: "PDF is now ready to view",
                      });
                    }}
                    onError={(e) => {
                      console.error('❌ PDF iframe load error for URL:', currentPdfUrl, e);
                      setIsLoadingPdf(false);
                      setLastRequestedPdfId(null);

                      // Clear the PDF URL to prevent retry loop
                      setCurrentPdfUrl('');
                      setIsPdfViewerOpen(false);

                      showToast({
                        title: "PDF Not Available",
                        description: "This plan file is not available and may need to be re-uploaded.",
                        variant: "destructive"
                      });
                    }}
                  />
                </>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  <div className="text-center">
                    <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <p>No PDF selected</p>
                    <p className="text-sm mt-2">Please select a plan to view its PDF</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
