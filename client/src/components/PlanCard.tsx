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
      // Create direct download link
      const link = document.createElement('a');
      link.href = `/api/plans/${plan._id}/download`;
      link.download = `${plan.title || 'plan'}.pdf`;
      link.target = '_blank'; // Open in new tab as fallback

      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      return Promise.resolve();
    },
    onError: (error: any) => {
      console.error('Download error:', error);
      toast({
        title: "Download Failed",
        description: error.response?.data?.message || "Failed to download PDF. Please try again.",
        variant: "destructive",
      });
    },
    onSuccess: () => {
      toast({
        title: "Download Started",
        description: `${plan.title} is downloading to your Downloads folder.`,
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
              {plan.storeys} Storey{String(plan.storeys) !== "1" ? "s" : ""}
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
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden">
              <DialogHeader>
                <DialogTitle>Plan Preview - {plan.title}</DialogTitle>
              </DialogHeader>
              <div className="overflow-y-auto max-h-[calc(80vh-120px)]">
                {/* Plan Image Placeholder */}
                <div className="w-full h-48 bg-slate-200 rounded-lg flex items-center justify-center mb-4">
                  <Home className="w-16 h-16 text-slate-400" />
                </div>

                {/* Plan Details Section */}
                <div className="p-4 bg-slate-50 rounded-lg">
                  <h4 className="font-semibold text-slate-900 mb-2">Plan Details</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div><strong>Plan Type:</strong> {plan.planType || "N/A"}</div>
                    <div><strong>Storeys:</strong> {plan.storeys}</div>
                    <div><strong>Bedrooms:</strong> {plan.bedrooms || "N/A"}</div>
                    <div><strong>Toilets:</strong> {plan.toilets || "N/A"}</div>
                    <div><strong>Living Areas:</strong> {plan.livingAreas || "N/A"}</div>
                    <div><strong>House Type:</strong> {plan.houseType || "N/A"}</div>
                    <div><strong>Lot Size:</strong> {plan.lotSize || "N/A"}</div>
                    <div><strong>Orientation:</strong> {plan.orientation || "N/A"}</div>
                    <div><strong>Plot Length (m):</strong> {plan.plotLength || "N/A"}</div>
                    <div><strong>Plot Width (m):</strong> {plan.plotWidth || "N/A"}</div>
                    <div><strong>Covered Area (sq.m):</strong> {plan.coveredArea || "N/A"}</div>
                    <div><strong>Road Position:</strong> {plan.roadPosition || "N/A"}</div>
                    <div><strong>Site Type:</strong> {plan.siteType || "N/A"}</div>
                    <div><strong>Foundation:</strong> {plan.foundationType || "N/A"}</div>
                    <div><strong>Construction Type:</strong> {Array.isArray(plan.constructionType) ? plan.constructionType.join(", ") : plan.constructionType || "N/A"}</div>
                    <div><strong>Builder/Designer:</strong> {plan.builderName || "N/A"}</div>
                    <div><strong>Council Area:</strong> {plan.councilArea || "N/A"}</div>
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
            onClick={() => {
              setIsDownloading(true);
              downloadMutation.mutate();
            }}
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
