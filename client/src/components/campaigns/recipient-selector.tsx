import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Send, Search, Users, Mail } from "lucide-react";
import type { Contact, EmailCampaign } from "@shared/schema";

interface RecipientSelectorProps {
  campaign: EmailCampaign;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function RecipientSelector({ campaign, onSuccess, onCancel }: RecipientSelectorProps) {
  const { toast } = useToast();
  const [selectedContactIds, setSelectedContactIds] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  const { data: contacts, isLoading: contactsLoading } = useQuery<Contact[]>({
    queryKey: ["/api/contacts"],
    retry: false,
  });

  const sendCampaignMutation = useMutation({
    mutationFn: async (contactIds: string[]) => {
      return await apiRequest("POST", `/api/campaigns/${campaign.id}/send`, {
        contactIds,
      });
    },
    onSuccess: (result: any) => {
      toast({
        title: "Campaign Sent Successfully",
        description: `Sent to ${result.successCount} recipients`,
      });
      onSuccess();
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
        description: "Failed to send campaign",
        variant: "destructive",
      });
    },
  });

  // Filter contacts based on search term and only include those with email addresses
  const filteredContacts = contacts?.filter(contact => {
    if (!contact.email) return false; // Only show contacts with email addresses
    
    if (!searchTerm) return true;
    
    const search = searchTerm.toLowerCase();
    return (
      contact.firstName?.toLowerCase().includes(search) ||
      contact.lastName?.toLowerCase().includes(search) ||
      contact.email?.toLowerCase().includes(search) ||
      contact.title?.toLowerCase().includes(search)
    );
  }) || [];

  const handleContactToggle = (contactId: string, checked: boolean) => {
    if (checked) {
      setSelectedContactIds(prev => [...prev, contactId]);
    } else {
      setSelectedContactIds(prev => prev.filter(id => id !== contactId));
    }
  };

  const handleSelectAll = () => {
    if (selectedContactIds.length === filteredContacts.length) {
      setSelectedContactIds([]);
    } else {
      setSelectedContactIds(filteredContacts.map(contact => contact.id));
    }
  };

  const handleSendCampaign = () => {
    if (selectedContactIds.length === 0) {
      toast({
        title: "No Recipients Selected",
        description: "Please select at least one contact to send the campaign to.",
        variant: "destructive",
      });
      return;
    }
    
    sendCampaignMutation.mutate(selectedContactIds);
  };

  if (contactsLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (!filteredContacts.length) {
    return (
      <div className="space-y-4">
        <Card>
          <CardContent className="py-12 text-center">
            <Mail className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No Contacts with Email</h3>
            <p className="text-muted-foreground mb-4">
              You need contacts with email addresses to send campaigns.
            </p>
            <Button onClick={onCancel} variant="outline">
              Close
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="w-5 h-5" />
            Send Campaign: {campaign.name}
          </CardTitle>
          <div className="text-sm text-muted-foreground">
            Subject: <span className="font-medium">{campaign.subject}</span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Search and Select All */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search contacts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                  data-testid="input-search-recipients"
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSelectAll}
                data-testid="button-select-all-recipients"
              >
                {selectedContactIds.length === filteredContacts.length ? "Deselect All" : "Select All"}
              </Button>
            </div>

            {/* Selected count */}
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                {selectedContactIds.length} selected
              </Badge>
              {selectedContactIds.length > 0 && (
                <span className="text-sm text-muted-foreground">
                  of {filteredContacts.length} contacts with email
                </span>
              )}
            </div>

            {/* Contact list */}
            <ScrollArea className="h-64 border rounded-md">
              <div className="p-4 space-y-2">
                {filteredContacts.map((contact) => (
                  <div
                    key={contact.id}
                    className="flex items-center space-x-3 p-2 hover:bg-muted rounded-md"
                    data-testid={`recipient-contact-${contact.id}`}
                  >
                    <Checkbox
                      checked={selectedContactIds.includes(contact.id)}
                      onCheckedChange={(checked) => handleContactToggle(contact.id, !!checked)}
                      data-testid={`checkbox-recipient-${contact.id}`}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">
                        {contact.firstName} {contact.lastName}
                      </p>
                      <p className="text-xs text-muted-foreground">{contact.email}</p>
                      {contact.title && (
                        <p className="text-xs text-muted-foreground">{contact.title}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            {/* Action buttons */}
            <div className="flex items-center justify-between pt-2">
              <Button variant="outline" onClick={onCancel} data-testid="button-cancel-send">
                Cancel
              </Button>
              <Button
                onClick={handleSendCampaign}
                disabled={selectedContactIds.length === 0 || sendCampaignMutation.isPending}
                data-testid="button-confirm-send-campaign"
              >
                {sendCampaignMutation.isPending ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Send to {selectedContactIds.length} Recipients
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}