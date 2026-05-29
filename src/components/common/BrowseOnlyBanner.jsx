import React from 'react';
import { RefreshCw, ShieldCheck } from 'lucide-react';

export default function BrowseOnlyBanner({
  isChecking = false,
  onRetry,
  mode = 'offline',
}) {
  const isLoading = mode === 'checking';

  return (
    <div className="bg-[#1a1a1a] text-white px-4 sm:px-6 lg:px-10">
      <div className="max-w-7xl mx-auto py-3 sm:py-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#d9006c]/20 text-[#ec4899]">
            <ShieldCheck size={18} />
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-[#ec4899] font-bold">
              Browse-Only Mode
            </p>
            <p className="mt-1 text-sm sm:text-base text-white/85 leading-relaxed">
              {isLoading
                ? 'Checking store services. Browsing remains available while checkout and account actions stay paused.'
                : 'Our store services are temporarily unavailable. Browsing remains available, but checkout and account features are currently disabled.'}
            </p>
          </div>
        </div>

        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            disabled={isChecking}
            className="inline-flex w-full sm:w-auto items-center justify-center gap-2 border border-[#ec4899] px-4 py-2.5 text-xs font-bold uppercase tracking-[0.2em] text-white hover:bg-[#d9006c] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <RefreshCw size={15} className={isChecking ? 'animate-spin' : ''} />
            {isChecking ? 'Checking' : 'Retry'}
          </button>
        )}
      </div>
    </div>
  );
}
