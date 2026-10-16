'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navbar() {
  const pathname = usePathname();

  // Hide course-specific actions on global/dashboard pages
  const isDashboard = pathname === '/dashboard' || pathname === '/';

  const navItems = [
    { name: 'Study Plan', href: '/plan' },
    { name: 'Topic Matrix', href: '/matrix' },
    { name: 'Simulation', href: '/simulation' },
    { name: 'Upload Exam', href: '/upload-exam' },
  ];

  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-white/80 border-b border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo / Brand */}
          <Link href="/dashboard" className="flex items-center gap-2.5 font-bold text-xl text-slate-900 tracking-tight">
            <span className="flex items-center justify-center px-2 py-1 rounded-xl bg-indigo-600 text-white font-black text-xs shadow-sm shadow-indigo-200">
              SS
            </span>
            <span>Study Smarter</span>
          </Link>

          {/* Navigation Items - Only visible when inside a specific course view */}
          {!isDashboard && (
            <nav className="flex items-center gap-1 sm:gap-2">
              <Link
                href="/dashboard"
                className="px-3.5 py-2 rounded-xl text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 transition-all mr-2 border-r border-slate-200 pr-4"
              >
                ← My Courses
              </Link>

              {navItems.map((item) => {
                const isActive = pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`px-3.5 py-2 rounded-xl text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-indigo-50 text-indigo-600 font-semibold shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                    }`}
                  >
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          )}
        </div>
      </div>
    </header>
  );
}