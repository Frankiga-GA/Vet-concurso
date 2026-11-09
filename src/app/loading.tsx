export default function Loading() {
  return <main className="vet-shell vet-page" aria-busy="true" aria-label="Cargando contenido">
    <div className="vet-skeleton h-12 max-w-md" />
    <div className="mt-4 vet-skeleton h-5 max-w-2xl" />
    <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {[1, 2, 3].map((item) => <div key={item} className="vet-card space-y-3">
        <div className="vet-skeleton h-11 w-11 rounded-xl" />
        <div className="vet-skeleton h-6 w-2/3" />
        <div className="vet-skeleton h-4 w-full" />
        <div className="vet-skeleton h-4 w-4/5" />
      </div>)}
    </div>
    <span className="sr-only">Cargando…</span>
  </main>;
}
