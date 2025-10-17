import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Brain, TrendingUp, Lightbulb, Sparkles, RefreshCw } from 'lucide-react';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import type { Contact, LeadScore, SalesForecast, Recommendation } from '@shared/schema';

export default function AIInsights() {
  const { toast } = useToast();

  const { data: leadScores = [], isLoading: scoresLoading } = useQuery<(LeadScore & { contact?: Contact })[]>({
    queryKey: ['/api/ai/lead-scores'],
  });

  const { data: forecasts = [], isLoading: forecastsLoading } = useQuery<SalesForecast[]>({
    queryKey: ['/api/ai/forecasts'],
  });

  const { data: recommendations = [], isLoading: recsLoading } = useQuery<(Recommendation & { contact?: Contact })[]>({
    queryKey: ['/api/ai/recommendations'],
  });

  const { data: contacts = [] } = useQuery<Contact[]>({
    queryKey: ['/api/contacts'],
  });

  const scoreContactMutation = useMutation({
    mutationFn: async (contactId: string) => {
      return await apiRequest('POST', `/api/ai/lead-score/${contactId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/ai/lead-scores'] });
      toast({
        title: 'Lead scored successfully',
        description: 'AI has analyzed this contact and assigned a quality score.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error scoring lead',
        description: error.message || 'Failed to calculate lead score',
        variant: 'destructive',
      });
    },
  });

  const generateForecastMutation = useMutation({
    mutationFn: async () => {
      const period = new Date().toISOString().slice(0, 7);
      return await apiRequest('POST', '/api/ai/forecast', { period });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/ai/forecasts'] });
      toast({
        title: 'Forecast generated',
        description: 'AI has predicted your upcoming revenue based on pipeline data.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error generating forecast',
        description: error.message || 'Failed to generate forecast',
        variant: 'destructive',
      });
    },
  });

  const generateRecommendationsMutation = useMutation({
    mutationFn: async (contactId: string) => {
      return await apiRequest('POST', `/api/ai/recommendations/${contactId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/ai/recommendations'] });
      toast({
        title: 'Recommendations generated',
        description: 'AI has suggested next best actions for this contact.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error generating recommendations',
        description: error.message || 'Failed to generate recommendations',
        variant: 'destructive',
      });
    },
  });

  const completeRecommendationMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest('PATCH', `/api/ai/recommendations/${id}`, { 
        isCompleted: true, 
        completedAt: new Date() 
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/ai/recommendations'] });
    },
  });

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-blue-500';
    if (score >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getPriorityColor = (priority: number) => {
    if (priority === 1) return 'destructive';
    if (priority === 2) return 'default';
    return 'secondary';
  };

  return (
    <div className="container mx-auto p-6 space-y-6" data-testid="page-ai-insights">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2" data-testid="heading-ai-insights">
            <Brain className="h-8 w-8" />
            AI Insights
          </h1>
          <p className="text-muted-foreground mt-1">
            AI-powered lead scoring, forecasting, and recommendations
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Lead Scores Card */}
        <Card data-testid="card-lead-scores">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Lead Scores
            </CardTitle>
            <CardDescription>AI-analyzed contact quality scores</CardDescription>
          </CardHeader>
          <CardContent>
            {scoresLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading scores...</div>
            ) : leadScores.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">No lead scores yet</p>
                <select
                  className="border rounded px-3 py-2 mb-2 w-full"
                  onChange={(e) => e.target.value && scoreContactMutation.mutate(e.target.value)}
                  data-testid="select-contact-score"
                >
                  <option value="">Score a contact...</option>
                  {contacts.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.firstName} {c.lastName}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="space-y-3">
                {leadScores.slice(0, 5).map((score) => (
                  <div key={score.id} className="flex items-center justify-between" data-testid={`lead-score-${score.id}`}>
                    <div>
                      <div className="font-medium">{score.contact?.firstName} {score.contact?.lastName}</div>
                      <div className="text-sm text-muted-foreground">{score.contact?.email}</div>
                    </div>
                    <Badge className={getScoreColor(score.score)} data-testid={`score-${score.id}`}>{score.score}</Badge>
                  </div>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full mt-2"
                  onClick={() => {
                    const contact = contacts[0];
                    if (contact) scoreContactMutation.mutate(contact.id);
                  }}
                  disabled={scoreContactMutation.isPending || contacts.length === 0}
                  data-testid="button-calculate-score"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Calculate Score
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Sales Forecasts Card */}
        <Card data-testid="card-forecasts">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Sales Forecast
            </CardTitle>
            <CardDescription>AI-predicted revenue projections</CardDescription>
          </CardHeader>
          <CardContent>
            {forecastsLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading forecast...</div>
            ) : forecasts.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">No forecasts generated yet</p>
                <Button
                  onClick={() => generateForecastMutation.mutate()}
                  disabled={generateForecastMutation.isPending}
                  data-testid="button-generate-forecast"
                >
                  Generate Forecast
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {forecasts.slice(0, 3).map((forecast) => (
                  <div key={forecast.id} className="border rounded-lg p-4" data-testid={`forecast-${forecast.id}`}>
                    <div className="flex justify-between items-start mb-2">
                      <div className="text-sm text-muted-foreground">{forecast.period}</div>
                      <Badge variant="outline" data-testid={`confidence-${forecast.id}`}>{forecast.confidence}% confidence</Badge>
                    </div>
                    <div className="text-2xl font-bold" data-testid={`revenue-${forecast.id}`}>
                      ${Number(forecast.predictedRevenue).toLocaleString()}
                    </div>
                    {forecast.factors && typeof forecast.factors === 'object' && 'reasoning' in forecast.factors && (
                      <p className="text-sm text-muted-foreground mt-2">
                        {String((forecast.factors as { reasoning?: string }).reasoning || '')}
                      </p>
                    )}
                  </div>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => generateForecastMutation.mutate()}
                  disabled={generateForecastMutation.isPending}
                  data-testid="button-refresh-forecast"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh Forecast
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recommendations Card */}
        <Card data-testid="card-recommendations">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5" />
              Smart Recommendations
            </CardTitle>
            <CardDescription>AI-suggested next actions</CardDescription>
          </CardHeader>
          <CardContent>
            {recsLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading recommendations...</div>
            ) : recommendations.filter(r => !r.isCompleted).length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">No recommendations yet</p>
                <select
                  className="border rounded px-3 py-2 mb-2 w-full"
                  onChange={(e) => e.target.value && generateRecommendationsMutation.mutate(e.target.value)}
                  data-testid="select-contact-recommend"
                >
                  <option value="">Generate for contact...</option>
                  {contacts.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.firstName} {c.lastName}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="space-y-3">
                {recommendations
                  .filter(r => !r.isCompleted)
                  .slice(0, 5)
                  .map((rec) => (
                    <div key={rec.id} className="border rounded-lg p-3" data-testid={`recommendation-${rec.id}`}>
                      <div className="flex justify-between items-start mb-2">
                        <div className="font-medium text-sm">{rec.title}</div>
                        <Badge variant={getPriorityColor(rec.priority)} data-testid={`priority-${rec.id}`}>
                          P{rec.priority}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{rec.description}</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => completeRecommendationMutation.mutate(rec.id)}
                        data-testid={`button-complete-${rec.id}`}
                      >
                        Mark Complete
                      </Button>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
