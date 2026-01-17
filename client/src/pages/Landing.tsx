import { useEvents } from "@/hooks/use-events";
import { useStudents } from "@/hooks/use-students";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { motion, useScroll, useTransform, useInView } from "framer-motion";
import { Calendar, Search, ArrowRight, Bell, Sparkles, BookOpen, Users, Clock, TrendingUp, Shield, Zap, BarChart3, CheckCircle2 } from "lucide-react";
import { useState, useRef } from "react";
import { Input } from "@/components/ui/input";

export default function Landing() {
  const { data: events } = useEvents();
  const [searchTerm, setSearchTerm] = useState("");
  const { data: students } = useStudents(searchTerm ? { search: searchTerm } : undefined);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-cyan-50/30">
      {/* Hero Section */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1523580494863-6f3031224c94?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-5" />
        <motion.div
          className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-cyan-500/5"
          animate={{
            backgroundPosition: ["0% 0%", "100% 100%"],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            repeatType: "reverse",
          }}
        />
        
        <div className="container mx-auto px-4 py-20 relative z-10">
          <nav className="flex justify-between items-center mb-20">
            <h1 className="text-2xl font-bold font-display text-primary flex items-center gap-2">
              <span className="w-8 h-8 bg-primary text-white rounded-lg flex items-center justify-center text-sm">CR</span>
              ClassRep
            </h1>
            <div className="flex gap-3">
              <Link href="/login">
                <Button variant="outline" className="border-primary/20 hover:bg-primary/5 hover:text-primary">
                  Representative Login
                </Button>
              </Link>
              <Link href="/register">
                <Button className="bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20">
                  Register
                </Button>
              </Link>
            </div>
          </nav>

          <div className="max-w-4xl mx-auto text-center space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <motion.span 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="inline-block px-4 py-1.5 rounded-full bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-700 text-sm font-medium mb-6 shadow-lg shadow-blue-200/50"
              >
                ✨ Streamline Your Class Management
              </motion.span>
              <h1 className="text-5xl md:text-7xl font-bold text-slate-900 font-display tracking-tight leading-tight">
                Your Class. <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-cyan-500">
                  Managed Beautifully.
                </span>
              </h1>
              <p className="text-xl text-slate-600 max-w-2xl mx-auto mt-6">
                Seamlessly organize events, track attendance, manage timetables, and keep your class connected. 
                Everything you need in one powerful platform.
              </p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <Link href="/events">
                <Button size="lg" className="rounded-full text-lg px-8 py-6 bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20">
                  View Events <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Link href="/events">
                <Button size="lg" variant="secondary" className="rounded-full text-lg px-8 py-6 bg-white hover:bg-slate-50 border border-slate-200">
                  Check Timetable
                </Button>
              </Link>
            </motion.div>
          </div>
        </div>
      </header>

      {/* Smart Search Section */}
      <section className="py-20 container mx-auto px-4">
        <div className="max-w-2xl mx-auto bg-white rounded-3xl p-8 shadow-2xl shadow-blue-900/5 ring-1 ring-slate-100">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Smart Student Search</h2>
              <p className="text-slate-500">Find your roll number or status instantly</p>
            </div>
          </div>
          
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <Input 
              className="pl-12 py-6 text-lg rounded-xl border-slate-200 focus:ring-primary/20"
              placeholder="Enter name or roll number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {searchTerm && students && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="mt-4 space-y-2"
            >
              {students.length > 0 ? (
                students.map(student => (
                  <div key={student.id} className="p-4 bg-slate-50 rounded-xl flex justify-between items-center hover:bg-blue-50 transition-colors">
                    <div>
                      <p className="font-bold text-slate-900">{student.name}</p>
                      <p className="text-sm text-slate-500">{student.batch}</p>
                    </div>
                    <span className="px-3 py-1 bg-white text-slate-600 text-sm font-medium rounded-lg border border-slate-200">
                      {student.rollNo}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-center text-slate-500 py-4">No students found matching "{searchTerm}"</p>
              )}
            </motion.div>
          )}
        </div>
      </section>

      {/* Features Section with Scroll Animations */}
      <FeaturesSection />

      {/* Featured Events */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h2 className="text-3xl font-bold text-slate-900 font-display">Upcoming Events</h2>
              <p className="text-slate-500 mt-2">Don't miss out on what's happening</p>
            </div>
            <Link href="/events">
              <Button variant="ghost" className="text-primary hover:text-primary/80">View All</Button>
            </Link>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {events?.slice(0, 3).map((event, index) => (
              <motion.div 
                key={event.id}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                whileHover={{ y: -5, scale: 1.02 }}
                className="group cursor-pointer"
              >
                <Card className="overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all h-full bg-slate-50">
                  <div className="h-48 bg-slate-200 relative overflow-hidden">
                    {/* Placeholder gradient for event image */}
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-indigo-500 opacity-80 group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur px-3 py-1 rounded-lg text-sm font-bold text-slate-900">
                      {new Date(event.date).toLocaleDateString()}
                    </div>
                  </div>
                  <CardContent className="p-6">
                    <h3 className="text-xl font-bold text-slate-900 mb-2">{event.title}</h3>
                    <p className="text-slate-500 line-clamp-2">{event.description}</p>
                    <div className="mt-4 flex items-center justify-between">
                      <span className="text-primary font-semibold">
                        {event.amount > 0 ? `₹${event.amount}` : "Free"}
                      </span>
                      <Button size="sm" className="rounded-full">Details</Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

// Features Section Component with Scroll Animations
function FeaturesSection() {
  const features = [
    {
      icon: Calendar,
      title: "Event Management",
      description: "Create, manage, and track class events with ease. Handle registrations and payments seamlessly.",
      color: "from-blue-500 to-cyan-500",
      bgColor: "bg-blue-50",
    },
    {
      icon: Users,
      title: "Student Directory",
      description: "Quick access to student information, roll numbers, and batch details with smart search.",
      color: "from-purple-500 to-pink-500",
      bgColor: "bg-purple-50",
    },
    {
      icon: Clock,
      title: "Smart Timetables",
      description: "AI-powered timetable extraction and management. Upload images and get structured schedules.",
      color: "from-orange-500 to-red-500",
      bgColor: "bg-orange-50",
    },
    {
      icon: TrendingUp,
      title: "Analytics & Insights",
      description: "Track engagement, attendance, and event participation with comprehensive analytics.",
      color: "from-green-500 to-emerald-500",
      bgColor: "bg-green-50",
    },
    {
      icon: Shield,
      title: "Secure & Reliable",
      description: "Your data is protected with enterprise-grade security and reliable infrastructure.",
      color: "from-indigo-500 to-blue-500",
      bgColor: "bg-indigo-50",
    },
    {
      icon: Zap,
      title: "Lightning Fast",
      description: "Experience blazing-fast performance with optimized queries and real-time updates.",
      color: "from-yellow-500 to-orange-500",
      bgColor: "bg-yellow-50",
    },
  ];

  return (
    <section className="py-24 bg-gradient-to-br from-slate-50 via-blue-50/30 to-cyan-50/30">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-slate-900 font-display mb-4">
            Powerful Features for <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-cyan-500">Modern Class Management</span>
          </h2>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            Everything you need to manage your class efficiently and beautifully
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <FeatureCard key={feature.title} feature={feature} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}

function FeatureCard({ feature, index }: { feature: typeof features[0], index: number }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const Icon = feature.icon;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 50 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
      transition={{ delay: index * 0.1, duration: 0.5 }}
      whileHover={{ y: -8, scale: 1.02 }}
      className="group"
    >
      <Card className="h-full border-0 shadow-lg hover:shadow-2xl transition-all duration-300 bg-white/80 backdrop-blur-sm overflow-hidden">
        <div className={`h-1 bg-gradient-to-r ${feature.color}`} />
        <CardContent className="p-8">
          <motion.div
            whileHover={{ rotate: 360, scale: 1.1 }}
            transition={{ duration: 0.5 }}
            className={`w-16 h-16 bg-gradient-to-br ${feature.color} rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:shadow-xl transition-shadow`}
          >
            <Icon className="w-8 h-8 text-white" />
          </motion.div>
          <h3 className="text-2xl font-bold text-slate-900 mb-3 group-hover:text-primary transition-colors">
            {feature.title}
          </h3>
          <p className="text-slate-600 leading-relaxed">
            {feature.description}
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
}
