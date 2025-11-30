import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { IndianRupee, Handshake, Percent, Users } from "lucide-react";
import type { DashboardMetrics } from "@shared/schema";
import { formatCurrency } from "@/lib/currency";

export default function MetricsCards() {
  const { data: metrics, isLoading } = useQuery<DashboardMetrics>({
    queryKey: ["/api/dashboard/metrics"],
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-16 bg-muted rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const metricCards = [
    {
      title: "Total Revenue",
      value: formatCurrency(metrics?.totalRevenue || 0),
      change: `+${metrics?.revenueGrowth || 0}%`,
      changeLabel: "from last month",
      icon: IndianRupee,
      iconColor: "text-chart-1",
      iconBg: "bg-chart-1/10",
      testId: "metric-total-revenue",
    },
    {
      title: "Active Deals",
      value: metrics?.activeDeals.toString() || '0',
      change: `+${metrics?.newDealsThisWeek || 0}`,
      changeLabel: "new this week",
      icon: Handshake,
      iconColor: "text-chart-2",
      iconBg: "bg-chart-2/10",
      testId: "metric-active-deals",
    },
    {
      title: "Conversion Rate",
      value: `${metrics?.conversionRate.toFixed(1) || '0'}%`,
      change: `+${metrics?.conversionGrowth || 0}%`,
      changeLabel: "from last quarter",
      icon: Percent,
      iconColor: "text-chart-3",
      iconBg: "bg-chart-3/10",
      testId: "metric-conversion-rate",
    },
    {
      title: "Total Contacts",
      value: metrics?.totalContacts.toLocaleString() || '0',
      change: `+${metrics?.newContactsThisWeek || 0}`,
      changeLabel: "new this week",
      icon: Users,
      iconColor: "text-chart-4",
      iconBg: "bg-chart-4/10",
      testId: "metric-total-contacts",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {metricCards.map((metric) => (
        <Card key={metric.title} className="border border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {metric.title}
                </p>
                <p 
                  className="text-2xl font-bold text-foreground"
                  data-testid={metric.testId}
                >
                  {metric.value}
                </p>
              </div>
              <div className={`w-12 h-12 ${metric.iconBg} rounded-lg flex items-center justify-center`}>
                <metric.icon className={`w-6 h-6 ${metric.iconColor}`} />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className="text-chart-2 font-medium">{metric.change}</span>
              <span className="text-muted-foreground ml-1">{metric.changeLabel}</span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
