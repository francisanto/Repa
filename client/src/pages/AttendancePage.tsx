import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";
import { Upload, Calendar, FileText, Loader2, Users, ClipboardList } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

export default function AttendancePage() {
  const { toast } = useToast();
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [attendanceFile, setAttendanceFile] = useState<File | null>(null);
  const [attendanceDate, setAttendanceDate] = useState("");
  const [batch, setBatch] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const [isLeaveOpen, setIsLeaveOpen] = useState(false);
  const [leaveFile, setLeaveFile] = useState<File | null>(null);
  const [leaveDate, setLeaveDate] = useState("");
  const [studentName, setStudentName] = useState("");
  const [isUploadingLeave, setIsUploadingLeave] = useState(false);

  const handleAttendanceUpload = async () => {
    if (!attendanceFile || !attendanceDate || !batch) {
      toast({ title: "Error", description: "Please fill all fields", variant: "destructive" });
      return;
    }

    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const response = await fetch("/api/attendance/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            date: attendanceDate,
            batch,
            image: reader.result as string,
          }),
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.message);

        toast({ title: "Success", description: `Attendance for ${attendanceDate} uploaded successfully` });
        setIsUploadOpen(false);
        setAttendanceFile(null);
        setAttendanceDate("");
        setBatch("");
      } catch (error: any) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      } finally {
        setIsUploading(false);
      }
    };
    reader.readAsDataURL(attendanceFile);
  };

  const handleLeaveUpload = async () => {
    if (!leaveFile) {
      toast({ title: "Error", description: "Please upload leave letter", variant: "destructive" });
      return;
    }

    setIsUploadingLeave(true);
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const response = await fetch("/api/leave-letters/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            studentName,
            date: leaveDate || new Date().toISOString(),
            image: reader.result as string,
          }),
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.message);

        toast({ title: "Success", description: `Leave letter processed. Category: ${data.category}` });
        setIsLeaveOpen(false);
        setLeaveFile(null);
        setLeaveDate("");
        setStudentName("");
      } catch (error: any) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      } finally {
        setIsUploadingLeave(false);
      }
    };
    reader.readAsDataURL(leaveFile);
  };

  return (
    <div className="space-y-8 min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-cyan-50/20 -m-8 p-8">
      <PageHeader
        title="Attendance & Leave Management"
        description="Upload attendance records and leave letters with AI processing"
      />

      <Tabs defaultValue="attendance" className="space-y-6">
        <TabsList>
          <TabsTrigger value="attendance">
            <Calendar className="w-4 h-4 mr-2" /> Attendance
          </TabsTrigger>
          <TabsTrigger value="leave">
            <FileText className="w-4 h-4 mr-2" /> Leave Letters
          </TabsTrigger>
        </TabsList>

        <TabsContent value="attendance">
          <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Daily Attendance Upload</CardTitle>
                <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-gradient-to-r from-primary to-cyan-500">
                      <Upload className="w-4 h-4 mr-2" /> Upload Attendance
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Upload Attendance Sheet</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                      <div className="space-y-2">
                        <Label>Date</Label>
                        <Input
                          type="date"
                          value={attendanceDate}
                          onChange={(e) => setAttendanceDate(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Batch</Label>
                        <Input
                          placeholder="e.g., CS-A"
                          value={batch}
                          onChange={(e) => setBatch(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Attendance Sheet (Image/PDF)</Label>
                        <Input
                          type="file"
                          accept="image/*,.pdf"
                          onChange={(e) => setAttendanceFile(e.target.files?.[0] || null)}
                        />
                        <p className="text-xs text-slate-500">AI will automatically extract attendance data</p>
                      </div>
                      <Button
                        onClick={handleAttendanceUpload}
                        disabled={isUploading}
                        className="w-full"
                      >
                        {isUploading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          "Upload & Process"
                        )}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-slate-500">
                <Users className="w-12 h-12 mx-auto mb-4 text-slate-400" />
                <p>Upload attendance sheets to track daily attendance</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="leave">
          <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Leave Letters</CardTitle>
                <Dialog open={isLeaveOpen} onOpenChange={setIsLeaveOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-gradient-to-r from-purple-500 to-pink-500">
                      <Upload className="w-4 h-4 mr-2" /> Upload Leave Letter
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Upload Leave Letter</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                      <div className="space-y-2">
                        <Label>Student Name (optional - AI will extract)</Label>
                        <Input
                          placeholder="Student name"
                          value={studentName}
                          onChange={(e) => setStudentName(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Date (optional)</Label>
                        <Input
                          type="date"
                          value={leaveDate}
                          onChange={(e) => setLeaveDate(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Leave Letter Image</Label>
                        <Input
                          type="file"
                          accept="image/*,.pdf"
                          onChange={(e) => setLeaveFile(e.target.files?.[0] || null)}
                        />
                        <p className="text-xs text-slate-500">AI will extract and classify the leave letter</p>
                      </div>
                      <Button
                        onClick={handleLeaveUpload}
                        disabled={isUploadingLeave}
                        className="w-full"
                      >
                        {isUploadingLeave ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          "Upload & Classify"
                        )}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-slate-500">
                <FileText className="w-12 h-12 mx-auto mb-4 text-slate-400" />
                <p>Upload leave letters for AI-powered classification</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

