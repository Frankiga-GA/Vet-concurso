import Link from "next/link";
import { Suspense } from "react";
import { logoutAction } from "@/app/auth/actions";
import { OwnerForm, PetForm } from "@/features/pets/pet-forms";
import { requireUser } from "@/lib/auth/session";
import { EmptyState, Notice, OwnerNav, PageIntro, PublicHeader } from "@/components/vetia-ui";
import { ownerProfileSchema, petListSchema } from "@/features/pets/contract";

export const dynamic = "force-dynamic";

const birthDateFormatter = new Intl.DateTimeFormat("es-PE", {
  dateStyle: "medium",
  timeZone: "UTC",
});

async function PetList({ supabase }: { supabase: Awaited<ReturnType<typeof requireUser>>["supabase"] }) {
  const { data, error } = await supabase.rpc("vetia_list_my_pets");
  const list = petListSchema.safeParse(data);
  const pets = list.success ? list.data : [];

  return error || !list.success ? (
    <Notice tone="danger" role="alert">No pudimos cargar tus mascotas. Recarga la página para volver a intentarlo.</Notice>
  ) : pets.length === 0 ? (
    <EmptyState icon="🐾" title="Tu familia todavía no tiene fichas">
      <p>Completa tu perfil y registra tu primera mascota con el formulario de esta página.</p>
    </EmptyState>
  ) : (
    <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {pets.map((pet) => (
        <li key={pet.id} className="vet-card vet-card-action wrap-break-word p-4">
          <div className="flex items-start gap-3">
            <span className="vet-icon-tile" aria-hidden="true">🐾</span>
            <div>
              <h3 className="vet-card-title">{pet.name}</h3>
              <span className="vet-badge mt-1">{pet.species}</span>
            </div>
          </div>
          <dl className="mt-2 space-y-1 text-sm text-slate-600">
            {pet.breed && (
              <div>
                <dt className="inline font-medium">Raza: </dt>
                <dd className="inline">{pet.breed}</dd>
              </div>
            )}
            {pet.sex && (
              <div>
                <dt className="inline font-medium">Sexo: </dt>
                <dd className="inline">{pet.sex}</dd>
              </div>
            )}
            {pet.birth_date && (
              <div>
                <dt className="inline font-medium">Nacimiento: </dt>
                <dd className="inline">
                  <time dateTime={pet.birth_date}>{birthDateFormatter.format(new Date(pet.birth_date))}</time>
                </dd>
              </div>
            )}
          </dl>
          <Link href={`/account/pets/${pet.id}`} className="vet-button vet-button-secondary mt-3" aria-label={`Editar a ${pet.name}`}>
            Editar ficha
          </Link>
        </li>
      ))}
    </ul>
  );
}

async function OwnerProfile({ supabase }: { supabase: Awaited<ReturnType<typeof requireUser>>["supabase"] }) {
  const { data, error } = await supabase.rpc("vetia_my_owner_profile").maybeSingle();
  const profile = ownerProfileSchema.nullable().safeParse(data);
  if (error || !profile.success) return <Notice tone="danger" role="alert">No pudimos cargar tu perfil. Recarga la página antes de editarlo.</Notice>;
  return <OwnerForm fullName={profile.data?.full_name} phone={profile.data?.phone ?? undefined} />;
}

export default async function PetsPage() {
  const { supabase } = await requireUser();
  return (
    <>
      <PublicHeader current="account" />
      <main className="vet-shell vet-page space-y-6">
        <OwnerNav current="pets" modality="mascotas" />
        <div className="flex flex-wrap items-start justify-between gap-4">
          <PageIntro title="Mis mascotas" label="Tu familia">
            <p>Consulta sus datos, mantén las fichas al día y registra una nueva mascota cuando la necesites.</p>
          </PageIntro>
          <form action={logoutAction}>
            <button className="vet-button vet-button-secondary">Cerrar sesión</button>
          </form>
        </div>

        <section aria-labelledby="pets-list" className="vet-card space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="vet-eyebrow">Fichas guardadas</p>
              <h2 id="pets-list" className="vet-section-title mt-1">Tus mascotas</h2>
            </div>
            <a href="#new-pet" className="vet-button vet-button-primary">+ Añadir mascota</a>
          </div>
          <Suspense fallback={<Notice role="status">Cargando tus mascotas…</Notice>}>
            <PetList supabase={supabase} />
          </Suspense>
        </section>

        <div className="grid items-start gap-3 lg:grid-cols-[1fr_1.5fr]">
          <section aria-labelledby="owner-profile" className="vet-card">
            <span className="vet-kicker">Paso 1</span>
            <h2 id="owner-profile" className="vet-card-title mt-3">Tus datos de contacto</h2>
            <p className="vet-muted mt-2 text-sm">
              Guarda tu perfil antes de registrar tu primera mascota. El teléfono es opcional y puedes actualizarlo cuando quieras.
            </p>
            <Suspense fallback={<p role="status" className="vet-muted mt-3">Cargando perfil…</p>}>
              <OwnerProfile supabase={supabase} />
            </Suspense>
          </section>
          <section aria-labelledby="new-pet" className="vet-card">
            <span className="vet-kicker">Paso 2</span>
            <h2 id="new-pet" className="vet-card-title mt-3">Registrar una mascota</h2>
            <p className="vet-muted mt-2 text-sm">
              Incluye los datos que conozcas. Los campos opcionales pueden completarse después.
            </p>
            <PetForm today={new Date().toISOString().slice(0, 10)} />
          </section>
        </div>
      </main>
    </>
  );
}
