import { useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Check, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface RazorpayPaymentProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  eventName: string;
  eventId: number;
  studentName: string;
  onSuccess: (paymentId: string, orderId: string) => void;
}

export function RazorpayPayment({
  isOpen,
  onClose,
  amount,
  eventName,
  eventId,
  studentName,
  onSuccess,
}: RazorpayPaymentProps) {
  const { toast } = useToast();

  useEffect(() => {
    // Load Razorpay script once on mount
    if (!window.Razorpay && !document.querySelector('script[src*="razorpay"]')) {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  const handlePayment = async () => {
    try {
      // Create order
      const response = await fetch("/api/payments/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          eventId,
          amount,
          studentName,
        }),
      });

      const orderData = await response.json();

      if (!response.ok) {
        throw new Error(orderData.message || "Failed to create payment order");
      }

      // Open Razorpay checkout
      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "Repa",
        description: `Payment for ${eventName}`,
        order_id: orderData.orderId,
        handler: async function (response: any) {
          // Payment successful
          try {
            // Call registration with payment details
            onSuccess(response.razorpay_payment_id, response.razorpay_order_id);
            toast({
              title: "Payment Successful!",
              description: "You have been registered for the event.",
            });
            onClose();
          } catch (error: any) {
            toast({
              title: "Error",
              description: error.message || "Payment succeeded but registration failed. Please contact support.",
              variant: "destructive",
            });
          }
        },
        prefill: {
          name: studentName,
        },
        theme: {
          color: "#2563eb",
        },
        modal: {
          ondismiss: function () {
            onClose();
          },
        },
      };

      if (!window.Razorpay) {
        // Wait for script to load
        const checkInterval = setInterval(() => {
          if (window.Razorpay) {
            clearInterval(checkInterval);
            const razorpay = new window.Razorpay(options);
            razorpay.on("payment.failed", function (response: any) {
              toast({
                title: "Payment Failed",
                description: response.error.description || "Payment could not be processed.",
                variant: "destructive",
              });
            });
            razorpay.open();
          }
        }, 100);
        
        // Timeout after 5 seconds
        setTimeout(() => clearInterval(checkInterval), 5000);
      } else {
        const razorpay = new window.Razorpay(options);
        razorpay.on("payment.failed", function (response: any) {
          toast({
            title: "Payment Failed",
            description: response.error.description || "Payment could not be processed.",
            variant: "destructive",
          });
        });
        razorpay.open();
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to initiate payment.",
        variant: "destructive",
      });
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Complete Payment</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="p-4 bg-slate-50 rounded-lg">
            <p className="text-sm text-slate-600 mb-2">Event: {eventName}</p>
            <p className="text-2xl font-bold text-slate-900">₹{amount}</p>
          </div>
          <Button
            onClick={handlePayment}
            className="w-full bg-gradient-to-r from-primary to-cyan-500 hover:from-primary/90 hover:to-cyan-500/90"
          >
            Pay ₹{amount} with Razorpay
          </Button>
          <Button variant="ghost" onClick={onClose} className="w-full">
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

