import { useEvents, useRegisterForEvent } from "@/hooks/use-events";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { format } from "date-fns";
import { Calendar, MapPin, Loader2, ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RozaryoPayModal } from "@/components/RozaryoPayModal";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

export default function PublicEvents() {
  const { data: events, isLoading } = useEvents();
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [studentName, setStudentName] = useState("");
  const [showPayment, setShowPayment] = useState(false);
  const { mutateAsync: register, isPending } = useRegisterForEvent();
  const { toast } = useToast();

  const handleRegisterClick = (event: any) => {
    setSelectedEvent(event);
  };

  const handleNameSubmit = async () => {
    if (!studentName) return;
    
    // Check if payment required
    if (selectedEvent.isPaymentRequired) {
      // In a real app, we'd verify the student exists first before showing payment
      // For now, we simulate the flow
      setShowPayment(true);
    } else {
      await processRegistration();
    }
  };

  const processRegistration = async () => {
    try {
      await register({ eventId: selectedEvent.id, studentName });
      toast({ title: "Success!", description: "You have been registered for the event." });
      setSelectedEvent(null);
      setStudentName("");
      setShowPayment(false);
    } catch (error: any) {
      toast({ title: "Registration Failed", description: error.message, variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white shadow-sm sticky top-0 z-30">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="icon"><ArrowLeft /></Button>
          </Link>
          <h1 className="text-xl font-bold font-display text-slate-900">All Events</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {isLoading ? (
          <div className="flex justify-center py-20"><Loader2 className="animate-spin" /></div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events?.map((event, i) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className="h-full hover:shadow-xl transition-all duration-300 border-none shadow-md overflow-hidden flex flex-col">
                  <div className="h-40 bg-gradient-to-br from-blue-500 to-indigo-600 relative p-6 flex flex-col justify-end">
                    <div className="absolute top-4 right-4 bg-white/20 backdrop-blur text-white px-3 py-1 rounded-full text-xs font-bold">
                       {event.amount > 0 ? `₹${event.amount}` : "Free"}
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-1">{event.title}</h3>
                  </div>
                  <CardContent className="p-6 flex-1 flex flex-col">
                    <div className="space-y-3 mb-6 flex-1">
                      <p className="text-slate-600 text-sm leading-relaxed">{event.description}</p>
                      <div className="flex items-center gap-2 text-sm text-slate-500 pt-2 border-t border-slate-100">
                        <Calendar className="w-4 h-4" />
                        {format(new Date(event.date), "PPP p")}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-500">
                        <MapPin className="w-4 h-4" />
                        {event.location || "TBD"}
                      </div>
                    </div>
                    <Button 
                      className="w-full bg-slate-900 hover:bg-slate-800"
                      onClick={() => handleRegisterClick(event)}
                    >
                      Register Now
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </main>

      {/* Registration Dialog */}
      <Dialog open={!!selectedEvent && !showPayment} onOpenChange={(open) => !open && setSelectedEvent(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Register for {selectedEvent?.title}</DialogTitle>
            <DialogDescription>Enter your name to confirm your identity.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input 
                placeholder="e.g. John Doe" 
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
              />
              <p className="text-xs text-slate-500">We'll match this with our student records.</p>
            </div>
            <Button className="w-full" onClick={handleNameSubmit} disabled={!studentName}>
              Proceed
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Payment Modal */}
      {selectedEvent && (
        <RozaryoPayModal
          isOpen={showPayment}
          onClose={() => setShowPayment(false)}
          amount={selectedEvent.amount || 0}
          eventName={selectedEvent.title}
          onSuccess={processRegistration}
        />
      )}
    </div>
  );
}
