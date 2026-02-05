// src/components/shared/Header.tsx
"use client"

import { useUser, useClerk } from "@/hooks/useUser";
import { SignedIn } from "@/components/auth/AuthComponents";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Mic, Bell, Search, Settings, BarChart3, Users, FileText, Zap, ChevronDown, HelpCircle, Command, ChevronRight, Slash, BookOpen, LogOut, User } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from '@/components/ui/dropdown-menu';
import { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface HeaderProps {
  breadcrumb?: {
    project?: string;
    item?: string;
  };
  isLoading?: boolean;
}

function Header({ breadcrumb, isLoading }: HeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();
  const [breadcrumbState, setBreadcrumbState] = useState<{
    project?: string;
    item?: string;
  } | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  const isActive = (path: string) => {
    if (path === '/') return pathname === '/';
    return pathname.startsWith(path);
  };

  useEffect(() => {
    if (isLoading) {
      setBreadcrumbState({
        project: 'Loading...',
        item: 'Loading...'
      });
    } else if (breadcrumb) {
      setBreadcrumbState(breadcrumb);
    }
  }, [breadcrumb, isLoading]);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  const getUserDisplayName = () => {
    if (user?.user_metadata?.full_name) return user.user_metadata.full_name;
    if (user?.user_metadata?.first_name && user?.user_metadata?.last_name) return `${user.user_metadata.first_name} ${user.user_metadata.last_name}`;
    if (user?.user_metadata?.first_name) return user.user_metadata.first_name;
    if (user?.email) {
      return user.email.split('@')[0];
    }
    return 'User';
  };

  const handleSignOut = async () => {
    await signOut();
    router.push('/sign-in');
  };

  return (
    <header className="bg-white/95 backdrop-blur-sm border-b border-neutral-200/60 sticky top-0 z-50 shadow-sm">
      <div className="px-6 py-3">
        <div className="flex items-center justify-between max-w-[1600px] mx-auto">
          {/* Logo & Brand Section */}
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-3 group">
              <Image src="/logo.png" alt="SoundFlare Logo" width={48} height={48} className="group-hover:scale-110 transition-transform duration-200" />
              <div>
                <h1 className="text-lg font-bold text-gray-900 group-hover:text-orange-600 transition-colors duration-200 tracking-tight">
                  SoundFlare
                </h1>
                <p className="text-xs text-gray-500 -mt-0.5 font-medium">LiveKit Observability Platform</p>
              </div>
            </Link>

            {/* Apple-Style Clean Breadcrumb with Loading States */}
            {breadcrumbState && (
              <div className="flex items-center">
                <nav className="flex items-center gap-2 text-sm">
                  <Link 
                    href="/" 
                    className="text-gray-500 hover:text-gray-900 transition-colors"
                  >
                    Home
                  </Link>
                  
                  {breadcrumbState.project && (
                    <>
                      <ChevronRight className="w-4 h-4 text-gray-300" />
                      {isLoading ? (
                        <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
                      ) : (
                        <span className="text-gray-900">
                          {breadcrumbState.project}
                        </span>
                      )}
                    </>
                  )}
                  
                  {breadcrumbState.item && (
                    <>
                      <ChevronRight className="w-4 h-4 text-gray-300" />
                      {isLoading ? (
                        <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
                      ) : (
                        <span className="text-gray-900">
                          {breadcrumbState.item}
                        </span>
                      )}
                    </>
                  )}
                </nav>
              </div>
            )}
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center gap-2">
            {/* Docs Button */}
            <Link
              href="/docs"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 dark:hover:text-gray-100 transition-all duration-200 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-800 border border-transparent hover:border-neutral-200 dark:hover:border-neutral-700"
            >
              <BookOpen className="w-4 h-4 transition-transform group-hover:scale-110" />
              <span className="hidden sm:inline">Docs</span>
              <svg 
                className="w-3 h-3 opacity-50 group-hover:opacity-100 transition-opacity" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" 
                />
              </svg>
            </Link>


            
            {/* Vertical Separator */}
            <div className="w-px h-5 bg-gray-200"></div>

            {/* Help Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-gray-500 hover:text-gray-700 hover:bg-gray-50 w-9 h-9 p-0 rounded-lg border border-transparent hover:border-neutral-200 transition-all duration-200"
                >
                  <HelpCircle className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64 shadow-lg border border-neutral-200/80 rounded-xl backdrop-blur-sm bg-white/95">
                <div className="px-3 py-2 border-b border-neutral-100">
                  <p className="text-sm font-semibold text-gray-900">Help & Resources</p>
                  <p className="text-xs text-gray-500 mt-0.5">Get support and documentation</p>
                </div>
                <div className="py-1">
                  <DropdownMenuItem asChild>
                    <Link href="/api-reference" className="flex items-center w-full px-3 py-2 hover:bg-gray-50 rounded-lg mx-1">
                      <Zap className="w-4 h-4 mr-3 text-yellow-600" />
                      <div>
                        <p className="font-medium text-gray-900">API Reference</p>
                        <p className="text-xs text-gray-500">Complete API documentation</p>
                      </div>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="https://discord.gg/r2eMeAp6" className="flex items-center w-full px-3 py-2 hover:bg-gray-50 rounded-lg mx-1">
                      <Users className="w-4 h-4 mr-3 text-green-600" />
                      <div>
                        <p className="font-medium text-gray-900">Community</p>
                        <p className="text-xs text-gray-500">Connect with developers</p>
                      </div>
                    </Link>
                  </DropdownMenuItem>
                </div>
                <DropdownMenuSeparator className="bg-gray-100" />
                <div className="py-1">
                  <DropdownMenuItem asChild>
                    <Link href="mailto:support@soundflare.ai" className="flex items-center w-full px-3 py-2 hover:bg-gray-50 rounded-lg mx-1">
                      <HelpCircle className="w-4 h-4 mr-3 text-purple-600" />
                      <div>
                        <p className="font-medium text-gray-900">Contact Support</p>
                        <p className="text-xs text-gray-500">Get help from our team</p>
                      </div>
                    </Link>
                  </DropdownMenuItem>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* User Profile Section with Loading State */}
            <div className="flex items-center gap-3 pl-4 ml-2 border-l border-neutral-200">
              {!isHydrated || !isLoaded ? (
                // Always show skeleton during SSR and initial load
                <>
                  <div className="hidden sm:flex flex-col items-end">
                    <div className="w-20 h-4 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                  <div className="relative">
                    <div className="w-9 h-9 bg-gray-200 rounded-full animate-pulse"></div>
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-gray-300 rounded-full border-2 border-white animate-pulse"></div>
                  </div>
                </>
              ) : (
                // Only show actual content after hydration AND Supabase Auth is loaded
                <SignedIn>
                  <div className="hidden sm:flex flex-col items-end">
                    <p className="text-sm font-semibold text-gray-900 leading-none">{getUserDisplayName()}</p>
                  </div>
                  
                  <div className="relative">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                          <Avatar className="h-9 w-9 ring-2 ring-gray-100 hover:ring-orange-200 transition-all duration-200 shadow-sm hover:shadow-md">
                            <AvatarImage src={user?.user_metadata?.avatar_url} alt={getUserDisplayName()} />
                            <AvatarFallback className="bg-gradient-to-br from-orange-500 to-red-600 text-white font-semibold">
                              {getUserDisplayName().charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="w-56" align="end" forceMount>
                        <DropdownMenuLabel className="font-normal">
                          <div className="flex flex-col space-y-1">
                            <p className="text-sm font-medium leading-none">{getUserDisplayName()}</p>
                            <p className="text-xs leading-none text-muted-foreground">
                              {user?.email}
                            </p>
                          </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={handleSignOut} className="text-red-600 focus:text-red-600">
                          <LogOut className="mr-2 h-4 w-4" />
                          <span>Log out</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    {/* Online Status Indicator */}
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white shadow-sm pointer-events-none"></div>
                  </div>
                </SignedIn>
              )}
            </div>
          </div>
        </div>
        
        {/* Subtle bottom gradient */}
        <div className="h-px bg-gradient-to-r from-transparent via-gray-200/50 to-transparent"></div>
      </div>
    </header>
  );
}

export default Header;
