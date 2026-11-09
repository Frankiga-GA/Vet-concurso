"use client";

import { useActionState, useRef, useEffect, useState } from "react";
import Link from "next/link";
import {
  createAgroFarmAction,
  createAgroHerdAction,
  deleteAgroHerdAction,
  type AgroActionState,
} from "./actions";
import {
  AGRO_SPECIES,
  AGRO_HOLDING_TYPES,
  AGRO_HEALTH_STATUSES,
  type AgroFarm,
  type AgroHerd,
} from "./contract";

export const SPECIES_LABELS: Record<string, { label: string; icon: string }> = {
  bovino: { label: "Bovino (Vacuno)", icon: "🐮" },
  porcino: { label: "Porcino (Cerdos)", icon: "🐷" },
  ovino: { label: "Ovino (Ovejas)", icon: "🐑" },
  caprino: { label: "Caprino (Cabras)", icon: "🐐" },
  ave: { label: "Aves (Ponedoras/Engorde)", icon: "🐔" },
};

export const HOLDING_TYPE_LABELS: Record<string, string> = {
  lecheria: "Lechería / Producción láctea",
  engorde: "Engorde / Ceba intensiva",
  porcicola: "Granja Porcícola",
  avicola: "Granja Avícola",
  ovino_caprino: "Ganadería Ovino / Caprino",
  mixto: "Explotación mixta / Agropecuaria",
  traspatio: "Crianza familiar / Traspatio",
};

export const HEALTH_STATUS_BADGES: Record<
  string,
  { label: string; className: string }
> = {
  aparentemente_sano: {
    label: "Aparentemente sano",
    className: "bg-emerald-100 text-emerald-800 border-emerald-300",
  },
  en_tratamiento: {
    label: "En tratamiento",
    className: "bg-amber-100 text-amber-800 border-amber-300",
  },
  en_observacion: {
    label: "En observación",
    className: "bg-blue-100 text-blue-800 border-blue-300",
  },
  cuarentena: {
    label: "En cuarentena / Aislado",
    className: "bg-rose-100 text-rose-800 border-rose-300",
  },
};

export function AgroModeSwitcher({ current = "agro" }: { current: "pets" | "agro" }) {
  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 rounded-2xl border border-emerald-800/15 bg-gradient-to-r from-emerald-50 via-teal-50/40 to-white p-3.5 sm:p-4 shadow-xs">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--green)] text-white text-lg shadow-sm">
          🌾
        </span>
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-[var(--green-dark)]">
            Módulo Diferenciado
          </p>
          <p className="text-sm font-extrabold text-[var(--ink)]">
            {current === "agro"
              ? "VetIA Agro: Animales de Producción"
              : "VetIA: Mascotas Familiares"}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1.5 rounded-xl border border-slate-200/90 bg-white p-1 shadow-xs">
        <Link
          href="/account/pets"
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
            current === "pets"
              ? "bg-[var(--green)] !text-white shadow-xs"
              : "text-[var(--ink-soft)] hover:bg-slate-100"
          }`}
        >
          <span>🐾</span>
          <span>Mascotas</span>
        </Link>
        <Link
          href="/account/agro"
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
            current === "agro"
              ? "bg-[var(--green)] !text-white shadow-xs"
              : "text-[var(--ink-soft)] hover:bg-slate-100"
          }`}
        >
          <span>🌾</span>
          <span>VetIA Agro</span>
        </Link>
      </div>
    </div>
  );
}

