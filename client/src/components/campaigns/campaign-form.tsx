import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { EmailCampaign } from "@shared/schema";

interface CampaignFormProps {
  campaign?: EmailCampaign;
  onSuccess: () => void;
}

export default function CampaignForm({ campaign, onSuccess }: CampaignFormProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const createCampaignMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/campaigns", data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Campaign created successfully",
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
        description: "Failed to create campaign",
        variant: "destructive",
      });
    },
  });

  const updateCampaignMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("PUT", `/api/campaigns/${campaign!.id}`, data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Campaign updated successfully",
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
        description: "Failed to update campaign",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name") as string,
      subject: formData.get("subject") as string,
      content: formData.get("content") as string,
      fromEmail: formData.get("fromEmail") as string,
      fromName: formData.get("fromName") as string,
    };

    try {
      if (campaign) {
        await updateCampaignMutation.mutateAsync(data);
      } else {
        await createCampaignMutation.mutateAsync(data);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">Campaign Name *</Label>
        <Input 
          id="name" 
          name="name" 
          required 
          defaultValue={campaign?.name || ""}
          placeholder="e.g., Monthly Newsletter"
          data-testid="input-campaign-name"
        />
      </div>

      <div>
        <Label htmlFor="subject">Email Subject *</Label>
        <Input 
          id="subject" 
          name="subject" 
          required 
          defaultValue={campaign?.subject || ""}
          placeholder="e.g., Your monthly business update"
          data-testid="input-campaign-subject"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="fromName">From Name *</Label>
          <Input 
            id="fromName" 
            name="fromName" 
            required 
            defaultValue={campaign?.fromName || ""}
            placeholder="Your Name"
            data-testid="input-campaign-from-name"
          />
        </div>
        <div>
          <Label htmlFor="fromEmail">From Email *</Label>
          <Input 
            id="fromEmail" 
            name="fromEmail" 
            type="email"
            required 
            defaultValue={campaign?.fromEmail || ""}
            placeholder="you@company.com"
            data-testid="input-campaign-from-email"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="content">Email Content *</Label>
        <Textarea 
          id="content" 
          name="content" 
          rows={8}
          required
          defaultValue={campaign?.content || ""}
          placeholder="Write your email content here. You can use HTML formatting."
          data-testid="textarea-campaign-content"
        />
        <p className="text-xs text-muted-foreground mt-1">
          You can use HTML tags for formatting (e.g., &lt;strong&gt;, &lt;em&gt;, &lt;br&gt;)
        </p>
      </div>

      <div className="flex justify-end space-x-2">
        <Button 
          type="button" 
          variant="outline" 
          onClick={onSuccess}
          data-testid="button-cancel-campaign"
        >
          Cancel
        </Button>
        <Button 
          type="submit" 
          disabled={isLoading}
          data-testid="button-save-campaign"
        >
          {isLoading ? "Saving..." : campaign ? "Update Campaign" : "Create Campaign"}
        </Button>
      </div>
    </form>
  );
}
