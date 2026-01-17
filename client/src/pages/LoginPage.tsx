import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import { LogIn, UserPlus, Sparkles, ArrowRight } from "lucide-react";

export default function LoginPage() {
  const [, setLocation] = useLocation();

  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-cyan-50/30 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
            className="inline-flex items-center gap-2 mb-4"
          >
            <div className="w-12 h-12 bg-gradient-to-br from-primary to-cyan-500 text-white rounded-xl flex items-center justify-center text-lg font-bold shadow-lg shadow-primary/30">
              CR
            </div>
            <h1 className="text-3xl font-bold font-display bg-gradient-to-r from-primary to-cyan-500 bg-clip-text text-transparent">
              ClassRep
            </h1>
          </motion.div>
          <p className="text-slate-600">Representative Portal</p>
        </div>

        <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-sm">
          <div className="h-1 bg-gradient-to-r from-primary via-cyan-500 to-blue-500" />
          <CardHeader className="text-center space-y-2">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: "spring" }}
              className="w-16 h-16 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-2xl flex items-center justify-center mx-auto mb-4"
            >
              <LogIn className="w-8 h-8 text-primary" />
            </motion.div>
            <CardTitle className="text-2xl font-display">Welcome Back</CardTitle>
            <CardDescription className="text-base">
              Sign in to manage your class activities
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button
                onClick={handleLogin}
                className="w-full bg-gradient-to-r from-primary to-cyan-500 hover:from-primary/90 hover:to-cyan-500/90 text-white shadow-lg shadow-primary/20 h-12 text-lg font-semibold"
              >
                Continue with Replit Auth
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </motion.div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-slate-500">Or</span>
              </div>
            </div>

            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Link href="/register">
                <Button
                  variant="outline"
                  className="w-full border-2 border-primary/20 hover:bg-primary/5 hover:border-primary/40 h-12 text-lg"
                >
                  <UserPlus className="mr-2 w-5 h-5" />
                  Create New Account
                </Button>
              </Link>
            </motion.div>

            <div className="pt-4">
              <Link href="/">
                <Button variant="ghost" className="w-full text-slate-600 hover:text-slate-900">
                  ← Back to Home
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-6 text-center text-sm text-slate-500"
        >
          <p>Secure authentication powered by Replit Auth</p>
        </motion.div>
      </motion.div>
    </div>
  );
}

