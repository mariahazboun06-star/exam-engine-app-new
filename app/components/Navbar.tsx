'use client';

import Link from 'link';
import { usePathname, useSearchParams, useParams } from 'next/navigation';
import { useLanguage } from '@/app/context/LanguageContext';
import { Suspense } from 'react';

function NavbarContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const params = useParams();

  const { lang, toggleLanguage, t } = useLanguage();

  // Extract active courseId from route params or search queries
  const courseId = (params?.courseId as string) || searchParams.get('courseId');

  // Check if we are on the main dashboard or landing page
  const isDashboard = pathname === '/dashboard' || pathname === '/';

  // Course-specific tabs are constructed ONLY when an active courseId exists
  const courseNavItems = courseId
    ? [
        { name: t('navMatrix'), href: `/matrix?courseId=${courseId}` },
        { name: t('navSimulation'), href: `/simulation?courseId=${courseId}` },
        { name: t('navUpload'), href: `/upload-exam?courseId=${courseId}` },
      ]
    : [];

  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-white/80 border-b border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <Link href="/dashboard" className="flex items-center gap-2.5 font-bold text-xl text-slate-900 tracking-tight">
            <span className="flex items-center justify-center px-2 py-1 rounded-xl bg-indigo-600 text-white font-black text-xs shadow-sm shadow-indigo-200">
              SS
            </span>
            <span>{t('brandName')}</span>
          </Link>

          {/* Navigation Items & Language Switcher */}
          <div className="flex items-center gap-2">
            {/* Show course-specific tabs ONLY when inside a specific course context */}
            {courseId ? (
              <nav className="flex items-center gap-1 sm:gap-2">
                <Link
                  href="/dashboard"
                  className="px-3 py-1.5 rounded-xl text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all mr-2 border-r border-slate-200 pr-4"
                >
                  {t('navMyCourses')}
                </Link>

                {courseNavItems.map((item) => {
                  const isActive = pathname === item.href.split('?')[0];
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-all ${
                        isActive
                          ? 'bg-indigo-50 text-indigo-600 font-semibold shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      }`}
                    >
                      {item.name}
                    </Link>
                  );
                })}
              </nav>
            ) : (
              /* Global View (No Course Selected): Show 'My Courses' link if not already on dashboard */
              !isDashboard && (
                <Link
                  href="/dashboard"
                  className="px-3 py-1.5 rounded-xl text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all"
                >
                  {t('navMyCourses')}
                </Link>
              )
            )}

            {/* Language Switcher */}
            <button
              onClick={toggleLanguage}
              className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all flex items-center gap-1.5 shadow-2xs"
            >
              <span>🌐</span>
              <span>{lang === 'he' ? 'English' : 'עברית'}</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

export default function Navbar() {
  return (
    <Suspense fallback={<header className="h-16 border-b border-slate-200 bg-white" />}>
      <NavbarContent />
    </Suspense>
  );
}