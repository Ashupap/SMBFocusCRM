import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle, XCircle, Clock, Plus, GitBranch, Users, ArrowRight, MessageSquare } from 'lucide-react';
import type { ApprovalWorkflow, ApprovalRequest, User } from '@shared/schema';

interface WorkflowWithSteps extends ApprovalWorkflow {
  steps?: (any & { approver?: User })[];
}

interface RequestWithDetails extends ApprovalRequest {
  workflow?: ApprovalWorkflow;
  requester?: User;
  actions?: any[];
}

export default function Approvals() {
  const { toast } = useToast();
  const [isCreateWorkflowOpen, setIsCreateWorkflowOpen] = useState(false);
  const [isCreateRequestOpen, setIsCreateRequestOpen] = useState(false);
  const [selectedWorkflow, setSelectedWorkflow] = useState<string>('');
  const [selectedRequest, setSelectedRequest] = useState<RequestWithDetails | null>(null);
  const [actionComments, setActionComments] = useState('');

  const [workflowData, setWorkflowData] = useState({
    name: '',
    description: '',
    entityType: 'deal',
    isActive: true,
  });

  const [requestData, setRequestData] = useState({
    workflowId: '',
    entityType: 'deal',
    entityId: '',
    requestData: {},
  });

  const { data: workflows = [], isLoading: workflowsLoading } = useQuery<WorkflowWithSteps[]>({
    queryKey: ['/api/approval-workflows'],
  });

  const { data: requests = [], isLoading: requestsLoading } = useQuery<RequestWithDetails[]>({
    queryKey: ['/api/approval-requests'],
  });

  const { data: users = [] } = useQuery<User[]>({
    queryKey: ['/api/users'],
  });

  const createWorkflowMutation = useMutation({
    mutationFn: async (data: typeof workflowData) => {
      return await apiRequest('POST', '/api/approval-workflows', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/approval-workflows'] });
      setIsCreateWorkflowOpen(false);
      setWorkflowData({ name: '', description: '', entityType: 'deal', isActive: true });
      toast({
        title: 'Workflow created',
        description: 'Approval workflow has been created successfully',
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

  const createRequestMutation = useMutation({
    mutationFn: async (data: typeof requestData) => {
      return await apiRequest('POST', '/api/approval-requests', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/approval-requests'] });
      setIsCreateRequestOpen(false);
      setRequestData({ workflowId: '', entityType: 'deal', entityId: '', requestData: {} });
      toast({
        title: 'Request submitted',
        description: 'Approval request has been submitted',
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

  const approvalActionMutation = useMutation({
    mutationFn: async ({ requestId, stepId, action }: { requestId: string; stepId: string; action: string }) => {
      return await apiRequest('POST', '/api/approval-actions', {
        requestId,
        stepId,
        action,
        comments: actionComments,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/approval-requests'] });
      setSelectedRequest(null);
      setActionComments('');
      toast({
        title: 'Action recorded',
        description: 'Your approval action has been recorded',
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

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      pending: { variant: 'default', icon: Clock, text: 'Pending' },
      approved: { variant: 'outline', icon: CheckCircle, text: 'Approved', className: 'border-green-500 text-green-500' },
      rejected: { variant: 'destructive', icon: XCircle, text: 'Rejected' },
      cancelled: { variant: 'secondary', icon: XCircle, text: 'Cancelled' },
    };
    const config = variants[status] || variants.pending;
    const Icon = config.icon;
    return (
      <Badge variant={config.variant} className={`flex items-center gap-1 ${config.className || ''}`}>
        <Icon className="h-3 w-3" />
        {config.text}
      </Badge>
    );
  };

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Approval Workflows</h1>
          <p className="text-muted-foreground">
            Manage multi-level approval processes for deals and transactions
          </p>
        </div>

        <Tabs defaultValue="requests" className="space-y-6">
          <TabsList>
            <TabsTrigger value="requests" data-testid="tab-requests">
              Approval Requests
            </TabsTrigger>
            <TabsTrigger value="workflows" data-testid="tab-workflows">
              Workflows
            </TabsTrigger>
          </TabsList>

          <TabsContent value="requests" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Approval Requests</h2>
              <Button
                onClick={() => setIsCreateRequestOpen(true)}
                data-testid="button-create-request"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Request
              </Button>
            </div>

            {requestsLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading requests...</div>
            ) : requests.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <p className="text-muted-foreground">No approval requests yet</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {requests.map((request) => (
                  <Card key={request.id} data-testid={`request-${request.id}`}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">
                            {request.workflow?.name || 'Unknown Workflow'}
                          </CardTitle>
                          <CardDescription>
                            Requested by {request.requester?.firstName} {request.requester?.lastName}
                          </CardDescription>
                        </div>
                        {getStatusBadge(request.status)}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex justify-between items-center">
                        <div className="text-sm text-muted-foreground">
                          Entity: {request.entityType} ({request.entityId})
                        </div>
                        {request.status === 'pending' && (
                          <Button
                            size="sm"
                            onClick={() => setSelectedRequest(request)}
                            data-testid={`button-review-${request.id}`}
                          >
                            Review
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="workflows" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Workflows</h2>
              <Button
                onClick={() => setIsCreateWorkflowOpen(true)}
                data-testid="button-create-workflow"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Workflow
              </Button>
            </div>

            {workflowsLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading workflows...</div>
            ) : workflows.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <p className="text-muted-foreground">No workflows configured yet</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {workflows.map((workflow) => (
                  <Card key={workflow.id} data-testid={`workflow-${workflow.id}`}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            <GitBranch className="h-5 w-5" />
                            {workflow.name}
                          </CardTitle>
                          <CardDescription>{workflow.description}</CardDescription>
                        </div>
                        <Badge variant={workflow.isActive ? 'default' : 'secondary'}>
                          {workflow.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm">
                        <span className="font-medium">Entity Type:</span> {workflow.entityType}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Create Workflow Dialog */}
        <Dialog open={isCreateWorkflowOpen} onOpenChange={setIsCreateWorkflowOpen}>
          <DialogContent data-testid="dialog-create-workflow">
            <DialogHeader>
              <DialogTitle>Create Approval Workflow</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Name</label>
                <Input
                  value={workflowData.name}
                  onChange={(e) => setWorkflowData({ ...workflowData, name: e.target.value })}
                  placeholder="e.g., Deal Approval Process"
                  data-testid="input-workflow-name"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  value={workflowData.description}
                  onChange={(e) => setWorkflowData({ ...workflowData, description: e.target.value })}
                  placeholder="Describe the approval workflow..."
                  data-testid="textarea-workflow-description"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Entity Type</label>
                <Select
                  value={workflowData.entityType}
                  onValueChange={(value) => setWorkflowData({ ...workflowData, entityType: value })}
                >
                  <SelectTrigger data-testid="select-entity-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="deal">Deal</SelectItem>
                    <SelectItem value="contact">Contact</SelectItem>
                    <SelectItem value="campaign">Campaign</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => setIsCreateWorkflowOpen(false)}
                  variant="outline"
                  className="flex-1"
                  data-testid="button-cancel-workflow"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => createWorkflowMutation.mutate(workflowData)}
                  disabled={!workflowData.name || createWorkflowMutation.isPending}
                  className="flex-1"
                  data-testid="button-save-workflow"
                >
                  Create
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Create Request Dialog */}
        <Dialog open={isCreateRequestOpen} onOpenChange={setIsCreateRequestOpen}>
          <DialogContent data-testid="dialog-create-request">
            <DialogHeader>
              <DialogTitle>Submit Approval Request</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Workflow</label>
                <Select
                  value={requestData.workflowId}
                  onValueChange={(value) => setRequestData({ ...requestData, workflowId: value })}
                >
                  <SelectTrigger data-testid="select-workflow">
                    <SelectValue placeholder="Select workflow" />
                  </SelectTrigger>
                  <SelectContent>
                    {workflows.filter(w => w.isActive).map((workflow) => (
                      <SelectItem key={workflow.id} value={workflow.id}>
                        {workflow.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Entity ID</label>
                <Input
                  value={requestData.entityId}
                  onChange={(e) => setRequestData({ ...requestData, entityId: e.target.value })}
                  placeholder="Enter deal/contact ID"
                  data-testid="input-entity-id"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => setIsCreateRequestOpen(false)}
                  variant="outline"
                  className="flex-1"
                  data-testid="button-cancel-request"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => createRequestMutation.mutate(requestData)}
                  disabled={!requestData.workflowId || !requestData.entityId || createRequestMutation.isPending}
                  className="flex-1"
                  data-testid="button-submit-request"
                >
                  Submit
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Review Request Dialog */}
        <Dialog open={!!selectedRequest} onOpenChange={() => setSelectedRequest(null)}>
          <DialogContent data-testid="dialog-review-request">
            <DialogHeader>
              <DialogTitle>Review Approval Request</DialogTitle>
            </DialogHeader>
            {selectedRequest && (
              <div className="space-y-4">
                <div>
                  <div className="text-sm font-medium">Workflow</div>
                  <div className="text-sm text-muted-foreground">
                    {selectedRequest.workflow?.name}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium">Requested by</div>
                  <div className="text-sm text-muted-foreground">
                    {selectedRequest.requester?.firstName} {selectedRequest.requester?.lastName}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">Comments</label>
                  <Textarea
                    value={actionComments}
                    onChange={(e) => setActionComments(e.target.value)}
                    placeholder="Add your comments..."
                    data-testid="textarea-action-comments"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => {
                      if (selectedRequest.currentStepId) {
                        approvalActionMutation.mutate({
                          requestId: selectedRequest.id,
                          stepId: selectedRequest.currentStepId,
                          action: 'rejected',
                        });
                      }
                    }}
                    variant="destructive"
                    className="flex-1"
                    disabled={approvalActionMutation.isPending}
                    data-testid="button-reject"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Reject
                  </Button>
                  <Button
                    onClick={() => {
                      if (selectedRequest.currentStepId) {
                        approvalActionMutation.mutate({
                          requestId: selectedRequest.id,
                          stepId: selectedRequest.currentStepId,
                          action: 'approved',
                        });
                      }
                    }}
                    className="flex-1"
                    disabled={approvalActionMutation.isPending}
                    data-testid="button-approve"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Approve
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
