import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, Bell } from "lucide-react";

interface HeaderProps {
  title: string;
  description: string;
  onNewAction?: () => void;
  newActionLabel?: string;
}

export default function Header({ 
  title, 
  description, 
  onNewAction, 
  newActionLabel = "New Deal" 
}: HeaderProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Implement search functionality
    console.log("Search query:", searchQuery);
  };

  return (
    <header className="bg-card border-b border-border px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">{title}</h1>
          <p className="text-muted-foreground">{description}</p>
        </div>

        <div className="flex items-center space-x-4">
          <form onSubmit={handleSearch} className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="w-4 h-4 text-muted-foreground" />
            </div>
            <Input
              type="text"
              placeholder="Search contacts, deals..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 w-64"
              data-testid="input-search"
            />
          </form>

          {onNewAction && (
            <Button 
              onClick={onNewAction}
              className="flex items-center space-x-2"
              data-testid="button-new-action"
            >
              <Plus className="w-4 h-4" />
              <span>{newActionLabel}</span>
            </Button>
          )}

          <div className="relative">
            <Button
              variant="ghost"
              size="sm"
              className="p-2 text-muted-foreground hover:text-foreground relative"
              data-testid="button-notifications"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-destructive rounded-full text-xs"></span>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
