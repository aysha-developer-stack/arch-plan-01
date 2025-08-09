import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Eye, Download, Home, Compass, MapPin } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import apiClient from "@/setupAxios";
import type { PlanType } from "@shared/schema";
import { AxiosError } from "axios";

interface PlanCardProps {
  plan: PlanType;
}

export default function PlanCard({ plan }: PlanCardProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDownloading, setIsDownloading] = useState(false);

  const downloadMutation = useMutation({
    mutationFn: async () => {
      console.log('=== DOWNLOAD DEBUG START ===');
      console.log('Starting download for plan:', plan);
      console.log('Plan ID:', plan._id);
      console.log('Plan fileName:', plan.fileName);
      console.log('Plan filePath:', plan.filePath);
      console.log('Request URL:', `/api/plans/${plan._id}/download`);
      console.log('=== DOWNLOAD DEBUG END ===');
      
      setIsDownloading(true);
      
      try {
        const response = await apiClient.get(`/api/plans/${plan._id}/download`, {
          responseType: 'blob',
        });
        
        console.log('Download response status:', response.status);
        console.log('Download response headers:', response.headers);
        console.log('Response data:', response.data);
        console.log('Response data type:', typeof response.data);
        console.log('Response data size:', response.data.size);
        console.log('Response data constructor:', response.data.constructor.name);
        
        // Verify response data exists and is not empty
        if (!response.data) {
          throw new Error("No data received from server");
        }

        // Check if the response is actually an error JSON disguised as a blob
        const contentType = response.headers['content-type'] || '';
        if (contentType.includes('application/json') || response.data.size < 1000) {
          // Likely an error response, try to parse it
          try {
            const text = await response.data.text();
            const errorData = JSON.parse(text);
            if (errorData.message) {
              // This is an error response from the backend
              throw new Error(errorData.message + (errorData.details?.solution ? ` - ${errorData.details.solution}` : ''));
            }
          } catch (parseError) {
            // If we can't parse it, it might still be a valid small PDF
            console.log('Could not parse as JSON, treating as PDF:', parseError);
          }
        }
        
        // Create blob URL and trigger download
        const blob = new Blob([response.data], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);
        
        // Create temporary download link and trigger download
        const link = document.createElement('a');
        link.href = url;
        link.download = plan.fileName || 'plan.pdf';
        document.body.appendChild(link);
        link.click();
        
        // Cleanup
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        console.log('Download triggered successfully for:', plan.fileName);
        
        return response.data;
        
      } catch (error) {
        console.error('Download error:', error);
        
        // Type guard to check if error is an AxiosError
        if (error instanceof AxiosError) {
          if (error.response?.status === 404) {
            throw new Error("Plan file not found on server");
          } else if (error.response?.status === 500) {
            throw new Error("Server error while downloading plan");
          } else {
            throw new Error("Failed to download plan: " + (error.message || "Unknown error"));
          }
        } else {
          // Handle non-Axios errors
          const errorMessage = error instanceof Error ? error.message : "Unknown error";
          throw new Error("Failed to download plan: " + errorMessage);
        }
      } finally {
        setIsDownloading(false);
      }
    },
    onSuccess: () => {
      toast({
        title: "Download Started",
        description: "Your plan is being downloaded.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/plans/search"] });
      queryClient.invalidateQueries({ queryKey: ["/api/plans/total-downloads"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users/me/downloads"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Download Failed",
        description: error.message,
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsDownloading(false);
    },
  });

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <div className="w-full h-48 bg-slate-200 flex items-center justify-center">
        <Home className="w-16 h-16 text-slate-400" />
      </div>
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-3">
          <h4 className="font-semibold text-slate-900">{plan.title}</h4>
          <Badge variant={plan.status === "active" ? "default" : "secondary"}>
            {plan.status}
          </Badge>
        </div>
        
        <div className="space-y-2 mb-4">
          <div className="flex items-center text-sm text-slate-600">
            <Home className="w-4 h-4 mr-2" />
            <span>
              {plan.storeys} Storey{plan.storeys !== 1 ? "s" : ""}
            </span>
          </div>
          
          {(plan.orientation || plan.lotSize) && (
            <div className="flex items-center text-sm text-slate-600">
              <Compass className="w-4 h-4 mr-2" />
              <span>
                {plan.orientation && `${plan.orientation}`}
                {plan.orientation && plan.lotSize && " • "}
                {plan.lotSize && `${plan.lotSize} Lot`}
              </span>
            </div>
          )}
          
          {plan.councilArea && (
            <div className="flex items-center text-sm text-slate-600">
              <MapPin className="w-4 h-4 mr-2" />
              <span>{plan.councilArea}</span>
            </div>
          )}
        </div>
        
        <div className="flex space-x-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="default" size="sm" className="flex-1">
                <Eye className="w-4 h-4 mr-2" />
                Preview
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh]">
              <DialogHeader>
                <DialogTitle>Plan Preview - {plan.title}</DialogTitle>
              </DialogHeader>
              <div className="overflow-y-auto">
                <div className="w-full h-96 bg-slate-200 rounded-lg flex items-center justify-center mb-4">
                  <Home className="w-24 h-24 text-slate-400" />
                </div>
                <div className="p-4 bg-slate-50 rounded-lg">
                  <h4 className="font-semibold text-slate-900 mb-2">Plan Details</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div key="storeys"><strong>Storeys:</strong> {plan.storeys}</div>
                    <div key="lotSize"><strong>Lot Size:</strong> {plan.lotSize || "N/A"}</div>
                    <div key="orientation"><strong>Orientation:</strong> {plan.orientation || "N/A"}</div>
                    <div key="foundation"><strong>Foundation:</strong> {plan.foundationType || "N/A"}</div>
                  </div>
                  {plan.description && (
                    <div className="mt-4">
                      <strong>Description:</strong>
                      <p className="mt-1 text-slate-600">{plan.description}</p>
                    </div>
                  )}
                </div>
              </div>
            </DialogContent>
          </Dialog>
          
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => downloadMutation.mutate()}
            disabled={isDownloading}
          >
            <Download className="w-4 h-4 mr-2" />
            {isDownloading ? "Downloading..." : "Download"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
