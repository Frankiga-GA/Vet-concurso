"use client";

import { useState, useTransition, type FormEvent } from "react";
import { documentTypeLabels, type ApplicationDocument, type AccreditationDetails } from "./accreditation-contract";
import {
  saveAccreditationChecksAction,
  requestAccreditationCorrectionsAction,
  verifyAccreditationAction,
} from "@/app/admin/clinic-applications/[id]/accreditation-actions";

type SunatStatus = "activo_habido" | "activo_no_habido" | "no_hallado" | "baja" | "invalido";
type CmvpStatus = "habilitado" | "no_habilitado" | "no_encontrado";

type DocItem = ApplicationDocument & { downloadUrl: string };

export function AccreditationPanel({
  applicationId,
  ruc,
  legalName,
  representativeName,
  veterinarianName,
  veterinarianLicense,
  documents,
  accreditation,
}: {
  applicationId: string;
  ruc: string | null;
  legalName: string | null;
  representativeName: string | null;
  veterinarianName: string | null;
  veterinarianLicense: string | null;
  documents: DocItem[];
  accreditation: AccreditationDetails | null;
}) {
  const [sunatVerified, setSunatVerified] = useState(accreditation?.sunat_verified ?? false);
  const [sunatStatus, setSunatStatus] = useState<SunatStatus>(accreditation?.sunat_status ?? "activo_habido");
  const [sunatNotes, setSunatNotes] = useState(accreditation?.sunat_notes ?? "");

  const [sunarpRequired, setSunarpRequired] = useState(accreditation?.sunarp_required ?? true);
  const [sunarpVerified, setSunarpVerified] = useState(accreditation?.sunarp_verified ?? false);
  const [sunarpEntry, setSunarpEntry] = useState(accreditation?.sunarp_entry ?? "");
  const [sunarpNotes, setSunarpNotes] = useState(accreditation?.sunarp_notes ?? "");

  const [cmvpVerified, setCmvpVerified] = useState(accreditation?.cmvp_verified ?? false);
  const [cmvpLicenseStatus, setCmvpLicenseStatus] = useState<CmvpStatus>(accreditation?.cmvp_license_status ?? "habilitado");
  const [cmvpNotes, setCmvpNotes] = useState(accreditation?.cmvp_notes ?? "");

  const [correctionNotes, setCorrectionNotes] = useState("");
  const [evidenceReference, setEvidenceReference] = useState("");
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [pending, startTransition] = useTransition();

  // Validate missing data
  const missingFields: string[] = [];
  if (!ruc || ruc.length !== 11) missingFields.push("RUC de 11 dígitos");
  if (!legalName) missingFields.push("Razón social");
  if (!representativeName) missingFields.push("Responsable legal");
  if (!veterinarianName) missingFields.push("Veterinario responsable");
  if (!veterinarianLicense) missingFields.push("Colegiatura profesional (CMVP)");
  const isDataIncomplete = missingFields.length > 0;

  // Document presence
  const hasSunatDoc = documents.some((d) => d.document_type === "sunat_ruc" || d.document_type === "other");
  const hasSunarpDoc = documents.some((d) => d.document_type === "sunarp_power" || d.document_type === "rep_identity" || d.document_type === "other");
  const hasCmvpDoc = documents.some((d) => d.document_type === "cmvp_license" || d.document_type === "other");

  // Prerequisites to allow checking verification
  const canCheckSunat = Boolean(ruc && ruc.length === 11) && hasSunatDoc;
  const canCheckSunarp = Boolean(representativeName && sunarpEntry.trim().length > 0) && hasSunarpDoc;
  const canCheckCmvp = Boolean(veterinarianName && veterinarianLicense) && hasCmvpDoc;

  const isVerified = accreditation?.is_representation_active ?? false;
  const canVerify =
    documents.length > 0 &&
    !isDataIncomplete &&
    sunatVerified &&
    sunatStatus === "activo_habido" &&
    cmvpVerified &&
    cmvpLicenseStatus === "habilitado" &&
    (!sunarpRequired || sunarpVerified);

  function handleSaveChecks(e: FormEvent) {
    e.preventDefault();
    setResult(null);
    startTransition(async () => {
      const data = new FormData();
      data.set("applicationId", applicationId);
      data.set("sunatVerified", String(sunatVerified && canCheckSunat));
      data.set("sunatStatus", sunatStatus);
      data.set("sunatNotes", sunatNotes);
      data.set("sunarpRequired", String(sunarpRequired));
      data.set("sunarpVerified", String(sunarpVerified && canCheckSunarp));
      data.set("sunarpEntry", sunarpEntry);
      data.set("sunarpNotes", sunarpNotes);
      data.set("cmvpVerified", String(cmvpVerified && canCheckCmvp));
      data.set("cmvpLicenseStatus", cmvpLicenseStatus);
      data.set("cmvpNotes", cmvpNotes);

      const res = await saveAccreditationChecksAction(data);
      setResult(res);
    });
  }

  function handleRequestCorrections(e: FormEvent) {
    e.preventDefault();
    if (!correctionNotes || correctionNotes.trim().length < 5) {
      setResult({ ok: false, message: "Escribe el detalle de las correcciones solicitadas (mínimo 5 caracteres)." });
      return;
    }
    setResult(null);
    startTransition(async () => {
      const data = new FormData();
      data.set("applicationId", applicationId);
      data.set("correctionNotes", correctionNotes);
      const res = await requestAccreditationCorrectionsAction(data);
      setResult(res);
      if (res.ok) setCorrectionNotes("");
    });
  }

  function handlePreFillMissingDataRequest() {
    setCorrectionNotes(
      `Estimado solicitante: Tu solicitud tiene información incompleta. Por favor ingresa a tu cuenta y completa: ${missingFields.join(
        ", "
      )}, y adjunta los documentos de sustento correspondientes (Ficha RUC, DNI o Vigencia de Poder, Constancia CMVP).`
    );
  }

  function handleVerifyAccreditation(e: FormEvent) {
    e.preventDefault();
    if (!canVerify) return;
    setResult(null);
    startTransition(async () => {
      const data = new FormData();
      data.set("applicationId", applicationId);
      data.set("evidenceReference", evidenceReference);
      const res = await verifyAccreditationAction(data);
      setResult(res);
    });
  }

  return (
    <div className="space-y-6">
      {/* Aviso de información incompleta si aplica */}
      {isDataIncomplete && (
        <div className="rounded-2xl border border-amber-300 bg-amber-50/90 p-4 text-amber-950">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <span className="vet-badge vet-badge-danger">Información incompleta</span>
              <h3 className="font-semibold text-sm mt-1 text-amber-950">
                La solicitud no cuenta con todos los datos fiscales o de colegiatura obligatorios
              </h3>
              <p className="mt-1 text-xs text-amber-900">
                Faltan registrar: <strong>{missingFields.join(" · ")}</strong>.
              </p>
            </div>
            <button
              type="button"
              onClick={handlePreFillMissingDataRequest}
              className="vet-button vet-button-secondary text-xs"
            >
              Pedir al solicitante completar datos y sustento
            </button>
          </div>
        </div>
      )}

      {/* PASO 2: Documentos de sustento */}
      <section className="vet-card space-y-4" aria-labelledby="step2-title">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <p className="vet-eyebrow">Paso 2</p>
            <h2 id="step2-title" className="vet-card-title mt-0.5">
              Documentos de sustento (Storage privado)
            </h2>
            <p className="vet-muted mt-1 text-xs">
              Archivos protegidos en almacenamiento privado accesible solo por el solicitante y superadministradores.
            </p>
          </div>
          <span className="vet-badge">{documents.length} archivo(s) recibido(s)</span>
        </div>

        {documents.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-center">
            <p className="text-sm font-medium text-slate-700">Aún no se han adjuntado documentos para esta solicitud.</p>
            <p className="vet-muted mt-1 text-xs">
              Puedes solicitar al solicitante que adjunte su Ficha RUC, DNI o Constancia CMVP en el Paso 3.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100 rounded-xl border border-[var(--line)] bg-white">
            {documents.map((doc) => (
              <li key={doc.id} className="flex flex-wrap items-center justify-between gap-2 p-3">
                <div className="min-w-0">
                  <span className="font-semibold text-xs text-slate-800">
                    {documentTypeLabels[doc.document_type] || doc.document_type}
                  </span>
                  <p className="text-xs text-slate-500 truncate">
                    {doc.file_name} · {(doc.file_size / 1024).toFixed(1)} KB
                  </p>
                </div>
                <a
                  href={doc.downloadUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="vet-button vet-button-secondary text-xs"
                >
                  Abrir documento seguro ↗
                </a>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* PASO 3: Verificaciones oficiales y Acreditación */}
      <section className="vet-card space-y-5" aria-labelledby="step3-title">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="vet-eyebrow">Paso 3</p>
            <h2 id="step3-title" className="vet-card-title mt-0.5">
              Verificaciones oficiales (SUNAT, SUNARP, CMVP)
            </h2>
            <p className="vet-muted mt-1 text-xs">
              Comprueba la validez en padrones oficiales antes de emitir la acreditación.
            </p>
          </div>
          <span
            className={`vet-badge ${
              isVerified ? "" : accreditation?.status === "corrections_requested" ? "vet-badge-danger" : "vet-badge-pending"
            }`}
          >
            {isVerified
              ? "Acreditación verificada"
              : accreditation?.status === "corrections_requested"
              ? "Correcciones solicitadas"
              : "Pendiente de verificación"}
          </span>
        </div>

        {result && (
          <div role={result.ok ? "status" : "alert"} className={`vet-notice ${result.ok ? "vet-notice-info" : "vet-notice-danger"}`}>
            {result.message}
          </div>
        )}

        <form onSubmit={handleSaveChecks} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            {/* SUNAT */}
            <div className="rounded-xl border border-[var(--line)] bg-slate-50/60 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-xs uppercase tracking-wide text-slate-800">1. SUNAT</h4>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${canCheckSunat ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-600"}`}>
                  {canCheckSunat ? "Listo para verificar" : "Datos/Doc faltantes"}
                </span>
              </div>
              <div className="text-xs text-slate-600 space-y-0.5">
                <p><strong>RUC:</strong> {ruc || <span className="text-rose-600 font-semibold">Falta RUC</span>}</p>
                <p><strong>Ficha RUC:</strong> {hasSunatDoc ? "Adjunta ✓" : <span className="text-rose-600">No adjunta</span>}</p>
              </div>

              <label className="block text-xs font-medium text-slate-700">
                Estado y condición tributaria
                <select
                  className="vet-field mt-1 text-xs"
                  value={sunatStatus}
                  onChange={(e) => setSunatStatus(e.target.value as SunatStatus)}
                  disabled={pending}
                >
                  <option value="activo_habido">ACTIVO Y HABIDO</option>
                  <option value="activo_no_habido">Activo no habido</option>
                  <option value="no_hallado">No hallado</option>
                  <option value="baja">Baja definitiva/provisoria</option>
                  <option value="invalido">RUC Inválido</option>
                </select>
              </label>

              <div>
                <label className={`flex items-center gap-2 text-xs font-medium ${canCheckSunat ? "text-slate-800 cursor-pointer" : "text-slate-400 cursor-not-allowed"}`}>
                  <input
                    type="checkbox"
                    checked={sunatVerified && canCheckSunat}
                    onChange={(e) => setSunatVerified(e.target.checked)}
                    disabled={pending || !canCheckSunat}
                  />
                  Comprobado en portal SUNAT
                </label>
                {!canCheckSunat && (
                  <p className="text-[11px] text-amber-800 mt-1">
                    Requiere RUC de 11 dígitos y Ficha RUC adjunta.
                  </p>
                )}
              </div>

              <textarea
                className="vet-field text-xs"
                placeholder="Notas de verificación SUNAT (opcional)"
                rows={2}
                value={sunatNotes}
                onChange={(e) => setSunatNotes(e.target.value)}
                disabled={pending}
              />
            </div>

            {/* SUNARP */}
            <div className="rounded-xl border border-[var(--line)] bg-slate-50/60 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-xs uppercase tracking-wide text-slate-800">2. SUNARP</h4>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${canCheckSunarp || !sunarpRequired ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-600"}`}>
                  {!sunarpRequired ? "Opcional (persona natural)" : canCheckSunarp ? "Listo para verificar" : "Datos/Doc faltantes"}
                </span>
              </div>
              <div className="text-xs text-slate-600 space-y-0.5">
                <p><strong>Representante:</strong> {representativeName || <span className="text-rose-600">No indicado</span>}</p>
                <p><strong>Documento/Poder:</strong> {hasSunarpDoc ? "Adjunto ✓" : <span className="text-rose-600">No adjunto</span>}</p>
              </div>

              <label className="flex items-center gap-2 text-xs font-medium text-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={sunarpRequired}
                  onChange={(e) => setSunarpRequired(e.target.checked)}
                  disabled={pending}
                />
                Exigir comprobación de poderes (persona jurídica)
              </label>

              {sunarpRequired && (
                <>
                  <label className="block text-xs font-medium text-slate-700">
                    Partida / Asiento electrónico
                    <input
                      className="vet-field mt-1 text-xs"
                      placeholder="Ej. Partida 11029342 Asiento A0001"
                      value={sunarpEntry}
                      onChange={(e) => setSunarpEntry(e.target.value)}
                      disabled={pending}
                    />
                  </label>
                  <div>
                    <label className={`flex items-center gap-2 text-xs font-medium ${canCheckSunarp ? "text-slate-800 cursor-pointer" : "text-slate-400 cursor-not-allowed"}`}>
                      <input
                        type="checkbox"
                        checked={sunarpVerified && canCheckSunarp}
                        onChange={(e) => setSunarpVerified(e.target.checked)}
                        disabled={pending || !canCheckSunarp}
                      />
                      Vigencia de poder verificada
                    </label>
                    {!canCheckSunarp && (
                      <p className="text-[11px] text-amber-800 mt-1">
                        Requiere nombre de representante, partida/asiento y vigencia/DNI adjunto.
                      </p>
                    )}
                  </div>
                </>
              )}

              <textarea
                className="vet-field text-xs"
                placeholder="Notas SUNARP (opcional)"
                rows={2}
                value={sunarpNotes}
                onChange={(e) => setSunarpNotes(e.target.value)}
                disabled={pending}
              />
            </div>

            {/* CMVP */}
            <div className="rounded-xl border border-[var(--line)] bg-slate-50/60 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-xs uppercase tracking-wide text-slate-800">3. CMVP</h4>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${canCheckCmvp ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-600"}`}>
                  {canCheckCmvp ? "Listo para verificar" : "Datos/Doc faltantes"}
                </span>
              </div>
              <div className="text-xs text-slate-600 space-y-0.5">
                <p><strong>Veterinario:</strong> {veterinarianName || <span className="text-rose-600">No indicado</span>}</p>
                <p><strong>Colegiatura:</strong> {veterinarianLicense || <span className="text-rose-600">No indicada</span>}</p>
                <p><strong>Constancia CMVP:</strong> {hasCmvpDoc ? "Adjunta ✓" : <span className="text-rose-600">No adjunta</span>}</p>
              </div>

              <label className="block text-xs font-medium text-slate-700">
                Condición en el Padrón CMVP
                <select
                  className="vet-field mt-1 text-xs"
                  value={cmvpLicenseStatus}
                  onChange={(e) => setCmvpLicenseStatus(e.target.value as CmvpStatus)}
                  disabled={pending}
                >
                  <option value="habilitado">HABILITADO</option>
                  <option value="no_habilitado">No habilitado / Suspendido</option>
                  <option value="no_encontrado">No encontrado</option>
                </select>
              </label>

              <div>
                <label className={`flex items-center gap-2 text-xs font-medium ${canCheckCmvp ? "text-slate-800 cursor-pointer" : "text-slate-400 cursor-not-allowed"}`}>
                  <input
                    type="checkbox"
                    checked={cmvpVerified && canCheckCmvp}
                    onChange={(e) => setCmvpVerified(e.target.checked)}
                    disabled={pending || !canCheckCmvp}
                  />
                  Habilitación comprobada en padrón CMVP
                </label>
                {!canCheckCmvp && (
                  <p className="text-[11px] text-amber-800 mt-1">
                    Requiere nombre de veterinario, colegiatura y constancia CMVP adjunta.
                  </p>
                )}
              </div>

              <textarea
                className="vet-field text-xs"
                placeholder="Notas CMVP (opcional)"
                rows={2}
                value={cmvpNotes}
                onChange={(e) => setCmvpNotes(e.target.value)}
                disabled={pending}
              />
            </div>
          </div>

          <button type="submit" disabled={pending} className="vet-button vet-button-secondary text-xs">
            {pending ? "Guardando…" : "Guardar comprobaciones"}
          </button>
        </form>

        {/* Acciones de resolución: Solicitar correcciones o Acreditar */}
        <div className="grid gap-4 sm:grid-cols-2 pt-3 border-t border-[var(--line)]">
          {/* Solicitar correcciones */}
          <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4 space-y-3">
            <h4 className="font-semibold text-xs text-amber-950 uppercase tracking-wide">
              Solicitar correcciones o nuevo sustento
            </h4>
            <p className="text-xs text-amber-800">
              Notifica al solicitante qué datos o documentos debe subsanar desde su cuenta.
            </p>
            <textarea
              className="vet-field text-xs"
              placeholder="Detalla qué documentos o datos faltan completar…"
              rows={3}
              value={correctionNotes}
              onChange={(e) => setCorrectionNotes(e.target.value)}
              disabled={pending}
            />
            <button
              type="button"
              onClick={handleRequestCorrections}
              disabled={pending || correctionNotes.trim().length < 5}
              className="vet-button vet-button-secondary text-xs"
            >
              {pending ? "Enviando…" : "Enviar requerimiento de corrección"}
            </button>
          </div>

          {/* Marcar acreditación como verificada */}
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 space-y-3">
            <h4 className="font-semibold text-xs text-emerald-950 uppercase tracking-wide">
              Emitir acreditación oficial
            </h4>
            <p className="text-xs text-emerald-800">
              Habilita la acción de aprobación. Exige documentos adjuntos y las 3 comprobaciones en conformidad.
            </p>
            <input
              className="vet-field text-xs"
              placeholder="Referencia de acreditación (opcional, ej. ACRED-2026-001)"
              value={evidenceReference}
              onChange={(e) => setEvidenceReference(e.target.value)}
              disabled={pending || !canVerify}
            />
            <button
              type="button"
              onClick={handleVerifyAccreditation}
              disabled={pending || !canVerify}
              className="vet-button vet-button-primary text-xs"
            >
              {pending
                ? "Verificando…"
                : isVerified
                ? "Acreditación vigente (Actualizar)"
                : "Marcar acreditación como verificada"}
            </button>
            {!canVerify && (
              <p className="text-[11px] text-slate-500">
                * Requiere: datos completos, al menos un documento, SUNAT activo/habido, CMVP habilitado y SUNARP (si aplica).
              </p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
