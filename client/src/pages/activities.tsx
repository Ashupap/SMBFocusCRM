import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Phone, Mail, Calendar, CheckSquare, FileText, Edit, Trash2 } from "lucide-react";
import { format } from "date-fns";
import type { Activity, Contact, Deal } from "@shared/schema";

type ActivityWithRelations = Activity & { contact?: Contact; deal?: Deal };

export default function Activities() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<ActivityWithRelations | null>(null);

  const { data: activities, isLoading: activitiesLoading } = useQuery<ActivityWithRelations[]>({
    queryKey: ["/api/activities"],
    retry: false,
  });

  const { data: contacts } = useQuery<Contact[]>({
    queryKey: ["/api/contacts"],
    retry: false,
  });

  const { data: deals } = useQuery<Deal[]>({
    queryKey: ["/api/deals"],
    retry: false,
  });

  const createActivityMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/activities", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/activities"] });
      setIsCreateDialogOpen(false);
      toast({
        title: "Success",
        description: "Activity created successfully",
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
        description: "Failed to create activity",
        variant: "destructive",
      });
    },
  });

  const updateActivityMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      return await apiRequest("PUT", `/api/activities/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/activities"] });
      setEditingActivity(null);
      toast({
        title: "Success",
        description: "Activity updated successfully",
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
        description: "Failed to update activity",
        variant: "destructive",
      });
    },
  });

  const deleteActivityMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/activities/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/activities"] });
      toast({
        title: "Success",
        description: "Activity deleted successfully",
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
        description: "Failed to delete activity",
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

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const data = {
      type: formData.get("type"),
      subject: formData.get("subject"),
      description: formData.get("description"),
      scheduledAt: formData.get("scheduledAt") ? new Date(formData.get("scheduledAt") as string) : null,
      contactId: (formData.get("contactId") as string) === "none" ? null : (formData.get("contactId") as string) || null,
      dealId: (formData.get("dealId") as string) === "none" ? null : (formData.get("dealId") as string) || null,
      isCompleted: formData.get("isCompleted") === "on",
    };

    if (editingActivity) {
      updateActivityMutation.mutate({ id: editingActivity.id, data });
    } else {
      createActivityMutation.mutate(data);
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'call': return <Phone className="w-4 h-4" />;
      case 'email': return <Mail className="w-4 h-4" />;
      case 'meeting': return <Calendar className="w-4 h-4" />;
      case 'task': return <CheckSquare className="w-4 h-4" />;
      case 'note': return <FileText className="w-4 h-4" />;
      default: return <Calendar className="w-4 h-4" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'call': return 'bg-chart-2/10 text-chart-2';
      case 'email': return 'bg-chart-3/10 text-chart-3';
      case 'meeting': return 'bg-chart-1/10 text-chart-1';
      case 'task': return 'bg-chart-4/10 text-chart-4';
      case 'note': return 'bg-chart-5/10 text-chart-5';
      default: return 'bg-muted text-muted-foreground';
    }
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
          title="Activities" 
          description="Track calls, meetings, tasks, and other customer interactions" 
        />
        
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold">Activity Timeline</h2>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button data-testid="button-add-activity">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Activity
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>
                    {editingActivity ? "Edit Activity" : "Create Activity"}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="type">Type</Label>
                    <Select name="type" defaultValue={editingActivity?.type || "task"}>
                      <SelectTrigger data-testid="select-activity-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="call">Call</SelectItem>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="meeting">Meeting</SelectItem>
                        <SelectItem value="task">Task</SelectItem>
                        <SelectItem value="note">Note</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="subject">Subject</Label>
                    <Input 
                      id="subject" 
                      name="subject" 
                      required 
                      defaultValue={editingActivity?.subject || ""}
                      data-testid="input-activity-subject"
                    />
                  </div>

                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea 
                      id="description" 
                      name="description" 
                      defaultValue={editingActivity?.description || ""}
                      data-testid="textarea-activity-description"
                    />
                  </div>

                  <div>
                    <Label htmlFor="scheduledAt">Scheduled Date & Time</Label>
                    <Input 
                      id="scheduledAt" 
                      name="scheduledAt" 
                      type="datetime-local"
                      defaultValue={editingActivity?.scheduledAt 
                        ? format(new Date(editingActivity.scheduledAt), "yyyy-MM-dd'T'HH:mm")
                        : ""
                      }
                      data-testid="input-activity-scheduled"
                    />
                  </div>

                  <div>
                    <Label htmlFor="contactId">Contact</Label>
                    <Select name="contactId" defaultValue={editingActivity?.contactId || "none"}>
                      <SelectTrigger data-testid="select-activity-contact">
                        <SelectValue placeholder="Select a contact (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No contact</SelectItem>
                        {contacts?.map((contact) => (
                          <SelectItem key={contact.id} value={contact.id}>
                            {contact.firstName} {contact.lastName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="dealId">Deal</Label>
                    <Select name="dealId" defaultValue={editingActivity?.dealId || "none"}>
                      <SelectTrigger data-testid="select-activity-deal">
                        <SelectValue placeholder="Select a deal (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No deal</SelectItem>
                        {deals?.map((deal) => (
                          <SelectItem key={deal.id} value={deal.id}>
                            {deal.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="isCompleted" 
                      name="isCompleted" 
                      defaultChecked={editingActivity?.isCompleted || false}
                      data-testid="checkbox-activity-completed"
                    />
                    <Label htmlFor="isCompleted">Mark as completed</Label>
                  </div>

                  <div className="flex justify-end space-x-2">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => {
                        setIsCreateDialogOpen(false);
                        setEditingActivity(null);
                      }}
                      data-testid="button-cancel-activity"
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={createActivityMutation.isPending || updateActivityMutation.isPending}
                      data-testid="button-save-activity"
                    >
                      {createActivityMutation.isPending || updateActivityMutation.isPending 
                        ? "Saving..." 
                        : editingActivity ? "Update" : "Create"
                      }
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {activitiesLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : activities && activities.length > 0 ? (
            <div className="space-y-4">
              {activities.map((activity) => (
                <Card key={activity.id} className="hover:border-primary/20 transition-colors">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${getActivityColor(activity.type)}`}>
                          {getActivityIcon(activity.type)}
                        </div>
                        <div>
                          <CardTitle className="text-lg font-medium">{activity.subject}</CardTitle>
                          <div className="flex items-center space-x-2 mt-1">
                            <Badge variant="secondary" className="capitalize">
                              {activity.type}
                            </Badge>
                            {activity.isCompleted && (
                              <Badge variant="outline" className="text-chart-2 border-chart-2">
                                Completed
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingActivity(activity);
                            setIsCreateDialogOpen(true);
                          }}
                          data-testid={`button-edit-activity-${activity.id}`}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => deleteActivityMutation.mutate(activity.id)}
                          disabled={deleteActivityMutation.isPending}
                          data-testid={`button-delete-activity-${activity.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    {activity.description && (
                      <p className="text-muted-foreground mb-3">{activity.description}</p>
                    )}
                    
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                      {activity.scheduledAt && (
                        <span>
                          Scheduled: {format(new Date(activity.scheduledAt), "MMM d, yyyy 'at' h:mm a")}
                        </span>
                      )}
                      {activity.contact && (
                        <span>
                          Contact: {activity.contact.firstName} {activity.contact.lastName}
                        </span>
                      )}
                      {activity.deal && (
                        <span>
                          Deal: {activity.deal.title}
                        </span>
                      )}
                      <span>
                        Created: {activity.createdAt ? format(new Date(activity.createdAt), "MMM d, yyyy") : 'Unknown'}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">No Activities Found</h3>
                <p className="text-muted-foreground mb-4">
                  Start tracking your customer interactions by creating your first activity.
                </p>
                <Button onClick={() => setIsCreateDialogOpen(true)} data-testid="button-create-first-activity">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Activity
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      {/* Edit Dialog */}
      <Dialog open={!!editingActivity && isCreateDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setEditingActivity(null);
          setIsCreateDialogOpen(false);
        }
      }}>
        {/* Dialog content is handled above in the create dialog */}
      </Dialog>
    </div>
  );
}
