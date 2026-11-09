"use client";

import { useState, useTransition, type FormEvent } from "react";
import { uploadApplicationDocument } from "@/app/account/clinic-applications/document-actions";
import { documentTypeLabels, type ApplicationDocument } from "./accreditation-contract";

export function DocumentUploader({
  applicationId,
  documents,
  isClosed,
}: {
  applicationId: string;
  documents: ApplicationDocument[];
  isClosed: boolean;
}) {
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    setResult(null);
    startTransition(async () => {
      const res = await uploadApplicationDocument(data);
      setResult(res);
      if (res.ok) {
        form.reset();
      }
    });
  }

  return (
    <div className="mt-4 rounded-xl border border-[var(--line)] bg-slate-50/60 p-4">
      <h4 className="text-sm font-semibold text-slate-900">Documentos de sustento y personería</h4>
      <p className="vet-muted mt-1 text-xs">
        Adjunta documentos de identidad del representante, Ficha RUC o constancia de colegiatura (PDF, JPG, PNG hasta 10 MB).
      </p>

      {/* Lista de documentos ya subidos */}
      {documents.length > 0 && (
        <ul className="mt-3 divide-y divide-slate-200/80 text-xs">
          {documents.map((doc) => (
            <li key={doc.id} className="py-2 flex items-center justify-between gap-2">
              <span className="font-medium text-slate-800">
                {documentTypeLabels[doc.document_type] || doc.document_type}: {doc.file_name}
              </span>
              <span className="text-slate-500">{(doc.file_size / 1024).toFixed(0)} KB</span>
            </li>
          ))}
        </ul>
      )}

      {/* Formulario para adjuntar nuevo documento */}
      {!isClosed && (
        <form onSubmit={handleSubmit} className="mt-3 space-y-3">
          <input type="hidden" name="applicationId" value={applicationId} />
          <div className="grid gap-2 sm:grid-cols-2">
            <label className="block text-xs font-medium text-slate-700">
              Tipo de documento
              <select name="documentType" required className="vet-field mt-1 text-xs" disabled={pending}>
                <option value="rep_identity">Copia DNI/CE de representante</option>
                <option value="sunat_ruc">Ficha RUC (SUNAT)</option>
                <option value="cmvp_license">Constancia de colegiatura (CMVP)</option>
                <option value="sunarp_power">Vigencia de poder (SUNARP)</option>
                <option value="other">Otro sustento</option>
              </select>
            </label>
            <label className="block text-xs font-medium text-slate-700">
              Seleccionar archivo
              <input
                type="file"
                name="file"
                required
                accept=".pdf,image/jpeg,image/png"
                className="vet-field mt-1 text-xs file:mr-2 file:rounded-md file:border-0 file:bg-slate-200 file:px-2 file:py-1 file:text-xs"
                disabled={pending}
              />
            </label>
          </div>
          <button type="submit" disabled={pending} className="vet-button vet-button-secondary text-xs">
            {pending ? "Subiendo…" : "+ Adjuntar documento"}
          </button>
        </form>
      )}

      {result && (
        <p role={result.ok ? "status" : "alert"} className={`vet-notice mt-3 text-xs ${result.ok ? "vet-notice-info" : "vet-notice-danger"}`}>
          {result.message}
        </p>
      )}
    </div>
  );
}
