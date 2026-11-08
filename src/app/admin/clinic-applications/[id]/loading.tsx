import { ReviewLoading } from "@/features/clinic-applications/review-loading";

export default function Loading() {
  return <main className="vet-shell vet-page">
    <ReviewLoading message="Cargando el detalle de la solicitud…" />
  </main>;
}
