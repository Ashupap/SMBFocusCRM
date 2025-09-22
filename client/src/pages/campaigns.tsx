import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import CampaignForm from "@/components/campaigns/campaign-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Mail, Send, Edit, Trash2, Users } from "lucide-react";
import { format } from "date-fns";
import type { EmailCampaign } from "@shared/schema";

export default function Campaigns() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<EmailCampaign | null>(null);

  const { data: campaigns, isLoading: campaignsLoading } = useQuery<EmailCampaign[]>({
    queryKey: ["/api/campaigns"],
    retry: false,
  });

  const deleteCampaignMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/campaigns/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/campaigns"] });
      toast({
        title: "Success",
        description: "Campaign deleted successfully",
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
        description: "Failed to delete campaign",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
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
  }, [isAuthenticated, isLoading, toast]);

  const handleCreateSuccess = () => {
    setIsCreateDialogOpen(false);
    queryClient.invalidateQueries({ queryKey: ["/api/campaigns"] });
  };

  const handleEditSuccess = () => {
    setEditingCampaign(null);
    setIsCreateDialogOpen(false);
    queryClient.invalidateQueries({ queryKey: ["/api/campaigns"] });
  };

  const getStatusBadge = (campaign: EmailCampaign) => {
    if (campaign.sentAt) {
      return (
        <Badge className="bg-chart-2/10 text-chart-2 border-chart-2">
          Sent
        </Badge>
      );
    }
    return (
      <Badge variant="outline">
        Draft
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <Header 
          title="Email Campaigns" 
          description="Create and manage email marketing campaigns" 
        />
        
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold">Campaign Management</h2>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button data-testid="button-add-campaign">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Campaign
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>
                    {editingCampaign ? "Edit Campaign" : "Create Campaign"}
                  </DialogTitle>
                </DialogHeader>
                <CampaignForm 
                  campaign={editingCampaign || undefined}
                  onSuccess={editingCampaign ? handleEditSuccess : handleCreateSuccess}
                />
              </DialogContent>
            </Dialog>
          </div>

          {campaignsLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : campaigns && campaigns.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {campaigns.map((campaign) => (
                <Card key={campaign.id} className="hover:border-primary/20 transition-colors">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-chart-3/10 rounded-lg flex items-center justify-center">
                          <Mail className="w-5 h-5 text-chart-3" />
                        </div>
                        <div>
                          <CardTitle className="text-lg font-medium">{campaign.name}</CardTitle>
                          <p className="text-sm text-muted-foreground">{campaign.subject}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingCampaign(campaign);
                            setIsCreateDialogOpen(true);
                          }}
                          data-testid={`button-edit-campaign-${campaign.id}`}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => deleteCampaignMutation.mutate(campaign.id)}
                          disabled={deleteCampaignMutation.isPending}
                          data-testid={`button-delete-campaign-${campaign.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Status</span>
                        {getStatusBadge(campaign)}
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">From</span>
                        <span className="text-sm font-medium">{campaign.fromName}</span>
                      </div>
                      
                      {campaign.sentAt && (
                        <>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Sent</span>
                            <span className="text-sm">{format(new Date(campaign.sentAt), "MMM d, yyyy")}</span>
                          </div>
                          
                          <div className="grid grid-cols-3 gap-2 pt-2 border-t">
                            <div className="text-center">
                              <div className="text-lg font-semibold text-chart-1">{campaign.totalSent || 0}</div>
                              <div className="text-xs text-muted-foreground">Sent</div>
                            </div>
                            <div className="text-center">
                              <div className="text-lg font-semibold text-chart-2">{campaign.totalOpened || 0}</div>
                              <div className="text-xs text-muted-foreground">Opened</div>
                            </div>
                            <div className="text-center">
                              <div className="text-lg font-semibold text-chart-3">{campaign.totalClicked || 0}</div>
                              <div className="text-xs text-muted-foreground">Clicked</div>
                            </div>
                          </div>
                        </>
                      )}
                      
                      {!campaign.sentAt && (
                        <Button 
                          className="w-full mt-4" 
                          size="sm"
                          data-testid={`button-send-campaign-${campaign.id}`}
                        >
                          <Send className="w-4 h-4 mr-2" />
                          Send Campaign
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <Mail className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">No Campaigns Found</h3>
                <p className="text-muted-foreground mb-4">
                  Start reaching out to your customers by creating your first email campaign.
                </p>
                <Button onClick={() => setIsCreateDialogOpen(true)} data-testid="button-create-first-campaign">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Campaign
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      {/* Edit Dialog */}
      <Dialog open={!!editingCampaign && isCreateDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setEditingCampaign(null);
          setIsCreateDialogOpen(false);
        }
      }}>
        {/* Dialog content is handled above in the create dialog */}
      </Dialog>
    </div>
  );
}
