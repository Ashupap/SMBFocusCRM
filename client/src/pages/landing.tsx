import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, Users, Mail, Target, TrendingUp, Shield, Sparkles, Zap, Brain, LineChart, Settings, Lock } from "lucide-react";
import { motion, useInView } from "framer-motion";
import { useRef, useEffect, useState } from "react";

const AnimatedCounter = ({ end, duration = 2 }: { end: number; duration?: number }) => {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (!isInView) return;
    
    let startTime: number | null = null;
    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / (duration * 1000), 1);
      
      setCount(Math.floor(progress * end));
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    requestAnimationFrame(animate);
  }, [isInView, end, duration]);

  return <span ref={ref}>{count}</span>;
};

export default function Landing() {
  const handleLogin = () => {
    window.location.href = "/auth/login";
  };

  const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  const fadeInScale = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: { opacity: 1, scale: 1 }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  return (
    <div className="min-h-screen overflow-hidden bg-gradient-to-br from-background via-background to-primary/5 relative">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl"
          animate={{
            x: [0, 100, 0],
            y: [0, 50, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute bottom-20 right-10 w-96 h-96 bg-chart-2/10 rounded-full blur-3xl"
          animate={{
            x: [0, -100, 0],
            y: [0, -50, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute top-1/2 left-1/2 w-64 h-64 bg-chart-3/10 rounded-full blur-3xl"
          animate={{
            x: [-100, 100, -100],
            y: [-50, 50, -50],
          }}
          transition={{
            duration: 30,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </div>

      {/* Hero Section */}
      <div className="container mx-auto px-4 py-20 relative z-10">
        <motion.div 
          className="text-center space-y-8"
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
        >
          <motion.div 
            className="flex items-center justify-center space-x-3 mb-8"
            variants={fadeInScale}
            transition={{ duration: 0.6 }}
          >
            <motion.div 
              className="w-16 h-16 bg-gradient-to-br from-primary to-chart-2 rounded-2xl flex items-center justify-center shadow-lg"
              whileHover={{ scale: 1.1, rotate: 5 }}
              transition={{ type: "spring", stiffness: 400 }}
            >
              <Users className="w-8 h-8 text-primary-foreground" />
            </motion.div>
            <div>
              <h1 className="text-5xl font-bold bg-gradient-to-r from-primary via-chart-2 to-chart-3 bg-clip-text text-transparent">
                CRM Pro
              </h1>
              <p className="text-lg text-muted-foreground">Sales & Marketing Platform</p>
            </div>
          </motion.div>

          <motion.div 
            className="max-w-4xl mx-auto space-y-6"
            variants={fadeInUp}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-6xl md:text-7xl font-bold tracking-tight">
              <span className="bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent">
                Transform Your
              </span>
              <br />
              <span className="bg-gradient-to-r from-chart-2 via-chart-3 to-primary bg-clip-text text-transparent">
                Customer Relationships
              </span>
            </h2>
            <motion.p 
              className="text-xl md:text-2xl text-muted-foreground leading-relaxed max-w-3xl mx-auto"
              variants={fadeInUp}
            >
              Streamline your sales process with AI-powered automation, advanced analytics, and intelligent workflows designed for modern businesses.
            </motion.p>
          </motion.div>

          <motion.div 
            className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-8"
            variants={fadeInUp}
          >
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button 
                size="lg" 
                onClick={handleLogin}
                className="px-10 py-6 text-lg bg-gradient-to-r from-primary to-chart-2 hover:from-primary/90 hover:to-chart-2/90 shadow-lg shadow-primary/25"
                data-testid="button-login"
              >
                <Sparkles className="w-5 h-5 mr-2" />
                Get Started Free
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button variant="outline" size="lg" className="px-10 py-6 text-lg border-2">
                <Zap className="w-5 h-5 mr-2" />
                Watch Demo
              </Button>
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Floating Feature Pills */}
        <motion.div 
          className="flex flex-wrap justify-center gap-4 mt-16"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          {[
            { icon: Brain, text: "AI-Powered", color: "from-purple-500 to-pink-500" },
            { icon: LineChart, text: "Advanced Analytics", color: "from-blue-500 to-cyan-500" },
            { icon: Zap, text: "Workflow Automation", color: "from-orange-500 to-yellow-500" },
            { icon: Lock, text: "Enterprise Security", color: "from-green-500 to-emerald-500" }
          ].map((item, index) => (
            <motion.div
              key={index}
              className={`px-6 py-3 rounded-full bg-gradient-to-r ${item.color} bg-opacity-10 backdrop-blur-sm border border-white/10 flex items-center gap-2`}
              whileHover={{ scale: 1.1, y: -5 }}
              transition={{ type: "spring", stiffness: 400 }}
            >
              <item.icon className="w-4 h-4 text-white" />
              <span className="text-sm font-semibold text-white">{item.text}</span>
            </motion.div>
          ))}
        </motion.div>

        {/* Features Grid */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-32"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={staggerContainer}
        >
          {[
            {
              icon: BarChart3,
              title: "Visual Sales Pipeline",
              description: "Drag-and-drop Kanban board with AI-powered deal insights and forecasting",
              color: "from-blue-500 to-cyan-500",
              bgColor: "bg-blue-500/10"
            },
            {
              icon: Users,
              title: "Smart Contact Management",
              description: "360° customer profiles with AI lead scoring and relationship intelligence",
              color: "from-purple-500 to-pink-500",
              bgColor: "bg-purple-500/10"
            },
            {
              icon: Mail,
              title: "Email Automation",
              description: "AI-generated templates, sequences, and campaign analytics",
              color: "from-orange-500 to-red-500",
              bgColor: "bg-orange-500/10"
            },
            {
              icon: Target,
              title: "Activity Tracking",
              description: "Smart scheduling with automated follow-ups and reminders",
              color: "from-green-500 to-emerald-500",
              bgColor: "bg-green-500/10"
            },
            {
              icon: TrendingUp,
              title: "Advanced Analytics",
              description: "Real-time dashboards with pipeline metrics and team performance",
              color: "from-yellow-500 to-orange-500",
              bgColor: "bg-yellow-500/10"
            },
            {
              icon: Shield,
              title: "Enterprise Security",
              description: "Role-based access, API keys, and comprehensive audit logs",
              color: "from-indigo-500 to-purple-500",
              bgColor: "bg-indigo-500/10"
            }
          ].map((feature, index) => (
            <motion.div key={index} variants={fadeInUp}>
              <motion.div
                whileHover={{ y: -10, scale: 1.02 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <Card className="border-2 border-border/50 hover:border-primary/30 transition-all duration-300 bg-card/50 backdrop-blur-sm h-full overflow-hidden group">
                  <CardHeader>
                    <motion.div 
                      className={`w-14 h-14 ${feature.bgColor} rounded-xl flex items-center justify-center mb-4 relative`}
                      whileHover={{ rotate: 360 }}
                      transition={{ duration: 0.6 }}
                    >
                      <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-100 transition-opacity rounded-xl`} />
                      <feature.icon className={`w-7 h-7 bg-gradient-to-br ${feature.color} bg-clip-text text-transparent relative z-10`} />
                    </motion.div>
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                    <CardDescription className="text-base">
                      {feature.description}
                    </CardDescription>
                  </CardHeader>
                </Card>
              </motion.div>
            </motion.div>
          ))}
        </motion.div>

        {/* Stats Section */}
        <motion.div 
          className="bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-xl rounded-3xl border border-border/50 p-12 mt-32 relative overflow-hidden"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />
          
          <div className="text-center mb-12 relative z-10">
            <motion.h3 
              className="text-4xl font-bold bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent mb-4"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              Trusted by Growing Businesses
            </motion.h3>
            <motion.p 
              className="text-xl text-muted-foreground"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
            >
              Join thousands of companies that have transformed their sales process
            </motion.p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative z-10">
            {[
              { end: 500, suffix: "+", label: "Companies Using CRM Pro", color: "from-primary to-chart-2" },
              { end: 85, suffix: "%", label: "Average Sales Increase", color: "from-chart-2 to-chart-3" },
              { end: 24, suffix: "/7", label: "Customer Support", color: "from-chart-3 to-chart-4" }
            ].map((stat, index) => (
              <motion.div 
                key={index}
                className="text-center"
                initial={{ opacity: 0, scale: 0.5 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, type: "spring", stiffness: 200 }}
              >
                <motion.div 
                  className={`text-6xl font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent mb-3`}
                  whileHover={{ scale: 1.1 }}
                >
                  <AnimatedCounter end={stat.end} />
                  {stat.suffix}
                </motion.div>
                <div className="text-muted-foreground text-lg">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Advanced Features Showcase */}
        <motion.div
          className="mt-32"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <div className="text-center mb-16">
            <motion.h3 
              className="text-4xl font-bold mb-4"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <span className="bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">
                Powerful Features for Modern Sales Teams
              </span>
            </motion.h3>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {[
              {
                title: "AI-Powered Automation",
                features: ["Lead Scoring", "Sales Forecasting", "Smart Recommendations", "Email Generation"],
                gradient: "from-purple-500/10 to-pink-500/10"
              },
              {
                title: "Advanced Analytics",
                features: ["Pipeline Velocity", "Conversion Tracking", "Bottleneck Detection", "Team Performance"],
                gradient: "from-blue-500/10 to-cyan-500/10"
              },
              {
                title: "Workflow Management",
                features: ["Approval Routing", "Custom Dashboards", "Email Sequences", "Task Automation"],
                gradient: "from-orange-500/10 to-yellow-500/10"
              },
              {
                title: "Integration & API",
                features: ["REST API", "Swagger Docs", "API Keys", "Webhooks"],
                gradient: "from-green-500/10 to-emerald-500/10"
              }
            ].map((section, index) => (
              <motion.div
                key={index}
                className={`p-8 rounded-2xl bg-gradient-to-br ${section.gradient} border border-border/50 backdrop-blur-sm`}
                initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.02 }}
              >
                <h4 className="text-2xl font-bold mb-6 flex items-center gap-3">
                  <Settings className="w-6 h-6 text-primary" />
                  {section.title}
                </h4>
                <ul className="space-y-3">
                  {section.features.map((feature, idx) => (
                    <motion.li 
                      key={idx}
                      className="flex items-center gap-3 text-muted-foreground"
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.1 + idx * 0.05 }}
                    >
                      <div className="w-2 h-2 rounded-full bg-gradient-to-r from-primary to-chart-2" />
                      {feature}
                    </motion.li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* CTA Section */}
        <motion.div 
          className="text-center py-32"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <motion.div
            animate={{
              scale: [1, 1.05, 1],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <h3 className="text-5xl font-bold mb-6">
              <span className="bg-gradient-to-r from-foreground via-primary to-chart-2 bg-clip-text text-transparent">
                Ready to Transform Your Sales?
              </span>
            </h3>
          </motion.div>
          <motion.p 
            className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            Start your journey today and join thousands of businesses using AI-powered CRM to close more deals and build stronger relationships.
          </motion.p>
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button 
              size="lg" 
              onClick={handleLogin}
              className="px-16 py-7 text-xl bg-gradient-to-r from-primary via-chart-2 to-primary bg-size-200 bg-pos-0 hover:bg-pos-100 transition-all duration-500 shadow-2xl shadow-primary/30"
              data-testid="button-cta-login"
            >
              <Sparkles className="w-6 h-6 mr-2" />
              Start Free Trial
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
