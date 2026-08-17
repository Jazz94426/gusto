import React from 'react';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';

export function CollectionCardSkeleton() {
  const coverImage = (
    <div className="relative w-full aspect-video overflow-hidden">
      <Skeleton className="w-full h-full rounded-none" />
    </div>
  );

  return (
    <Card variant="default" imageHeader={coverImage} className="h-full flex flex-col border border-stone-light/30 bg-white shadow-sm overflow-hidden rounded-[24px]">
      <Skeleton className="h-7 w-2/3 mb-2 rounded-md" />
      <Skeleton className="h-4 w-1/3 mb-4 rounded-md" />
      
      <div className="mt-auto pt-4 flex -space-x-2">
        <Skeleton className="w-8 h-8 rounded-full border-2 border-white" />
        <Skeleton className="w-8 h-8 rounded-full border-2 border-white" />
        <Skeleton className="w-8 h-8 rounded-full border-2 border-white" />
      </div>
    </Card>
  );
}
