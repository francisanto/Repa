import { PageHeader } from "@/components/PageHeader";
import { useStudents, useCreateStudent, useDeleteStudent, useImportFromGoogleSheets } from "@/hooks/use-students";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertStudentSchema } from "@shared/schema";
import { useState } from "react";
import { Loader2, Trash2, Plus, Search, Upload, FileSpreadsheet, Filter, Image as ImageIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion } from "framer-motion";

export default function StudentsPage() {
  const [search, setSearch] = useState("");
  const [batchFilter, setBatchFilter] = useState<string>("all");
  const { data: students, isLoading } = useStudents({ search, batch: batchFilter !== "all" ? batchFilter : undefined });
  const { mutateAsync: createStudent, isPending: isCreating } = useCreateStudent();
  const { mutateAsync: deleteStudent } = useDeleteStudent();
  const { mutateAsync: importFromSheets, isPending: isImporting } = useImportFromGoogleSheets();
  const { toast } = useToast();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [sheetUrl, setSheetUrl] = useState("");
  const [sheetName, setSheetName] = useState("");
  const [importImage, setImportImage] = useState<string | null>(null);
  const [importBatch, setImportBatch] = useState("");
  const [isImportingImage, setIsImportingImage] = useState(false);

  // Get unique batches for filter
  const allStudents = useStudents();
  const batches = Array.from(new Set(allStudents.data?.map(s => s.batch) || [])).sort();

  const form = useForm({
    resolver: zodResolver(insertStudentSchema),
    defaultValues: {
      name: "",
      rollNo: "",
      email: "",
      phone: "",
      batch: "",
    },
  });

  const onSubmit = async (data: any) => {
    try {
      await createStudent(data);
      setIsAddOpen(false);
      form.reset();
      toast({ title: "Success", description: "Student added successfully" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure?")) return;
    try {
      await deleteStudent(id);
      toast({ title: "Deleted", description: "Student removed" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete", variant: "destructive" });
    }
  };

  const handleImportSheets = async () => {
    if (!sheetUrl) {
      toast({ title: "Error", description: "Please enter a Google Sheets URL", variant: "destructive" });
      return;
    }
    try {
      const result = await importFromSheets({ sheetUrl, sheetName: sheetName || undefined });
      setIsImportOpen(false);
      setSheetUrl("");
      setSheetName("");
      toast({ 
        title: "Success!", 
        description: `Imported ${result.imported} students from Google Sheets` 
      });
    } catch (error: any) {
      toast({ title: "Import Failed", description: error.message, variant: "destructive" });
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImportImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImportImage = async () => {
    if (!importImage) {
      toast({ title: "Error", description: "Please upload an image", variant: "destructive" });
      return;
    }
    setIsImportingImage(true);
    try {
      const response = await fetch("/api/students/import-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ image: importImage, batch: importBatch || undefined }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || "Import failed");
      }

      setIsImportOpen(false);
      setImportImage(null);
      setImportBatch("");
      toast({ 
        title: "Success!", 
        description: `Imported ${data.imported} students from image` 
      });
    } catch (error: any) {
      toast({ title: "Import Failed", description: error.message, variant: "destructive" });
    } finally {
      setIsImportingImage(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Students" 
        description="Manage your class roster"
        action={
          <div className="flex gap-3">
            <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
              <DialogTrigger asChild>
                <Button size="lg" variant="outline" className="rounded-full border-primary/20 hover:bg-primary/5">
                  <FileSpreadsheet className="w-5 h-5 mr-2" /> Import Sheets
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle>Import Students</DialogTitle>
                  <DialogDescription>
                    Import students from Google Sheets or upload an image/file containing student list
                  </DialogDescription>
                </DialogHeader>
                <Tabs defaultValue="sheets" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="sheets">Google Sheets</TabsTrigger>
                    <TabsTrigger value="image">Image/File</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="sheets" className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Google Sheets URL</label>
                      <Input 
                        placeholder="https://docs.google.com/spreadsheets/d/..."
                        value={sheetUrl}
                        onChange={(e) => setSheetUrl(e.target.value)}
                      />
                      <p className="text-xs text-slate-500">
                        Expected columns: Name, Roll No, Batch (Email, Phone optional)
                      </p>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Sheet Name (optional)</label>
                      <Input 
                        placeholder="Sheet1 (leave empty for default)"
                        value={sheetName}
                        onChange={(e) => setSheetName(e.target.value)}
                      />
                    </div>
                    <Button 
                      className="w-full" 
                      onClick={handleImportSheets} 
                      disabled={!sheetUrl || isImporting}
                    >
                      {isImporting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Importing...
                        </>
                      ) : (
                        <>
                          <Upload className="mr-2 h-4 w-4" />
                          Import from Sheets
                        </>
                      )}
                    </Button>
                  </TabsContent>

                  <TabsContent value="image" className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Upload Image/File</label>
                      <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center">
                        <input
                          type="file"
                          accept="image/*,.pdf,.doc,.docx"
                          onChange={handleImageUpload}
                          className="hidden"
                          id="image-upload"
                        />
                        <label htmlFor="image-upload" className="cursor-pointer">
                          {importImage ? (
                            <img src={importImage} alt="Preview" className="max-h-48 mx-auto rounded-lg" />
                          ) : (
                            <div className="space-y-2">
                              <ImageIcon className="w-8 h-8 mx-auto text-slate-400" />
                              <p className="text-sm text-slate-600">Click to upload image or file</p>
                              <p className="text-xs text-slate-500">Supports: Images, PDF, Word documents</p>
                            </div>
                          )}
                        </label>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Batch (optional)</label>
                      <Input 
                        placeholder="e.g., CS-A (leave empty to extract from image)"
                        value={importBatch}
                        onChange={(e) => setImportBatch(e.target.value)}
                      />
                    </div>
                    <Button 
                      className="w-full" 
                      onClick={handleImportImage} 
                      disabled={!importImage || isImportingImage}
                    >
                      {isImportingImage ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <Upload className="mr-2 h-4 w-4" />
                          Import from Image
                        </>
                      )}
                    </Button>
                  </TabsContent>
                </Tabs>
              </DialogContent>
            </Dialog>
            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
              <DialogTrigger asChild>
                <Button size="lg" className="rounded-full shadow-lg shadow-primary/20 bg-gradient-to-r from-primary to-cyan-500 border-none">
                  <Plus className="w-5 h-5 mr-2" /> Add Student
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Add New Student</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name</FormLabel>
                          <FormControl><Input {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="rollNo"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Roll No</FormLabel>
                            <FormControl><Input {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="batch"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Batch</FormLabel>
                            <FormControl><Input {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl><Input type="email" {...field} value={field.value || ""} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" className="w-full" disabled={isCreating}>
                      {isCreating ? <Loader2 className="animate-spin" /> : "Save Student"}
                    </Button>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        }
      />

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <Input 
            placeholder="🔍 Smart search by name or roll no..." 
            className="pl-10 rounded-xl border-slate-200 focus:ring-primary/20"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={batchFilter} onValueChange={setBatchFilter}>
          <SelectTrigger className="w-full sm:w-[180px] rounded-xl">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Filter by batch" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Batches</SelectItem>
            {batches.map(batch => (
              <SelectItem key={batch} value={batch}>{batch}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-blue-50 to-cyan-50 border-b border-slate-200">
              <tr>
                <th className="text-left py-4 px-6 font-semibold text-sm text-slate-700">Name</th>
                <th className="text-left py-4 px-6 font-semibold text-sm text-slate-700">Roll No</th>
                <th className="text-left py-4 px-6 font-semibold text-sm text-slate-700">Batch</th>
                <th className="text-left py-4 px-6 font-semibold text-sm text-slate-700">Email</th>
                <th className="text-right py-4 px-6 font-semibold text-sm text-slate-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="p-12 text-center">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
                    <p className="mt-4 text-slate-500">Loading students...</p>
                  </td>
                </tr>
              ) : students?.map((student, index) => (
                <motion.tr 
                  key={student.id} 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="hover:bg-blue-50/50 transition-all duration-200 group"
                >
                  <td className="py-4 px-6 font-semibold text-slate-900 group-hover:text-primary transition-colors">
                    {student.name}
                  </td>
                  <td className="py-4 px-6 text-slate-600">
                    <span className="px-2 py-1 bg-slate-100 rounded-md text-sm font-mono">
                      {student.rollNo}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
                      {student.batch}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-slate-600">{student.email || "-"}</td>
                  <td className="py-4 px-6 text-right">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all"
                      onClick={() => handleDelete(student.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </td>
                </motion.tr>
              ))}
              {!isLoading && students?.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center">
                        <Search className="w-8 h-8 text-slate-400" />
                      </div>
                      <p className="text-slate-500 font-medium">No students found</p>
                      <p className="text-sm text-slate-400">Try adjusting your search or filters</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {!isLoading && students && students.length > 0 && (
          <div className="bg-slate-50 px-6 py-3 border-t border-slate-100 text-sm text-slate-600">
            Showing {students.length} student{students.length !== 1 ? 's' : ''}
          </div>
        )}
      </motion.div>
    </div>
  );
}
