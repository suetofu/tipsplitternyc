import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useRestaurantStore } from "@/lib/hooks/useRestaurantStore";

import {
  Bell,
  LayoutDashboard,
  Users,
  CalendarPlus,
  BarChart3,
  History,
  ChevronDown,
  Settings
} from "lucide-react";

type MenuItemProps = {
  icon: React.ReactNode;
  text: string;
  href: string;
  isActive: boolean;
};

const MenuItem = ({ icon, text, href, isActive }: MenuItemProps) => {
  return (
    <Link href={href}>
      <a
        className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
          isActive
            ? "bg-primary text-white"
            : "text-gray-600 hover:bg-gray-100"
        }`}
      >
        <div
          className={`mr-3 h-5 w-5 ${
            isActive
              ? "text-white"
              : "text-gray-400 group-hover:text-gray-500"
          }`}
        >
          {icon}
        </div>
        {text}
      </a>
    </Link>
  );
};

const Layout = ({ children }) => {
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { setRestaurantConfig } = useRestaurantStore();
  
  // Fetch restaurant configuration
  const { data } = useQuery({
    queryKey: ["/api/setup"],
  });
  
  // Update restaurant store with configuration
  useEffect(() => {
    if (data) {
      setRestaurantConfig(data);
    }
  }, [data, setRestaurantConfig]);
  
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-8 w-8 text-primary"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="8" y1="12" x2="16" y2="12"></line>
              <line x1="8" y1="16" x2="16" y2="16"></line>
              <line x1="8" y1="8" x2="10" y2="8"></line>
            </svg>
            <h1 className="text-xl font-semibold text-gray-900">
              {data?.restaurant?.name || "TipSplitter"}
            </h1>
          </div>
          <div className="flex items-center space-x-4">
            <button
              type="button"
              className="p-1 rounded-full text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              <span className="sr-only">View notifications</span>
              <Bell className="h-6 w-6" />
            </button>
            <div className="relative">
              <button
                type="button"
                className="flex items-center text-sm font-medium text-gray-700 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              >
                <span className="sr-only">Open user menu</span>
                <span>Manager</span>
                <ChevronDown className="ml-1 h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <aside className="hidden md:flex md:flex-shrink-0">
          <div className="flex flex-col w-64 border-r border-gray-200 bg-white">
            <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
              <nav className="mt-5 flex-1 px-2 space-y-1">
                <MenuItem
                  icon={<Settings />}
                  text="Setup"
                  href="/setup"
                  isActive={location === "/" || location === "/setup"}
                />
                <MenuItem
                  icon={<Users />}
                  text="Employees"
                  href="/employees"
                  isActive={location === "/employees"}
                />
                <MenuItem
                  icon={<CalendarPlus />}
                  text="New Shift"
                  href="/new-shift"
                  isActive={location === "/new-shift"}
                />
                <MenuItem
                  icon={<BarChart3 />}
                  text="Results"
                  href="/results"
                  isActive={location === "/results"}
                />
                <MenuItem
                  icon={<History />}
                  text="History"
                  href="/history"
                  isActive={location === "/history"}
                />
              </nav>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 bg-gray-50">
          {/* Mobile navigation */}
          <div className="md:hidden flex items-center justify-around bg-white rounded-lg shadow-sm mb-6 p-3">
            <Link href="/setup">
              <a className={`flex flex-col items-center px-2 ${location === "/" || location === "/setup" ? "text-primary" : "text-gray-600"}`}>
                <Settings className="h-6 w-6" />
                <span className="text-xs">Setup</span>
              </a>
            </Link>
            <Link href="/employees">
              <a className={`flex flex-col items-center px-2 ${location === "/employees" ? "text-primary" : "text-gray-600"}`}>
                <Users className="h-6 w-6" />
                <span className="text-xs">Employees</span>
              </a>
            </Link>
            <Link href="/new-shift">
              <a className={`flex flex-col items-center px-2 ${location === "/new-shift" ? "text-primary" : "text-gray-600"}`}>
                <CalendarPlus className="h-6 w-6" />
                <span className="text-xs">Shift</span>
              </a>
            </Link>
            <Link href="/results">
              <a className={`flex flex-col items-center px-2 ${location === "/results" ? "text-primary" : "text-gray-600"}`}>
                <BarChart3 className="h-6 w-6" />
                <span className="text-xs">Results</span>
              </a>
            </Link>
            <Link href="/history">
              <a className={`flex flex-col items-center px-2 ${location === "/history" ? "text-primary" : "text-gray-600"}`}>
                <History className="h-6 w-6" />
                <span className="text-xs">History</span>
              </a>
            </Link>
          </div>

          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
