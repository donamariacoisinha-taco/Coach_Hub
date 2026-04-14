
import React from "react";

interface SkeletonProps {
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className }) => {
  return (
    <div className={`bg-gray-200 animate-pulse rounded-2xl ${className}`} />
  );
};

export const DashboardSkeleton: React.FC = () => {
  return (
    <div className="max-w-md mx-auto px-6 pt-12 space-y-12">
      <div className="space-y-4">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-10 w-48" />
      </div>
      <div className="flex gap-8">
        <Skeleton className="h-12 w-16" />
        <Skeleton className="h-12 w-16" />
        <Skeleton className="h-12 w-16" />
      </div>
      <div className="space-y-6 pt-8">
        <Skeleton className="h-6 w-32" />
        <div className="space-y-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="flex justify-between items-center py-4">
              <div className="space-y-2 flex-1">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
              <Skeleton className="h-10 w-10 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
