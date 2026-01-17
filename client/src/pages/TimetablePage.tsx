import { PageHeader } from "@/components/PageHeader";
import { useTimetables, useUploadTimetable } from "@/hooks/use-timetables";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { Upload, FileText, Loader2, Sparkles, Clock, MapPin, Bell, Calendar as CalendarIcon, Radio } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export default function TimetablePage() {
  const { data: timetables, isLoading } = useTimetables();
  const { mutateAsync: upload, isPending } = useUploadTimetable();
  const { toast } = useToast();
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [batch, setBatch] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [selectedTimetable, setSelectedTimetable] = useState<any>(null);
  const [showReminders, setShowReminders] = useState(true);

  // Set up reminders for upcoming classes
  useEffect(() => {
    if (!selectedTimetable || !showReminders) return;

    const checkReminders = () => {
      const now = new Date();
      const currentDay = DAYS[now.getDay() === 0 ? 6 : now.getDay() - 1]; // Convert Sunday=0 to Monday=0
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      
      const schedule = selectedTimetable?.content?.[currentDay] || [];
      const upcoming = schedule.filter((slot: any) => {
        const [slotHour, slotMin] = slot.time.split(':').map(Number);
        const [currHour, currMin] = currentTime.split(':').map(Number);
        const slotMinutes = slotHour * 60 + slotMin;
        const currMinutes = currHour * 60 + currMin;
        return slotMinutes > currMinutes && slotMinutes <= currMinutes + 15; // 15 min before
      });

      if (upcoming.length > 0) {
        upcoming.forEach((slot: any) => {
          toast({
            title: "⏰ Class Reminder",
            description: `${slot.subject} in ${slot.room} at ${slot.time}`,
          });
        });
      }
    };

    const interval = setInterval(checkReminders, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [selectedTimetable, showReminders, toast]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file || !batch) return;

    // Convert file to base64 mock
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      try {
        await upload({ batch, image: reader.result as string });
        setIsUploadOpen(false);
        setBatch("");
        setFile(null);
        toast({ title: "Success", description: "Timetable processed by AI and uploaded!" });
      } catch (error) {
        toast({ title: "Error", description: "Upload failed", variant: "destructive" });
      }
    };
  };

  return (
    <div className="space-y-8 min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-cyan-50/20 -m-8 p-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <PageHeader 
          title="Timetables" 
          description="AI-Powered Timetable Management"
        action={
          <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
            <DialogTrigger asChild>
              <Button size="lg" className="rounded-full shadow-lg shadow-primary/20 bg-gradient-to-r from-primary to-purple-600 border-none">
                <Sparkles className="w-5 h-5 mr-2" /> Upload & Parse
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Upload Timetable Image</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Batch Name</Label>
                  <Input 
                    placeholder="e.g. CS-2024-A" 
                    value={batch}
                    onChange={(e) => setBatch(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Timetable Image/PDF</Label>
                  <Input type="file" onChange={handleFileChange} />
                  <p className="text-xs text-slate-500">Our AI model will extract the schedule automatically.</p>
                </div>
                <Button className="w-full" onClick={handleUpload} disabled={!file || !batch || isPending}>
                  {isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing with AI...
                    </>
                  ) : (
                    "Upload & Process"
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        }
      />
      </motion.div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="col-span-full flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : timetables?.map((tt) => (
          <motion.div 
            key={tt.id} 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.02 }}
            className="cursor-pointer"
            onClick={() => setSelectedTimetable(tt)}
          >
            <Card className="hover:shadow-xl transition-all duration-300 border-t-4 border-t-primary overflow-hidden group">
              <div className="h-2 bg-gradient-to-r from-primary via-cyan-500 to-blue-500" />
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="bg-gradient-to-br from-primary to-cyan-500 p-3 rounded-xl group-hover:scale-110 transition-transform shadow-lg">
                    <CalendarIcon className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0 flex items-center gap-1">
                      <Radio className="w-3 h-3 animate-pulse" />
                      Live
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      {new Date(tt.createdAt).toLocaleDateString()}
                    </Badge>
                  </div>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-primary transition-colors">
                  {tt.batch}
                </h3>
                <p className="text-sm text-slate-500 mb-4">AI-Parsed Live Schedule</p>
                <Button variant="outline" className="w-full group-hover:bg-primary group-hover:text-white transition-colors">
                  View Interactive Schedule
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        ))}
        {!isLoading && (!timetables || timetables.length === 0) && (
          <div className="col-span-full text-center py-12 bg-white rounded-xl border-2 border-dashed border-slate-200">
            <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500 font-medium">No timetables uploaded yet</p>
            <p className="text-sm text-slate-400 mt-2">Upload your first timetable to get started</p>
          </div>
        )}
      </div>

      {/* Interactive Timetable Viewer */}
      <Dialog open={!!selectedTimetable} onOpenChange={(open) => !open && setSelectedTimetable(null)}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">Interactive Timetable - {selectedTimetable?.batch}</DialogTitle>
            <DialogDescription>
              View your class schedule with smart reminders
            </DialogDescription>
          </DialogHeader>
          
          {selectedTimetable && (
            <div className="space-y-6 pt-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium">Reminders</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowReminders(!showReminders)}
                >
                  {showReminders ? "Disable" : "Enable"}
                </Button>
              </div>

              <Tabs defaultValue={DAYS[0]} className="w-full">
                <TabsList className="grid w-full grid-cols-7">
                  {DAYS.map(day => (
                    <TabsTrigger key={day} value={day} className="text-xs">
                      {day.slice(0, 3)}
                    </TabsTrigger>
                  ))}
                </TabsList>

                {DAYS.map(day => {
                  const schedule = selectedTimetable.content?.[day] || [];
                  const now = new Date();
                  const currentDay = DAYS[now.getDay() === 0 ? 6 : now.getDay() - 1];
                  const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
                  const isToday = day === currentDay;

                  return (
                    <TabsContent key={day} value={day} className="mt-4">
                      <div className="space-y-3">
                        {schedule.length > 0 ? (
                          schedule.map((slot: any, idx: number) => {
                            const isUpcoming = isToday && slot.time > currentTime;
                            const isPast = isToday && slot.time < currentTime;

                            return (
                              <motion.div
                                key={idx}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.1 }}
                              >
                                <Card className={`border-l-4 ${
                                  isUpcoming 
                                    ? 'border-l-green-500 bg-green-50/50' 
                                    : isPast 
                                    ? 'border-l-slate-300 bg-slate-50/50 opacity-60'
                                    : 'border-l-primary bg-blue-50/50'
                                }`}>
                                  <CardContent className="p-4">
                                    <div className="flex items-start justify-between">
                                      <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                          <Clock className="w-4 h-4 text-primary" />
                                          <span className="font-bold text-lg text-slate-900">{slot.time}</span>
                                          {isUpcoming && (
                                            <Badge className="bg-green-500 text-white">Upcoming</Badge>
                                          )}
                                        </div>
                                        <h4 className="font-semibold text-slate-900 text-lg mb-1">
                                          {slot.subject}
                                        </h4>
                                        <div className="flex items-center gap-2 text-slate-600">
                                          <MapPin className="w-4 h-4" />
                                          <span className="text-sm">{slot.room || "TBD"}</span>
                                        </div>
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>
                              </motion.div>
                            );
                          })
                        ) : (
                          <div className="text-center py-8 text-slate-500">
                            No classes scheduled for {day}
                          </div>
                        )}
                      </div>
                    </TabsContent>
                  );
                })}
              </Tabs>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
