import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { 
  Phone, 
  Mail, 
  Calendar, 
  CheckSquare, 
  FileText, 
  UserPlus,
  Handshake
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import type { Activity, Contact, Deal } from "@shared/schema";

type ActivityWithRelations = Activity & { contact?: Contact; deal?: Deal };

export default function RecentActivity() {
  const { data: activities, isLoading: activitiesLoading } = useQuery<ActivityWithRelations[]>({
    queryKey: ["/api/dashboard/recent-activities"],
    retry: false,
  });

  const { data: upcomingTasks, isLoading: tasksLoading } = useQuery<ActivityWithRelations[]>({
    queryKey: ["/api/dashboard/upcoming-tasks"],
    retry: false,
  });

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'call': return Phone;
      case 'email': return Mail;
      case 'meeting': return Calendar;
      case 'task': return CheckSquare;
      case 'note': return FileText;
      default: return Calendar;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'call': return 'text-chart-2 bg-chart-2/10';
      case 'email': return 'text-chart-3 bg-chart-3/10';
      case 'meeting': return 'text-chart-1 bg-chart-1/10';
      case 'task': return 'text-chart-4 bg-chart-4/10';
      case 'note': return 'text-chart-5 bg-chart-5/10';
      default: return 'text-muted-foreground bg-muted/10';
    }
  };

  const getPriorityColor = (type: string) => {
    // Simple priority assignment based on type for demo
    switch (type) {
      case 'call':
      case 'meeting':
        return 'bg-chart-3 text-white';
      case 'email':
        return 'bg-chart-2 text-white';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getPriorityLabel = (type: string) => {
    switch (type) {
      case 'call':
      case 'meeting':
        return 'High';
      case 'email':
        return 'Medium';
      default:
        return 'Low';
    }
  };

  return (
    <div className="space-y-6">
      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {activitiesLoading ? (
            <div className="space-y-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex items-start space-x-3 animate-pulse">
                  <div className="w-8 h-8 bg-muted rounded-full"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted rounded w-3/4"></div>
                    <div className="h-3 bg-muted rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : activities && activities.length > 0 ? (
            <div className="space-y-4">
              {activities.slice(0, 4).map((activity) => {
                const Icon = getActivityIcon(activity.type);
                const colorClasses = getActivityColor(activity.type);
                
                return (
                  <div key={activity.id} className="flex items-start space-x-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${colorClasses}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm">
                        <span className="font-medium">{activity.subject}</span>
                        {activity.contact && (
                          <span> with <span className="font-medium">
                            {activity.contact.firstName} {activity.contact.lastName}
                          </span></span>
                        )}
                        {activity.deal && (
                          <span> for <span className="font-medium">{activity.deal.title}</span></span>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {activity.createdAt ? formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true }) : 'Unknown time'}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              <Calendar className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No recent activities</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upcoming Tasks */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Upcoming Tasks</CardTitle>
            <Button variant="link" className="text-primary hover:text-primary/80 text-sm font-medium p-0">
              View All
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {tasksLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center space-x-3 p-3 bg-background rounded-lg animate-pulse">
                  <div className="w-4 h-4 bg-muted rounded"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted rounded w-3/4"></div>
                    <div className="h-3 bg-muted rounded w-1/2"></div>
                  </div>
                  <div className="w-12 h-6 bg-muted rounded"></div>
                </div>
              ))}
            </div>
          ) : upcomingTasks && upcomingTasks.length > 0 ? (
            <div className="space-y-3">
              {upcomingTasks.slice(0, 3).map((task) => (
                <div 
                  key={task.id} 
                  className="flex items-center space-x-3 p-3 bg-background rounded-lg border"
                  data-testid={`task-${task.id}`}
                >
                  <Checkbox 
                    checked={task.isCompleted}
                    className="w-4 h-4"
                    data-testid={`task-checkbox-${task.id}`}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{task.subject}</p>
                    <p className="text-xs text-muted-foreground">
                      {task.scheduledAt 
                        ? `Due ${format(new Date(task.scheduledAt), "MMM d 'at' h:mm a")}`
                        : "No due date"
                      }
                    </p>
                  </div>
                  <Badge 
                    className={`text-xs px-2 py-1 rounded ${getPriorityColor(task.type)}`}
                  >
                    {getPriorityLabel(task.type)}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              <CheckSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No upcoming tasks</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
