import { PageHeader } from "@/components/PageHeader";
import { useTimetables, useUploadTimetable } from "@/hooks/use-timetables";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { Upload, FileText, Loader2, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

export default function TimetablePage() {
  const { data: timetables, isLoading } = useTimetables();
  const { mutateAsync: upload, isPending } = useUploadTimetable();
  const { toast } = useToast();
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [batch, setBatch] = useState("");
  const [file, setFile] = useState<File | null>(null);

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
    <div className="space-y-8">
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

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <div><Loader2 className="animate-spin" /></div>
        ) : timetables?.map((tt) => (
          <motion.div key={tt.id} layout>
            <Card className="hover:shadow-lg transition-shadow border-t-4 border-t-purple-500">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="bg-purple-50 p-3 rounded-xl">
                    <FileText className="w-6 h-6 text-purple-600" />
                  </div>
                  <span className="text-xs font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded">
                    {new Date(tt.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">{tt.batch}</h3>
                <p className="text-sm text-slate-500 mb-4">Parsed Schedule Available</p>
                <Button variant="outline" className="w-full">View Schedule</Button>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
