import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Activity, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HealthResponse {
  status: string;
  service: string;
}

export function ApiStatusBadge() {
  const { data, isError, isLoading, refetch, isFetching } = useQuery<HealthResponse>({
    queryKey: ['apiHealth'],
    queryFn: async () => {
      const response = await fetch('/api/health/');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    },
    refetchInterval: 15000, // Poll every 15 seconds
    retry: 1,
  });

  const isHealthy = !isLoading && !isError && data?.status === 'ok';

  return (
    <div
      className={cn(
        'group relative inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium border transition-all duration-200 cursor-pointer',
        isLoading && 'bg-slate-100 dark:bg-charcoal-200 border-slate-300 dark:border-charcoal-100 text-slate-600 dark:text-slate-400',
        isHealthy && 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700/50 text-emerald-800 dark:text-emerald-300 shadow-sm',
        isError && 'bg-red-50 dark:bg-red-950/40 border-red-300 dark:border-red-700/50 text-red-800 dark:text-red-300 shadow-sm'
      )}
      onClick={() => refetch()}
      title="Click to check API status"
    >
      {/* Pulse Dot */}
      <span className="relative flex h-2 w-2">
        {isHealthy && (
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
        )}
        <span
          className={cn(
            'relative inline-flex rounded-full h-2 w-2',
            isLoading && 'bg-slate-400',
            isHealthy && 'bg-emerald-500',
            isError && 'bg-red-500'
          )}
        ></span>
      </span>

      <span className="font-semibold tracking-wide flex items-center gap-1.5">
        <Activity className="w-3.5 h-3.5" />
        {isLoading
          ? 'Checking API...'
          : isHealthy
          ? 'API Online'
          : 'API Offline'}
      </span>

      {isFetching && !isLoading && (
        <RefreshCw className="w-3 h-3 animate-spin text-current opacity-70" />
      )}

      {/* Hover Info Tooltip */}
      <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 hidden group-hover:block z-50 w-52 p-2.5 bg-navy-900 text-ivory text-[11px] rounded-xl shadow-soft-lg pointer-events-none">
        <div className="font-semibold text-gold-400 mb-1 flex items-center justify-between">
          <span>Backend Status</span>
          <span className="text-[9px] uppercase tracking-wider text-slate-400">GET /api/health/</span>
        </div>
        <p className="text-slate-300 leading-snug">
          {isHealthy
            ? `Service "${data?.service}" responded with status: "${data?.status}".`
            : isError
            ? 'Cannot reach Django API at /api/health/. Ensure backend is running.'
            : 'Connecting to Django API...'}
        </p>
      </div>
    </div>
  );
}
