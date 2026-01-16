import { PageHeader } from "@/components/PageHeader";
import { useStudents, useCreateStudent, useDeleteStudent } from "@/hooks/use-students";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertStudentSchema } from "@shared/schema";
import { useState } from "react";
import { Loader2, Trash2, Plus, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function StudentsPage() {
  const [search, setSearch] = useState("");
  const { data: students, isLoading } = useStudents({ search });
  const { mutateAsync: createStudent, isPending: isCreating } = useCreateStudent();
  const { mutateAsync: deleteStudent } = useDeleteStudent();
  const { toast } = useToast();
  const [isAddOpen, setIsAddOpen] = useState(false);

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

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Students" 
        description="Manage your class roster"
        action={
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button size="lg" className="rounded-full shadow-lg shadow-primary/20">
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
        }
      />

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
        <Input 
          placeholder="Search by name or roll no..." 
          className="pl-10"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="text-left py-4 px-6 font-semibold text-sm text-slate-500">Name</th>
                <th className="text-left py-4 px-6 font-semibold text-sm text-slate-500">Roll No</th>
                <th className="text-left py-4 px-6 font-semibold text-sm text-slate-500">Batch</th>
                <th className="text-left py-4 px-6 font-semibold text-sm text-slate-500">Email</th>
                <th className="text-right py-4 px-6 font-semibold text-sm text-slate-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr><td colSpan={5} className="p-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" /></td></tr>
              ) : students?.map((student) => (
                <tr key={student.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-4 px-6 font-medium text-slate-900">{student.name}</td>
                  <td className="py-4 px-6 text-slate-600">{student.rollNo}</td>
                  <td className="py-4 px-6 text-slate-600">{student.batch}</td>
                  <td className="py-4 px-6 text-slate-600">{student.email || "-"}</td>
                  <td className="py-4 px-6 text-right">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-slate-400 hover:text-red-500"
                      onClick={() => handleDelete(student.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </td>
                </tr>
              ))}
              {!isLoading && students?.length === 0 && (
                <tr><td colSpan={5} className="p-8 text-center text-slate-500">No students found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
