import { useLocation, Link } from "wouter";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import type { User } from "@shared/schema";
import { 
  BarChart3, 
  Users, 
  Handshake, 
  Calendar, 
  Mail, 
  FileBarChart, 
  UserCheck, 
  Settings,
  MoreVertical
} from "lucide-react";
import { Button } from "@/components/ui/button";

const navigation = [
  { name: "Dashboard", href: "/", icon: BarChart3 },
  { name: "Contacts", href: "/contacts", icon: Users },
  { name: "Deals", href: "/deals", icon: Handshake },
  { name: "Activities", href: "/activities", icon: Calendar },
  { name: "Email Campaigns", href: "/campaigns", icon: Mail },
  { name: "Reports", href: "/reports", icon: FileBarChart },
];

const settingsNavigation = [
  { name: "Team", href: "/team", icon: UserCheck },
  { name: "Settings", href: "/settings", icon: Settings },
];

export default function Sidebar() {
  const [location] = useLocation();
  const { user, logout } = useAuth() as { user: User | undefined; logout: () => void };

  const handleLogout = () => {
    logout();
  };

  return (
    <aside className="w-64 bg-card border-r border-border flex-shrink-0 flex flex-col">
      {/* Logo Section */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Users className="w-4 h-4 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-foreground">CRM Pro</h1>
            <p className="text-xs text-muted-foreground">Sales & Marketing</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navigation.map((item) => {
          const isActive = location === item.href;
          return (
            <Link key={item.name} href={item.href}>
              <a
                className={cn(
                  "flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  isActive
                    ? "sidebar-active"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
                data-testid={`nav-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
              >
                <item.icon className="w-4 h-4" />
                <span>{item.name}</span>
              </a>
            </Link>
          );
        })}

        <div className="pt-4 border-t border-border mt-4">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 px-3">
            Settings
          </p>
          {settingsNavigation.map((item) => {
            const isActive = location === item.href;
            return (
              <Link key={item.name} href={item.href}>
                <a
                  className={cn(
                    "flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                    isActive
                      ? "sidebar-active"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                  data-testid={`nav-${item.name.toLowerCase()}`}
                >
                  <item.icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </a>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* User Profile */}
      <div className="p-4">
        <div className="bg-muted rounded-lg p-3">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
              <span className="text-primary-foreground text-sm font-medium">
                {user?.firstName?.[0] || ''}{user?.lastName?.[0] || ''}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {user?.firstName || ''} {user?.lastName || ''}
              </p>
              <p className="text-xs text-muted-foreground truncate capitalize">
                {user?.role?.replace('_', ' ') || 'User'}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-muted-foreground hover:text-foreground p-1"
              data-testid="button-logout"
            >
              <MoreVertical className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </aside>
  );
}
