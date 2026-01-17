import { useEvents, useRegisterForEvent } from "@/hooks/use-events";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { format } from "date-fns";
import { Calendar, MapPin, Loader2, ArrowLeft, Sparkles } from "lucide-react";
import { Link } from "wouter";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RazorpayPayment } from "@/components/RazorpayPayment";
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
    
    // First verify the student exists (with fuzzy matching)
    try {
      // This will be handled by the registration endpoint which does fuzzy matching
      // For payment events, we'll verify first, then show payment
      if (selectedEvent.isPaymentRequired) {
        // Verify student exists before showing payment
        const verifyRes = await fetch(`/api/students?search=${encodeURIComponent(studentName)}`, {
          credentials: "include"
        });
        const students = await verifyRes.json();
        
        if (students.length === 0) {
          toast({ 
            title: "Student Not Found", 
            description: "Please check your name spelling or contact your representative.",
            variant: "destructive" 
          });
          return;
        }
        
        setShowPayment(true);
      } else {
        await processRegistration();
      }
    } catch (error) {
      toast({ 
        title: "Error", 
        description: "Failed to verify student. Please try again.",
        variant: "destructive" 
      });
    }
  };

  const processRegistration = async (paymentId?: string, orderId?: string) => {
    try {
      await register({ 
        eventId: selectedEvent.id, 
        studentName,
        paymentId,
        orderId,
      });
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
                      {event.amount > 0 ? `Register & Pay ₹${event.amount}` : "Register"}
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
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl">Register for {selectedEvent?.title}</DialogTitle>
            <DialogDescription>
              Enter your name to confirm your identity. Our AI will match it with student records.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Full Name</Label>
              <Input 
                placeholder="e.g. John Doe" 
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleNameSubmit()}
                className="rounded-xl border-slate-200 focus:ring-primary/20"
              />
              <div className="flex items-start gap-2 text-xs text-slate-500 bg-blue-50 p-3 rounded-lg border border-blue-100">
                <Sparkles className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <p>Our smart matching system will find you even with minor spelling variations.</p>
              </div>
            </div>
            <Button 
              className="w-full rounded-xl bg-gradient-to-r from-primary to-cyan-500 hover:from-primary/90 hover:to-cyan-500/90 shadow-lg shadow-primary/20" 
              onClick={handleNameSubmit} 
              disabled={!studentName || isPending}
              size="lg"
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                "Verify & Continue"
              )}
            </Button>
            {selectedEvent?.isPaymentRequired && (
              <p className="text-xs text-center text-slate-500">
                Payment of ₹{selectedEvent.amount} will be required after verification
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Razorpay Payment Modal */}
      {selectedEvent && selectedEvent.isPaymentRequired && selectedEvent.amount > 0 && (
        <RazorpayPayment
          isOpen={showPayment}
          onClose={() => setShowPayment(false)}
          amount={selectedEvent.amount}
          eventName={selectedEvent.title}
          eventId={selectedEvent.id}
          studentName={studentName}
          onSuccess={(paymentId, orderId) => processRegistration(paymentId, orderId)}
        />
      )}
    </div>
  );
}
