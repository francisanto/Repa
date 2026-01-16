import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { Check, Loader2, CreditCard, Lock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Confetti from "react-confetti";
import { useWindowSize } from "react-use";

interface RozaryoPayProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  eventName: string;
  onSuccess: () => void;
}

export function RozaryoPayModal({ isOpen, onClose, amount, eventName, onSuccess }: RozaryoPayProps) {
  const [step, setStep] = useState<"processing" | "success">("processing");
  const { width, height } = useWindowSize();

  useEffect(() => {
    if (isOpen) {
      setStep("processing");
      // Simulate payment processing time
      const timer = setTimeout(() => {
        setStep("success");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleComplete = () => {
    onSuccess();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md border-0 bg-transparent shadow-none p-0 overflow-hidden">
        {step === "success" && <Confetti width={width} height={height} recycle={false} numberOfPieces={200} />}
        
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white rounded-3xl overflow-hidden shadow-2xl ring-1 ring-black/5"
        >
          {/* Header Brand */}
          <div className="bg-[#3395ff] px-6 py-4 flex items-center justify-between text-white">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded bg-white/20 flex items-center justify-center font-bold">R</div>
              <span className="font-bold tracking-wide">RozaryoPay</span>
            </div>
            <div className="flex items-center gap-1 text-xs bg-white/10 px-2 py-1 rounded">
              <Lock className="w-3 h-3" />
              Secured
            </div>
          </div>

          <div className="p-8">
            <AnimatePresence mode="wait">
              {step === "processing" ? (
                <motion.div
                  key="processing"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex flex-col items-center text-center space-y-6"
                >
                  <div className="w-20 h-20 rounded-full bg-blue-50 flex items-center justify-center relative">
                    <Loader2 className="w-10 h-10 text-primary animate-spin" />
                    <div className="absolute inset-0 rounded-full border-4 border-primary/20 animate-ping" />
                  </div>
                  
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">Processing Payment</h3>
                    <p className="text-slate-500 mt-1">Please do not close this window</p>
                  </div>

                  <div className="w-full bg-slate-50 p-4 rounded-xl flex justify-between items-center border border-slate-100">
                    <span className="text-sm text-slate-600">Amount</span>
                    <span className="text-xl font-bold text-slate-900">₹{amount}</span>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center text-center space-y-6"
                >
                  <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
                    <Check className="w-10 h-10 text-green-600" />
                  </div>
                  
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">Payment Successful!</h3>
                    <p className="text-slate-500 mt-1">You are now registered for <span className="font-medium text-primary">{eventName}</span></p>
                  </div>

                  <Button 
                    onClick={handleComplete} 
                    className="w-full bg-green-600 hover:bg-green-700 text-white rounded-xl py-6 text-lg shadow-lg shadow-green-600/20"
                  >
                    Done
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          <div className="bg-slate-50 px-6 py-3 border-t text-center text-xs text-slate-400">
            Powered by RozaryoPay Secure Gateway
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}
