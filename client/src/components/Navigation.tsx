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
      <div className="p-6">
        <h1 className="text-2xl font-bold font-display text-primary flex items-center gap-2">
          <span className="w-8 h-8 bg-primary text-white rounded-lg flex items-center justify-center text-sm">CR</span>
          ClassRep
        </h1>
      </div>
      
      <div className="flex-1 px-4 space-y-2">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = location === link.href;
          
          return (
            <Link key={link.href} href={link.href} className={`
              flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200
              ${isActive 
                ? "bg-primary text-white shadow-lg shadow-primary/25 translate-x-1" 
                : "text-slate-600 hover:bg-white hover:shadow-md hover:text-primary"}
            `}>
                <Icon className="w-5 h-5" />
                <span className="font-medium">{link.label}</span>
            </Link>
          );
        })}
      </div>

      <div className="p-4 mt-auto">
        {isAdmin ? (
          <Button 
            variant="ghost" 
            className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={() => logout()}
          >
            <LogOut className="w-5 h-5 mr-2" />
            Logout
          </Button>
        ) : (
           <Link href="/api/login" className="w-full">
              <Button className="w-full bg-slate-900 text-white hover:bg-slate-800">
                Representative Login
              </Button>
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
      <div className="hidden md:block w-64 fixed inset-y-0 left-0 border-r border-slate-200 bg-white/50 backdrop-blur-md">
        <NavContent />
      </div>
    </>
  );
}
