"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import {
  LayoutDashboard,
  CalendarClock,
  Newspaper,
  Bookmark,
  Settings,
  Shield,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/timeline", label: "Timeline", icon: CalendarClock },
  { href: "/digest", label: "Daily Digest", icon: Newspaper },
  { href: "/saved", label: "Saved for Later", icon: Bookmark },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const [expanded, setExpanded] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const pathname = usePathname();
  const { user } = useUser();

  useEffect(() => {
    fetch("/api/user")
      .then((r) => r.json())
      .then((d) => setIsAdmin(d.user?.isAdmin ?? false))
      .catch(() => {});
  }, []);

  return (
    <aside
      className={`fixed left-0 top-0 h-screen bg-spotify-black flex flex-col z-40 transition-all duration-300 ${
        expanded ? "w-60" : "w-[72px]"
      }`}
    >
      <div className="h-1 bg-gradient-to-r from-spotify-green/80 to-spotify-green/20" />

      <div className="flex items-center justify-between px-4 py-5">
        {expanded && (
          <span className="text-lg font-bold text-white tracking-tight">
            CSMart
          </span>
        )}
        <button
          onClick={() => setExpanded(!expanded)}
          className="p-1.5 rounded-card text-spotify-subtext hover:text-white hover:bg-spotify-card transition-colors"
        >
          {expanded ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
        </button>
      </div>

      <nav className="flex-1 flex flex-col gap-1 px-3">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-card transition-all duration-200 group ${
                isActive
                  ? "bg-spotify-card text-spotify-green"
                  : "text-spotify-subtext hover:text-white hover:bg-spotify-card/50"
              }`}
            >
              <item.icon
                size={20}
                className={
                  isActive
                    ? "text-spotify-green"
                    : "text-spotify-subtext group-hover:text-white transition-colors"
                }
              />
              {expanded && (
                <span className="text-sm font-medium">{item.label}</span>
              )}
            </Link>
          );
        })}

        {isAdmin && (
          <Link
            href="/admin"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-card transition-all duration-200 group mt-2 ${
              pathname === "/admin"
                ? "bg-spotify-card text-spotify-green"
                : "text-spotify-subtext hover:text-white hover:bg-spotify-card/50"
            }`}
          >
            <Shield
              size={20}
              className={
                pathname === "/admin"
                  ? "text-spotify-green"
                  : "text-spotify-subtext group-hover:text-white transition-colors"
              }
            />
            {expanded && (
              <span className="text-sm font-medium">Admin</span>
            )}
          </Link>
        )}
      </nav>

      <div className="px-3 pb-5">
        <div
          className={`flex items-center gap-3 px-3 py-3 rounded-card bg-spotify-card/50 ${
            expanded ? "" : "justify-center"
          }`}
        >
          {user?.imageUrl ? (
            <img
              src={user.imageUrl}
              alt=""
              className="w-8 h-8 rounded-full flex-shrink-0"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-spotify-border flex-shrink-0" />
          )}
          {expanded && (
            <div className="overflow-hidden">
              <p className="text-sm font-medium text-white truncate">
                {user?.fullName ?? "Loading..."}
              </p>
              <p className="text-xs text-spotify-subtext truncate">
                {user?.primaryEmailAddress?.emailAddress}
              </p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
