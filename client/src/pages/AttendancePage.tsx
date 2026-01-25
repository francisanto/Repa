import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useState, useEffect } from "react";
import { Upload, Calendar, FileText, Loader2, Users, ClipboardList, AlertTriangle, CheckCircle2, XCircle, Eye, RefreshCw, Brain, TrendingUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

interface LeaveLetter {
  id?: string;
  studentName: string;
  rollNumber?: string;
  date: string;
  reason: string;
  rawText?: string;
  imageUrl?: string;
  status?: "pending" | "approved" | "rejected";
  riskLevel?: "low" | "medium" | "high";
}

interface GroupedCategory {
  category_id: string;
  representative_reason: string;
  student_count: number;
  students: Array<{
    name: string;
    roll_number: string;
    date: string;
    reason: string;
    similarity_scores?: Record<string, number>;
  }>;
  average_similarity: number;
}

interface Anomaly {
  type: string;
  risk_level: "low" | "medium" | "high";
  description: string;
  students?: Array<{ name: string; roll_number: string; date: string; reason: string }>;
  student?: { name: string; roll_number: string };
  date?: string;
  student_count?: number;
  similarity_score?: number;
  excuse_count?: number;
  reason?: string;
}

interface AnalysisResult {
  grouped_categories: GroupedCategory[];
  anomalies: Anomaly[];
  insights: string[];
  statistics: {
    total_letters: number;
    total_categories: number;
    total_anomalies: number;
    high_risk_anomalies: number;
    medium_risk_anomalies: number;
    low_risk_anomalies: number;
  };
}

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

  const [leaveLetters, setLeaveLetters] = useState<LeaveLetter[]>([]);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedLetter, setSelectedLetter] = useState<LeaveLetter | null>(null);

  // Load leave letters on mount
  useEffect(() => {
    loadLeaveLetters();
  }, []);

  const loadLeaveLetters = async () => {
    try {
      const response = await fetch("/api/leave-letters", {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setLeaveLetters(data);
      }
    } catch (error) {
      console.error("Failed to load leave letters:", error);
    }
  };

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

        toast({ 
          title: "Success", 
          description: `Leave letter processed. Student: ${data.studentName || "Unknown"}` 
        });
        
        // Add to local state
        const newLetter: LeaveLetter = {
          studentName: data.studentName,
          rollNumber: data.rollNumber,
          date: data.date,
          reason: data.reason,
          rawText: data.rawText,
          imageUrl: data.imageUrl,
          status: "pending",
        };
        setLeaveLetters([...leaveLetters, newLetter]);
        
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

  const handleAnalyze = async () => {
    if (leaveLetters.length === 0) {
      toast({ title: "Error", description: "No leave letters to analyze", variant: "destructive" });
      return;
    }

    setIsAnalyzing(true);
    try {
      const response = await fetch("/api/leave-letters/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          leave_letters: leaveLetters.map(letter => ({
            student_name: letter.studentName,
            roll_number: letter.rollNumber,
            date: letter.date,
            reason: letter.reason,
          })),
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Analysis failed");

      setAnalysisResult(data);
      toast({ title: "Analysis Complete", description: `Found ${data.statistics.total_anomalies} anomalies` });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getRiskBadge = (risk: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      high: "destructive",
      medium: "default",
      low: "secondary",
    };
    return <Badge variant={variants[risk] || "secondary"}>{risk.toUpperCase()}</Badge>;
  };

  return (
    <div className="space-y-8 min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-cyan-50/20 -m-8 p-8">
      <PageHeader
        title="Attendance & Leave Management"
        description="Upload attendance records and leave letters with AI-powered analysis"
      />

      <Tabs defaultValue="leave" className="space-y-6">
        <TabsList>
          <TabsTrigger value="attendance">
            <Calendar className="w-4 h-4 mr-2" /> Attendance
          </TabsTrigger>
          <TabsTrigger value="leave">
            <FileText className="w-4 h-4 mr-2" /> Leave Letters
          </TabsTrigger>
          {analysisResult && (
            <TabsTrigger value="analysis">
              <Brain className="w-4 h-4 mr-2" /> Analysis
            </TabsTrigger>
          )}
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
          <div className="space-y-6">
            <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Leave Letters</CardTitle>
                    <CardDescription>
                      {leaveLetters.length} leave letter{leaveLetters.length !== 1 ? "s" : ""} uploaded
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
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
                            <Label>Leave Letter (Image/PDF)</Label>
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
                              "Upload & Extract"
                            )}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                    {leaveLetters.length > 0 && (
                      <Button
                        onClick={handleAnalyze}
                        disabled={isAnalyzing}
                        variant="outline"
                      >
                        {isAnalyzing ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Analyzing...
                          </>
                        ) : (
                          <>
                            <Brain className="w-4 h-4 mr-2" />
                            Analyze
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {leaveLetters.length === 0 ? (
                    <div className="text-center py-12 text-slate-500">
                      <FileText className="w-12 h-12 mx-auto mb-4 text-slate-400" />
                      <p>No leave letters uploaded yet</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Student</TableHead>
                          <TableHead>Roll Number</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Reason</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {leaveLetters.map((letter, idx) => (
                          <TableRow key={idx}>
                            <TableCell className="font-medium">{letter.studentName}</TableCell>
                            <TableCell>{letter.rollNumber || "N/A"}</TableCell>
                            <TableCell>{new Date(letter.date).toLocaleDateString()}</TableCell>
                            <TableCell className="max-w-xs truncate">{letter.reason}</TableCell>
                            <TableCell>
                              <Badge variant={letter.status === "approved" ? "default" : "secondary"}>
                                {letter.status || "pending"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedLetter(letter)}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {analysisResult && (
          <TabsContent value="analysis">
            <div className="space-y-6">
              {/* Statistics Card */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Total Letters</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{analysisResult.statistics.total_letters}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Categories</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{analysisResult.statistics.total_categories}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>High Risk</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-red-600">
                      {analysisResult.statistics.high_risk_anomalies}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Total Anomalies</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{analysisResult.statistics.total_anomalies}</div>
                  </CardContent>
                </Card>
              </div>

              {/* Insights */}
              {analysisResult.insights.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5" />
                      AI Insights
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {analysisResult.insights.map((insight, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-primary mt-1">•</span>
                          <span>{insight}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {/* Anomalies */}
              {analysisResult.anomalies.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-amber-500" />
                      Detected Anomalies
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Accordion type="single" collapsible className="w-full">
                      {analysisResult.anomalies.map((anomaly, idx) => (
                        <AccordionItem key={idx} value={`anomaly-${idx}`}>
                          <AccordionTrigger>
                            <div className="flex items-center gap-2">
                              {getRiskBadge(anomaly.risk_level)}
                              <span className="text-sm">{anomaly.description}</span>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent>
                            <div className="space-y-2 pt-2">
                              <p className="text-sm text-slate-600">{anomaly.type.replace(/_/g, " ")}</p>
                              {anomaly.students && (
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead>Name</TableHead>
                                      <TableHead>Roll Number</TableHead>
                                      <TableHead>Date</TableHead>
                                      <TableHead>Reason</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {anomaly.students.map((student, sIdx) => (
                                      <TableRow key={sIdx}>
                                        <TableCell>{student.name}</TableCell>
                                        <TableCell>{student.roll_number}</TableCell>
                                        <TableCell>{student.date}</TableCell>
                                        <TableCell className="max-w-xs truncate">{student.reason}</TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              )}
                              {anomaly.similarity_score && (
                                <p className="text-xs text-slate-500">
                                  Similarity Score: {(anomaly.similarity_score * 100).toFixed(1)}%
                                </p>
                              )}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </CardContent>
                </Card>
              )}

              {/* Grouped Categories */}
              {analysisResult.grouped_categories.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Grouped Leave Categories</CardTitle>
                    <CardDescription>
                      Leave reasons grouped by semantic similarity
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Accordion type="single" collapsible className="w-full">
                      {analysisResult.grouped_categories.map((category, idx) => (
                        <AccordionItem key={idx} value={`category-${idx}`}>
                          <AccordionTrigger>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">{category.student_count} students</Badge>
                              <span className="text-sm max-w-md truncate">
                                {category.representative_reason}
                              </span>
                              <span className="text-xs text-slate-500">
                                ({(category.average_similarity * 100).toFixed(0)}% similarity)
                              </span>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent>
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Name</TableHead>
                                  <TableHead>Roll Number</TableHead>
                                  <TableHead>Date</TableHead>
                                  <TableHead>Reason</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {category.students.map((student, sIdx) => (
                                  <TableRow key={sIdx}>
                                    <TableCell>{student.name}</TableCell>
                                    <TableCell>{student.roll_number}</TableCell>
                                    <TableCell>{student.date}</TableCell>
                                    <TableCell className="max-w-xs truncate">{student.reason}</TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        )}
      </Tabs>

      {/* Letter Detail Dialog */}
      <Dialog open={!!selectedLetter} onOpenChange={() => setSelectedLetter(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Leave Letter Details</DialogTitle>
          </DialogHeader>
          {selectedLetter && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Student Name</Label>
                  <p className="font-medium">{selectedLetter.studentName}</p>
                </div>
                <div>
                  <Label>Roll Number</Label>
                  <p className="font-medium">{selectedLetter.rollNumber || "N/A"}</p>
                </div>
                <div>
                  <Label>Date</Label>
                  <p className="font-medium">{new Date(selectedLetter.date).toLocaleDateString()}</p>
                </div>
                <div>
                  <Label>Status</Label>
                  <Badge variant={selectedLetter.status === "approved" ? "default" : "secondary"}>
                    {selectedLetter.status || "pending"}
                  </Badge>
                </div>
              </div>
              <div>
                <Label>Leave Reason</Label>
                <p className="text-sm text-slate-700 mt-1">{selectedLetter.reason}</p>
              </div>
              {selectedLetter.rawText && (
                <div>
                  <Label>Extracted Text</Label>
                  <p className="text-xs text-slate-500 mt-1 whitespace-pre-wrap">{selectedLetter.rawText}</p>
                </div>
              )}
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    const updated = leaveLetters.map(l => 
                      l === selectedLetter ? { ...l, status: "approved" as const } : l
                    );
                    setLeaveLetters(updated);
                    setSelectedLetter({ ...selectedLetter, status: "approved" });
                    toast({ title: "Approved", description: "Leave letter approved" });
                  }}
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Approve
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    const updated = leaveLetters.map(l => 
                      l === selectedLetter ? { ...l, status: "rejected" as const } : l
                    );
                    setLeaveLetters(updated);
                    setSelectedLetter({ ...selectedLetter, status: "rejected" });
                    toast({ title: "Rejected", description: "Leave letter rejected" });
                  }}
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Reject
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
