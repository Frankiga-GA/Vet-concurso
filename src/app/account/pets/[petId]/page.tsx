import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { Notice, PageIntro } from "@/components/vetia-ui";
import { petListSchema } from "@/features/pets/contract";
import { PetForm } from "@/features/pets/pet-forms";
import { requireUser } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default async function EditPetPage({ params }: { params: Promise<{ petId: string }> }) {
  const { petId } = await params;
  if (!z.uuid().safeParse(petId).success) notFound();
  const { supabase } = await requireUser();
  const { data, error } = await supabase.rpc("vetia_list_my_pets").eq("id", petId);
  const pets = petListSchema.safeParse(data);
  const pet = pets.success ? pets.data[0] : undefined;
  if (!error && pets.success && !pet) notFound();
  return <main className="vet-shell vet-page vet-narrow space-y-4">
    <Link href="/account/pets" className="vet-link inline-flex min-h-11 items-center">← Mis mascotas</Link>
    <section className="vet-card space-y-3">
      <PageIntro title="Editar mascota" />
      {pet && !error ? <PetForm today={new Date().toISOString().slice(0, 10)} pet={pet} />
        : <Notice tone="danger" role="alert">No pudimos cargar la ficha. Intenta de nuevo.</Notice>}
    </section>
  </main>;
}