export function FarmForm() {
  const [state, formAction, isPending] = useActionState(createAgroFarmAction, null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.success) {
      formRef.current?.reset();
    }
  }, [state?.success]);

  return (
    <form ref={formRef} action={formAction} className="space-y-4">
      {state?.error && (
        <div role="alert" className="vet-notice vet-notice-danger text-xs">
          {state.error}
        </div>
      )}
      {state?.success && (
        <div role="status" className="vet-notice vet-notice-info text-xs">
          ✓ Explotación agropecuaria registrada con éxito.
        </div>
      )}

      <div>
        <label htmlFor="farm-name" className="block text-xs font-bold text-[var(--ink)]">
          Nombre del predio, granja o establo *
        </label>
        <input
          id="farm-name"
          name="name"
          type="text"
          required
          placeholder="Ej. Fundo San Fernando, Granja Porcina El Valle"
          className="vet-field text-sm"
        />
        {state?.fieldErrors?.name && (
          <p className="text-[11px] text-rose-600 mt-1">{state.fieldErrors.name[0]}</p>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label htmlFor="farm-holding" className="block text-xs font-bold text-[var(--ink)]">
            Tipo de explotación pecuaria *
          </label>
          <select id="farm-holding" name="holding_type" required className="vet-field text-sm">
            {AGRO_HOLDING_TYPES.map((type) => (
              <option key={type} value={type}>
                {HOLDING_TYPE_LABELS[type]}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="farm-province" className="block text-xs font-bold text-[var(--ink)]">
            Provincia (Región Ica) *
          </label>
          <select id="farm-province" name="province" required className="vet-field text-sm">
            <option value="Chincha">Chincha</option>
            <option value="Pisco">Pisco</option>
            <option value="Ica">Ica</option>
            <option value="Palpa">Palpa</option>
            <option value="Nasca">Nasca</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label htmlFor="farm-district" className="block text-xs font-bold text-[var(--ink)]">
            Distrito / Localidad *
          </label>
          <input
            id="farm-district"
            name="district"
            type="text"
            required
            placeholder="Ej. Chincha Baja, Sunampe, Subtanjalla"
            className="vet-field text-sm"
          />
        </div>

        <div>
          <label htmlFor="farm-senasa" className="block text-xs font-bold text-[var(--ink)]">
            Código de Predio SENASA (opcional)
          </label>
          <input
            id="farm-senasa"
            name="senasa_code"
            type="text"
            placeholder="Ej. PE-110201-0042"
            className="vet-field text-sm"
          />
        </div>
      </div>

      <div>
        <label htmlFor="farm-address" className="block text-xs font-bold text-[var(--ink)]">
          Referencia de ubicación / Camino de acceso
        </label>
        <input
          id="farm-address"
          name="address_reference"
          type="text"
          placeholder="Ej. Km 198 Panamericana Sur, entrada margen derecha"
          className="vet-field text-sm"
        />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="vet-button vet-button-primary !w-full text-xs sm:text-sm py-2.5 font-bold shadow-sm"
      >
        {isPending ? "Guardando predio..." : "+ Registrar Explotación"}
      </button>
    </form>
  );
}

export function HerdForm({ farms }: { farms: AgroFarm[] }) {
  const [state, formAction, isPending] = useActionState(createAgroHerdAction, null);
  const [selectedRecordType, setSelectedRecordType] = useState<"lote" | "individual">("lote");
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.success) {
      formRef.current?.reset();
    }
  }, [state?.success]);

  if (farms.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-xs text-[var(--muted)]">
        <p className="font-semibold text-slate-700">Primero registra una explotación o predio</p>
        <p className="mt-1">
          Para asociar lotes o animales individuales de producción, debes tener al menos una granja o fundo guardado.
        </p>
      </div>
    );
  }

  return (
    <form ref={formRef} action={formAction} className="space-y-4">
      {state?.error && (
        <div role="alert" className="vet-notice vet-notice-danger text-xs">
          {state.error}
        </div>
      )}
      {state?.success && (
        <div role="status" className="vet-notice vet-notice-info text-xs">
          ✓ Ficha zootécnica / lote registrado exitosamente.
        </div>
      )}

      <div>
        <label htmlFor="herd-farm" className="block text-xs font-bold text-[var(--ink)]">
          Predio o explotación pecuaria *
        </label>
        <select id="herd-farm" name="farm_id" required className="vet-field text-sm">
          {farms.map((f) => (
            <option key={f.id} value={f.id}>
              {f.name} ({f.district}, {f.province})
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label htmlFor="herd-species" className="block text-xs font-bold text-[var(--ink)]">
            Especie zootécnica *
          </label>
          <select id="herd-species" name="species" required className="vet-field text-sm">
            {AGRO_SPECIES.map((sp) => (
              <option key={sp} value={sp}>
                {SPECIES_LABELS[sp].icon} {SPECIES_LABELS[sp].label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="herd-type" className="block text-xs font-bold text-[var(--ink)]">
            Tipo de registro *
          </label>
          <select
            id="herd-type"
            name="record_type"
            value={selectedRecordType}
            onChange={(e) => setSelectedRecordType(e.target.value as "lote" | "individual")}
            required
            className="vet-field text-sm"
          >
            <option value="lote">Lote / Grupo sanitario</option>
            <option value="individual">Animal individual</option>
          </select>
        </div>

        <div>
          <label htmlFor="herd-count" className="block text-xs font-bold text-[var(--ink)]">
            {selectedRecordType === "individual" ? "Cantidad de cabezas" : "N° de cabezas o aves *"}
          </label>
          <input
            id="herd-count"
            name="head_count"
            type="number"
            min="1"
            defaultValue={selectedRecordType === "individual" ? 1 : 10}
            required
            className="vet-field text-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label htmlFor="herd-id" className="block text-xs font-bold text-[var(--ink)]">
            {selectedRecordType === "individual"
              ? "Identificación (Arete / Tatuaje / Nombre) *"
              : "Código o nombre del Lote *"}
          </label>
          <input
            id="herd-id"
            name="identifier"
            type="text"
            required
            placeholder={
              selectedRecordType === "individual"
                ? "Ej. Arete PE-8492, Vaca Golondrina"
                : "Ej. Lote Ponedoras Galpón 4, Lote Cerdas Recría"
            }
            className="vet-field text-sm"
          />
        </div>

        <div>
          <label htmlFor="herd-breed" className="block text-xs font-bold text-[var(--ink)]">
            Raza / Línea genética
          </label>
          <input
            id="herd-breed"
            name="breed"
            type="text"
            placeholder="Ej. Holstein, Landrace, Dorper, Cobb 500"
            className="vet-field text-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label htmlFor="herd-purpose" className="block text-xs font-bold text-[var(--ink)]">
            Propósito productivo
          </label>
          <input
            id="herd-purpose"
            name="production_purpose"
            type="text"
            placeholder="Ej. Leche, Carne, Huevos, Cría"
            className="vet-field text-sm"
          />
        </div>

        <div>
          <label htmlFor="herd-location" className="block text-xs font-bold text-[var(--ink)]">
            Ubicación en predio
          </label>
          <input
            id="herd-location"
            name="location_in_farm"
            type="text"
            placeholder="Ej. Corral 3, Galpón B, Potrero Sur"
            className="vet-field text-sm"
          />
        </div>

        <div>
          <label htmlFor="herd-health" className="block text-xs font-bold text-[var(--ink)]">
            Estado de salud inicial *
          </label>
          <select id="herd-health" name="health_status" required className="vet-field text-sm">
            {AGRO_HEALTH_STATUSES.map((status) => (
              <option key={status} value={status}>
                {HEALTH_STATUS_BADGES[status].label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Sanitarios */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label htmlFor="herd-vaccines" className="block text-xs font-bold text-[var(--ink)]">
            Vacunaciones aplicadas / Calendario
          </label>
          <input
            id="herd-vaccines"
            name="vaccines_applied"
            type="text"
            placeholder="Ej. Fiebre Aftosa (12/08), Carbunco (15/09)"
            className="vet-field text-sm"
          />
        </div>

        <div>
          <label htmlFor="herd-deworming" className="block text-xs font-bold text-[var(--ink)]">
            Última desparasitación
          </label>
          <input
            id="herd-deworming"
            name="deworming_applied"
            type="text"
            placeholder="Ej. Ivermectina 1% (20/10)"
            className="vet-field text-sm"
          />
        </div>
      </div>

      <div>
        <label htmlFor="herd-obs" className="block text-xs font-bold text-[var(--ink)]">
          Observaciones sanitarias / Manejo
        </label>
        <textarea
          id="herd-obs"
          name="observations"
          rows={2}
          placeholder="Notas de alimentación, sintomatología leve o historial de partos..."
          className="vet-field text-sm"
        />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="vet-button vet-button-primary !w-full text-xs sm:text-sm py-2.5 font-bold shadow-sm"
      >
        {isPending ? "Guardando lote..." : "+ Guardar Ficha Sanitaria"}
      </button>
    </form>
  );
}

export function DeleteHerdButton({ herdId }: { herdId: string }) {
  const [, formAction, isPending] = useActionState(deleteAgroHerdAction, null);

  return (
    <form action={formAction}>
      <input type="hidden" name="herd_id" value={herdId} />
      <button
        type="submit"
        disabled={isPending}
        title="Eliminar registro pecuario"
        className="text-xs text-rose-600 hover:text-rose-800 font-semibold p-1 transition"
      >
        {isPending ? "Eliminando..." : "Eliminar"}
      </button>
    </form>
  );
}
