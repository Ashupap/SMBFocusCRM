import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import DealForm from "@/components/deals/deal-form";
import DealCard from "@/components/deals/deal-card";
import { Plus } from "lucide-react";
import type { PipelineStage, Deal } from "@shared/schema";

interface SalesPipelineProps {
  showActions?: boolean;
}

export default function SalesPipeline({ showActions = false }: SalesPipelineProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedPeriod, setSelectedPeriod] = useState("This Month");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const { data: pipeline, isLoading } = useQuery<PipelineStage[]>({
    queryKey: ["/api/dashboard/pipeline"],
    retry: false,
  });

  const updateDealMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      return await apiRequest("PUT", `/api/deals/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/pipeline"] });
      queryClient.invalidateQueries({ queryKey: ["/api/deals"] });
      toast({
        title: "Success",
        description: "Deal updated successfully",
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
        title: "Error",
        description: "Failed to update deal",
        variant: "destructive",
      });
    },
  });

  const handleDealMove = (dealId: string, newStage: string) => {
    updateDealMutation.mutate({
      id: dealId,
      data: { stage: newStage },
    });
  };

  const handleCreateSuccess = () => {
    setIsCreateDialogOpen(false);
    queryClient.invalidateQueries({ queryKey: ["/api/dashboard/pipeline"] });
    queryClient.invalidateQueries({ queryKey: ["/api/deals"] });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Sales Pipeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse">
            <div className="grid grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="space-y-3">
                  <div className="h-6 bg-muted rounded"></div>
                  <div className="space-y-2">
                    <div className="h-20 bg-muted rounded"></div>
                    <div className="h-20 bg-muted rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Sales Pipeline</CardTitle>
          <div className="flex items-center space-x-3">
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-32" data-testid="select-pipeline-period">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="This Month">This Month</SelectItem>
                <SelectItem value="Last Month">Last Month</SelectItem>
                <SelectItem value="This Quarter">This Quarter</SelectItem>
              </SelectContent>
            </Select>
            
            {showActions && (
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" data-testid="button-add-deal-pipeline">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Deal
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>Create New Deal</DialogTitle>
                  </DialogHeader>
                  <DealForm onSuccess={handleCreateSuccess} />
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="grid grid-cols-4 gap-4">
          {pipeline?.map((stage) => (
            <div key={stage.stage} className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-sm capitalize">{stage.stage}</h4>
                <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                  ${(stage.totalValue / 1000).toFixed(1)}K
                </span>
              </div>
              
              <div className="space-y-2 min-h-[200px]" data-testid={`pipeline-stage-${stage.stage}`}>
                {stage.deals.length > 0 ? (
                  stage.deals.map((deal) => (
                    <DealCard
                      key={deal.id}
                      deal={deal}
                      onStageChange={handleDealMove}
                      showStageSelector={showActions}
                    />
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    No deals in this stage
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
