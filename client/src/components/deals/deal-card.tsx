import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import type { Deal, Contact, Company } from "@shared/schema";
import { formatCurrency } from "@/lib/currency";

interface DealCardProps {
  deal: Deal & { contact?: Contact; company?: Company };
  onStageChange?: (dealId: string, newStage: string) => void;
  showStageSelector?: boolean;
}

export default function DealCard({ deal, onStageChange, showStageSelector = false }: DealCardProps) {
  const handleStageChange = (newStage: string) => {
    if (onStageChange) {
      onStageChange(deal.id, newStage);
    }
  };

  const getProbabilityColor = (probability: number) => {
    if (probability >= 80) return 'text-chart-2';
    if (probability >= 50) return 'text-chart-3';
    if (probability >= 25) return 'text-chart-4';
    return 'text-muted-foreground';
  };

  return (
    <Card className="cursor-pointer hover:border-primary transition-colors" data-testid={`deal-card-${deal.id}`}>
      <CardContent className="p-3 space-y-2">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate">{deal.title}</p>
            <p className="text-xs text-muted-foreground truncate">
              {deal.company?.name || deal.contact ? 
                `${deal.company?.name || ''} ${deal.contact ? `- ${deal.contact.firstName} ${deal.contact.lastName}` : ''}`.trim()
                : 'No contact'
              }
            </p>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-chart-1">
            {formatCurrency(deal.value)}
          </p>
          <Badge variant="outline" className={`text-xs ${getProbabilityColor(deal.probability)}`}>
            {deal.probability}%
          </Badge>
        </div>

        {deal.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">
            {deal.description}
          </p>
        )}

        {showStageSelector && (
          <div className="pt-2 border-t">
            <Select value={deal.stage} onValueChange={handleStageChange}>
              <SelectTrigger className="h-7 text-xs" data-testid={`select-deal-stage-${deal.id}`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="prospecting">Prospecting</SelectItem>
                <SelectItem value="qualification">Qualification</SelectItem>
                <SelectItem value="proposal">Proposal</SelectItem>
                <SelectItem value="closing">Closing</SelectItem>
                <SelectItem value="won">Won</SelectItem>
                <SelectItem value="lost">Lost</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
