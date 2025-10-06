import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Eye, Download, Home, Compass, MapPin, ChevronLeft, ChevronRight, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import apiClient from "@/setupAxios";
import type { IPlan } from "@shared/schema";
import { AxiosError } from "axios";

// Extend IPlan with the new properties until TypeScript server picks up the schema changes
interface ExtendedPlan extends IPlan {
  plotLengthMin?: number;
  plotLengthMax?: number;
}

interface PlanCardProps {
  plan: ExtendedPlan;
}

export default function PlanCard({ plan }: PlanCardProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDownloading, setIsDownloading] = useState(false);
  const [isImageLightboxOpen, setIsImageLightboxOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Prepare lightbox images
  const lightboxImages = plan.images && Array.isArray(plan.images) 
    ? plan.images
        .filter(img => img?.fileId)
        .map(img => `/api/plans/${plan.id}/images/${img.fileId}`)
    : [];

  const downloadMutation = useMutation({
    mutationFn: async () => {
      // Use fetch with blob to force custom filename
      const response = await fetch(`/api/plans/${plan.id}/download`);
      if (!response.ok) {
        throw new Error('Download failed');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${plan.title}.pdf`; // Force custom name
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

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
    <>
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <div className="w-full h-48 bg-slate-200 flex items-center justify-center overflow-hidden">
        {plan.images && plan.images.length > 0 && plan.images[0].fileId ? (
          <img 
            src={`/api/plans/${plan.id}/images/${plan.images[0].fileId}`}
            alt={plan.title || "Plan image"}
            className="w-full h-full object-cover"
            onError={(e) => {
              // Fallback to placeholder if image fails to load
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              target.parentElement!.innerHTML = '<div class="w-16 h-16 text-slate-400"><svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9,22 9,12 15,12 15,22"/></svg></div>';
            }}
          />
        ) : (
          <Home className="w-16 h-16 text-slate-400" />
        )}
      </div>
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-3">
          <h4 className="font-semibold text-slate-900">{plan.jobAddress || "No Address"}</h4>
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

          {plan.orientation && (
            <div className="flex items-center text-sm text-slate-600">
              <Compass className="w-4 h-4 mr-2" />
              <span>{plan.orientation}</span>
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
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
              <DialogHeader>
                <DialogTitle>Plan Preview - {plan.jobAddress || "No Address"}</DialogTitle>
              </DialogHeader>
              <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
                {/* Plan Images */}
                <div className="w-full h-48 bg-slate-200 rounded-lg flex items-center justify-center mb-4 overflow-hidden relative group">
                  {plan.images && plan.images.length > 0 && plan.images[0].fileId ? (
                    <>
                      <img 
                        src={`/api/plans/${plan.id}/images/${plan.images[0].fileId}`}
                        alt={plan.title || "Plan image"}
                        className="w-full h-full object-cover rounded-lg cursor-pointer transition-opacity hover:opacity-90"
                        onClick={() => {
                          setCurrentImageIndex(0);
                          setIsImageLightboxOpen(true);
                        }}
                        onError={(e) => {
                          // Fallback to placeholder if image fails to load
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          target.parentElement!.innerHTML = '<div class="w-16 h-16 text-slate-400 flex items-center justify-center"><svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9,22 9,12 15,12 15,22"/></svg></div>';
                        }}
                      />
                      {/* Image count overlay */}
                      {(plan.images?.length || 0) > 1 && (
                        <div className="absolute bottom-2 right-2 bg-black/60 text-white px-2 py-1 rounded text-sm">
                          {plan.images?.length || 0} image{(plan.images?.length || 0) !== 1 ? 's' : ''} • Click to view all
                        </div>
                      )}
                    </>
                  ) : (
                    <Home className="w-16 h-16 text-slate-400" />
                  )}
                </div>
                


                {/* Plan Details Section */}
                <div className="p-4 bg-slate-50 rounded-lg">
                  <h4 className="font-semibold text-slate-900 mb-2">Plan Details</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div><strong>Plan Title:</strong> {plan.title || "N/A"}</div>
                    <div><strong>Plan Type:</strong> {plan.planType || "N/A"}</div>
                    <div><strong>Storeys:</strong> {plan.storeys}</div>
                    <div><strong>Bedrooms:</strong> {plan.bedrooms || "N/A"}</div>
                    <div><strong>Toilets/Bathrooms:</strong> {plan.toilets || "N/A"}</div>
                    <div><strong>Living Areas:</strong> {plan.livingAreas || "N/A"}</div>
                    <div><strong>Number of Units:</strong> {plan.numberOfUnits || "N/A"}</div>
                    <div><strong>House Type:</strong> {plan.houseType || "N/A"}</div>
                    <div><strong>Lot Size Min (m²):</strong> {plan.lotSizeMin || "N/A"}</div>
                    <div><strong>Lot Size Max (m²):</strong> {plan.lotSizeMax || "N/A"}</div>
                    <div><strong>Orientation:</strong> {plan.orientation || "N/A"}</div>
                    <div><strong>Plot Length Min (m):</strong> {plan.plotLengthMin || "N/A"}</div>
                    <div><strong>Plot Length Max (m):</strong> {plan.plotLengthMax || "N/A"}</div>
                    <div><strong>Plot Width (m):</strong> {plan.plotWidth || "N/A"}</div>
                    <div><strong>Covered Area (sq.m):</strong> {plan.coveredArea || "N/A"}</div>
                    <div><strong>Total Building Height (m):</strong> {plan.totalBuildingHeight || "N/A"}</div>
                    <div><strong>Roof Pitch (°):</strong> {plan.roofPitch || "N/A"}</div>
                    <div><strong>Road Position:</strong> {plan.roadPosition || "N/A"}</div>
                    <div><strong>Site Type:</strong> {plan.siteType || "N/A"}</div>
                    <div><strong>Foundation:</strong> {plan.foundationType || "N/A"}</div>
                    <div><strong>Construction Type:</strong> {Array.isArray(plan.constructionType) ? plan.constructionType.join(", ") : plan.constructionType || "N/A"}</div>
                    <div><strong>Builder/Designer:</strong> {plan.builderName || "N/A"}</div>
                    <div><strong>Job Address:</strong> {plan.jobAddress || "N/A"}</div>
                    <div><strong>Council Area:</strong> {plan.councilArea || "N/A"}</div>
                    <div><strong>File Name:</strong> {plan.fileName || "N/A"}</div>
                    <div><strong>File Size:</strong> {plan.fileSize ? `${(plan.fileSize / 1024 / 1024).toFixed(2)} MB` : "N/A"}</div>
                    <div><strong>Downloads:</strong> {plan.downloadCount || 0}</div>
                    <div><strong>Status:</strong> {plan.status || "N/A"}</div>
                    <div><strong>Uploaded By:</strong> {plan.uploadedBy ? "Admin" : "N/A"}</div>
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

    {/* Image Lightbox */}
    <Dialog open={isImageLightboxOpen} onOpenChange={setIsImageLightboxOpen}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] w-full h-full p-0 bg-black/95 border-0">
        <div className="relative w-full h-full flex items-center justify-center min-h-[80vh]">
          {/* Close Button */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 z-50 text-white bg-black/40 hover:bg-black/60 border border-white/20 hover:border-white/40 shadow-lg backdrop-blur-sm"
            onClick={() => setIsImageLightboxOpen(false)}
          >
            <X className="w-6 h-6" />
          </Button>

          {/* Navigation Buttons */}
          {lightboxImages.length > 1 && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-4 top-1/2 -translate-y-1/2 z-50 text-white bg-black/40 hover:bg-black/60 border border-white/20 hover:border-white/40 shadow-lg backdrop-blur-sm"
                onClick={() => setCurrentImageIndex(prev => prev > 0 ? prev - 1 : lightboxImages.length - 1)}
              >
                <ChevronLeft className="w-8 h-8" />
              </Button>
              
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-4 top-1/2 -translate-y-1/2 z-50 text-white bg-black/40 hover:bg-black/60 border border-white/20 hover:border-white/40 shadow-lg backdrop-blur-sm"
                onClick={() => setCurrentImageIndex(prev => prev < lightboxImages.length - 1 ? prev + 1 : 0)}
              >
                <ChevronRight className="w-8 h-8" />
              </Button>
            </>
          )}

          {/* Main Image */}
          <div className="w-full h-full flex items-center justify-center p-4">
            {lightboxImages[currentImageIndex] && (
              <img
                src={lightboxImages[currentImageIndex]}
                alt={`Plan image ${currentImageIndex + 1}`}
                className="max-w-[calc(100vw-8rem)] max-h-[calc(100vh-12rem)] w-auto h-auto object-contain"
                style={{ maxWidth: '100%', maxHeight: '100%' }}
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5YTNhZiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlIG5vdCBmb3VuZDwvdGV4dD48L3N2Zz4=';
                }}
              />
            )}
          </div>

          {/* Image Counter */}
          {lightboxImages.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-50">
              <div className="bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                {currentImageIndex + 1} / {lightboxImages.length}
              </div>
            </div>
          )}

          {/* Thumbnail Strip */}
          {lightboxImages.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-50 mb-8">
              <div className="flex space-x-2 bg-black/50 p-2 rounded-lg max-w-md overflow-x-auto">
                {lightboxImages.map((imageUrl, index) => (
                  <button
                    key={index}
                    className={`flex-shrink-0 w-12 h-12 rounded overflow-hidden border-2 transition-all shadow-lg ${
                      index === currentImageIndex ? 'border-white shadow-white/50' : 'border-white/30 opacity-60 hover:opacity-80 hover:border-white/50'
                    }`}
                    onClick={() => setCurrentImageIndex(index)}
                  >
                    <img
                      src={imageUrl}
                      alt={`Thumbnail ${index + 1}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iI2YzZjRmNiIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTAiIGZpbGw9IiM5OWEzYWYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5OL0E8L3RleHQ+PC9zdmc+';
                      }}
                    />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
}
