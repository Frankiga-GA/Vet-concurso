"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { createSubmissionKeys } from "@/features/clinic-applications/submission";
import { days, fieldLabels } from "./contract";
import {
  availablePublicationDecision, publicationError, publicationRetrySlot,
  type PublicationInput, type PublicationResult, type PublicationReview,
} from "./publication-contract";

export function ClinicPublicationPanel({ profile, userId, action }: {
  profile: PublicationReview;
  userId: string;
  action: (input: PublicationInput) => Promise<PublicationResult>;
}) {
  const router = useRouter();
  const decision = availablePublicationDecision(profile);
  const label = decision === "withdraw" ? "Retirar del directorio" : "Publicar clínica";
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<PublicationResult>();
  const [confirmedRevision, setConfirmedRevision] = useState<number>();
  const [reasonText, setReasonText] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const sending = useRef(false);
  const keys = useRef<ReturnType<typeof createSubmissionKeys>>(null);
  const blocked = pending || confirmedRevision === profile.publicationRevision;
  const status = { published: "Publicada", withdrawn: "Retirada", unpublished: "Sin publicar" }[profile.publication];

  function confirm(form: FormData) {
    if (!decision || sending.current || blocked || form.get("confirmed") !== "yes") return;
    const reason = String(form.get("reason") ?? "").trim().replaceAll("\r\n", "\n");
    if (reason.length < 5) {
      setResult({ ok: false, message: "Indica un motivo de al menos cinco caracteres." });
      return;
    }
    if (!keys.current) {
      let storage: Storage | undefined;
      try { storage = window.sessionStorage; } catch { /* Keep retry keys in memory. */ }
      keys.current = createSubmissionKeys(storage);
    }
    const operationKeys = keys.current;
    const draft: Omit<PublicationInput, "operationId"> = {
      clinicId: profile.clinicId, profileRevision: profile.revision, publicationRevision: profile.publicationRevision,
      decision, reason,
    };
    sending.current = true;
    setResult(undefined);
    startTransition(async () => {
      try {
        const slot = await publicationRetrySlot(userId, draft);
        const response = await action({ ...draft, operationId: operationKeys.get(slot) });
        if (response.ok) {
          setConfirmedRevision(profile.publicationRevision);
          setReasonText("");
          setConfirmed(false);
          operationKeys.complete(slot);
          router.refresh();
        }
        setResult(response);
      } catch {
        setResult(publicationError());
      } finally {
        sending.current = false;
      }
    });
  }

  return <>
    <p className="mt-2 font-semibold">Estado de publicación · {status}</p>
    <p className="mt-2 text-sm">La decisión requiere TOTP verificado en los últimos diez minutos. Para publicar se comprueban la activación y la acreditación vigente del representante.</p>
    {profile.missing.length > 0 && <p className="mt-2 text-sm">Campos pendientes · {profile.missing.map((field) => fieldLabels[field]).join(", ")}</p>}
    {!decision && <p className="mt-2 text-sm">La clínica debe estar activa y tener un perfil completo antes de publicar.</p>}
    <details className="mt-4 rounded-xl bg-slate-50 p-3">
      <summary className="cursor-pointer font-semibold">Revisar ficha antes de publicar</summary>
      <dl className="mt-2 grid gap-2 break-words text-sm sm:grid-cols-2">
        <div><dt className="font-semibold">Nombre público</dt><dd>{profile.name}</dd></div>
        <div><dt className="font-semibold">Dirección</dt><dd>{profile.address ?? "Pendiente"}, {profile.city}</dd></div>
        <div><dt className="font-semibold">Teléfono público</dt><dd>{profile.phone ?? "Pendiente"}</dd></div>
        <div><dt className="font-semibold">Descripción</dt><dd>{profile.description ?? "Pendiente"}</dd></div>
        <div><dt className="font-semibold">Servicios</dt><dd>{profile.services.join(", ") || "Pendiente"}</dd></div>
        <div><dt className="font-semibold">Horarios</dt><dd>{profile.hours.map((slot) => `${days[slot.day - 1]} ${slot.start}–${slot.end}`).join(", ") || "Pendiente"}</dd></div>
      </dl>
    </details>
    {decision && <details key={profile.publicationRevision} className="mt-4 rounded-xl border border-slate-300 p-3">
      <summary className="cursor-pointer font-semibold">{label}</summary>
      <form action={confirm} className="mt-3 grid min-w-0 gap-3" aria-busy={pending}>
        <label className="font-semibold">Motivo interno
          <textarea name="reason" required minLength={5} maxLength={500} rows={3}
            value={reasonText} onChange={(event) => setReasonText(event.target.value)}
            className="vet-field" />
        </label>
        <label className="flex items-start gap-2 text-sm">
          <input type="checkbox" name="confirmed" value="yes" required className="mt-1"
            checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} />
          {decision === "publish" ? "Confirmo que revisé los datos y autorizo su publicación."
            : "Confirmo que la clínica dejará de aparecer y de recibir nuevas solicitudes públicas."}
        </label>
        <button type="submit" disabled={blocked} className="vet-button vet-button-primary">
          {pending ? "Guardando…" : `Confirmar: ${label.toLowerCase()}`}
        </button>
      </form>
    </details>}
    {result && <p className="mt-3 text-sm font-semibold" role={result.ok ? "status" : "alert"}>{result.message}</p>}
  </>;
}
