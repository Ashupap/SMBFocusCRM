import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Deal, Contact, Company } from "@shared/schema";

interface DealFormProps {
  deal?: Deal & { contact?: Contact; company?: Company };
  onSuccess: () => void;
}

export default function DealForm({ deal, onSuccess }: DealFormProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const { data: contacts } = useQuery<Contact[]>({
    queryKey: ["/api/contacts"],
    retry: false,
  });

  const { data: companies } = useQuery<Company[]>({
    queryKey: ["/api/companies"],
    retry: false,
  });

  const createDealMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/deals", data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Deal created successfully",
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
        description: "Failed to create deal",
        variant: "destructive",
      });
    },
  });

  const updateDealMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("PUT", `/api/deals/${deal!.id}`, data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Deal updated successfully",
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
        description: "Failed to update deal",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      title: formData.get("title") as string,
      description: (formData.get("description") as string) || null,
      value: parseFloat(formData.get("value") as string),
      stage: formData.get("stage") as string,
      probability: parseInt(formData.get("probability") as string),
      expectedCloseDate: formData.get("expectedCloseDate") ? new Date(formData.get("expectedCloseDate") as string) : null,
      contactId: (formData.get("contactId") as string) || null,
      companyId: (formData.get("companyId") as string) || null,
    };

    try {
      if (deal) {
        await updateDealMutation.mutateAsync(data);
      } else {
        await createDealMutation.mutateAsync(data);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="title">Deal Title *</Label>
        <Input 
          id="title" 
          name="title" 
          required 
          defaultValue={deal?.title || ""}
          placeholder="e.g., Enterprise software license"
          data-testid="input-deal-title"
        />
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea 
          id="description" 
          name="description" 
          rows={3}
          defaultValue={deal?.description || ""}
          placeholder="Brief description of the deal"
          data-testid="textarea-deal-description"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="value">Deal Value *</Label>
          <Input 
            id="value" 
            name="value" 
            type="number" 
            step="0.01"
            min="0"
            required 
            defaultValue={deal?.value || ""}
            placeholder="10000"
            data-testid="input-deal-value"
          />
        </div>
        <div>
          <Label htmlFor="probability">Probability (%)</Label>
          <Input 
            id="probability" 
            name="probability" 
            type="number" 
            min="0" 
            max="100"
            defaultValue={deal?.probability || 25}
            data-testid="input-deal-probability"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="stage">Stage</Label>
          <Select name="stage" defaultValue={deal?.stage || "prospecting"}>
            <SelectTrigger data-testid="select-deal-stage">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="prospecting">Prospecting</SelectItem>
              <SelectItem value="qualification">Qualification</SelectItem>
              <SelectItem value="proposal">Proposal</SelectItem>
              <SelectItem value="closing">Closing</SelectItem>
              <SelectItem value="won">Won</SelectItem>
              <SelectItem value="lost">Lost</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="expectedCloseDate">Expected Close Date</Label>
          <Input 
            id="expectedCloseDate" 
            name="expectedCloseDate" 
            type="date"
            defaultValue={deal?.expectedCloseDate ? 
              new Date(deal.expectedCloseDate).toISOString().split('T')[0] : ""
            }
            data-testid="input-deal-close-date"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="contactId">Primary Contact</Label>
        <Select name="contactId" defaultValue={deal?.contactId || ""}>
          <SelectTrigger data-testid="select-deal-contact">
            <SelectValue placeholder="Select a contact" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">No contact</SelectItem>
            {contacts?.map((contact) => (
              <SelectItem key={contact.id} value={contact.id}>
                {contact.firstName} {contact.lastName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="companyId">Company</Label>
        <Select name="companyId" defaultValue={deal?.companyId || ""}>
          <SelectTrigger data-testid="select-deal-company">
            <SelectValue placeholder="Select a company" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">No company</SelectItem>
            {companies?.map((company) => (
              <SelectItem key={company.id} value={company.id}>
                {company.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex justify-end space-x-2">
        <Button 
          type="button" 
          variant="outline" 
          onClick={onSuccess}
          data-testid="button-cancel-deal"
        >
          Cancel
        </Button>
        <Button 
          type="submit" 
          disabled={isLoading}
          data-testid="button-save-deal"
        >
          {isLoading ? "Saving..." : deal ? "Update Deal" : "Create Deal"}
        </Button>
      </div>
    </form>
  );
}
