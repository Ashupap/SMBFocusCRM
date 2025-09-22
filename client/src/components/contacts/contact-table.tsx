import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import ContactForm from "./contact-form";
import CsvImport from "../ui/csv-import";
import { convertToCSV, downloadCSV, generateTimestamp, contactExportHeaders } from "@/lib/csvUtils";
import { Plus, Upload, Download, Edit, Mail, Phone, Trash2 } from "lucide-react";
import { format } from "date-fns";
import type { Contact, Company } from "@shared/schema";

type ContactWithCompany = Contact & { company?: Company };

export default function ContactTable() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<ContactWithCompany | null>(null);

  const { data: contacts, isLoading } = useQuery<ContactWithCompany[]>({
    queryKey: ["/api/contacts"],
    retry: false,
  });

  const deleteContactMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/contacts/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contacts"] });
      toast({
        title: "Success",
        description: "Contact deleted successfully",
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
        description: "Failed to delete contact",
        variant: "destructive",
      });
    },
  });

  const exportContactsMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("GET", "/api/contacts/export");
      return await response.json();
    },
    onSuccess: (data) => {
      if (data.length === 0) {
        toast({
          title: "No Data to Export",
          description: "There are no contacts to export",
          variant: "default",
        });
        return;
      }
      
      const csvContent = convertToCSV(data, contactExportHeaders as Array<{ key: string; label: string }>);
      const timestamp = generateTimestamp();
      downloadCSV(csvContent, `contacts_export_${timestamp}.csv`);
      toast({
        title: "Export Successful",
        description: `Exported ${data.length} contacts to CSV`,
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
        description: "Failed to export contacts",
        variant: "destructive",
      });
    },
  });

  const handleCreateSuccess = () => {
    setIsCreateDialogOpen(false);
    queryClient.invalidateQueries({ queryKey: ["/api/contacts"] });
  };

  const handleEditSuccess = () => {
    setEditingContact(null);
    setIsCreateDialogOpen(false);
    queryClient.invalidateQueries({ queryKey: ["/api/contacts"] });
  };

  const handleImportSuccess = () => {
    setIsImportDialogOpen(false);
    queryClient.invalidateQueries({ queryKey: ["/api/contacts"] });
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  };

  const getAvatarColor = (name: string) => {
    const colors = [
      'bg-chart-1', 'bg-chart-2', 'bg-chart-3', 'bg-chart-4', 'bg-chart-5',
      'bg-primary', 'bg-secondary', 'bg-accent'
    ];
    const index = name.length % colors.length;
    return colors[index];
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Contacts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse">
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4 py-3">
                  <div className="w-10 h-10 bg-muted rounded-full"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted rounded w-1/4"></div>
                    <div className="h-3 bg-muted rounded w-1/6"></div>
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
          <CardTitle>Recent Contacts</CardTitle>
          <div className="flex items-center space-x-3">
            <Button 
              variant="outline" 
              onClick={() => exportContactsMutation.mutate()}
              disabled={exportContactsMutation.isPending || !contacts?.length}
              data-testid="button-export-contacts"
            >
              {exportContactsMutation.isPending ? (
                <>
                  <div className="w-4 h-4 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin mr-2" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </>
              )}
            </Button>
            
            <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" data-testid="button-import-contacts">
                  <Upload className="w-4 h-4 mr-2" />
                  Import
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Import Contacts</DialogTitle>
                </DialogHeader>
                <CsvImport
                  endpoint="/api/contacts/import"
                  onSuccess={handleImportSuccess}
                  sampleHeaders={['firstName', 'lastName', 'email', 'phone', 'title']}
                />
              </DialogContent>
            </Dialog>

            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button data-testid="button-add-contact">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Contact
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>
                    {editingContact ? "Edit Contact" : "Add Contact"}
                  </DialogTitle>
                </DialogHeader>
                <ContactForm 
                  contact={editingContact || undefined}
                  onSuccess={editingContact ? handleEditSuccess : handleCreateSuccess}
                />
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {contacts && contacts.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 font-medium text-sm text-muted-foreground">Name</th>
                  <th className="text-left py-3 px-4 font-medium text-sm text-muted-foreground">Company</th>
                  <th className="text-left py-3 px-4 font-medium text-sm text-muted-foreground">Email</th>
                  <th className="text-left py-3 px-4 font-medium text-sm text-muted-foreground">Phone</th>
                  <th className="text-left py-3 px-4 font-medium text-sm text-muted-foreground">Last Contact</th>
                  <th className="text-left py-3 px-4 font-medium text-sm text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {contacts.map((contact) => {
                  const fullName = `${contact.firstName} ${contact.lastName}`;
                  const initials = getInitials(contact.firstName, contact.lastName);
                  const avatarColor = getAvatarColor(fullName);
                  
                  return (
                    <tr 
                      key={contact.id} 
                      className="border-b border-border hover:bg-muted/50 transition-colors"
                      data-testid={`contact-row-${contact.id}`}
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-3">
                          <Avatar className="w-8 h-8">
                            <AvatarFallback className={`${avatarColor} text-white text-sm font-medium`}>
                              {initials}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <span className="font-medium">{fullName}</span>
                            {contact.title && (
                              <p className="text-xs text-muted-foreground">{contact.title}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm">
                        {contact.company?.name || '—'}
                      </td>
                      <td className="py-3 px-4 text-sm text-muted-foreground">
                        {contact.email || '—'}
                      </td>
                      <td className="py-3 px-4 text-sm text-muted-foreground">
                        {contact.phone || '—'}
                      </td>
                      <td className="py-3 px-4 text-sm text-muted-foreground">
                        {contact.lastContactedAt 
                          ? format(new Date(contact.lastContactedAt), "MMM d, yyyy")
                          : 'Never'
                        }
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setEditingContact(contact);
                              setIsCreateDialogOpen(true);
                            }}
                            data-testid={`button-edit-contact-${contact.id}`}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          {contact.email && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => window.open(`mailto:${contact.email}`)}
                              data-testid={`button-email-contact-${contact.id}`}
                            >
                              <Mail className="w-4 h-4" />
                            </Button>
                          )}
                          {contact.phone && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => window.open(`tel:${contact.phone}`)}
                              data-testid={`button-call-contact-${contact.id}`}
                            >
                              <Phone className="w-4 h-4" />
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => deleteContactMutation.mutate(contact.id)}
                            disabled={deleteContactMutation.isPending}
                            data-testid={`button-delete-contact-${contact.id}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Plus className="w-6 h-6 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">No Contacts Found</h3>
            <p className="text-muted-foreground mb-4">
              Start building your customer base by adding your first contact.
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)} data-testid="button-create-first-contact">
              <Plus className="w-4 h-4 mr-2" />
              Add Contact
            </Button>
          </div>
        )}
      </CardContent>

      {/* Edit Dialog */}
      <Dialog open={!!editingContact && isCreateDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setEditingContact(null);
          setIsCreateDialogOpen(false);
        }
      }}>
        {/* Dialog content is handled above in the create dialog */}
      </Dialog>
    </Card>
  );
}
