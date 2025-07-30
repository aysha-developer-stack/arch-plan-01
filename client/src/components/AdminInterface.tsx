import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  BarChart3, 
  FileText, 
  Upload, 
  Users, 
  TrendingUp, 
  Download,
  HardDrive,
  Eye,
  Edit,
  Trash2,
  CloudUpload
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import type { Plan } from "@shared/schema";

interface AdminStats {
  totalPlans: number;
  totalDownloads: number;
  recentUploads: number;
}

interface UploadFormData {
  title: string;
  description: string;
  planType: string;
  bedrooms: string;
  bathrooms: string;
  storeys: string;
  lotSize: string;
  orientation: string;
  siteType: string;
  foundationType: string;
  councilArea: string;
  file: File | null;
}

export default function AdminInterface() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [uploadForm, setUploadForm] = useState<UploadFormData>({
    title: "",
    description: "",
    planType: "",
    bedrooms: "",
    bathrooms: "",
    storeys: "",
    lotSize: "",
    orientation: "",
    siteType: "",
    foundationType: "",
    councilArea: "",
    file: null,
  });

  // Fetch admin stats
  const { data: stats } = useQuery<AdminStats>({
    queryKey: ["/api/admin/stats"],
    retry: false,
  });

  // Fetch admin plans
  const { data: plans = [], isLoading: plansLoading } = useQuery<Plan[]>({
    queryKey: ["/api/admin/plans"],
    retry: false,
  });

  // Upload plan mutation
  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      return await apiRequest("POST", "/api/admin/plans", formData);
    },
    onSuccess: () => {
      toast({
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
        bedrooms: "",
        bathrooms: "",
        storeys: "",
        lotSize: "",
        orientation: "",
        siteType: "",
        foundationType: "",
        councilArea: "",
        file: null,
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
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
      toast({
        title: "Success",
        description: "Plan deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/plans"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Delete Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleUpload = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!uploadForm.file) {
      toast({
        title: "Error",
        description: "Please select a PDF file to upload",
        variant: "destructive",
      });
      return;
    }

    const formData = new FormData();
    Object.entries(uploadForm).forEach(([key, value]) => {
      if (key === "file" && value) {
        formData.append(key, value);
      } else if (key !== "file" && value) {
        formData.append(key, value.toString());
      }
    });

    uploadMutation.mutate(formData);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === "application/pdf") {
      setUploadForm(prev => ({ ...prev, file }));
    } else {
      toast({
        title: "Invalid File",
        description: "Please select a PDF file",
        variant: "destructive",
      });
    }
  };

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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
                          {stats?.totalDownloads || 0}
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

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-slate-600 mb-1">Storage Used</p>
                        <p className="text-2xl font-bold text-slate-900">1.2TB</p>
                      </div>
                      <div className="bg-orange-100 p-3 rounded-lg">
                        <HardDrive className="text-orange-600 text-xl" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Manage Plans */}
            <TabsContent value="manage" className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-2">Manage Plans</h3>
                  <p className="text-slate-600">View, edit, and organize your architectural plans</p>
                </div>
              </div>

              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Plan Name</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Downloads</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {plansLoading ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8">
                            Loading plans...
                          </TableCell>
                        </TableRow>
                      ) : plans.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8">
                            No plans found
                          </TableCell>
                        </TableRow>
                      ) : (
                        plans.map((plan) => (
                          <TableRow key={plan.id}>
                            <TableCell>
                              <div>
                                <p className="font-medium text-slate-900">{plan.title}</p>
                                <p className="text-sm text-slate-600">
                                  {plan.bedrooms ? `${plan.bedrooms} bed` : "N/A"}, {plan.bathrooms ? `${plan.bathrooms} bath` : "N/A"}, {plan.storeys} storey
                                </p>
                              </div>
                            </TableCell>
                            <TableCell className="text-slate-600">{plan.planType}</TableCell>
                            <TableCell className="text-slate-600">{plan.downloadCount}</TableCell>
                            <TableCell>
                              <Badge variant={plan.status === "active" ? "default" : "secondary"}>
                                {plan.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-2">
                                <Button variant="ghost" size="sm">
                                  <Eye className="w-4 h-4" />
                                </Button>
                                <Button variant="ghost" size="sm">
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => deleteMutation.mutate(plan.id)}
                                  disabled={deleteMutation.isPending}
                                >
                                  <Trash2 className="w-4 h-4 text-red-600" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
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
                        <Label htmlFor="bedrooms">Number of Bedrooms</Label>
                        <Select
                          value={uploadForm.bedrooms}
                          onValueChange={(value) => setUploadForm(prev => ({ ...prev, bedrooms: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select Bedrooms" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">1 Bedroom</SelectItem>
                            <SelectItem value="2">2 Bedrooms</SelectItem>
                            <SelectItem value="3">3 Bedrooms</SelectItem>
                            <SelectItem value="4">4 Bedrooms</SelectItem>
                            <SelectItem value="5">5+ Bedrooms</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="bathrooms">Number of Bathrooms</Label>
                        <Select
                          value={uploadForm.bathrooms}
                          onValueChange={(value) => setUploadForm(prev => ({ ...prev, bathrooms: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select Bathrooms" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">1 Bathroom</SelectItem>
                            <SelectItem value="1.5">1.5 Bathrooms</SelectItem>
                            <SelectItem value="2">2 Bathrooms</SelectItem>
                            <SelectItem value="2.5">2.5 Bathrooms</SelectItem>
                            <SelectItem value="3">3+ Bathrooms</SelectItem>
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
          </Tabs>
        </div>
      </div>
    </div>
  );
}
