import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import { LogIn, UserPlus, ArrowRight, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useQueryClient } from "@tanstack/react-query";

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const [representativeId, setRepresentativeId] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { user, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();

  // Redirect if already logged in
  useEffect(() => {
    if (user && !authLoading) {
      setLocation("/dashboard");
    }
  }, [user, authLoading, setLocation]);

  if (user) {
    return null;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!representativeId || !password) {
      toast({ title: "Error", description: "Please fill in all fields", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ representativeId, password }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || "Login failed");
      }

      // Invalidate and refetch user data
      await queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      
      toast({ title: "Success", description: "Logged in successfully!" });
      
      // Wait a moment for the query to update, then redirect
      setTimeout(() => {
        setLocation("/dashboard");
      }, 100);
    } catch (error: any) {
      toast({ title: "Login Failed", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-cyan-50/30 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-10">
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
            className="inline-flex items-center gap-3 mb-6"
          >
            <div className="w-14 h-14 bg-gradient-to-br from-primary to-cyan-500 text-white rounded-xl flex items-center justify-center text-lg font-bold shadow-lg shadow-primary/30">
              RP
            </div>
            <h1 className="text-4xl font-bold font-display bg-gradient-to-r from-primary to-cyan-500 bg-clip-text text-transparent">
              Repa
            </h1>
          </motion.div>
          <p className="text-lg text-slate-600 font-medium">Representative Portal</p>
        </div>

        <Card className="border-0 shadow-2xl bg-white/90 backdrop-blur-md overflow-hidden">
          <div className="h-2 bg-gradient-to-r from-primary via-cyan-500 to-blue-500" />
          <CardHeader className="text-center space-y-4 pb-8">
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
              className="w-24 h-24 bg-gradient-to-br from-primary to-cyan-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-primary/30"
            >
              <LogIn className="w-12 h-12 text-white" />
            </motion.div>
            <CardTitle className="text-3xl font-display bg-gradient-to-r from-primary to-cyan-500 bg-clip-text text-transparent mb-2">
              Welcome Back
            </CardTitle>
            <CardDescription className="text-base text-slate-600">
              Sign in to your representative dashboard
            </CardDescription>
          </CardHeader>
          <CardContent className="px-8 pb-8">
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-3">
                <Label htmlFor="representativeId" className="text-sm font-semibold text-slate-700">
                  Representative ID
                </Label>
                <Input
                  id="representativeId"
                  type="text"
                  placeholder="Enter your ID"
                  value={representativeId}
                  onChange={(e) => setRepresentativeId(e.target.value)}
                  required
                  className="h-12 rounded-xl border-2 border-slate-200 focus:border-primary/50 transition-colors text-base"
                />
              </div>
              <div className="space-y-3">
                <Label htmlFor="password" className="text-sm font-semibold text-slate-700">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-12 rounded-xl border-2 border-slate-200 focus:border-primary/50 transition-colors text-base"
                />
              </div>
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="pt-2"
              >
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-primary to-cyan-500 hover:from-primary/90 hover:to-cyan-500/90 text-white shadow-lg shadow-primary/20 h-14 text-lg font-semibold rounded-xl"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 w-5 h-5 animate-spin" />
                      Logging in...
                    </>
                  ) : (
                    <>
                      Sign In
                      <ArrowRight className="ml-2 w-5 h-5" />
                    </>
                  )}
                </Button>
              </motion.div>
            </form>

            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-3 text-slate-500 font-medium">Or</span>
              </div>
            </div>

            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="mb-6"
            >
              <Link href="/register">
                <Button
                  variant="outline"
                  className="w-full border-2 border-primary/20 hover:bg-primary/5 hover:border-primary/40 h-12 text-base font-medium rounded-xl"
                >
                  <UserPlus className="mr-2 w-5 h-5" />
                  Create New Account
                </Button>
              </Link>
            </motion.div>

            <div className="pt-4 border-t border-slate-100">
              <Link href="/">
                <Button variant="ghost" className="w-full text-slate-600 hover:text-slate-900 h-10">
                  ← Back to Home
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

      </motion.div>
    </div>
  );
}

