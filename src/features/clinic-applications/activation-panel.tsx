"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { createSubmissionKeys } from "./submission";
import { activationError, type ActivationInput, type ActivationResult } from "./activation-contract";

export function ClinicActivationPanel({ clinicId, userId, reviewedAt, action }: {
  clinicId: string;
  userId: string;
  reviewedAt: string;
  action: (input: ActivationInput) => Promise<ActivationResult>;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<ActivationResult>();
  const sending = useRef(false);
  const keys = useRef<ReturnType<typeof createSubmissionKeys>>(null);

  function submit(form: FormData) {
    if (sending.current || result?.ok || form.get("confirmed") !== "yes") return;
    if (!keys.current) {
      let storage: Storage | undefined;
      try { storage = window.sessionStorage; } catch { /* In-memory retries remain available. */ }
      keys.current = createSubmissionKeys(storage);
    }
    const operationKeys = keys.current;
    const slot = `vetia:activate:${userId}:${clinicId}:${reviewedAt}`;
    sending.current = true;
    startTransition(async () => {
      try {
        const response = await action({
          clinicId, expectedReviewedAt: reviewedAt, operationId: operationKeys.get(slot),
        });
        setResult(response);
        if (response.ok) {
          operationKeys.complete(slot);
          router.refresh();
        }
      } catch {
        setResult(activationError());
      } finally {
        sending.current = false;
      }
    });
  }

  return <form action={submit} aria-busy={pending} className="mt-3 space-y-3">
    <p className="vet-muted text-sm">Se requiere acreditación vigente y TOTP verificado en los últimos diez minutos.</p>
    <label className="flex min-h-11 items-start gap-2 text-sm">
      <input type="checkbox" name="confirmed" value="yes" required className="mt-1" />
      Autorizo activar la clínica y la membresía del representante acreditado. La clínica seguirá fuera del directorio.
    </label>
    <button type="submit" disabled={pending || result?.ok} className="vet-button vet-button-primary">
      {pending ? "Activando…" : "Activar clínica"}
    </button>
    {result && <p role={result.ok ? "status" : "alert"} className={`vet-notice ${result.ok ? "vet-notice-info" : "vet-notice-danger"}`}>{result.message}</p>}
  </form>;
}
