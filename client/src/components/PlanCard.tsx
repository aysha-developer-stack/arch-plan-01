import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Eye, Download, Home, Compass, MapPin } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Plan } from "@shared/schema";

interface PlanCardProps {
  plan: Plan;
}

export default function PlanCard({ plan }: PlanCardProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDownloading, setIsDownloading] = useState(false);

  const downloadMutation = useMutation({
    mutationFn: async () => {
      setIsDownloading(true);
      const response = await fetch(`/api/plans/${plan.id}/download`);
      if (!response.ok) {
        throw new Error("Failed to download plan");
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = plan.fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    },
    onSuccess: () => {
      toast({
        title: "Download Started",
        description: "Your plan is being downloaded.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/plans/search"] });
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
              {plan.storeys} Storey{plan.storeys !== 1 ? "s" : ""} •{" "}
              {plan.bedrooms ? `${plan.bedrooms} Bedrooms` : "N/A"} •{" "}
              {plan.bathrooms ? `${plan.bathrooms} Bathrooms` : "N/A"}
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
                    <div><strong>Bedrooms:</strong> {plan.bedrooms || "N/A"}</div>
                    <div><strong>Bathrooms:</strong> {plan.bathrooms || "N/A"}</div>
                    <div><strong>Storeys:</strong> {plan.storeys}</div>
                    <div><strong>Lot Size:</strong> {plan.lotSize || "N/A"}</div>
                    <div><strong>Orientation:</strong> {plan.orientation || "N/A"}</div>
                    <div><strong>Foundation:</strong> {plan.foundationType || "N/A"}</div>
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
