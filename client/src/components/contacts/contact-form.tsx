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
import type { Contact, Company } from "@shared/schema";

interface ContactFormProps {
  contact?: Contact & { company?: Company };
  onSuccess: () => void;
}

export default function ContactForm({ contact, onSuccess }: ContactFormProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const { data: companies } = useQuery<Company[]>({
    queryKey: ["/api/companies"],
    retry: false,
  });

  const createContactMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/contacts", data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Contact created successfully",
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
        description: "Failed to create contact",
        variant: "destructive",
      });
    },
  });

  const updateContactMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("PUT", `/api/contacts/${contact!.id}`, data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Contact updated successfully",
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
        description: "Failed to update contact",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      firstName: formData.get("firstName") as string,
      lastName: formData.get("lastName") as string,
      email: (formData.get("email") as string) || null,
      phone: (formData.get("phone") as string) || null,
      title: (formData.get("title") as string) || null,
      companyId: (formData.get("companyId") as string) || null,
      notes: (formData.get("notes") as string) || null,
    };

    try {
      if (contact) {
        await updateContactMutation.mutateAsync(data);
      } else {
        await createContactMutation.mutateAsync(data);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="firstName">First Name *</Label>
          <Input 
            id="firstName" 
            name="firstName" 
            required 
            defaultValue={contact?.firstName || ""}
            data-testid="input-contact-first-name"
          />
        </div>
        <div>
          <Label htmlFor="lastName">Last Name *</Label>
          <Input 
            id="lastName" 
            name="lastName" 
            required 
            defaultValue={contact?.lastName || ""}
            data-testid="input-contact-last-name"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="email">Email</Label>
        <Input 
          id="email" 
          name="email" 
          type="email" 
          defaultValue={contact?.email || ""}
          data-testid="input-contact-email"
        />
      </div>

      <div>
        <Label htmlFor="phone">Phone</Label>
        <Input 
          id="phone" 
          name="phone" 
          type="tel" 
          defaultValue={contact?.phone || ""}
          data-testid="input-contact-phone"
        />
      </div>

      <div>
        <Label htmlFor="title">Job Title</Label>
        <Input 
          id="title" 
          name="title" 
          defaultValue={contact?.title || ""}
          data-testid="input-contact-title"
        />
      </div>

      <div>
        <Label htmlFor="companyId">Company</Label>
        <Select name="companyId" defaultValue={contact?.companyId || ""}>
          <SelectTrigger data-testid="select-contact-company">
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

      <div>
        <Label htmlFor="notes">Notes</Label>
        <Textarea 
          id="notes" 
          name="notes" 
          rows={3}
          defaultValue={contact?.notes || ""}
          data-testid="textarea-contact-notes"
        />
      </div>

      <div className="flex justify-end space-x-2">
        <Button 
          type="button" 
          variant="outline" 
          onClick={onSuccess}
          data-testid="button-cancel-contact"
        >
          Cancel
        </Button>
        <Button 
          type="submit" 
          disabled={isLoading}
          data-testid="button-save-contact"
        >
          {isLoading ? "Saving..." : contact ? "Update Contact" : "Create Contact"}
        </Button>
      </div>
    </form>
  );
}
