import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, Users, Mail, Target, TrendingUp, Shield } from "lucide-react";

export default function Landing() {
  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center space-y-8">
          <div className="flex items-center justify-center space-x-3 mb-8">
            <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-foreground">CRM Pro</h1>
              <p className="text-lg text-muted-foreground">Sales & Marketing Platform</p>
            </div>
          </div>

          <div className="max-w-3xl mx-auto space-y-6">
            <h2 className="text-5xl font-bold tracking-tight text-foreground">
              Transform Your Customer Relationships
            </h2>
            <p className="text-xl text-muted-foreground leading-relaxed">
              Streamline your sales process, track customer interactions, and grow your business with our comprehensive CRM platform designed for small and medium businesses.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-8">
            <Button 
              size="lg" 
              onClick={handleLogin}
              className="px-8 py-3 text-lg"
              data-testid="button-login"
            >
              Get Started
            </Button>
            <Button variant="outline" size="lg" className="px-8 py-3 text-lg">
              Watch Demo
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-24">
          <Card className="border-2 hover:border-primary/20 transition-colors">
            <CardHeader>
              <div className="w-12 h-12 bg-chart-1/10 rounded-lg flex items-center justify-center mb-4">
                <BarChart3 className="w-6 h-6 text-chart-1" />
              </div>
              <CardTitle>Sales Pipeline</CardTitle>
              <CardDescription>
                Visual Kanban board to track deals through every stage of your sales process
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-2 hover:border-primary/20 transition-colors">
            <CardHeader>
              <div className="w-12 h-12 bg-chart-2/10 rounded-lg flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-chart-2" />
              </div>
              <CardTitle>Contact Management</CardTitle>
              <CardDescription>
                Store detailed customer profiles and track all interactions in one place
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-2 hover:border-primary/20 transition-colors">
            <CardHeader>
              <div className="w-12 h-12 bg-chart-3/10 rounded-lg flex items-center justify-center mb-4">
                <Mail className="w-6 h-6 text-chart-3" />
              </div>
              <CardTitle>Email Campaigns</CardTitle>
              <CardDescription>
                Create and send targeted email campaigns with templates and tracking
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-2 hover:border-primary/20 transition-colors">
            <CardHeader>
              <div className="w-12 h-12 bg-chart-4/10 rounded-lg flex items-center justify-center mb-4">
                <Target className="w-6 h-6 text-chart-4" />
              </div>
              <CardTitle>Activity Tracking</CardTitle>
              <CardDescription>
                Schedule calls, meetings, and follow-ups with automated reminders
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-2 hover:border-primary/20 transition-colors">
            <CardHeader>
              <div className="w-12 h-12 bg-chart-5/10 rounded-lg flex items-center justify-center mb-4">
                <TrendingUp className="w-6 h-6 text-chart-5" />
              </div>
              <CardTitle>Analytics & Reports</CardTitle>
              <CardDescription>
                Comprehensive dashboards and insights to track your sales performance
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-2 hover:border-primary/20 transition-colors">
            <CardHeader>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-primary" />
              </div>
              <CardTitle>Secure & Reliable</CardTitle>
              <CardDescription>
                Enterprise-grade security with role-based access and data protection
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Stats Section */}
        <div className="bg-card rounded-2xl border p-12 mt-24">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-foreground mb-4">
              Trusted by Growing Businesses
            </h3>
            <p className="text-lg text-muted-foreground">
              Join thousands of companies that have transformed their sales process
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-4xl font-bold text-primary mb-2">500+</div>
              <div className="text-muted-foreground">Companies Using CRM Pro</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-chart-2 mb-2">85%</div>
              <div className="text-muted-foreground">Average Sales Increase</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-chart-3 mb-2">24/7</div>
              <div className="text-muted-foreground">Customer Support</div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center py-24">
          <h3 className="text-3xl font-bold text-foreground mb-6">
            Ready to grow your business?
          </h3>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Start your free trial today and see how CRM Pro can help you close more deals and build stronger customer relationships.
          </p>
          <Button 
            size="lg" 
            onClick={handleLogin}
            className="px-12 py-4 text-lg"
            data-testid="button-cta-login"
          >
            Start Free Trial
          </Button>
        </div>
      </div>
    </div>
  );
}
