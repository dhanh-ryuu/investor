interface SkeletonProps {
  className?: string;
}

export default function Skeleton({ className = "" }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse bg-[var(--bg-subtle)] rounded-[var(--radius)] ${className}`}
    />
  );
}
