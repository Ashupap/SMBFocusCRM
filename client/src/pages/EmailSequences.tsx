import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Mail } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { EmailSequence } from "@shared/schema";

export default function EmailSequences() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingSequence, setEditingSequence] = useState<EmailSequence | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    isActive: false,
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

  const { data: sequences = [], isLoading: isLoadingSequences } = useQuery<EmailSequence[]>({
    queryKey: ["/api/email-sequences"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return await apiRequest("POST", "/api/email-sequences", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/email-sequences"] });
      setIsCreateOpen(false);
      setFormData({ name: "", description: "", isActive: false });
      toast({ title: "Success", description: "Email sequence created successfully" });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create sequence",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      return await apiRequest("PATCH", `/api/email-sequences/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/email-sequences"] });
      setEditingSequence(null);
      setFormData({ name: "", description: "", isActive: false });
      toast({ title: "Success", description: "Email sequence updated successfully" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/email-sequences/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/email-sequences"] });
      toast({ title: "Success", description: "Email sequence deleted successfully" });
    },
  });

  const handleCreate = async () => {
    if (!formData.name.trim()) {
      toast({ title: "Error", description: "Sequence name is required", variant: "destructive" });
      return;
    }
    createMutation.mutate(formData);
  };

  const handleEdit = (sequence: EmailSequence) => {
    setEditingSequence(sequence);
    setFormData({
      name: sequence.name,
      description: sequence.description || "",
      isActive: sequence.isActive,
    });
    setIsCreateOpen(true);
  };

  const handleSave = async () => {
    if (editingSequence) {
      updateMutation.mutate({ id: editingSequence.id, data: formData });
    } else {
      handleCreate();
    }
  };

  const filteredSequences = sequences.filter((s) =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
        <Header title="Email Sequences" description="Create and manage automated email drip campaigns" />
        
        <div className="p-6 space-y-6">
          <div className="flex justify-between items-center gap-4">
            <Input
              placeholder="Search sequences..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-md"
              data-testid="input-search-sequences"
            />
            <Button onClick={() => {
              setEditingSequence(null);
              setFormData({ name: "", description: "", isActive: false });
              setIsCreateOpen(true);
            }} data-testid="button-create-sequence">
              <Plus className="w-4 h-4 mr-2" />
              Create Sequence
            </Button>
          </div>

          {isLoadingSequences ? (
            <div className="text-center py-8">Loading...</div>
          ) : filteredSequences.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Mail className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No email sequences yet. Create one to get started.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {filteredSequences.map((sequence) => (
                <Card key={sequence.id} data-testid={`card-sequence-${sequence.id}`}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <CardTitle>{sequence.name}</CardTitle>
                          <Badge variant={sequence.isActive ? "default" : "secondary"}>
                            {sequence.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                        {sequence.description && (
                          <CardDescription>{sequence.description}</CardDescription>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(sequence)}
                          data-testid={`button-edit-${sequence.id}`}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteMutation.mutate(sequence.id)}
                          data-testid={`button-delete-${sequence.id}`}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Created {new Date(sequence.createdAt).toLocaleDateString()}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingSequence ? "Edit Sequence" : "Create Email Sequence"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                placeholder="Sequence Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                data-testid="input-sequence-name"
              />
              <Textarea
                placeholder="Description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                data-testid="textarea-sequence-description"
              />
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  data-testid="checkbox-sequence-active"
                />
                <label htmlFor="isActive">Active</label>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={createMutation.isPending || updateMutation.isPending} data-testid="button-save-sequence">
                  {editingSequence ? "Update" : "Create"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
