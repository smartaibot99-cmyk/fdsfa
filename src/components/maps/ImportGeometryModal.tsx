import React, { useRef, useState } from 'react';
import { AlertTriangle, CheckCircle2, FileCode2, Upload, X } from 'lucide-react';
import { ImportedFeatureCandidate, MapFieldRecord } from '../../types/maps';
import { formatArea, parseImportedBoundariesFile } from '../../lib/mapGeometry';

interface ImportGeometryModalProps {
  open: boolean;
  farmName: string;
  areaUnit: 'hectares' | 'acres';
  existingFields: MapFieldRecord[];
  onClose: () => void;
  onConfirmImport: (
    validCandidates: Array<{ name: string; geometry: NonNullable<ImportedFeatureCandidate['geometry']> }>
  ) => Promise<void>;
}

export const ImportGeometryModal: React.FC<ImportGeometryModalProps> = ({
  open,
  farmName,
  areaUnit,
  existingFields,
  onClose,
  onConfirmImport,
}) => {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [filename, setFilename] = useState<string>('');
  const [formatLabel, setFormatLabel] = useState<string>('');
  const [crsAssumption, setCrsAssumption] = useState<string>('');
  const [candidates, setCandidates] = useState<ImportedFeatureCandidate[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);

  if (!open) return null;

  const handleFileChange = async (file: File | undefined) => {
    if (!file) return;
    setParseError(null);
    setFilename(file.name);
    try {
      const text = await file.text();
      const res = parseImportedBoundariesFile(file.name, text, existingFields);
      setFormatLabel(res.format);
      setCrsAssumption(res.crsAssumption);
      setCandidates(res.candidates);
      if (res.candidates.length === 0) {
        setParseError('No geographic features detected in this file.');
      }
    } catch (err) {
      setCandidates([]);
      setParseError(err instanceof Error ? err.message : 'Unable to parse geometry file.');
    }
  };

  const selectedValid = candidates.filter((c) => c.selected && c.geometry && c.validation?.valid);

  return (
    <div
      className="fixed inset-0 z-[900] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl rounded-2xl border border-[#283B5E] bg-[#0B1424] text-slate-100 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-4 border-b border-[#1E2E4A] flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-white">
              Import Field Boundaries (GeoJSON / KML)
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Target farm: <span className="text-teal-300 font-medium">{farmName}</span> · Preview &amp; validate before committing
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close import modal"
            className="text-slate-400 hover:text-white cursor-pointer p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4 overflow-y-auto fs-thin-scroll">
          {/* File Drop / Picker */}
          <div className="p-4 rounded-xl border border-dashed border-teal-400/40 bg-teal-500/5 text-center space-y-2">
            <FileCode2 className="w-7 h-7 text-teal-300 mx-auto" />
            <div className="text-xs text-slate-200">
              Select a <code className="text-teal-300">.geojson</code>, <code className="text-teal-300">.json</code>, or{' '}
              <code className="text-teal-300">.kml</code> boundary file
            </div>
            <input
              ref={fileRef}
              type="file"
              accept=".geojson,.json,.kml,application/geo+json,application/vnd.google-earth.kml+xml"
              className="hidden"
              onChange={(e) => handleFileChange(e.target.files?.[0])}
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-teal-500 text-slate-950 font-semibold text-xs cursor-pointer hover:bg-teal-400"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>{filename ? 'Choose Another File' : 'Select Boundary File'}</span>
            </button>
          </div>

          {parseError && (
            <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-400/40 text-xs text-rose-200 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-300 shrink-0 mt-0.5" />
              <span>{parseError}</span>
            </div>
          )}

          {filename && !parseError && (
            <div className="p-3 rounded-xl bg-white/[0.04] border border-white/10 text-xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-white">{filename}</span>
                <span className="text-teal-300 font-mono">{formatLabel}</span>
              </div>
              <div className="text-[11px] text-slate-400">
                CRS Assumption: {crsAssumption} · Detected features: {candidates.length} (
                {candidates.filter((c) => c.validation?.valid).length} valid,{' '}
                {candidates.filter((c) => !c.validation?.valid).length} rejected)
              </div>
            </div>
          )}

          {candidates.length > 0 && (
            <div className="space-y-2">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Detected Features Preview (Invalid features are explicitly listed below)
              </div>
              {candidates.map((cand, idx) => {
                const isValid = Boolean(cand.validation?.valid && cand.geometry);
                return (
                  <div
                    key={cand.index}
                    className={`p-3 rounded-xl border text-xs space-y-1.5 ${
                      isValid
                        ? 'bg-[#0E1A30] border-[#253A5E]'
                        : 'bg-rose-950/35 border-rose-500/40'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <label className="inline-flex items-center gap-2 font-medium text-white flex-1 min-w-0">
                        <input
                          type="checkbox"
                          disabled={!isValid}
                          checked={cand.selected && isValid}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            setCandidates((prev) =>
                              prev.map((c, i) => (i === idx ? { ...c, selected: checked } : c))
                            );
                          }}
                        />
                        <input
                          type="text"
                          value={cand.suggestedName}
                          disabled={!isValid}
                          onChange={(e) => {
                            const val = e.target.value;
                            setCandidates((prev) =>
                              prev.map((c, i) => (i === idx ? { ...c, suggestedName: val } : c))
                            );
                          }}
                          aria-label={`Field name for feature ${cand.index}`}
                          className="flex-1 min-w-0 px-2 py-1 rounded bg-[#060D1A] border border-white/15 text-xs text-white disabled:opacity-60"
                        />
                      </label>
                      <span className="text-[10.5px] font-mono text-slate-300 shrink-0">
                        {cand.validation ? formatArea(cand.validation.netAreaM2, areaUnit) : cand.rawGeometryType}
                      </span>
                    </div>

                    {isValid ? (
                      <div className="text-[11px] text-emerald-300 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                        <span>
                          Valid {cand.rawGeometryType} · {cand.validation?.vertexCount} vertices
                          {cand.validation?.holeCount ? ` · ${cand.validation.holeCount} exclusion hole(s)` : ''}
                        </span>
                      </div>
                    ) : (
                      <div className="text-[11px] text-rose-200 flex items-start gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                        <span>Rejected: {cand.error}</span>
                      </div>
                    )}

                    {cand.validation?.issues
                      .filter((iss) => iss.severity === 'warning')
                      .map((warn, wi) => (
                        <div key={wi} className="text-[10.5px] text-amber-300">
                          Warning: {warn.message}
                        </div>
                      ))}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="px-5 py-3.5 border-t border-[#1E2E4A] flex items-center justify-between gap-3 bg-[#08101E]">
          <span className="text-[11px] text-slate-400">
            Existing boundaries will not be overwritten.
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-xl text-xs font-medium text-slate-300 hover:bg-white/10 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={selectedValid.length === 0 || importing}
              onClick={async () => {
                setImporting(true);
                try {
                  await onConfirmImport(
                    selectedValid.map((c) => ({
                      name: c.suggestedName.trim() || `Imported Field ${c.index}`,
                      geometry: c.geometry!,
                    }))
                  );
                  onClose();
                } finally {
                  setImporting(false);
                }
              }}
              className="px-4 py-1.5 rounded-xl text-xs font-semibold bg-teal-500 text-slate-950 hover:bg-teal-400 disabled:opacity-45 cursor-pointer"
            >
              {importing
                ? 'Importing...'
                : `Import ${selectedValid.length} Valid ${selectedValid.length === 1 ? 'Boundary' : 'Boundaries'}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
