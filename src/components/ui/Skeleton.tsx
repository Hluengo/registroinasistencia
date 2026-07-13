import React from 'react';
import { cn } from '../../utils';

interface SkeletonProps {
  className?: string;
}

const Skeleton: React.FC<SkeletonProps> = ({ className }) => {
  return (
    <div className={cn("animate-pulse bg-slate-200 rounded", className)} />
  );
};

const skeletonRows = ['r1', 'r2', 'r3', 'r4', 'r5'];

export const TableSkeleton: React.FC = () => {
  return (
    <div className="space-y-4 w-full">
      <div className="flex gap-4">
        <Skeleton className="h-10 w-full" />
      </div>
      {skeletonRows.map((row) => (
        <div key={row} className="flex gap-4">
          <Skeleton className="h-12 w-full" />
        </div>
      ))}
    </div>
  );
};
