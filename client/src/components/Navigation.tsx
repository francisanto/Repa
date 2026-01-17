import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, Users, Calendar, Clock, LogOut, Menu, X } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export function Navigation() {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const isAdmin = !!user;

  const links = isAdmin ? [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/dashboard/students", label: "Students", icon: Users },
    { href: "/dashboard/events", label: "Events", icon: Calendar },
    { href: "/dashboard/timetable", label: "Timetable", icon: Clock },
  ] : [
    { href: "/", label: "Home", icon: LayoutDashboard },
    { href: "/events", label: "Events", icon: Calendar },
  ];

  const NavContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b border-slate-100">
        <motion.div
          whileHover={{ scale: 1.05 }}
          className="flex items-center gap-2"
        >
          <div className="w-10 h-10 bg-gradient-to-br from-primary to-cyan-500 text-white rounded-xl flex items-center justify-center text-sm font-bold shadow-lg shadow-primary/30">
            RP
          </div>
          <h1 className="text-2xl font-bold font-display bg-gradient-to-r from-primary to-cyan-500 bg-clip-text text-transparent">
            Repa
          </h1>
        </motion.div>
      </div>
      
      <div className="flex-1 px-4 space-y-2">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = location === link.href;
          
          return (
            <motion.div
              key={link.href}
              whileHover={{ x: isActive ? 0 : 4 }}
              whileTap={{ scale: 0.98 }}
            >
              <Link href={link.href} className={`
                flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 relative
                ${isActive 
                  ? "bg-gradient-to-r from-primary to-cyan-500 text-white shadow-lg shadow-primary/30" 
                  : "text-slate-600 hover:bg-blue-50 hover:text-primary hover:shadow-md"}
              `}>
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{link.label}</span>
                  {isActive && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute right-2 w-2 h-2 bg-white rounded-full"
                      initial={false}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />
                  )}
              </Link>
            </motion.div>
          );
        })}
      </div>

      <div className="p-4 mt-auto border-t border-slate-100">
        {isAdmin ? (
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button 
              variant="ghost" 
              className="w-full justify-start text-slate-600 hover:text-destructive hover:bg-destructive/10 transition-all"
              onClick={() => logout()}
            >
              <LogOut className="w-5 h-5 mr-2" />
              Logout
            </Button>
          </motion.div>
        ) : (
          <Link href="/login" className="w-full">
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button className="w-full bg-gradient-to-r from-primary to-cyan-500 text-white hover:from-primary/90 hover:to-cyan-500/90 shadow-lg shadow-primary/20">
                Representative Login
              </Button>
            </motion.div>
          </Link>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Menu Button */}
      <div className="md:hidden fixed top-4 right-4 z-50">
        <Button 
          size="icon" 
          variant="secondary" 
          className="rounded-full shadow-lg"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <X /> : <Menu />}
        </Button>
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-40 bg-background/95 backdrop-blur-xl md:hidden"
          >
            <NavContent />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <div className="hidden md:block w-64 fixed inset-y-0 left-0 border-r border-slate-200 bg-white/80 backdrop-blur-xl shadow-xl">
        <NavContent />
      </div>
    </>
  );
}
