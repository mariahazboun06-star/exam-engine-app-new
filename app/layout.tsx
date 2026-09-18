import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";

export const metadata: Metadata = {
  title: "SS - Study Smarter",
  description: "מערכת למידה ותרגול חכמה המבוססת על חומרי הקורס בלבד",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="he" dir="rtl">
      <body className="bg-gray-50 min-h-screen text-gray-900 font-sans">
        {/* סרגל ניווט ראשי (Navbar) */}
        <header className="bg-white border-b sticky top-0 z-50 shadow-sm">
          <div className="max-w-6xl mx-auto px-6 h-16 flex justify-between items-center">
            {/* מותג ושם התוכנה */}
            <Link href="/" className="flex items-center gap-2 font-extrabold text-xl text-blue-600">
              <span className="bg-blue-600 text-white px-2.5 py-1 rounded-lg text-sm font-black shadow-sm">
                SS
              </span>
              <span>Study Smarter</span>
            </Link>

            {/* קישורי ניווט */}
            <nav className="flex items-center gap-6 text-xs font-bold text-gray-600">
              <Link href="/setup" className="hover:text-blue-600 transition">⚙️ הקמת קורס</Link>
              <Link href="/matrix" className="hover:text-blue-600 transition">📊 מטריצה</Link>
              <Link href="/study/focused" className="hover:text-blue-600 transition">🎯 תרגול ממוקד</Link>
              <Link href="/exam/simulation" className="hover:text-blue-600 transition">📝 סימולטור מבחן</Link>
            </nav>
          </div>
        </header>

        <main>{children}</main>
      </body>
    </html>
  );
}