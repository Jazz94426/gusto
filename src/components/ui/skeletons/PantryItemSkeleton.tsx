import React from 'react';
import { Skeleton } from '@/components/ui/Skeleton';

export function PantryItemSkeleton() {
  return (
    <div className="flex items-center gap-4 bg-white p-4 rounded-2xl border border-stone/10 shadow-sm mb-3">
      <Skeleton className="w-6 h-6 rounded-md" />
      <div className="flex-1">
        <Skeleton className="h-5 w-1/3 mb-1.5 rounded-md" />
        <Skeleton className="h-4 w-1/4 rounded-md" />
      </div>
      <Skeleton className="w-10 h-10 rounded-xl" />
    </div>
  );
}
