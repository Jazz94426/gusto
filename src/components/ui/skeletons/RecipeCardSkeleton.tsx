import React from 'react';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';

export function RecipeCardSkeleton() {
  const coverImage = (
    <div className="relative w-full aspect-[4/3] overflow-hidden">
      <Skeleton className="w-full h-full rounded-none" />
    </div>
  );

  return (
    <Card variant="default" imageHeader={coverImage} className="h-full flex flex-col border border-stone-light/30 bg-white shadow-sm overflow-hidden rounded-[24px]">
      <Skeleton className="h-7 w-3/4 mb-2 rounded-md" />
      <Skeleton className="h-7 w-1/2 mb-4 rounded-md" />
      
      <div className="flex items-center gap-5 mb-5">
        <Skeleton className="h-4 w-16 rounded-md" />
        <Skeleton className="h-4 w-16 rounded-md" />
        <Skeleton className="h-4 w-16 rounded-md" />
      </div>
      
      <div className="mt-auto pt-1 flex gap-2">
        <Skeleton className="h-6 w-16 rounded-full" />
        <Skeleton className="h-6 w-20 rounded-full" />
        <Skeleton className="h-6 w-14 rounded-full" />
      </div>
    </Card>
  );
}
