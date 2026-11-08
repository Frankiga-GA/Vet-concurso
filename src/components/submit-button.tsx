"use client";

import { useFormStatus } from "react-dom";

export function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return <button className="vet-button vet-button-primary w-full" type="submit" disabled={pending}>
    {pending ? "Enviando…" : label}
  </button>;
}
