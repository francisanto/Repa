import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bell, Image as ImageIcon, Upload, Loader2, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNotifications } from "@/hooks/use-notifications";

export function ReminderManager() {
  const { toast } = useToast();
  const { requestPermission, sendNotification, scheduleNotification } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const [reminderText, setReminderText] = useState("");
  const [reminderDate, setReminderDate] = useState("");
  const [reminderImage, setReminderImage] = useState<string | null>(null);
  const [reminderFile, setReminderFile] = useState<File | null>(null);
  const [isSending, setIsSending] = useState(false);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setReminderImage(reader.result as string);
      };
      reader.readAsDataURL(file);
      setReminderFile(file);
    }
  };

  const handleSendReminder = async () => {
    if (!reminderText && !reminderImage) {
      toast({ title: "Error", description: "Please enter a message or upload an image", variant: "destructive" });
      return;
    }

    setIsSending(true);
    try {
      const hasPermission = await requestPermission();
      if (!hasPermission) {
        toast({ title: "Permission Required", description: "Please allow notifications to send reminders", variant: "destructive" });
        return;
      }

      if (reminderDate) {
        // Schedule for later
        scheduleNotification(
          reminderText || "Image Reminder",
          new Date(reminderDate),
          {
            body: reminderText || "Check the image for details",
            icon: reminderImage || undefined,
            image: reminderImage || undefined,
          }
        );
        toast({ title: "Success", description: `Reminder scheduled for ${new Date(reminderDate).toLocaleString()}` });
      } else {
        // Send immediately
        sendNotification(
          reminderText || "Image Reminder",
          {
            body: reminderText || "Check the image for details",
            icon: reminderImage || undefined,
            image: reminderImage || undefined,
          }
        );
        toast({ title: "Success", description: "Reminder sent to all users" });
      }

      setIsOpen(false);
      setReminderText("");
      setReminderDate("");
      setReminderImage(null);
      setReminderFile(null);
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to send reminder", variant: "destructive" });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white shadow-lg">
            <Bell className="w-4 h-4 mr-2" />
            Send Reminder
          </Button>
        </motion.div>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Send Reminder to Students</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="text" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="text">Text Reminder</TabsTrigger>
            <TabsTrigger value="image">Image Reminder</TabsTrigger>
          </TabsList>

          <TabsContent value="text" className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Reminder Message</Label>
              <Textarea
                placeholder="Enter reminder message..."
                value={reminderText}
                onChange={(e) => setReminderText(e.target.value)}
                rows={4}
              />
            </div>
            <div className="space-y-2">
              <Label>Schedule (optional - leave empty for immediate)</Label>
              <Input
                type="datetime-local"
                value={reminderDate}
                onChange={(e) => setReminderDate(e.target.value)}
              />
            </div>
            <Button onClick={handleSendReminder} disabled={isSending} className="w-full">
              {isSending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Send Reminder
                </>
              )}
            </Button>
          </TabsContent>

          <TabsContent value="image" className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Upload Image</Label>
              <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="reminder-image"
                />
                <label htmlFor="reminder-image" className="cursor-pointer">
                  {reminderImage ? (
                    <img src={reminderImage} alt="Reminder" className="max-h-48 mx-auto rounded-lg" />
                  ) : (
                    <div className="space-y-2">
                      <ImageIcon className="w-8 h-8 mx-auto text-slate-400" />
                      <p className="text-sm text-slate-600">Click to upload image</p>
                    </div>
                  )}
                </label>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Message (optional)</Label>
              <Textarea
                placeholder="Additional message with image..."
                value={reminderText}
                onChange={(e) => setReminderText(e.target.value)}
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label>Schedule (optional)</Label>
              <Input
                type="datetime-local"
                value={reminderDate}
                onChange={(e) => setReminderDate(e.target.value)}
              />
            </div>
            <Button onClick={handleSendReminder} disabled={isSending || !reminderImage} className="w-full">
              {isSending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Send Image Reminder
                </>
              )}
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

