import { useTimetables } from "@/hooks/use-timetables";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, Calendar, Radio } from "lucide-react";
import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export function LiveTimetable() {
  const { data: timetables } = useTimetables();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedBatch, setSelectedBatch] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"live" | "full" | "weekly">("live");

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000); // Update every second

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (timetables && timetables.length > 0 && !selectedBatch) {
      setSelectedBatch(timetables[0].batch);
    }
  }, [timetables, selectedBatch]);

  const currentTimetable = timetables?.find(tt => tt.batch === selectedBatch);
  const currentDay = DAYS[currentTime.getDay() === 0 ? 6 : currentTime.getDay() - 1]; // Convert Sunday (0) to index 6

  if (!timetables || timetables.length === 0) {
    return (
      <section className="py-20 bg-gradient-to-br from-slate-50 via-blue-50/30 to-cyan-50/30">
        <div className="container mx-auto px-4 text-center">
          <p className="text-slate-500">No timetable uploaded yet. Representatives can upload timetables in the dashboard.</p>
        </div>
      </section>
    );
  }

  if (!currentTimetable || !currentTimetable.content) {
    return null;
  }

  const todaySchedule = (currentTimetable.content as any)[currentDay] || [];
  const currentHour = currentTime.getHours();
  const currentMinute = currentTime.getMinutes();
  const currentTimeStr = `${String(currentHour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}`;

  // Find current and next period
  let currentPeriod: any = null;
  let nextPeriod: any = null;
  let pastPeriods: any[] = [];
  let upcomingPeriods: any[] = [];

  todaySchedule.forEach((period: any) => {
    const [periodHour, periodMinute] = period.time.split(':').map(Number);
    const periodTime = periodHour * 60 + periodMinute;
    const nowTime = currentHour * 60 + currentMinute;

    if (periodTime <= nowTime) {
      pastPeriods.push(period);
      if (!currentPeriod || periodTime > (currentPeriod.time.split(':').map(Number)[0] * 60 + currentPeriod.time.split(':').map(Number)[1])) {
        currentPeriod = period;
      }
    } else {
      if (!nextPeriod || periodTime < (nextPeriod.time.split(':').map(Number)[0] * 60 + nextPeriod.time.split(':').map(Number)[1])) {
        nextPeriod = period;
      }
      upcomingPeriods.push(period);
    }
  });

  // Remove current period from past if it exists
  if (currentPeriod) {
    pastPeriods = pastPeriods.filter(p => p !== currentPeriod);
  }

  const getFullWeekSchedule = () => {
    const schedule: any = {};
    DAYS.forEach(day => {
      schedule[day] = (currentTimetable.content as any)[day] || [];
    });
    return schedule;
  };

  return (
    <section className="py-20 bg-gradient-to-br from-slate-50 via-blue-50/30 to-cyan-50/30">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 mb-4">
            <Radio className="w-5 h-5 text-green-500 animate-pulse" />
            <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0">
              Live Timetable
            </Badge>
          </div>
          <h2 className="text-4xl font-bold text-slate-900 font-display mb-4">
            Live Class Schedule
          </h2>
          <p className="text-slate-600">Real-time updates as classes progress</p>
        </motion.div>

        <div className="max-w-6xl mx-auto">
          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as any)} className="mb-6">
            <TabsList className="grid w-full max-w-md mx-auto grid-cols-3">
              <TabsTrigger value="live">Live View</TabsTrigger>
              <TabsTrigger value="full">Full Day</TabsTrigger>
              <TabsTrigger value="weekly">Weekly</TabsTrigger>
            </TabsList>
          </Tabs>

          {timetables && timetables.length > 0 && (
            <div className="mb-6 flex justify-center gap-2 flex-wrap">
              {timetables.map(tt => (
                <Button
                  key={tt.id}
                  variant={selectedBatch === tt.batch ? "default" : "outline"}
                  onClick={() => setSelectedBatch(tt.batch)}
                  className={selectedBatch === tt.batch ? "bg-gradient-to-r from-primary to-cyan-500" : ""}
                >
                  {tt.batch}
                </Button>
              ))}
            </div>
          )}

          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as any)}>
            <TabsContent value="live" className="mt-6">
              <Card className="border-0 shadow-2xl bg-white/90 backdrop-blur-sm overflow-hidden">
                <div className="h-2 bg-gradient-to-r from-primary via-cyan-500 to-blue-500" />
                <CardContent className="p-8">
                  <div className="text-center mb-8">
                    <div className="inline-flex items-center gap-3 mb-4">
                      <Clock className="w-6 h-6 text-primary" />
                      <span className="text-3xl font-bold text-slate-900 font-mono">
                        {currentTimeStr}
                      </span>
                    </div>
                    <p className="text-lg text-slate-600">{currentDay}</p>
                  </div>

                  <div className="space-y-4">
                    {/* Past Periods */}
                    <AnimatePresence>
                      {pastPeriods.map((period, idx) => (
                        <motion.div
                          key={`past-${idx}`}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 0.5, x: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          className="p-4 bg-slate-100 rounded-xl border border-slate-200"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <span className="text-sm font-mono text-slate-500">{period.time}</span>
                              <div>
                                <p className="font-semibold text-slate-700">{period.subject}</p>
                                <p className="text-sm text-slate-500">{period.room || "TBD"}</p>
                              </div>
                            </div>
                            <Badge variant="secondary" className="text-xs">Completed</Badge>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>

                    {/* Current Period */}
                    {currentPeriod && (
                      <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="p-6 bg-gradient-to-r from-primary to-cyan-500 rounded-2xl text-white shadow-xl"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <Badge className="bg-white/20 text-white border-0">
                            <Radio className="w-3 h-3 mr-1 animate-pulse" />
                            Now
                          </Badge>
                          <span className="text-sm font-mono bg-white/20 px-3 py-1 rounded-lg">
                            {currentPeriod.time}
                          </span>
                        </div>
                        <h3 className="text-2xl font-bold mb-1">{currentPeriod.subject}</h3>
                        <p className="text-white/90">{currentPeriod.room || "Room TBD"}</p>
                      </motion.div>
                    )}

                    {/* Next Period */}
                    {nextPeriod && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-5 bg-blue-50 border-2 border-primary/30 rounded-xl"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <span className="text-sm font-mono text-primary font-bold">{nextPeriod.time}</span>
                            <div>
                              <p className="font-semibold text-slate-900">Next: {nextPeriod.subject}</p>
                              <p className="text-sm text-slate-600">{nextPeriod.room || "TBD"}</p>
                            </div>
                          </div>
                          <Badge className="bg-primary text-white">Upcoming</Badge>
                        </div>
                      </motion.div>
                    )}

                    {/* Upcoming Periods */}
                    <AnimatePresence>
                      {upcomingPeriods.filter(p => p !== nextPeriod).map((period, idx) => (
                        <motion.div
                          key={`upcoming-${idx}`}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          className="p-4 bg-white border border-slate-200 rounded-xl"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <span className="text-sm font-mono text-slate-600">{period.time}</span>
                              <div>
                                <p className="font-medium text-slate-700">{period.subject}</p>
                                <p className="text-sm text-slate-500">{period.room || "TBD"}</p>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="full" className="mt-6">
              <Card className="border-0 shadow-2xl bg-white/90 backdrop-blur-sm">
                <div className="h-2 bg-gradient-to-r from-primary via-cyan-500 to-blue-500" />
                <CardContent className="p-8">
                  <h3 className="text-2xl font-bold mb-6 text-center">{currentDay} Schedule</h3>
                  <div className="space-y-3">
                    {todaySchedule.map((period: any, idx: number) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="p-4 bg-slate-50 rounded-xl border border-slate-200 hover:border-primary/30 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <span className="text-sm font-mono font-bold text-primary w-20">{period.time}</span>
                            <div>
                              <p className="font-semibold text-slate-900">{period.subject}</p>
                              <p className="text-sm text-slate-500">{period.room || "Room TBD"}</p>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="weekly" className="mt-6">
              <Card className="border-0 shadow-2xl bg-white/90 backdrop-blur-sm">
                <div className="h-2 bg-gradient-to-r from-primary via-cyan-500 to-blue-500" />
                <CardContent className="p-8">
                  <h3 className="text-2xl font-bold mb-6 text-center">Weekly Schedule - {selectedBatch}</h3>
                  <div className="grid gap-4">
                    {DAYS.map(day => {
                      const daySchedule = (currentTimetable.content as any)[day] || [];
                      return (
                        <div key={day} className="border border-slate-200 rounded-xl p-4 bg-slate-50">
                          <h4 className="font-bold text-lg mb-3 text-primary">{day}</h4>
                          <div className="space-y-2">
                            {daySchedule.length > 0 ? (
                              daySchedule.map((period: any, idx: number) => (
                                <div key={idx} className="flex items-center gap-4 text-sm">
                                  <span className="font-mono text-slate-600 w-20">{period.time}</span>
                                  <span className="font-medium text-slate-900">{period.subject}</span>
                                  <span className="text-slate-500 ml-auto">{period.room || "TBD"}</span>
                                </div>
                              ))
                            ) : (
                              <p className="text-slate-400 text-sm">No classes scheduled</p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </section>
  );
}

