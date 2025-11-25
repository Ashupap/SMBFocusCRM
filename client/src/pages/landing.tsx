import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, Users, Mail, Target, TrendingUp, Shield, Sparkles, Zap, Brain, LineChart, Settings, Lock, Kanban, UserCircle2, Send, CalendarCheck, PieChart, ShieldCheck } from "lucide-react";
import { motion, useScroll, useTransform, useInView, useMotionTemplate } from "framer-motion";
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

// Section with parallax scroll effect
const ParallaxSection = ({ children, offset = 50 }: { children: React.ReactNode; offset?: number }) => {
  const ref = useRef(null);
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 1000], [0, offset]);
  
  return (
    <motion.div ref={ref} style={{ y }}>
      {children}
    </motion.div>
  );
};

// Staggered list animation
const StaggeredContainer = ({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <motion.div 
      ref={ref}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            staggerChildren: 0.12,
            delayChildren: delay,
          }
        }
      }}
    >
      {children}
    </motion.div>
  );
};

// Individual item animation
const StaggerItem = ({ children }: { children: React.ReactNode }) => {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 30 },
        visible: {
          opacity: 1,
          y: 0,
          transition: {
            type: "spring",
            stiffness: 100,
            damping: 12
          }
        }
      }}
    >
      {children}
    </motion.div>
  );
};

