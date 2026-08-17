import React from 'react';
import { Skeleton } from '@/components/ui/Skeleton';

export function PlannerDaySkeleton() {
  return (
    <div className="flex-none w-[300px] snap-center">
      <div className="flex flex-col items-center mb-6">
        <Skeleton className="h-4 w-12 mb-1 rounded-md" />
        <Skeleton className="h-8 w-8 rounded-full" />
      </div>
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-stone/5 p-4 rounded-3xl min-h-[140px] flex flex-col">
            <div className="flex items-center gap-2 mb-3">
              <Skeleton className="w-5 h-5 rounded-full" />
              <Skeleton className="h-5 w-20 rounded-md" />
            </div>
            <Skeleton className="w-full h-24 rounded-2xl" />
          </div>
        ))}
      </div>
    </div>
  );
}
