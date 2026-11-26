'use client';

import { useActionState, useState } from 'react';
import { BookOpen, Eye, EyeOff, Lock, Mail, ShieldCheck, AlertCircle, Loader2 } from 'lucide-react';
import { signInAction } from '@/app/sign-in/actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function SignInForm() {
  const [state, formAction, isPending] = useActionState(signInAction, null);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white dark:bg-zinc-950 px-4 py-12">
      <div className="w-full max-w-[400px] space-y-6">
        {/* Minimal Brand Header */}
        <div className="flex flex-col items-center text-center space-y-2.5">
          <div className="h-11 w-11 rounded-2xl bg-[#00684A] text-white flex items-center justify-center shadow-xs">
            <BookOpen className="h-5 w-5" />
          </div>
          <div className="space-y-1">
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-zinc-100">
              BMT Guide Boi
            </h1>
            <p className="text-xs text-slate-500 dark:text-zinc-400">
              এইচএসসি বিএমটি (১ম ও ২য় বর্ষ) গাইড বই ও প্রশ্ন ব্যাংক ম্যানেজমেন্ট
            </p>
          </div>
        </div>

        {/* Ultra-clean Chorcha-style Sign-In Card (No Sign-Up) */}
        <Card className="border-slate-200/85 dark:border-zinc-800 shadow-xs bg-white dark:bg-zinc-900 rounded-2xl">
          <CardHeader className="space-y-1 pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-bold text-slate-900 dark:text-zinc-100">
                অ্যাডমিন সাইন ইন
              </CardTitle>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/70 dark:border-emerald-800/50 px-2.5 py-0.5 text-[10px] font-semibold text-[#00684A] dark:text-emerald-300">
                <ShieldCheck className="h-3 w-3" />
                সংরক্ষিত
              </span>
            </div>
            <CardDescription className="text-xs text-slate-500 dark:text-zinc-400">
              সকল ২৫টি বিষয়ের গাইড ও প্রশ্ন পরিচালনা করতে সাইন ইন করুন।
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form action={formAction} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs font-medium text-slate-700 dark:text-zinc-300">
                  ইমেইল ঠিকানা
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="admin@bmtguide.com"
                    className="pl-9 h-10 rounded-xl border-slate-200 dark:border-zinc-800 bg-slate-50/40 dark:bg-zinc-950 focus-visible:bg-white focus-visible:ring-[#00684A]/20"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-xs font-medium text-slate-700 dark:text-zinc-300">
                  পাসওয়ার্ড
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete="current-password"
                    placeholder="••••••••"
                    className="pl-9 pr-10 h-10 rounded-xl border-slate-200 dark:border-zinc-800 bg-slate-50/40 dark:bg-zinc-950 focus-visible:bg-white focus-visible:ring-[#00684A]/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? 'পাসওয়ার্ড লুকান' : 'পাসওয়ার্ড দেখুন'}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {state?.error && (
                <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-xs text-red-700">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-red-600" />
                  <span>{state.error}</span>
                </div>
              )}

              <Button
                type="submit"
                disabled={isPending}
                className="w-full h-10 rounded-xl bg-[#00684A] hover:bg-[#00553D] text-white font-semibold shadow-xs"
              >
                {isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    যাচাই করা হচ্ছে...
                  </>
                ) : (
                  'সাইন ইন করুন'
                )}
              </Button>
            </form>

            <div className="mt-5 pt-4 border-t border-slate-100 dark:border-zinc-800 text-center">
              <p className="text-[11px] text-slate-400 dark:text-zinc-500 leading-relaxed">
                সাইন আপ বন্ধ রাখা হয়েছে। প্রথম অ্যাডমিন অ্যাকাউন্ট সরাসরি ডাটাবেজের{' '}
                <code className="rounded bg-slate-100 dark:bg-zinc-800 px-1 py-0.5 font-mono text-[10px] text-slate-600 dark:text-zinc-300">
                  admin_users
                </code>{' '}
                টেবিল থেকে তৈরি করা হয়।
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
