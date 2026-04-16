
import React from "react";

interface SkeletonProps {
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className }) => {
  return (
    <div
      className={`animate-pulse bg-slate-100 rounded-lg ${className}`}
    />
  );
};

export const SkeletonCard = () => (
  <div className="bg-white rounded-3xl p-6 border border-slate-50 shadow-sm space-y-4">
    <div className="flex items-center gap-4">
      <Skeleton className="w-12 h-12 rounded-2xl" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-20" />
      </div>
    </div>
    <Skeleton className="h-20 w-full" />
    <div className="flex justify-between">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-4 w-16" />
    </div>
  </div>
);

export const ExerciseSkeleton = () => (
  <div className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-slate-50 shadow-sm">
    <Skeleton className="w-14 h-14 rounded-xl shrink-0" />
    <div className="flex-1 space-y-2">
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-3 w-1/2" />
    </div>
    <Skeleton className="w-8 h-8 rounded-full" />
  </div>
);

export const WorkoutSkeleton = () => (
  <div className="space-y-6">
    <div className="flex items-center justify-between">
      <div className="space-y-2">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-32" />
      </div>
      <Skeleton className="w-12 h-12 rounded-2xl" />
    </div>
    <div className="grid grid-cols-1 gap-4">
      {[1, 2, 3].map(i => <ExerciseSkeleton key={i} />)}
    </div>
  </div>
);

export const DashboardSkeleton = () => (
  <div className="space-y-10">
    <div className="flex items-center justify-between">
      <div className="space-y-2">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-4 w-64" />
      </div>
      <Skeleton className="w-12 h-12 rounded-full" />
    </div>
    <div className="grid grid-cols-2 gap-4">
      <Skeleton className="h-32 rounded-3xl" />
      <Skeleton className="h-32 rounded-3xl" />
    </div>
    <div className="space-y-4">
      <Skeleton className="h-6 w-32" />
      <div className="space-y-3">
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 rounded-2xl" />)}
      </div>
    </div>
  </div>
);
