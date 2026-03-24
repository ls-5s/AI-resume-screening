interface SettingSkeletonProps {
  rows?: number;
  message?: string;
}

export function SettingSkeleton({
  rows = 3,
  message = "加载中...",
}: SettingSkeletonProps) {
  return (
    <div className="flex min-h-[360px] flex-col items-center justify-center gap-6 rounded-3xl border border-zinc-200/70 bg-white p-8 shadow-[0_2px_8px_-2px_rgba(15,23,42,0.06)]">
      <div className="flex flex-col items-center gap-3">
        <div className="flex gap-2">
          {Array.from({ length: rows }).map((_, i) => (
            <div
              key={i}
              className="h-10 w-48 animate-pulse rounded-2xl bg-zinc-100"
            />
          ))}
        </div>
        <div className="h-3 w-32 animate-pulse rounded-full bg-zinc-200" />
      </div>
      <p className="text-sm text-zinc-400">{message}</p>
    </div>
  );
}
