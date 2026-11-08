import Link from "next/link";
import { z } from "zod";
import { logoutAction } from "@/app/auth/actions";
import { OwnerForm, PetForm } from "@/features/pets/pet-forms";
import { requireUser } from "@/lib/auth/session";
import { Notice, PageIntro } from "@/components/vetia-ui";

export const dynamic = "force-dynamic";

const petListSchema = z.array(z.object({
  id: z.string(),
  name: z.string(),
  species: z.string(),
  breed: z.string().nullable(),
  sex: z.string().nullable(),
  birth_date: z.iso.date().nullable(),
}));

const birthDateFormatter = new Intl.DateTimeFormat("es-PE", {
  dateStyle: "medium",
  timeZone: "UTC",
});

export default async function PetsPage() {
  const { supabase } = await requireUser();
  const { data, error } = await supabase.rpc("vetia_list_my_pets");
  const list = petListSchema.safeParse(data);
  const pets = list.success ? list.data : [];

  return <main className="vet-shell vet-page space-y-4">
    <header className="flex flex-wrap items-center justify-between gap-3">
      <Link href="/account" className="vet-link">← Mi cuenta</Link>
      <form action={logoutAction}><button className="vet-button vet-button-secondary">Cerrar sesión</button></form>
    </header>
    <PageIntro title="Mis mascotas"><p>Registra y consulta las mascotas asociadas a tu cuenta.</p></PageIntro>

    <section aria-labelledby="pets-list" className="vet-card space-y-3">
      <h2 id="pets-list" className="text-xl font-semibold">Tus mascotas</h2>
      {error || !list.success ? <Notice tone="danger" role="alert">No pudimos cargar tus mascotas. Recarga la página para volver a intentarlo.</Notice>
        : pets.length === 0 ? <Notice>Aún no tienes mascotas registradas. Completa tu perfil para registrar la primera.</Notice>
        : <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {pets.map((pet) => <li key={pet.id} className="rounded-2xl border border-slate-200 p-4 break-words">
            <h3 className="font-semibold">{pet.name}</h3>
            <dl className="mt-2 space-y-1 text-sm text-slate-600">
              <div><dt className="inline font-medium">Especie: </dt><dd className="inline">{pet.species}</dd></div>
              {pet.breed && <div><dt className="inline font-medium">Raza: </dt><dd className="inline">{pet.breed}</dd></div>}
              {pet.sex && <div><dt className="inline font-medium">Sexo: </dt><dd className="inline">{pet.sex}</dd></div>}
              {pet.birth_date && <div><dt className="inline font-medium">Nacimiento: </dt><dd className="inline"><time dateTime={pet.birth_date}>{birthDateFormatter.format(new Date(pet.birth_date))}</time></dd></div>}
            </dl>
          </li>)}
        </ul>}
      {pets.length > 0 && <a href="#new-pet" className="vet-button vet-button-secondary">Añadir mascota</a>}
    </section>

    <div className="mt-6 grid items-start gap-6 lg:grid-cols-[1fr_1.5fr]">
      <section aria-labelledby="owner-profile" className="vet-card">
        <h2 id="owner-profile" className="text-xl font-semibold">Perfil de propietario</h2>
        <p className="mt-2 text-sm text-slate-600">Guarda tu perfil antes de registrar tu primera mascota. Si actualizas el perfil con el teléfono en blanco, se eliminará el teléfono guardado.</p>
        <OwnerForm />
      </section>
      <section aria-labelledby="new-pet" className="vet-card">
        <h2 id="new-pet" className="text-xl font-semibold">Registrar una mascota</h2>
        <PetForm today={new Date().toISOString().slice(0, 10)} />
      </section>
    </div>
  </main>;
}