export default function Landing() {
  const { scrollY } = useScroll();
  const heroRef = useRef(null);
  
  const handleLogin = () => {
    window.location.href = "/auth/login";
  };

  // Parallax transforms
  const heroParallax = useTransform(scrollY, [0, 300], [0, 100]);
  const heroOpacity = useTransform(scrollY, [0, 400], [1, 0.3]);
  const bgShift1Y = useTransform(scrollY, [0, 800], [0, 300]);
  const bgShift2Y = useTransform(scrollY, [0, 800], [0, -300]);

  return (
    <div className="min-h-screen overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 relative">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-20 left-10 w-96 h-96 bg-primary/20 rounded-full blur-3xl"
          style={{ y: bgShift1Y }}
          animate={{
            scale: [1, 1.15, 1],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute bottom-20 right-10 w-[500px] h-[500px] bg-blue-500/20 rounded-full blur-3xl"
          style={{ y: bgShift2Y }}
          animate={{
            scale: [1, 1.25, 1],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute top-1/2 left-1/2 w-80 h-80 bg-purple-500/15 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            x: [-100, 100, -100],
          }}
          transition={{
            duration: 30,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </div>

      {/* Hero Section */}
      <motion.div 
        ref={heroRef}
        className="container mx-auto px-4 py-20 relative z-10"
        style={{ 
          y: heroParallax,
          opacity: heroOpacity
        }}
      >
        <motion.div 
          className="text-center space-y-8"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, type: "spring" }}
        >
          <motion.div 
            className="flex items-center justify-center space-x-3 mb-8"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.1 }}
          >
            <motion.div 
              className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-2xl shadow-emerald-500/50"
              whileHover={{ scale: 1.1, rotate: 5 }}
              animate={{ boxShadow: ["0 0 20px rgba(16, 185, 129, 0.3)", "0 0 40px rgba(16, 185, 129, 0.5)", "0 0 20px rgba(16, 185, 129, 0.3)"] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Users className="w-8 h-8 text-white" />
            </motion.div>
            <div>
              <h1 className="text-5xl font-bold bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-400 bg-clip-text text-transparent">
                CRM Pro
              </h1>
              <p className="text-lg text-slate-400">Sales & Marketing Platform</p>
            </div>
          </motion.div>

          <motion.div 
            className="max-w-4xl mx-auto space-y-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <h2 className="text-6xl md:text-7xl font-bold tracking-tight">
              <span className="bg-gradient-to-r from-white via-emerald-200 to-white bg-clip-text text-transparent">
                Transform Your
              </span>
              <br />
              <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
                Customer Relationships
              </span>
            </h2>
            <motion.p 
              className="text-xl md:text-2xl text-slate-300 leading-relaxed max-w-3xl mx-auto"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.8 }}
            >
              Streamline your sales process with AI-powered automation, advanced analytics, and intelligent workflows designed for modern businesses.
            </motion.p>
          </motion.div>

          <motion.div 
            className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
          >
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button 
                size="lg" 
                onClick={handleLogin}
                className="px-10 py-6 text-lg bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 shadow-2xl shadow-emerald-500/50 text-white font-semibold"
                data-testid="button-login"
              >
                <Sparkles className="w-5 h-5 mr-2" />
                Get Started Free
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button variant="outline" size="lg" className="px-10 py-6 text-lg border-2 border-emerald-500/50 bg-slate-800/50 text-white hover:bg-emerald-500/10 hover:border-emerald-500 backdrop-blur-sm">
                <Zap className="w-5 h-5 mr-2" />
                Watch Demo
              </Button>
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Floating Feature Pills with scroll reveal */}
        <motion.div 
          className="flex flex-wrap justify-center gap-4 mt-16"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.8 }}
        >
          {[
            { icon: Brain, text: "AI-Powered", color: "from-purple-500 to-pink-500", shadow: "shadow-purple-500/50" },
            { icon: LineChart, text: "Advanced Analytics", color: "from-blue-500 to-cyan-500", shadow: "shadow-blue-500/50" },
            { icon: Zap, text: "Workflow Automation", color: "from-orange-500 to-yellow-500", shadow: "shadow-orange-500/50" },
            { icon: Lock, text: "Enterprise Security", color: "from-emerald-500 to-green-500", shadow: "shadow-emerald-500/50" }
          ].map((item, index) => (
            <motion.div
              key={index}
              className={`px-6 py-3 rounded-full bg-gradient-to-r ${item.color} backdrop-blur-sm border border-white/20 flex items-center gap-2 shadow-lg ${item.shadow}`}
              whileHover={{ scale: 1.1, y: -5 }}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 + index * 0.1, type: "spring", stiffness: 400 }}
            >
              <item.icon className="w-4 h-4 text-white" />
              <span className="text-sm font-semibold text-white">{item.text}</span>
            </motion.div>
          ))}
        </motion.div>

        {/* Features Grid with scroll-triggered animations */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-32"
        >
          <StaggeredContainer delay={0.1}>
            {[
              {
                icon: Kanban,
                title: "Visual Sales Pipeline",
                description: "Drag-and-drop Kanban board with AI-powered deal insights and forecasting",
                color: "from-blue-500 to-cyan-500",
                bgColor: "bg-blue-500/10"
              },
              {
                icon: UserCircle2,
                title: "Smart Contact Management",
                description: "360° customer profiles with AI lead scoring and relationship intelligence",
                color: "from-purple-500 to-pink-500",
                bgColor: "bg-purple-500/10"
              },
              {
                icon: Send,
                title: "Email Automation",
                description: "AI-generated templates, sequences, and campaign analytics",
                color: "from-orange-500 to-red-500",
                bgColor: "bg-orange-500/10"
              },
              {
                icon: CalendarCheck,
                title: "Activity Tracking",
                description: "Smart scheduling with automated follow-ups and reminders",
                color: "from-green-500 to-emerald-500",
                bgColor: "bg-green-500/10"
              },
              {
                icon: PieChart,
                title: "Advanced Analytics",
                description: "Real-time dashboards with pipeline metrics and team performance",
                color: "from-yellow-500 to-orange-500",
                bgColor: "bg-yellow-500/10"
              },
              {
                icon: ShieldCheck,
                title: "Enterprise Security",
                description: "Role-based access, API keys, and comprehensive audit logs",
                color: "from-indigo-500 to-purple-500",
                bgColor: "bg-indigo-500/10"
              }
            ].map((feature, index) => (
              <StaggerItem key={index}>
                <motion.div
                  whileHover={{ y: -12, scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                >
                  <Card className="border-2 border-slate-700/50 hover:border-slate-600 transition-all duration-300 bg-slate-800/80 backdrop-blur-xl h-full overflow-hidden group shadow-xl hover:shadow-2xl">
                    <CardHeader>
                      <motion.div 
                        className={`w-16 h-16 bg-gradient-to-br ${feature.color} rounded-2xl flex items-center justify-center mb-6 relative shadow-lg`}
                        whileHover={{ rotate: 360, scale: 1.15 }}
                        transition={{ duration: 0.7, type: "spring" }}
                      >
                        <feature.icon className={`w-8 h-8 text-white`} />
                      </motion.div>
                      <CardTitle className="text-xl text-white mb-3">{feature.title}</CardTitle>
                      <CardDescription className="text-base text-slate-300">
                        {feature.description}
                      </CardDescription>
                    </CardHeader>
                  </Card>
                </motion.div>
              </StaggerItem>
            ))}
          </StaggeredContainer>
        </motion.div>

        {/* Stats Section with scroll-based animations */}
        <motion.div 
          className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-xl rounded-3xl border-2 border-slate-700/50 p-12 mt-32 relative overflow-hidden shadow-2xl"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, type: "spring" }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-transparent to-blue-500/10" />
          
          <div className="text-center mb-12 relative z-10">
            <motion.h3 
              className="text-4xl font-bold bg-gradient-to-r from-white to-emerald-200 bg-clip-text text-transparent mb-4"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              Trusted by Growing Businesses
            </motion.h3>
            <motion.p 
              className="text-xl text-slate-300"
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
              { end: 500, suffix: "+", label: "Companies Using CRM Pro", color: "from-emerald-400 to-cyan-400" },
              { end: 85, suffix: "%", label: "Average Sales Increase", color: "from-cyan-400 to-blue-400" },
              { end: 24, suffix: "/7", label: "Customer Support", color: "from-blue-400 to-purple-400" }
            ].map((stat, index) => (
              <motion.div 
                key={index}
                className="text-center"
                initial={{ opacity: 0, scale: 0.5 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.15, type: "spring", stiffness: 200, damping: 15 }}
              >
                <motion.div 
                  className={`text-6xl font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent mb-3`}
                  whileHover={{ scale: 1.15 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <AnimatedCounter end={stat.end} />
                  {stat.suffix}
                </motion.div>
                <div className="text-slate-300 text-lg font-medium">{stat.label}</div>
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
              className="text-4xl md:text-5xl font-bold mb-4"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <span className="bg-gradient-to-r from-white via-emerald-200 to-white bg-clip-text text-transparent">
                Powerful Features for Modern Sales Teams
              </span>
            </motion.h3>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <StaggeredContainer delay={0.2}>
              {[
                {
                  title: "AI-Powered Automation",
                  features: ["Lead Scoring", "Sales Forecasting", "Smart Recommendations", "Email Generation"],
                  gradient: "from-purple-600 to-pink-600",
                  icon: Brain
                },
                {
                  title: "Advanced Analytics",
                  features: ["Pipeline Velocity", "Conversion Tracking", "Bottleneck Detection", "Team Performance"],
                  gradient: "from-blue-600 to-cyan-600",
                  icon: PieChart
                },
                {
                  title: "Workflow Management",
                  features: ["Approval Routing", "Custom Dashboards", "Email Sequences", "Task Automation"],
                  gradient: "from-orange-600 to-yellow-600",
                  icon: Settings
                },
                {
                  title: "Integration & API",
                  features: ["REST API", "Swagger Docs", "API Keys", "Webhooks"],
                  gradient: "from-emerald-600 to-green-600",
                  icon: Zap
                }
              ].map((section, index) => (
                <StaggerItem key={index}>
                  <motion.div
                    className={`p-8 rounded-2xl bg-slate-800/80 backdrop-blur-xl border-2 border-slate-700/50 shadow-xl hover:shadow-2xl transition-shadow`}
                    whileHover={{ scale: 1.02, y: -5 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  >
                    <h4 className="text-2xl font-bold mb-6 flex items-center gap-3 text-white">
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${section.gradient} flex items-center justify-center shadow-lg`}>
                        <section.icon className="w-6 h-6 text-white" />
                      </div>
                      {section.title}
                    </h4>
                    <ul className="space-y-3">
                      {section.features.map((feature, idx) => (
                        <motion.li 
                          key={idx}
                          className="flex items-center gap-3 text-slate-300"
                          initial={{ opacity: 0, x: -20 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          viewport={{ once: true }}
                          transition={{ delay: index * 0.1 + idx * 0.05 }}
                        >
                          <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${section.gradient}`} />
                          {feature}
                        </motion.li>
                      ))}
                    </ul>
                  </motion.div>
                </StaggerItem>
              ))}
            </StaggeredContainer>
          </div>
        </motion.div>

        {/* CTA Section with pulse effect */}
        <motion.div 
          className="text-center py-32"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <motion.div
            animate={{
              scale: [1, 1.02, 1],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <h3 className="text-5xl md:text-6xl font-bold mb-6">
              <span className="bg-gradient-to-r from-white via-emerald-300 to-cyan-300 bg-clip-text text-transparent">
                Ready to Transform Your Sales?
              </span>
            </h3>
          </motion.div>
          <motion.p 
            className="text-xl md:text-2xl text-slate-300 mb-10 max-w-2xl mx-auto"
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
              className="px-16 py-7 text-xl bg-gradient-to-r from-emerald-500 via-cyan-500 to-blue-500 hover:from-emerald-600 hover:via-cyan-600 hover:to-blue-600 text-white font-bold shadow-2xl shadow-emerald-500/50 border-0"
              data-testid="button-cta-login"
            >
              <Sparkles className="w-6 h-6 mr-2" />
              Start Free Trial
            </Button>
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  );
}
