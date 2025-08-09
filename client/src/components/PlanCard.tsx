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
      console.log('🚀 Starting download for plan:', plan.fileName);
      setIsDownloading(true);
      
      try {
        const response = await apiClient.get(`/api/plans/${plan._id}/download`, {
          responseType: 'blob',
        });
        
        console.log('Download response status:', response.status);
        console.log('Download response headers:', response.headers);
        console.log('Response data size:', response.data.size);
        
        // Check if response is not OK or if content-type indicates an error
        if (!response.status || response.status >= 400) {
          throw new Error(`Server error: ${response.status}`);
        }
        
        const contentType = response.headers['content-type'] || '';
        
        // If content-type is JSON, it's an error response - read as text
        if (contentType.includes('application/json') || contentType.includes('text/html')) {
          console.log('Error response detected (JSON/HTML content-type)');
          const errorText = await response.data.text();
          console.log('Error response text:', errorText);
          
          try {
            const errorData = JSON.parse(errorText);
            throw new Error(errorData.message || 'Server returned an error');
          } catch (parseError) {
            throw new Error('Server returned an error response');
          }
        }
        
        // Verify we have data
        if (!response.data || response.data.size === 0) {
          throw new Error("No data received from server");
        }
        
        // For very small responses that might be JSON errors disguised as blobs
        if (response.data.size < 1000 && !contentType.includes('application/pdf')) {
          console.log('Very small response detected, checking if it\'s an error...');
          const clonedBlob = response.data.slice();
          const text = await clonedBlob.text();
          
          try {
            const parsed = JSON.parse(text);
            if (parsed.message || parsed.error) {
              throw new Error(parsed.message || parsed.error || 'Server returned an error');
            }
          } catch (parseError) {
            // If it's not JSON, continue with download
            console.log('Small response is not JSON, proceeding with download');
          }
        }
        
        // Create download link and trigger download
        const url = window.URL.createObjectURL(response.data);
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
