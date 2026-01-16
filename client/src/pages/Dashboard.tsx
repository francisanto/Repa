import { PageHeader } from "@/components/PageHeader";
import { useStudents } from "@/hooks/use-students";
import { useEvents } from "@/hooks/use-events";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Calendar, TrendingUp, DollarSign } from "lucide-react";
import { motion } from "framer-motion";

export default function Dashboard() {
  const { data: students } = useStudents();
  const { data: events } = useEvents();

  const stats = [
    {
      title: "Total Students",
      value: students?.length || 0,
      icon: Users,
      color: "text-blue-600",
      bg: "bg-blue-100",
    },
    {
      title: "Active Events",
      value: events?.length || 0,
      icon: Calendar,
      color: "text-purple-600",
      bg: "bg-purple-100",
    },
    {
      title: "Total Revenue",
      value: "₹0", // Placeholder until payments are real
      icon: DollarSign,
      color: "text-green-600",
      bg: "bg-green-100",
    },
    {
      title: "Engagement",
      value: "94%",
      icon: TrendingUp,
      color: "text-orange-600",
      bg: "bg-orange-100",
    },
  ];

  return (
    <div className="space-y-8">
      <PageHeader 
        title="Dashboard" 
        description="Welcome back, Representative. Here's what's happening."
      />

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card className="border-none shadow-lg hover:shadow-xl transition-shadow bg-white/80 backdrop-blur">
              <CardContent className="p-6 flex items-center gap-4">
                <div className={`p-4 rounded-2xl ${stat.bg}`}>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">{stat.title}</p>
                  <h3 className="text-2xl font-bold text-slate-900">{stat.value}</h3>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <Card className="border-none shadow-lg">
          <CardHeader>
            <CardTitle>Recent Students</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {students?.slice(0, 5).map((student) => (
                <div key={student.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold">
                      {student.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">{student.name}</p>
                      <p className="text-xs text-slate-500">{student.rollNo}</p>
                    </div>
                  </div>
                  <span className="text-sm font-medium text-slate-600">{student.batch}</span>
                </div>
              ))}
              {!students?.length && <p className="text-slate-500">No students found.</p>}
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg">
          <CardHeader>
            <CardTitle>Upcoming Events</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
               {events?.slice(0, 3).map((event) => (
                <div key={event.id} className="group flex gap-4 p-4 bg-slate-50 rounded-xl hover:bg-blue-50 transition-colors cursor-pointer">
                  <div className="w-16 h-16 bg-white rounded-lg flex flex-col items-center justify-center shadow-sm text-center border border-slate-200">
                    <span className="text-xs font-bold text-red-500 uppercase">
                      {new Date(event.date).toLocaleDateString('en-US', { month: 'short' })}
                    </span>
                    <span className="text-xl font-bold text-slate-900">
                       {new Date(event.date).getDate()}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 group-hover:text-primary transition-colors">{event.title}</h4>
                    <p className="text-sm text-slate-500 line-clamp-1">{event.description}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs px-2 py-0.5 bg-white rounded border border-slate-200 text-slate-600">
                         {event.amount > 0 ? `₹${event.amount}` : 'Free'}
                      </span>
                    </div>
                  </div>
                </div>
               ))}
               {!events?.length && <p className="text-slate-500">No upcoming events.</p>}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
