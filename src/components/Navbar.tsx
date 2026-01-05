"use client";

import { UserButton, useUser } from "@clerk/nextjs";
import { CalendarIcon, CrownIcon, HomeIcon, MicIcon, BarChart3Icon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

function Navbar() {
  const { user } = useUser();
  const pathname = usePathname();

  const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL;
  const isAdmin = user && adminEmail && user.emailAddresses?.[0]?.emailAddress === adminEmail;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-2 border-b border-border/50 bg-background/80 backdrop-blur-md h-16">
      <div className="max-w-7xl mx-auto flex justify-between items-center h-full">
        {/* LOGO */}
        <div className="flex items-center gap-8">
          <Link href={isAdmin ? "/admin" : "/dashboard"} className="flex items-center gap-2">
            <Image src="/logo.png" alt="AyurAI Logo" width={32} height={32} className="w-11" />
          </Link>

          <div className="flex items-center gap-6">
            {isAdmin ? (
              <>
                <Link
                  href="/admin"
                  className={`flex items-center gap-2 transition-colors ${
                    pathname === "/admin"
                      ? "text-foreground hover:text-primary font-medium"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <HomeIcon className="w-4 h-4" />
                  <span className="hidden md:inline">Dashboard</span>
                </Link>

                <Link
                  href="/admin/videos"
                  className={`flex items-center gap-2 transition-colors ${
                    pathname === "/admin/videos" || pathname.startsWith("/admin/videos/")
                      ? "text-foreground hover:text-primary font-medium"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <HomeIcon className="w-4 h-4" />
                  <span className="hidden md:inline">Library</span>
                </Link>

                <Link
                  href="/admin/analytics"
                  className={`flex items-center gap-2 transition-colors hover:text-foreground ${
                    pathname === "/admin/analytics" || pathname.startsWith("/admin/analytics/")
                      ? "text-foreground"
                      : "text-muted-foreground"
                  }`}
                >
                  <BarChart3Icon className="w-4 h-4" />
                  <span className="hidden md:inline">Analytics</span>
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/dashboard"
                  className={`flex items-center gap-2 transition-colors ${
                    pathname === "/dashboard"
                      ? "text-foreground hover:text-primary font-medium"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <HomeIcon className="w-4 h-4" />
                  <span className="hidden md:inline">Dashboard</span>
                </Link>

                <Link
                  href="/dashboard/library"
                  className={`flex items-center gap-2 transition-colors ${
                    pathname === "/dashboard/library" || pathname.startsWith("/dashboard/library/")
                      ? "text-foreground hover:text-primary font-medium"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <HomeIcon className="w-4 h-4" />
                  <span className="hidden md:inline">Library</span>
                </Link>

                <Link
                  href="/appointments"
                  className={`flex items-center gap-2 transition-colors hover:text-foreground ${
                    pathname === "/appointments" ? "text-foreground" : "text-muted-foreground"
                  }`}
                >
                  <CalendarIcon className="w-4 h-4" />
                  <span className="hidden md:inline">Appointments</span>
                </Link>

                <Link
                  href="/voice"
                  className={`flex items-center gap-2 transition-colors hover:text-foreground ${
                    pathname === "/voice" ? "text-foreground" : "text-muted-foreground"
                  }`}
                >
                  <MicIcon className="w-4 h-4" />
                  <span className="hidden md:inline">Voice</span>
                </Link>
                <Link
                  href="/pro"
                  className={`flex items-center gap-2 transition-colors hover:text-foreground ${
                    pathname === "/pro" ? "text-foreground" : "text-muted-foreground"
                  }`}
                >
                  <CrownIcon className="w-4 h-4" />
                  <span className="hidden md:inline">Pro</span>
                </Link>
              </>
            )}
          </div>
        </div>

        {/* RIGHT SECTION */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="hidden lg:flex flex-col items-end">
              <span className="text-sm font-medium text-foreground">
                {user?.firstName} {user?.lastName}
              </span>
              <span className="text-xs text-muted-foreground">
                {user?.emailAddresses?.[0]?.emailAddress}
              </span>
            </div>

            <UserButton />
          </div>
        </div>
      </div>
    </nav>
  );
}
export { Navbar };
export default Navbar;
