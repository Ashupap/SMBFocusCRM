import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Key, Trash2, Copy, Check, Shield, Calendar } from 'lucide-react';
import type { ApiKey } from '@shared/schema';
import { format } from 'date-fns';

export default function ApiKeys() {
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newKeyData, setNewKeyData] = useState({ name: '', expiresAt: '' });
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);

  const { data: apiKeys = [], isLoading } = useQuery<ApiKey[]>({
    queryKey: ['/api/api-keys'],
  });

  const createKeyMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('POST', '/api/api-keys', newKeyData);
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['/api/api-keys'] });
      setGeneratedKey(data.apiKey);
      setNewKeyData({ name: '', expiresAt: '' });
      toast({
        title: 'API key created',
        description: 'Copy your API key now - it will not be shown again',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const revokeKeyMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest('DELETE', `/api/api-keys/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/api-keys'] });
      toast({
        title: 'API key revoked',
        description: 'The API key has been revoked',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleCopyKey = async () => {
    if (generatedKey) {
      await navigator.clipboard.writeText(generatedKey);
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    }
  };

  const handleCreateKey = () => {
    createKeyMutation.mutate();
  };

  const handleCloseGeneratedKeyDialog = () => {
    setGeneratedKey(null);
    setIsCreateDialogOpen(false);
  };

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold mb-2">API Keys</h1>
            <p className="text-muted-foreground">
              Manage API keys for external integrations and programmatic access
            </p>
          </div>
          <Button onClick={() => setIsCreateDialogOpen(true)} data-testid="button-create-api-key">
            <Key className="h-4 w-4 mr-2" />
            Create API Key
          </Button>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Security Notice
            </CardTitle>
            <CardDescription>
              API keys grant programmatic access to your CRM data. Keep them secure and never share them publicly.
              You can view the API documentation at <a href="/api-docs" className="text-primary hover:underline" target="_blank">/api-docs</a>
            </CardDescription>
          </CardHeader>
        </Card>

        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">Loading API keys...</div>
        ) : apiKeys.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Key className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">No API keys yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first API key to start integrating with external services
              </p>
              <Button onClick={() => setIsCreateDialogOpen(true)} data-testid="button-create-first-api-key">
                <Key className="h-4 w-4 mr-2" />
                Create API Key
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {apiKeys.map((key) => (
              <Card key={key.id} data-testid={`api-key-${key.id}`}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg">{key.name}</h3>
                        {key.isActive ? (
                          <Badge variant="default">Active</Badge>
                        ) : (
                          <Badge variant="secondary">Revoked</Badge>
                        )}
                      </div>
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Key className="h-3 w-3" />
                          <code className="font-mono">{key.keyPrefix}...</code>
                        </div>
                        {key.lastUsedAt && (
                          <div className="flex items-center gap-2">
                            <Calendar className="h-3 w-3" />
                            Last used: {format(new Date(key.lastUsedAt), 'PPp')}
                          </div>
                        )}
                        {key.expiresAt && (
                          <div className="flex items-center gap-2">
                            <Calendar className="h-3 w-3" />
                            Expires: {format(new Date(key.expiresAt), 'PPp')}
                          </div>
                        )}
                        {key.createdAt && (
                          <div className="text-xs">
                            Created: {format(new Date(key.createdAt), 'PPp')}
                          </div>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => revokeKeyMutation.mutate(key.id)}
                      disabled={!key.isActive}
                      data-testid={`button-revoke-${key.id}`}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Revoke
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Create API Key Dialog */}
        <Dialog open={isCreateDialogOpen && !generatedKey} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent data-testid="dialog-create-api-key">
            <DialogHeader>
              <DialogTitle>Create API Key</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Key Name</Label>
                <Input
                  value={newKeyData.name}
                  onChange={(e) => setNewKeyData({ ...newKeyData, name: e.target.value })}
                  placeholder="e.g., Production Integration"
                  data-testid="input-api-key-name"
                />
              </div>
              <div>
                <Label>Expiration Date (Optional)</Label>
                <Input
                  type="datetime-local"
                  value={newKeyData.expiresAt}
                  onChange={(e) => setNewKeyData({ ...newKeyData, expiresAt: e.target.value })}
                  data-testid="input-api-key-expiry"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => setIsCreateDialogOpen(false)}
                  variant="outline"
                  className="flex-1"
                  data-testid="button-cancel-create"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateKey}
                  disabled={!newKeyData.name || createKeyMutation.isPending}
                  className="flex-1"
                  data-testid="button-generate-key"
                >
                  Generate Key
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Generated Key Dialog */}
        <Dialog open={!!generatedKey} onOpenChange={handleCloseGeneratedKeyDialog}>
          <DialogContent data-testid="dialog-generated-key">
            <DialogHeader>
              <DialogTitle>API Key Generated</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="p-4 bg-destructive/10 border border-destructive rounded-lg">
                <p className="text-sm font-medium text-destructive mb-2">
                  Important: Copy this key now!
                </p>
                <p className="text-sm text-muted-foreground">
                  This is the only time you'll see the full API key. Store it securely.
                </p>
              </div>
              <div className="relative">
                <Input
                  value={generatedKey || ''}
                  readOnly
                  className="font-mono pr-20"
                  data-testid="input-generated-key"
                />
                <Button
                  onClick={handleCopyKey}
                  size="sm"
                  variant="ghost"
                  className="absolute right-1 top-1"
                  data-testid="button-copy-key"
                >
                  {copiedKey ? (
                    <>
                      <Check className="h-4 w-4 mr-1" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-1" />
                      Copy
                    </>
                  )}
                </Button>
              </div>
              <Button
                onClick={handleCloseGeneratedKeyDialog}
                className="w-full"
                data-testid="button-close-generated-key"
              >
                I've Saved My Key
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
