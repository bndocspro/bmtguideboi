import type { Metadata } from 'next';
import { Geist, Geist_Mono, Noto_Serif_Bengali } from 'next/font/google';
import { TooltipProvider } from '@/components/ui/tooltip';
import 'katex/dist/katex.min.css';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

const notoSerifBengali = Noto_Serif_Bengali({
  variable: '--font-noto-serif-bengali',
  subsets: ['bengali', 'latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'BMT Guide Boi | এইচএসসি বিএমটি সার্বজনীন গাইড বই সিস্টেম',
  description:
    'এইচএসসি বিএমটি (১ম ও ২য় বর্ষ) সকল বিষয়ের প্রশ্ন ব্যাংক, LaTeX ও টেবিল এডিটর এবং হাই-কোয়ালিটি ভেক্টর PDF প্রিন্ট সলিউশন।',
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html
      lang="bn"
      className={`${notoSerifBengali.variable} ${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground font-sans">
        <TooltipProvider>{children}</TooltipProvider>
      </body>
    </html>
  );
}
