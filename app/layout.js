import { Hind_Siliguri } from 'next/font/google';
import './globals.css';

// Hind Siliguri renders both Bangla and Latin text well. Next.js downloads it at build
// time and serves it from this app's own server (no request to Google when people visit).
const appFont = Hind_Siliguri({
  subsets: ['bengali', 'latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
});

/** The browser tab title. */
export const metadata = {
  title: 'Madrassa Management System | মাদ্রাসা ম্যানেজমেন্ট সিস্টেম',
};

/** Make the page fit phone screens (including notches) and colour the phone's address bar. */
export const viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#0e3b32',
};

/** The HTML shell wrapped around every page. */
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={appFont.className}>{children}</body>
    </html>
  );
}
