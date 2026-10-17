'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLanguage } from '@/app/context/LanguageContext';

export default function Navbar() {
  const pathname = usePathname();
  const { lang, toggleLanguage, t } = useLanguage();

  // Hide sub-navigation when on dashboard or landing page
  const isDashboard = pathname === '/dashboard' || pathname === '/';

  const navItems = [
    { name: t('navPlan'), href: '/plan' },
    { name: t('navMatrix'), href: '/matrix' },
    { name: t('navSimulation'), href: '/simulation' },
    { name: t('navUpload'), href: '/upload-exam' },
  ];

  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-white/80 border-b border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-2.5 font-bold text-xl text-slate-900 tracking-tight">
            <span className="flex items-center justify-center px-2 py-1 rounded-xl bg-indigo-600 text-white font-black text-xs shadow-sm shadow-indigo-200">
              SS
            </span>
            <span>{t('brandName')}</span>
          </Link>

          {/* Nav Items & Language Switcher */}
          <div className="flex items-center gap-2">
            {!isDashboard && (
              <nav className="flex items-center gap-1 sm:gap-2">
                <Link
                  href="/dashboard"
                  className="px-3 py-1.5 rounded-xl text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all mr-2 border-r border-slate-200 pr-4"
                >
                  {t('navMyCourses')}
                </Link>

                {navItems.map((item) => {
                  const isActive = pathname.startsWith(item.href);
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
            )}

            {/* Language Switch Button */}
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