import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, GripVertical, BarChart3, TrendingUp, Users, DollarSign, Activity, PieChart } from 'lucide-react';
import type { DashboardWidget } from '@shared/schema';

interface WidgetConfig {
  metric?: string;
  chartType?: string;
  dataSource?: string;
  timeRange?: string;
  [key: string]: any;
}

interface WidgetPosition {
  x: number;
  y: number;
  w: number;
  h: number;
}

export default function CustomDashboard() {
  const { toast } = useToast();
  const [isAddWidgetOpen, setIsAddWidgetOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<string>('metric');
  const [widgetTitle, setWidgetTitle] = useState('');
  const [widgetConfig, setWidgetConfig] = useState<WidgetConfig>({});
  
  const { data: widgets = [], isLoading } = useQuery<DashboardWidget[]>({
    queryKey: ['/api/dashboard-widgets'],
  });

  const createWidgetMutation = useMutation({
    mutationFn: async (data: { type: string; title: string; config: any; position: any }) => {
      return await apiRequest('POST', '/api/dashboard-widgets', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard-widgets'] });
      setIsAddWidgetOpen(false);
      resetForm();
      toast({
        title: 'Widget added',
        description: 'Dashboard widget has been added successfully',
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

  const deleteWidgetMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest('DELETE', `/api/dashboard-widgets/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard-widgets'] });
      toast({
        title: 'Widget removed',
        description: 'Dashboard widget has been removed',
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

  const updatePositionMutation = useMutation({
    mutationFn: async ({ id, position }: { id: string; position: any }) => {
      return await apiRequest('PATCH', `/api/dashboard-widgets/${id}`, { position });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard-widgets'] });
    },
  });

  const resetForm = () => {
    setWidgetTitle('');
    setSelectedType('metric');
    setWidgetConfig({});
  };

  const handleAddWidget = () => {
    const position = {
      x: 0,
      y: widgets.length * 2,
      w: selectedType === 'metric' ? 3 : 6,
      h: selectedType === 'metric' ? 2 : 4,
    };

    createWidgetMutation.mutate({
      type: selectedType,
      title: widgetTitle,
      config: widgetConfig,
      position,
    });
  };

  const getWidgetIcon = (type: string) => {
    const icons: Record<string, any> = {
      metric: DollarSign,
      chart: BarChart3,
      table: Users,
      pipeline: TrendingUp,
      activity_feed: Activity,
      forecast: PieChart,
    };
    return icons[type] || BarChart3;
  };

  const widgetTypes = [
    { value: 'metric', label: 'Metric Card', description: 'Display a single key metric' },
    { value: 'chart', label: 'Chart', description: 'Visualize data with charts' },
    { value: 'table', label: 'Data Table', description: 'Show data in table format' },
    { value: 'pipeline', label: 'Pipeline View', description: 'Sales pipeline visualization' },
    { value: 'activity_feed', label: 'Activity Feed', description: 'Recent activity stream' },
    { value: 'forecast', label: 'Forecast', description: 'AI-powered forecasts' },
  ];

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold mb-2">Custom Dashboard</h1>
            <p className="text-muted-foreground">
              Build your personalized dashboard with drag-and-drop widgets
            </p>
          </div>
          <Button onClick={() => setIsAddWidgetOpen(true)} data-testid="button-add-widget">
            <Plus className="h-4 w-4 mr-2" />
            Add Widget
          </Button>
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">Loading dashboard...</div>
        ) : widgets.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <BarChart3 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">No widgets yet</h3>
              <p className="text-muted-foreground mb-4">
                Start building your custom dashboard by adding widgets
              </p>
              <Button onClick={() => setIsAddWidgetOpen(true)} data-testid="button-add-first-widget">
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Widget
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {widgets.map((widget) => {
              const Icon = getWidgetIcon(widget.type);
              return (
                <Card key={widget.id} className="relative group" data-testid={`widget-${widget.id}`}>
                  <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity cursor-move">
                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteWidgetMutation.mutate(widget.id)}
                      data-testid={`button-delete-widget-${widget.id}`}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Icon className="h-5 w-5" />
                      {widget.title}
                    </CardTitle>
                    <CardDescription>
                      <Badge variant="outline">{widget.type.replace('_', ' ')}</Badge>
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {widget.type === 'metric' ? (
                        <>
                          {(widget.config as any)?.metric || 'No data'}
                        </>
                      ) : widget.type === 'chart' ? (
                        <div className="h-24 bg-muted rounded flex items-center justify-center text-sm text-muted-foreground">
                          Chart Preview
                        </div>
                      ) : widget.type === 'table' ? (
                        <div className="h-24 bg-muted rounded flex items-center justify-center text-sm text-muted-foreground">
                          Table Preview
                        </div>
                      ) : (
                        <div className="h-24 bg-muted rounded flex items-center justify-center text-sm text-muted-foreground">
                          {widget.type.replace('_', ' ')} Preview
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Add Widget Dialog */}
        <Dialog open={isAddWidgetOpen} onOpenChange={setIsAddWidgetOpen}>
          <DialogContent className="max-w-2xl" data-testid="dialog-add-widget">
            <DialogHeader>
              <DialogTitle>Add Dashboard Widget</DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              <div>
                <label className="text-sm font-medium mb-3 block">Widget Type</label>
                <div className="grid grid-cols-2 gap-3">
                  {widgetTypes.map((type) => {
                    const Icon = getWidgetIcon(type.value);
                    return (
                      <button
                        key={type.value}
                        onClick={() => setSelectedType(type.value)}
                        className={`p-4 rounded-lg border-2 text-left transition-all ${
                          selectedType === type.value
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/50'
                        }`}
                        data-testid={`widget-type-${type.value}`}
                      >
                        <div className="flex items-start gap-3">
                          <Icon className="h-5 w-5 mt-0.5" />
                          <div>
                            <div className="font-medium">{type.label}</div>
                            <div className="text-xs text-muted-foreground mt-1">
                              {type.description}
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Widget Title</label>
                <Input
                  value={widgetTitle}
                  onChange={(e) => setWidgetTitle(e.target.value)}
                  placeholder="e.g., Total Revenue, Active Deals"
                  data-testid="input-widget-title"
                />
              </div>

              {selectedType === 'metric' && (
                <div>
                  <label className="text-sm font-medium">Metric</label>
                  <Select
                    value={widgetConfig.metric || ''}
                    onValueChange={(value) => setWidgetConfig({ ...widgetConfig, metric: value })}
                  >
                    <SelectTrigger data-testid="select-metric">
                      <SelectValue placeholder="Select metric" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="total_revenue">Total Revenue</SelectItem>
                      <SelectItem value="deals_won">Deals Won</SelectItem>
                      <SelectItem value="active_contacts">Active Contacts</SelectItem>
                      <SelectItem value="conversion_rate">Conversion Rate</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {selectedType === 'chart' && (
                <div>
                  <label className="text-sm font-medium">Chart Type</label>
                  <Select
                    value={widgetConfig.chartType || ''}
                    onValueChange={(value) => setWidgetConfig({ ...widgetConfig, chartType: value })}
                  >
                    <SelectTrigger data-testid="select-chart-type">
                      <SelectValue placeholder="Select chart type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="line">Line Chart</SelectItem>
                      <SelectItem value="bar">Bar Chart</SelectItem>
                      <SelectItem value="pie">Pie Chart</SelectItem>
                      <SelectItem value="area">Area Chart</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  onClick={() => setIsAddWidgetOpen(false)}
                  variant="outline"
                  className="flex-1"
                  data-testid="button-cancel-widget"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAddWidget}
                  disabled={!widgetTitle || createWidgetMutation.isPending}
                  className="flex-1"
                  data-testid="button-save-widget"
                >
                  Add Widget
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
