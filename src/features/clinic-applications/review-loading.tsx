export function ReviewLoading({ message }: { message: string }) {
  return <div role="status" aria-busy="true" className="vet-card">
    <div aria-hidden="true" className="mb-4 h-3 w-24 rounded-full bg-emerald-100 motion-safe:animate-pulse" />
    <p className="text-sm font-medium text-slate-700">{message}</p>
  </div>;
}
