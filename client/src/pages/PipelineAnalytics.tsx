import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, AlertTriangle, Award, Activity, DollarSign } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { User } from '@shared/schema';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function PipelineAnalytics() {
  const [timePeriod, setTimePeriod] = useState('30');

  const { data: conversionData = [] } = useQuery({
    queryKey: ['/api/analytics/pipeline-conversion', { timePeriod }],
    queryFn: async () => {
      const params = timePeriod !== 'all' ? `?startDate=${new Date(Date.now() - Number(timePeriod) * 24 * 60 * 60 * 1000).toISOString()}` : '';
      const res = await fetch(`/api/analytics/pipeline-conversion${params}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` },
      });
      return await res.json();
    },
  });

  const { data: velocityData = [] } = useQuery({
    queryKey: ['/api/analytics/pipeline-velocity'],
    queryFn: async () => {
      const res = await fetch('/api/analytics/pipeline-velocity', {
        headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` },
      });
      return await res.json();
    },
  });

  const { data: bottleneckData = [] } = useQuery({
    queryKey: ['/api/analytics/pipeline-bottlenecks'],
    queryFn: async () => {
      const res = await fetch('/api/analytics/pipeline-bottlenecks', {
        headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` },
      });
      return await res.json();
    },
  });

  const { data: winLossData = [] } = useQuery({
    queryKey: ['/api/analytics/win-loss', { timePeriod }],
    queryFn: async () => {
      const params = timePeriod !== 'all' ? `?startDate=${new Date(Date.now() - Number(timePeriod) * 24 * 60 * 60 * 1000).toISOString()}` : '';
      const res = await fetch(`/api/analytics/win-loss${params}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` },
      });
      return await res.json();
    },
  });

  const { data: leaderboardData = [] } = useQuery({
    queryKey: ['/api/analytics/team-leaderboard', { timePeriod }],
    queryFn: async () => {
      const params = timePeriod !== 'all' ? `?period=${new Date(Date.now() - Number(timePeriod) * 24 * 60 * 60 * 1000).toISOString()}` : '';
      const res = await fetch(`/api/analytics/team-leaderboard${params}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` },
      });
      return await res.json();
    },
  });

  const { data: users = [] } = useQuery<User[]>({
    queryKey: ['/api/users'],
  });

  const getUserName = (userId: string) => {
    const user = users.find(u => u.id === userId);
    return user ? `${user.firstName} ${user.lastName}` : 'Unknown';
  };

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold mb-2">Pipeline Analytics</h1>
            <p className="text-muted-foreground">
              Advanced insights into your sales pipeline performance
            </p>
          </div>
          <Select value={timePeriod} onValueChange={setTimePeriod}>
            <SelectTrigger className="w-[180px]" data-testid="select-time-period">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
              <SelectItem value="all">All time</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Tabs defaultValue="conversion" className="space-y-6">
          <TabsList>
            <TabsTrigger value="conversion" data-testid="tab-conversion">
              Conversion Rates
            </TabsTrigger>
            <TabsTrigger value="velocity" data-testid="tab-velocity">
              Pipeline Velocity
            </TabsTrigger>
            <TabsTrigger value="bottlenecks" data-testid="tab-bottlenecks">
              Bottlenecks
            </TabsTrigger>
            <TabsTrigger value="performance" data-testid="tab-performance">
              Team Performance
            </TabsTrigger>
          </TabsList>

          <TabsContent value="conversion" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card data-testid="card-conversion-chart">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Stage Conversion Rates
                  </CardTitle>
                  <CardDescription>Percentage of deals in each stage</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={conversionData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="stage" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="conversionRate" fill="#8884d8" name="Conversion Rate (%)" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card data-testid="card-win-loss">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Win/Loss Analysis
                  </CardTitle>
                  <CardDescription>Deal outcomes distribution</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={winLossData}
                        dataKey="count"
                        nameKey="stage"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        label
                      >
                        {winLossData.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="velocity" className="space-y-4">
            <Card data-testid="card-velocity-chart">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Average Days in Each Stage
                </CardTitle>
                <CardDescription>Pipeline velocity metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={velocityData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="stage" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="avgDays" stroke="#8884d8" name="Avg Days" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="bottlenecks" className="space-y-4">
            <Card data-testid="card-bottlenecks">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Pipeline Bottlenecks
                </CardTitle>
                <CardDescription>Stages requiring attention</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {bottleneckData.slice(0, 5).map((bottleneck: any, index: number) => (
                    <div
                      key={bottleneck.stage}
                      className="flex items-center justify-between p-4 border rounded-lg"
                      data-testid={`bottleneck-${index}`}
                    >
                      <div className="flex-1">
                        <div className="font-medium">{bottleneck.stage}</div>
                        <div className="text-sm text-muted-foreground">
                          {bottleneck.dealCount} deals • Avg {Math.round(bottleneck.avgDaysInStage)} days
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={index === 0 ? 'destructive' : index === 1 ? 'default' : 'secondary'}>
                          Score: {Math.round(bottleneck.bottleneckScore)}
                        </Badge>
                        {index === 0 && <AlertTriangle className="h-4 w-4 text-destructive" />}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="performance" className="space-y-4">
            <Card data-testid="card-leaderboard">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  Sales Team Leaderboard
                </CardTitle>
                <CardDescription>Top performers by revenue</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {leaderboardData.map((entry: any, index: number) => (
                    <div
                      key={entry.userId}
                      className="flex items-center gap-4 p-4 border rounded-lg"
                      data-testid={`leaderboard-${index}`}
                    >
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 font-bold">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">{getUserName(entry.userId)}</div>
                        <div className="text-sm text-muted-foreground">
                          {entry.dealsWon} deals won
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold flex items-center gap-1">
                          <DollarSign className="h-4 w-4" />
                          {Number(entry.totalRevenue).toLocaleString()}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Avg: ${Number(entry.avgDealSize || 0).toLocaleString()}
                        </div>
                      </div>
                      {index === 0 && (
                        <Award className="h-5 w-5 text-yellow-500" />
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
