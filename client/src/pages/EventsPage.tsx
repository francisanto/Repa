import { PageHeader } from "@/components/PageHeader";
import { useEvents, useCreateEvent } from "@/hooks/use-events";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertEventSchema } from "@shared/schema";
import { useState } from "react";
import { Loader2, Plus, Calendar as CalendarIcon, MapPin, IndianRupee, Image, Bell, Share2, Sparkles, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import { useAuth } from "@/hooks/use-auth";
import { motion } from "framer-motion";
import { useNotifications } from "@/hooks/use-notifications";

export default function EventsPage() {
  const { data: events, isLoading } = useEvents();
  const { mutateAsync: createEvent, isPending: isCreating } = useCreateEvent();
  const { toast } = useToast();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const { user } = useAuth();

  const [posterFile, setPosterFile] = useState<File | null>(null);
  const [posterPreview, setPosterPreview] = useState<string | null>(null);
  const [reminderDate, setReminderDate] = useState<string>("");
  const { requestPermission, scheduleNotification } = useNotifications();

  const form = useForm({
    resolver: zodResolver(insertEventSchema),
    defaultValues: {
      title: "",
      description: "",
      date: new Date(),
      location: "",
      amount: 0,
      isPaymentRequired: false,
      organizerId: user?.id || "temp-id",
      posterUrl: "",
    },
  });

  const handlePosterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPosterFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPosterPreview(reader.result as string);
        form.setValue("posterUrl", reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = async (data: any) => {
    try {
      const eventData = {
        ...data,
        organizerId: user?.id || "temp-id",
        reminderDate: reminderDate ? new Date(reminderDate) : undefined,
      };
      
      await createEvent(eventData);
      
      // Schedule push notification if reminder is set
      if (reminderDate) {
        const hasPermission = await requestPermission();
        if (hasPermission) {
          const reminderDateTime = new Date(reminderDate);
          scheduleNotification(
            `Reminder: ${data.title}`,
            reminderDateTime,
            {
              body: `Don't forget: ${data.description || data.title} on ${new Date(data.date).toLocaleDateString()}`,
              tag: `event-reminder-${Date.now()}`,
            }
          );
          toast({ title: "Reminder Set", description: "You'll receive a notification before the event" });
        }
      }
      
      setIsAddOpen(false);
      form.reset();
      setReminderDate("");
      setPosterFile(null);
      setPosterPreview(null);
      toast({ title: "Success", description: "Event created successfully" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-8 min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-cyan-50/20 -m-8 p-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <PageHeader 
          title="Events" 
          description="Plan and manage class activities"
          action={
            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button size="lg" className="rounded-full bg-gradient-to-r from-primary to-cyan-500 hover:from-primary/90 hover:to-cyan-500/90 text-white shadow-lg shadow-primary/20">
                  <Plus className="w-5 h-5 mr-2" /> Create Event
                </Button>
              </motion.div>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Create New Event</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Event Title</FormLabel>
                        <FormControl><Input {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl><Textarea {...field} value={field.value || ""} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Date</FormLabel>
                          <FormControl>
                            <Input 
                              type="datetime-local" 
                              value={field.value ? new Date(field.value).toISOString().slice(0, 16) : ""}
                              onChange={(e) => field.onChange(new Date(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="location"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Location</FormLabel>
                          <FormControl><Input {...field} value={field.value || ""} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="isPaymentRequired"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value || false}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Require Payment?</FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />

                  {form.watch("isPaymentRequired") && (
                    <FormField
                      control={form.control}
                      name="amount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Amount (₹)</FormLabel>
                          <FormControl><Input type="number" {...field} onChange={e => field.onChange(Number(e.target.value))} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">Event Poster</Label>
                    <div className="flex items-center gap-4">
                      <label className="flex-1 cursor-pointer">
                        <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center hover:border-primary/50 transition-colors">
                          {posterPreview ? (
                            <img src={posterPreview} alt="Poster preview" className="max-h-32 mx-auto rounded-lg" />
                          ) : (
                            <div className="space-y-2">
                              <Upload className="w-8 h-8 mx-auto text-slate-400" />
                              <p className="text-sm text-slate-600">Upload poster image</p>
                            </div>
                          )}
                        </div>
                        <input type="file" accept="image/*" onChange={handlePosterChange} className="hidden" />
                      </label>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-semibold flex items-center gap-2">
                      <Bell className="w-4 h-4" /> Set Reminder
                    </Label>
                    <Input
                      type="datetime-local"
                      value={reminderDate}
                      onChange={(e) => setReminderDate(e.target.value)}
                      placeholder="Schedule reminder"
                    />
                  </div>

                  <div className="flex items-center gap-2 p-3 bg-blue-50/50 rounded-lg border border-blue-100">
                    <Sparkles className="w-4 h-4 text-primary flex-shrink-0" />
                    <p className="text-xs text-slate-600">AI will validate event details and suggest improvements</p>
                  </div>

                  <Button type="submit" className="w-full bg-gradient-to-r from-primary to-cyan-500 hover:from-primary/90 hover:to-cyan-500/90" disabled={isCreating}>
                    {isCreating ? (
                      <>
                        <Loader2 className="mr-2 animate-spin" /> Creating...
                      </>
                    ) : (
                      "Create Event"
                    )}
                  </Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        }
      />

      {isLoading ? (
        <div className="flex justify-center p-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events?.map((event, index) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -5 }}
            >
              <Card className="group hover:shadow-2xl transition-all duration-300 border-0 shadow-xl overflow-hidden bg-white/90 backdrop-blur-sm">
                <div className="h-2 bg-gradient-to-r from-primary via-cyan-500 to-blue-500" />
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <motion.div 
                      className="w-14 h-14 bg-gradient-to-br from-primary to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform"
                      whileHover={{ rotate: 360 }}
                      transition={{ duration: 0.5 }}
                    >
                      <CalendarIcon className="w-7 h-7 text-white" />
                    </motion.div>
                    {event.isPaymentRequired && (
                      <motion.span 
                        className="bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 px-4 py-1.5 rounded-full text-xs font-bold flex items-center gap-1 shadow-sm"
                        whileHover={{ scale: 1.1 }}
                      >
                        <IndianRupee className="w-3 h-3" /> {event.amount}
                      </motion.span>
                    )}
                  </div>
                  
                  <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-primary transition-colors">
                    {event.title}
                  </h3>
                  <p className="text-slate-500 text-sm mb-4 line-clamp-2">{event.description}</p>
                  
                  <div className="space-y-2 text-sm text-slate-600 pt-4 border-t border-slate-100">
                    <div className="flex items-center gap-2">
                      <CalendarIcon className="w-4 h-4 text-primary" />
                      <span className="font-medium">{format(new Date(event.date), "PPP p")}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-primary" />
                      <span>{event.location || "TBD"}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-100">
                    {event.posterUrl && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 border-primary/20 hover:bg-primary/5"
                        onClick={() => window.open(event.posterUrl || "", "_blank")}
                      >
                        <Image className="w-4 h-4 mr-2" />
                        Poster
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 border-primary/20 hover:bg-primary/5"
                      onClick={() => {
                        if (navigator.share) {
                          navigator.share({
                            title: event.title,
                            text: event.description || "",
                            url: window.location.href,
                          }).catch(() => {});
                        } else {
                          navigator.clipboard.writeText(window.location.href);
                          toast({ title: "Link copied!" });
                        }
                      }}
                    >
                      <Share2 className="w-4 h-4 mr-2" />
                      Share
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
          {!events?.length && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="col-span-full text-center py-16 bg-white/80 backdrop-blur-sm rounded-2xl border-2 border-dashed border-slate-300"
            >
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="w-20 h-20 bg-gradient-to-br from-primary/10 to-cyan-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4"
              >
                <CalendarIcon className="w-10 h-10 text-primary/50" />
              </motion.div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">No events scheduled yet</h3>
              <p className="text-slate-500 mb-6">Create your first event to get started!</p>
              <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-gradient-to-r from-primary to-cyan-500 text-white">
                    <Plus className="w-4 h-4 mr-2" /> Create Event
                  </Button>
                </DialogTrigger>
              </Dialog>
            </motion.div>
          )}
        </div>
      )}
    </div>
  );
}
