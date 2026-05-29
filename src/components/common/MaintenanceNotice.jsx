import React from 'react';
import { RefreshCw, ShieldAlert } from 'lucide-react';

export default function MaintenanceNotice({
  title = 'Service Temporarily Unavailable',
  message = 'Live catalog, cart, checkout, account, and payment actions are paused while we reconnect to the store API.',
  onRetry,
  isChecking = false,
  compact = false,
}) {
  return (
    <section className={`${compact ? 'py-6' : 'py-10 sm:py-14'} px-4 sm:px-6 lg:px-10 bg-[#D5E8D4]`}>
      <div className="max-w-4xl mx-auto bg-white border border-[#f9c0d9] shadow-sm p-6 sm:p-8 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#d9006c]/10 text-[#d9006c]">
          <ShieldAlert size={24} />
        </div>
        <p className="uppercase tracking-[0.3em] text-xs text-[#d9006c] font-bold">
          Store Maintenance
        </p>
        <h2 className="mt-3 text-3xl sm:text-4xl font-black uppercase text-[#d9006c]">
          {title}
        </h2>
        <p className="mt-4 text-gray-600 leading-relaxed">
          {message}
        </p>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            disabled={isChecking}
            className="mt-6 inline-flex items-center justify-center gap-2 bg-[#d9006c] text-white px-5 py-3 text-sm uppercase tracking-[0.2em] font-semibold hover:bg-[#ec4899] transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <RefreshCw size={16} className={isChecking ? 'animate-spin' : ''} />
            {isChecking ? 'Checking' : 'Retry'}
          </button>
        )}
      </div>
    </section>
  );
}
