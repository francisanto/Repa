import { PageHeader } from "@/components/PageHeader";
import { useStudents } from "@/hooks/use-students";
import { useEvents } from "@/hooks/use-events";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Calendar, TrendingUp, DollarSign, ArrowRight, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function Dashboard() {
  const { data: students } = useStudents();
  const { data: events } = useEvents();

  const stats = [
    {
      title: "Total Students",
      value: students?.length || 0,
      icon: Users,
      gradient: "from-blue-500 to-cyan-500",
      bg: "bg-gradient-to-br from-blue-50 to-cyan-50",
      textColor: "text-blue-600",
    },
    {
      title: "Active Events",
      value: events?.length || 0,
      icon: Calendar,
      gradient: "from-purple-500 to-pink-500",
      bg: "bg-gradient-to-br from-purple-50 to-pink-50",
      textColor: "text-purple-600",
    },
    {
      title: "Total Revenue",
      value: "₹0", // Placeholder until payments are real
      icon: DollarSign,
      gradient: "from-green-500 to-emerald-500",
      bg: "bg-gradient-to-br from-green-50 to-emerald-50",
      textColor: "text-green-600",
    },
    {
      title: "Engagement",
      value: "94%",
      icon: TrendingUp,
      gradient: "from-orange-500 to-red-500",
      bg: "bg-gradient-to-br from-orange-50 to-red-50",
      textColor: "text-orange-600",
    },
  ];

  return (
    <div className="space-y-8 min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-cyan-50/20 -m-8 p-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <PageHeader 
          title="Dashboard" 
          description="Welcome back, Representative. Here's what's happening with your class."
        />
      </motion.div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            whileHover={{ y: -5, scale: 1.02 }}
          >
            <Card className="border-0 shadow-xl hover:shadow-2xl transition-all duration-300 bg-white/90 backdrop-blur-sm overflow-hidden group">
              <div className={`h-1 bg-gradient-to-r ${stat.gradient}`} />
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <motion.div
                    whileHover={{ rotate: 360, scale: 1.1 }}
                    transition={{ duration: 0.5 }}
                    className={`p-4 rounded-2xl bg-gradient-to-br ${stat.gradient} shadow-lg`}
                  >
                    <stat.icon className="w-6 h-6 text-white" />
                  </motion.div>
                </div>
                <p className="text-sm font-medium text-slate-500 mb-1">{stat.title}</p>
                <h3 className="text-3xl font-bold text-slate-900">{stat.value}</h3>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-blue-500 to-cyan-500" />
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-xl font-display">Recent Students</CardTitle>
              <Link href="/dashboard/students">
                <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80">
                  View All <ArrowRight className="ml-1 w-4 h-4" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {students?.slice(0, 5).map((student, index) => (
                  <motion.div
                    key={student.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + index * 0.05 }}
                    whileHover={{ x: 4 }}
                    className="flex items-center justify-between p-4 bg-gradient-to-r from-slate-50 to-blue-50/50 rounded-xl border border-slate-100 hover:border-primary/20 hover:shadow-md transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-4">
                      <motion.div
                        whileHover={{ scale: 1.1, rotate: 360 }}
                        transition={{ duration: 0.5 }}
                        className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-cyan-500 flex items-center justify-center text-white font-bold shadow-lg shadow-primary/30"
                      >
                        {student.name.charAt(0)}
                      </motion.div>
                      <div>
                        <p className="font-semibold text-slate-900 group-hover:text-primary transition-colors">{student.name}</p>
                        <p className="text-xs text-slate-500">{student.rollNo}</p>
                      </div>
                    </div>
                    <span className="text-sm font-medium px-3 py-1 bg-white rounded-lg border border-slate-200 text-slate-600">{student.batch}</span>
                  </motion.div>
                ))}
                {!students?.length && (
                  <div className="text-center py-8 text-slate-500">
                    <Users className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                    <p>No students found.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-purple-500 to-pink-500" />
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-xl font-display">Upcoming Events</CardTitle>
              <Link href="/dashboard/events">
                <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80">
                  View All <ArrowRight className="ml-1 w-4 h-4" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                 {events?.slice(0, 3).map((event, index) => (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 + index * 0.05 }}
                    whileHover={{ x: -4 }}
                    className="group flex gap-4 p-4 bg-gradient-to-r from-slate-50 to-purple-50/50 rounded-xl border border-slate-100 hover:border-purple-200 hover:shadow-md transition-all cursor-pointer"
                  >
                    <motion.div
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex flex-col items-center justify-center shadow-lg text-center"
                    >
                      <span className="text-xs font-bold text-white uppercase">
                        {new Date(event.date).toLocaleDateString('en-US', { month: 'short' })}
                      </span>
                      <span className="text-xl font-bold text-white">
                         {new Date(event.date).getDate()}
                      </span>
                    </motion.div>
                    <div className="flex-1">
                      <h4 className="font-bold text-slate-900 group-hover:text-primary transition-colors mb-1">{event.title}</h4>
                      <p className="text-sm text-slate-500 line-clamp-1 mb-2">{event.description}</p>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-3 py-1 rounded-full font-semibold ${
                          event.amount > 0 
                            ? 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-700' 
                            : 'bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-700'
                        }`}>
                          {event.amount > 0 ? `₹${event.amount}` : 'Free'}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                 ))}
                 {!events?.length && (
                   <div className="text-center py-8 text-slate-500">
                     <Calendar className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                     <p>No upcoming events.</p>
                     <Link href="/dashboard/events">
                       <Button size="sm" className="mt-4 bg-gradient-to-r from-primary to-cyan-500 text-white">
                         Create Your First Event
                       </Button>
                     </Link>
                   </div>
                 )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <Card className="border-0 shadow-xl bg-gradient-to-br from-primary/5 via-cyan-50/50 to-blue-50/50 backdrop-blur-sm">
          <div className="h-1 bg-gradient-to-r from-primary via-cyan-500 to-blue-500" />
          <CardHeader>
            <CardTitle className="text-xl font-display flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-3 gap-4">
              <Link href="/dashboard/events">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="p-4 bg-white rounded-xl border border-slate-200 hover:border-primary/40 hover:shadow-lg transition-all cursor-pointer group"
                >
                  <div className="w-10 h-10 bg-gradient-to-br from-primary to-cyan-500 rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <Calendar className="w-5 h-5 text-white" />
                  </div>
                  <p className="font-semibold text-slate-900 group-hover:text-primary transition-colors">Create Event</p>
                  <p className="text-xs text-slate-500 mt-1">Plan a new class activity</p>
                </motion.div>
              </Link>
              <Link href="/dashboard/students">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="p-4 bg-white rounded-xl border border-slate-200 hover:border-primary/40 hover:shadow-lg transition-all cursor-pointer group"
                >
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <Users className="w-5 h-5 text-white" />
                  </div>
                  <p className="font-semibold text-slate-900 group-hover:text-primary transition-colors">Manage Students</p>
                  <p className="text-xs text-slate-500 mt-1">View and edit student data</p>
                </motion.div>
              </Link>
              <Link href="/dashboard/timetable">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="p-4 bg-white rounded-xl border border-slate-200 hover:border-primary/40 hover:shadow-lg transition-all cursor-pointer group"
                >
                  <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <TrendingUp className="w-5 h-5 text-white" />
                  </div>
                  <p className="font-semibold text-slate-900 group-hover:text-primary transition-colors">Upload Timetable</p>
                  <p className="text-xs text-slate-500 mt-1">Add or update schedules</p>
                </motion.div>
              </Link>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
