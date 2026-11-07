import { ReviewLoading } from "@/features/clinic-applications/review-loading";

export default function Loading() {
  return <main className="mx-auto max-w-4xl px-5 py-8 sm:py-12">
    <ReviewLoading message="Cargando el detalle de la solicitud…" />
  </main>;
}
