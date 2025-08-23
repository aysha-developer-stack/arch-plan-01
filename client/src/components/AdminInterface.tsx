import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { apiClient } from "@/lib/axios";
import { Label } from "@/components/ui/label";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
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
  lotSizeMin: string;
  lotSizeMax: string;
  orientation: string;
  siteType: string;
  foundationType: string;
  totalBuildingHeight: number;
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
  roofPitch: string;
  outdoorFeatures: string[];
  indoorFeatures: string[];
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
  
  // State for controlling feature visibility
  const [showAllOutdoorFeatures, setShowAllOutdoorFeatures] = useState(false);
  const [showAllIndoorFeatures, setShowAllIndoorFeatures] = useState(false);
  const initialFormData: UploadFormData = {
    title: "",
    description: "",
    planType: "",
    storeys: "",
    lotSizeMin: "",
    lotSizeMax: "",
    orientation: "",
    siteType: "",
    foundationType: "",
    totalBuildingHeight: 0,
    councilArea: "Any",
    plotLength: "",
    plotWidth: "",
    coveredArea: "",
    roadPosition: "",
    builderName: "",
    houseType: "",
    bedrooms: "",
    toilets: "",
    livingAreas: "",
    constructionType: [],
    roofPitch: "",   // Roof pitch in degrees
    outdoorFeatures: [],
    indoorFeatures: [],
    file: null,
  };

  const [uploadForm, setUploadForm] = useState<UploadFormData>(initialFormData);

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
      setUploadForm({
        ...initialFormData,
        file: null
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

const handleUpload = (e: React.MouseEvent) => {
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
  formData.append("lotSizeMin", uploadForm.lotSizeMin.trim());
  formData.append("lotSizeMax", uploadForm.lotSizeMax.trim());
  if (uploadForm.orientation.trim()) formData.append("orientation", uploadForm.orientation.trim());
  if (uploadForm.siteType.trim()) formData.append("siteType", uploadForm.siteType.trim());
  formData.append("foundationType", uploadForm.foundationType.trim());
  if (uploadForm.councilArea.trim()) formData.append("councilArea", uploadForm.councilArea.trim());

  // New fields
  if (uploadForm.plotLength.trim()) formData.append("plotLength", uploadForm.plotLength.trim());
  if (uploadForm.plotWidth.trim()) formData.append("plotWidth", uploadForm.plotWidth.trim());
  if (uploadForm.coveredArea.trim()) formData.append("coveredArea", uploadForm.coveredArea.trim());
  if (uploadForm.roadPosition.trim()) formData.append("roadPosition", uploadForm.roadPosition.trim());
  formData.append("builderName", uploadForm.builderName.trim());
  if (uploadForm.houseType.trim()) formData.append("houseType", uploadForm.houseType.trim());
  if (uploadForm.bedrooms.trim()) formData.append("bedrooms", uploadForm.bedrooms.trim());
  if (uploadForm.toilets.trim()) formData.append("toilets", uploadForm.toilets.trim());
  if (uploadForm.livingAreas.trim()) formData.append("livingAreas", uploadForm.livingAreas.trim());

  // Handle construction type
  if (uploadForm.constructionType.length > 0) {
    formData.append("constructionType", uploadForm.constructionType[0]);
  }

  // Handle outdoor features - always send, even if empty
  formData.append("outdoorFeatures", JSON.stringify(uploadForm.outdoorFeatures));

  // Handle indoor features - always send, even if empty
  formData.append("indoorFeatures", JSON.stringify(uploadForm.indoorFeatures));

  // Handle totalBuildingHeight
  if (uploadForm.totalBuildingHeight > 0) {
    formData.append("totalBuildingHeight", uploadForm.totalBuildingHeight.toString());
  }

  // Handle roofPitch
  if (uploadForm.roofPitch.trim()) {
    formData.append("roofPitch", uploadForm.roofPitch.trim());
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
                <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
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

                  {/* Basic Information Section */}
                  <div className="space-y-6">
                    <div className="border-b border-slate-200 pb-4">
                      <h4 className="text-lg font-semibold text-slate-900 mb-2">Basic Information</h4>
                      <p className="text-sm text-slate-600">Essential plan details and identification</p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <Label htmlFor="title">Plan Title *</Label>
                        <Input
                          id="title"
                          value={uploadForm.title}
                          onChange={(e) => setUploadForm(prev => ({ ...prev, title: e.target.value }))}
                          placeholder="e.g., Modern Family Home"
                          required
                        />
                      </div>

                      <div>
                        <Label htmlFor="planType">Plan Type *</Label>
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
                        <Label htmlFor="builderName">Builder / Designer Name</Label>
                        <Input
                          id="builderName"
                          value={uploadForm.builderName}
                          onChange={(e) => setUploadForm(prev => ({ ...prev, builderName: e.target.value }))}
                          placeholder="e.g., John Smith Architects"
                        />
                      </div>

                      <div>
                        <Label htmlFor="councilArea">Council Area</Label>
                        <SearchableSelect
                          value={uploadForm.councilArea}
                          onValueChange={(value) =>
                            setUploadForm({ ...uploadForm, councilArea: value })
                          }
                          placeholder="Search or select council area..."
                          searchPlaceholder="Search councils..."
                        >
                        <SelectItem value="Any" className="font-medium text-slate-700">Any Council Area</SelectItem>
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
                        <SelectItem value="Greater Hume Shire Council">Greater Hume Shire Council</SelectItem>
                        <SelectItem value="Griffith City Council">Griffith City Council</SelectItem>
                        <SelectItem value="Gundagai Council">Gundagai Council</SelectItem>
                        <SelectItem value="Gunnedah Shire Council">Gunnedah Shire Council</SelectItem>
                        <SelectItem value="Guyra Shire Council">Guyra Shire Council</SelectItem>
                        <SelectItem value="Gwydir Shire Council">Gwydir Shire Council</SelectItem>
                        <SelectItem value="Hawkesbury City Council">Hawkesbury City Council</SelectItem>
                        <SelectItem value="Hay Shire Council">Hay Shire Council</SelectItem>
                        <SelectItem value="Hilltops Council">Hilltops Council</SelectItem>
                        <SelectItem value="Hornsby Shire Council">Hornsby Shire Council</SelectItem>
                        <SelectItem value="Hunters Hill Council">Hunters Hill Council</SelectItem>
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
                        <SelectItem value="MidCoast Council">MidCoast Council</SelectItem>
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
                        <SelectItem value="Wellington Council">Wellington Council</SelectItem>
                        <SelectItem value="Wentworth Shire Council">Wentworth Shire Council</SelectItem>
                        <SelectItem value="Willoughby City Council">Willoughby City Council</SelectItem>
                        <SelectItem value="Wingecarribee Shire Council">Wingecarribee Shire Council</SelectItem>
                        <SelectItem value="Wollondilly Shire Council">Wollondilly Shire Council</SelectItem>
                        <SelectItem value="Wollongong City Council">Wollongong City Council</SelectItem>
                        <SelectItem value="Woollahra Municipal Council">Woollahra Municipal Council</SelectItem>
                        <SelectItem value="Yass Valley Council">Yass Valley Council</SelectItem>

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
                        <SelectItem value="Mansfield Shire Council">Mansfield Shire Council</SelectItem>
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
                        <SelectItem value="Merri-bek City Council">Merri-bek City Council</SelectItem>
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
                        <SelectItem value="Yarriambiack Shire Council">Yarriambiack Shire Council</SelectItem>

                        {/* Queensland (QLD) Councils */}
                        <SelectItem value="QLD_HEADER" disabled className="font-extrabold text-slate-900 pointer-events-none bg-slate-50">Queensland (QLD)</SelectItem>
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
                        <SelectItem value="Noosa Shire Council">Noosa Shire Council</SelectItem>
                        <SelectItem value="North Burnett Regional Council">North Burnett Regional Council</SelectItem>
                        <SelectItem value="Northern Peninsula Area Regional Council">Northern Peninsula Area Regional Council</SelectItem>
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
                        <SelectItem value="Sunshine Coast Regional Council">Sunshine Coast Regional Council</SelectItem>
                        <SelectItem value="Tablelands Regional Council">Tablelands Regional Council</SelectItem>
                        <SelectItem value="Toowoomba Regional Council">Toowoomba Regional Council</SelectItem>
                        <SelectItem value="Torres Strait Island Regional Council">Torres Strait Island Regional Council</SelectItem>
                        <SelectItem value="Torres Shire Council">Torres Shire Council</SelectItem>
                        <SelectItem value="Townsville City Council">Townsville City Council</SelectItem>
                        <SelectItem value="Weipa Town Council">Weipa Town Council</SelectItem>
                        <SelectItem value="Western Downs Regional Council">Western Downs Regional Council</SelectItem>
                        <SelectItem value="Whitsunday Regional Council">Whitsunday Regional Council</SelectItem>
                        <SelectItem value="Winton Shire Council">Winton Shire Council</SelectItem>
                        <SelectItem value="Woorabinda Aboriginal Shire Council">Woorabinda Aboriginal Shire Council</SelectItem>
                        <SelectItem value="Wujal Wujal Aboriginal Shire Council">Wujal Wujal Aboriginal Shire Council</SelectItem>
                        <SelectItem value="Yarrabah Aboriginal Shire Council">Yarrabah Aboriginal Shire Council</SelectItem>

                        {/* Western Australia (WA) Councils */}
                        <SelectItem value="WA_HEADER" disabled className="font-extrabold text-slate-900 pointer-events-none bg-slate-50">Western Australia (WA)</SelectItem>
                        <SelectItem value="Albany, City of">Albany, City of</SelectItem>
                        <SelectItem value="Armadale, City of">Armadale, City of</SelectItem>
                        <SelectItem value="Ashburton, Shire of">Ashburton, Shire of</SelectItem>
                        <SelectItem value="Augusta-Margaret River, Shire of">Augusta-Margaret River, Shire of</SelectItem>
                        <SelectItem value="Bassendean, Town of">Bassendean, Town of</SelectItem>
                        <SelectItem value="Bayswater, City of">Bayswater, City of</SelectItem>
                        <SelectItem value="Belmont, City of">Belmont, City of</SelectItem>
                        <SelectItem value="Beverley, Shire of">Beverley, Shire of</SelectItem>
                        <SelectItem value="Boddington, Shire of">Boddington, Shire of</SelectItem>
                        <SelectItem value="Boyup Brook, Shire of">Boyup Brook, Shire of</SelectItem>
                        <SelectItem value="Bridgetown-Greenbushes, Shire of">Bridgetown-Greenbushes, Shire of</SelectItem>
                        <SelectItem value="Brookton, Shire of">Brookton, Shire of</SelectItem>
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
                        <SelectItem value="Cuballing, Shire of">Cuballing, Shire of</SelectItem>
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
                        <SelectItem value="Gingin, Shire of">Gingin, Shire of</SelectItem>
                        <SelectItem value="Gnowangerup, Shire of">Gnowangerup, Shire of</SelectItem>
                        <SelectItem value="Goomalling, Shire of">Goomalling, Shire of</SelectItem>
                        <SelectItem value="Gosnells, City of">Gosnells, City of</SelectItem>
                        <SelectItem value="Halls Creek, Shire of">Halls Creek, Shire of</SelectItem>
                        <SelectItem value="Harvey, Shire of">Harvey, Shire of</SelectItem>
                        <SelectItem value="Irwin, Shire of">Irwin, Shire of</SelectItem>
                        <SelectItem value="Joondalup, City of">Joondalup, City of</SelectItem>
                        <SelectItem value="Kalamunda, City of">Kalamunda, City of</SelectItem>
                        <SelectItem value="Kalgoorlie-Boulder, City of">Kalgoorlie-Boulder, City of</SelectItem>
                        <SelectItem value="Katanning, Shire of">Katanning, Shire of</SelectItem>
                        <SelectItem value="Kellerberrin, Shire of">Kellerberrin, Shire of</SelectItem>
                        <SelectItem value="Kent, Shire of">Kent, Shire of</SelectItem>
                        <SelectItem value="Kojonup, Shire of">Kojonup, Shire of</SelectItem>
                        <SelectItem value="Kondinin, Shire of">Kondinin, Shire of</SelectItem>
                        <SelectItem value="Koorda, Shire of">Koorda, Shire of</SelectItem>
                        <SelectItem value="Kulin, Shire of">Kulin, Shire of</SelectItem>
                        <SelectItem value="Kwinana, City of">Kwinana, City of</SelectItem>
                        <SelectItem value="Lake Grace, Shire of">Lake Grace, Shire of</SelectItem>
                        <SelectItem value="Laverton, Shire of">Laverton, Shire of</SelectItem>
                        <SelectItem value="Leonora, Shire of">Leonora, Shire of</SelectItem>
                        <SelectItem value="Mandurah, City of">Mandurah, City of</SelectItem>
                        <SelectItem value="Manjimup, Shire of">Manjimup, Shire of</SelectItem>
                        <SelectItem value="Meekatharra, Shire of">Meekatharra, Shire of</SelectItem>
                        <SelectItem value="Menzies, Shire of">Menzies, Shire of</SelectItem>
                        <SelectItem value="Merredin, Shire of">Merredin, Shire of</SelectItem>
                        <SelectItem value="Mingenew, Shire of">Mingenew, Shire of</SelectItem>
                        <SelectItem value="Moora, Shire of">Moora, Shire of</SelectItem>
                        <SelectItem value="Morawa, Shire of">Morawa, Shire of</SelectItem>
                        <SelectItem value="Mosman Park, Town of">Mosman Park, Town of</SelectItem>
                        <SelectItem value="Mount Magnet, Shire of">Mount Magnet, Shire of</SelectItem>
                        <SelectItem value="Mount Marshall, Shire of">Mount Marshall, Shire of</SelectItem>
                        <SelectItem value="Mukinbudin, Shire of">Mukinbudin, Shire of</SelectItem>
                        <SelectItem value="Mundaring, Shire of">Mundaring, Shire of</SelectItem>
                        <SelectItem value="Murchison, Shire of">Murchison, Shire of</SelectItem>
                        <SelectItem value="Murray, Shire of">Murray, Shire of</SelectItem>
                        <SelectItem value="Nannup, Shire of">Nannup, Shire of</SelectItem>
                        <SelectItem value="Narembeen, Shire of">Narembeen, Shire of</SelectItem>
                        <SelectItem value="Narrogin, Shire of">Narrogin, Shire of</SelectItem>
                        <SelectItem value="Narrogin, Town of">Narrogin, Town of</SelectItem>
                        <SelectItem value="Nedlands, City of">Nedlands, City of</SelectItem>
                        <SelectItem value="Ngaanyatjarraku, Shire of">Ngaanyatjarraku, Shire of</SelectItem>
                        <SelectItem value="Northam, Shire of">Northam, Shire of</SelectItem>
                        <SelectItem value="Northampton, Shire of">Northampton, Shire of</SelectItem>
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
                        <SelectItem value="Vincent, City of">Vincent, City of</SelectItem>
                        <SelectItem value="Wagin, Shire of">Wagin, Shire of</SelectItem>
                        <SelectItem value="Wandering, Shire of">Wandering, Shire of</SelectItem>
                        <SelectItem value="Wanneroo, City of">Wanneroo, City of</SelectItem>
                        <SelectItem value="Waroona, Shire of">Waroona, Shire of</SelectItem>
                        <SelectItem value="West Arthur, Shire of">West Arthur, Shire of</SelectItem>
                        <SelectItem value="Westonia, Shire of">Westonia, Shire of</SelectItem>
                        <SelectItem value="Wickepin, Shire of">Wickepin, Shire of</SelectItem>
                        <SelectItem value="Williams, Shire of">Williams, Shire of</SelectItem>
                        <SelectItem value="Wiluna, Shire of">Wiluna, Shire of</SelectItem>
                        <SelectItem value="Wongan-Ballidu, Shire of">Wongan-Ballidu, Shire of</SelectItem>
                        <SelectItem value="Woodanilling, Shire of">Woodanilling, Shire of</SelectItem>
                        <SelectItem value="Wyalkatchem, Shire of">Wyalkatchem, Shire of</SelectItem>
                        <SelectItem value="Wyndham-East Kimberley, Shire of">Wyndham-East Kimberley, Shire of</SelectItem>
                        <SelectItem value="Yalgoo, Shire of">Yalgoo, Shire of</SelectItem>
                        <SelectItem value="Yilgarn, Shire of">Yilgarn, Shire of</SelectItem>
                        <SelectItem value="York, Shire of">York, Shire of</SelectItem>

                        {/* South Australia (SA) Councils */}
                        <SelectItem value="SA_HEADER" disabled className="font-extrabold text-slate-900 pointer-events-none bg-slate-50">South Australia (SA)</SelectItem>
                        <SelectItem value="Adelaide City Council">Adelaide City Council</SelectItem>
                        <SelectItem value="Adelaide Hills Council">Adelaide Hills Council</SelectItem>
                        <SelectItem value="Alexandrina Council">Alexandrina Council</SelectItem>
                        <SelectItem value="Barossa Council">Barossa Council</SelectItem>
                        <SelectItem value="Berri Barmera Council">Berri Barmera Council</SelectItem>
                        <SelectItem value="Burnside, City of">Burnside, City of</SelectItem>
                        <SelectItem value="Campbelltown, City of">Campbelltown, City of</SelectItem>
                        <SelectItem value="Ceduna District Council">Ceduna District Council</SelectItem>
                        <SelectItem value="Charles Sturt, City of">Charles Sturt, City of</SelectItem>
                        <SelectItem value="Clare and Gilbert Valleys Council">Clare and Gilbert Valleys Council</SelectItem>
                        <SelectItem value="Cleve District Council">Cleve District Council</SelectItem>
                        <SelectItem value="Coober Pedy District Council">Coober Pedy District Council</SelectItem>
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

                        {/* Tasmania (TAS) Councils */}
                        <SelectItem value="TAS_HEADER" disabled className="font-extrabold text-slate-900 pointer-events-none bg-slate-50">Tasmania (TAS)</SelectItem>
                        <SelectItem value="Break O'Day Council">Break O'Day Council</SelectItem>
                        <SelectItem value="Brighton Council">Brighton Council</SelectItem>
                        <SelectItem value="Burnie City Council">Burnie City Council</SelectItem>
                        <SelectItem value="Central Coast Council">Central Coast Council</SelectItem>
                        <SelectItem value="Central Highlands Council">Central Highlands Council</SelectItem>
                        <SelectItem value="Clarence City Council">Clarence City Council</SelectItem>
                        <SelectItem value="Derwent Valley Council">Derwent Valley Council</SelectItem>
                        <SelectItem value="Devonport City Council">Devonport City Council</SelectItem>
                        <SelectItem value="Dorset Council">Dorset Council</SelectItem>
                        <SelectItem value="Flinders Council">Flinders Council</SelectItem>
                        <SelectItem value="George Town Council">George Town Council</SelectItem>
                        <SelectItem value="Glamorgan–Spring Bay Council">Glamorgan–Spring Bay Council</SelectItem>
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

                        {/* Northern Territory (NT) Councils */}
                        <SelectItem value="NT_HEADER" disabled className="font-extrabold text-slate-900 pointer-events-none bg-slate-50">Northern Territory (NT)</SelectItem>
                        <SelectItem value="Barkly Regional Council">Barkly Regional Council</SelectItem>
                        <SelectItem value="Central Desert Regional Council">Central Desert Regional Council</SelectItem>
                        <SelectItem value="Coomalie Community Government Council">Coomalie Community Government Council</SelectItem>
                        <SelectItem value="Darwin City Council">Darwin City Council</SelectItem>
                        <SelectItem value="East Arnhem Regional Council">East Arnhem Regional Council</SelectItem>
                        <SelectItem value="Katherine Town Council">Katherine Town Council</SelectItem>
                        <SelectItem value="Litchfield Council">Litchfield Council</SelectItem>
                        <SelectItem value="MacDonnell Regional Council">MacDonnell Regional Council</SelectItem>
                        <SelectItem value="Municipal Council of Alice Springs">Municipal Council of Alice Springs</SelectItem>
                        <SelectItem value="Palmerston City Council">Palmerston City Council</SelectItem>
                        <SelectItem value="Roper Gulf Regional Council">Roper Gulf Regional Council</SelectItem>
                        <SelectItem value="Tiwi Islands Regional Council">Tiwi Islands Regional Council</SelectItem>
                        <SelectItem value="Victoria Daly Regional Council">Victoria Daly Regional Council</SelectItem>
                        <SelectItem value="Wagait Shire Council">Wagait Shire Council</SelectItem>
                        <SelectItem value="West Arnhem Regional Council">West Arnhem Regional Council</SelectItem>
                        <SelectItem value="West Daly Regional Council">West Daly Regional Council</SelectItem>
                        <SelectItem value="Unincorporated NT" data-council-item>
                          Unincorporated NT (includes unincorporated areas managed by the NT Government)
                        </SelectItem>
                      </SearchableSelect>
                    </div>
                  </div>
                </div>

                {/* Building Specifications Section */}
                <div className="space-y-6">
                  <div className="border-b border-slate-200 pb-4">
                    <h4 className="text-lg font-semibold text-slate-900 mb-2">Building Specifications</h4>
                    <p className="text-sm text-slate-600">Structural and design characteristics</p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="storeys">Number of Storeys *</Label>
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
                      <Label htmlFor="houseType">House Type</Label>
                      <Select
                        value={uploadForm.houseType}
                        onValueChange={(value) => setUploadForm(prev => ({ ...prev, houseType: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select House Type" />
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

                    <div>
                      <Label htmlFor="totalBuildingHeight">Total Building Height (m)</Label>
                      <Input
                        id="totalBuildingHeight"
                        type="number"
                        min="0"
                        max="1000"
                        step="0.01"
                        value={uploadForm.totalBuildingHeight === 0 ? '' : uploadForm.totalBuildingHeight}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value === '') {
                            setUploadForm(prev => ({ ...prev, totalBuildingHeight: 0 }));
                          } else {
                            const numValue = parseFloat(value);
                            if (!isNaN(numValue) && numValue >= 0 && numValue <= 1000) {
                              setUploadForm(prev => ({ ...prev, totalBuildingHeight: numValue }));
                            }
                          }
                        }}
                        placeholder="e.g., 8.5"
                      />
                    </div>

                    <div>
                      <Label htmlFor="roofPitch">Roof Pitch (degrees)</Label>
                      <div className="relative">
                        <Input
                          id="roofPitch"
                          type="number"
                          min="0"
                          max="35"
                          step="0.1"
                          value={uploadForm.roofPitch}
                          onChange={(e) => {
                            const value = e.target.value;
                            const numValue = parseFloat(value);
                            
                            // Only allow values between 0 and 35, or empty string
                            // Also limit to 1 decimal place to match step="0.1"
                            if (value === '' || (numValue >= 0 && numValue <= 35 && /^\d*\.?\d{0,1}$/.test(value))) {
                              setUploadForm(prev => ({
                                ...prev,
                                roofPitch: value
                              }));
                            }
                          }}
                          placeholder="e.g., 22.5"
                          className="pr-12"
                        />
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                          <span className="text-muted-foreground">°</span>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">Enter value between 0° and 35°</p>
                    </div>

                    <div>
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
                      <Label htmlFor="foundationType">Foundation Type</Label>
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
                  </div>
                </div>

                {/* Site & Plot Details Section */}
                <div className="space-y-6">
                  <div className="border-b border-slate-200 pb-4">
                    <h4 className="text-lg font-semibold text-slate-900 mb-2">Site & Plot Details</h4>
                    <p className="text-sm text-slate-600">Land specifications and site characteristics</p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="lotSizeRange">Lot Size Range (m²)</Label>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label htmlFor="lotSizeMin" className="text-xs text-slate-600">Min</Label>
                          <Input
                            id="lotSizeMin"
                            type="number"
                            min="0"
                            max="10000"
                            value={uploadForm.lotSizeMin}
                            onChange={(e) => setUploadForm(prev => ({ ...prev, lotSizeMin: e.target.value }))}
                            placeholder="0"
                          />
                        </div>
                        <div>
                          <Label htmlFor="lotSizeMax" className="text-xs text-slate-600">Max</Label>
                          <Input
                            id="lotSizeMax"
                            type="number"
                            min="0"
                            max="10000"
                            value={uploadForm.lotSizeMax}
                            onChange={(e) => setUploadForm(prev => ({ ...prev, lotSizeMax: e.target.value }))}
                            placeholder="10000"
                          />
                        </div>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">Select range from 0 to 10,000 m²</p>
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
                          <SelectItem value="North-East Facing">North-East Facing</SelectItem>
                          <SelectItem value="East Facing">East Facing</SelectItem>
                          <SelectItem value="South-East Facing">South-East Facing</SelectItem>
                          <SelectItem value="South Facing">South Facing</SelectItem>
                          <SelectItem value="South-West Facing">South-West Facing</SelectItem>
                          <SelectItem value="West Facing">West Facing</SelectItem>
                          <SelectItem value="North-West Facing">North-West Facing</SelectItem>
                          <SelectItem value="Any Orientation">Any Orientation</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

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
                  </div>
                </div>

                {/* Room Configuration Section */}
                <div className="space-y-6">
                  <div className="border-b border-slate-200 pb-4">
                    <h4 className="text-lg font-semibold text-slate-900 mb-2">Room Configuration</h4>
                    <p className="text-sm text-slate-600">Interior layout and room specifications</p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <Label htmlFor="bedrooms">Bedrooms</Label>
                      <Input
                        id="bedrooms"
                        type="number"
                        min="0"
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
                        value={uploadForm.livingAreas}
                        onChange={(e) => setUploadForm(prev => ({ ...prev, livingAreas: e.target.value }))}
                        placeholder="1"
                      />
                    </div>
                  </div>
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
                          checked={uploadForm.outdoorFeatures.includes(feature)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setUploadForm(prev => ({
                                ...prev,
                                outdoorFeatures: [...prev.outdoorFeatures, feature]
                              }));
                            } else {
                              setUploadForm(prev => ({
                                ...prev,
                                outdoorFeatures: prev.outdoorFeatures.filter(f => f !== feature)
                              }));
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
                          checked={uploadForm.indoorFeatures.includes(feature)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setUploadForm(prev => ({
                                ...prev,
                                indoorFeatures: [...prev.indoorFeatures, feature]
                              }));
                            } else {
                              setUploadForm(prev => ({
                                ...prev,
                                indoorFeatures: prev.indoorFeatures.filter(f => f !== feature)
                              }));
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

                {/* Additional Information Section */}
                <div className="space-y-6">
                  <div className="border-b border-slate-200 pb-4">
                    <h4 className="text-lg font-semibold text-slate-900 mb-2">Additional Information</h4>
                    <p className="text-sm text-slate-600">Detailed description and notes</p>
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
                </div>

                  <div className="flex justify-end space-x-4">
                    <Button type="button" variant="outline">
                      Cancel
                    </Button>
                    <Button type="button" onClick={handleUpload} disabled={uploadMutation.isPending}>
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
                          <TableHead>Indoor Features</TableHead>
                          <TableHead>Outdoor Features</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Downloads</TableHead>
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
                              <div className="flex flex-wrap gap-1">
                                {plan.indoorFeatures && plan.indoorFeatures.length > 0 ? (
                                  plan.indoorFeatures.slice(0, 2).map((feature, index) => (
                                    <span key={index} className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                                      {feature}
                                    </span>
                                  ))
                                ) : (
                                  <span className="text-slate-400 text-sm">None</span>
                                )}
                                {plan.indoorFeatures && plan.indoorFeatures.length > 2 && (
                                  <span className="text-slate-500 text-xs">+{plan.indoorFeatures.length - 2}</span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-1">
                                {plan.outdoorFeatures && plan.outdoorFeatures.length > 0 ? (
                                  plan.outdoorFeatures.slice(0, 2).map((feature, index) => (
                                    <span key={index} className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                                      {feature}
                                    </span>
                                  ))
                                ) : (
                                  <span className="text-slate-400 text-sm">None</span>
                                )}
                                {plan.outdoorFeatures && plan.outdoorFeatures.length > 2 && (
                                  <span className="text-slate-500 text-xs">+{plan.outdoorFeatures.length - 2}</span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant={plan.status === 'active' ? 'default' : 'secondary'}>
                                {plan.status}
                              </Badge>
                            </TableCell>
                            <TableCell>{plan.downloadCount || 0}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end space-x-2">
                                {/* View Details Dialog */}
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button variant="outline" size="sm">
                                      <Eye className="w-4 h-4" />
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
                                    <DialogHeader>
                                      <DialogTitle>{plan.title}</DialogTitle>
                                      <DialogDescription>
                                        View detailed information about this plan
                                      </DialogDescription>
                                    </DialogHeader>
                                    <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
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
                                        <strong>Lot Size Min (m²):</strong> {plan.lotSizeMin || 'N/A'}
                                      </div>
                                      <div>
                                        <strong>Lot Size Max (m²):</strong> {plan.lotSizeMax || 'N/A'}
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
                                        <strong>Total Building Height (m):</strong> {plan.totalBuildingHeight || 'N/A'}
                                      </div>
                                      <div>
                                        <strong>Roof Pitch (°):</strong> {plan.roofPitch || 'N/A'}
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
                                        <strong>File Name:</strong> {plan.fileName || 'N/A'}
                                      </div>
                                      <div>
                                        <strong>Downloads:</strong> {plan.downloadCount || 0}
                                      </div>
                                      <div>
                                        <strong>Status:</strong>
                                        <Badge variant={plan.status === 'active' ? 'default' : 'secondary'} className="ml-2">
                                          {plan.status}
                                        </Badge>
                                      </div>
                                      <div>
                                        <strong>Created:</strong> {plan.createdAt ? new Date(plan.createdAt).toLocaleDateString() : 'N/A'}
                                      </div>
                                      <div>
                                        <strong>Updated:</strong> {plan.updatedAt ? new Date(plan.updatedAt).toLocaleDateString() : 'N/A'}
                                      </div>
                                    </div>
                                    
                                    {/* Outdoor Features */}
                                    {plan.outdoorFeatures && plan.outdoorFeatures.length > 0 && (
                                      <div className="mt-4">
                                        <strong>Outdoor Features:</strong>
                                        <div className="flex flex-wrap gap-1 mt-1">
                                          {plan.outdoorFeatures.map((feature, index) => (
                                            <span key={index} className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                                              {feature}
                                            </span>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                    
                                    {/* Indoor Features */}
                                    {plan.indoorFeatures && plan.indoorFeatures.length > 0 && (
                                      <div className="mt-4">
                                        <strong>Indoor Features:</strong>
                                        <div className="flex flex-wrap gap-1 mt-1">
                                          {plan.indoorFeatures.map((feature, index) => (
                                            <span key={index} className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                                              {feature}
                                            </span>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                    {plan.description && (
                                      <div className="mt-4">
                                        <strong>Description:</strong>
                                        <p className="mt-1 text-slate-600">{plan.description}</p>
                                      </div>
                                    )}
                                    </div>
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
      <DialogContent className="max-w-7xl h-[35vh] p-0">
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
