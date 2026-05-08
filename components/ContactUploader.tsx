"use client";

import { ChangeEvent, DragEvent, useRef, useState } from "react";
import { FileSpreadsheet, Upload, X } from "lucide-react";

type ContactUploaderProps = {
  id: string;
  title: string;
  description: string;
  contactCount: number;
  droppedRows?: number;
  accent: "fern" | "ember" | "berry";
  onLoadText: (text: string, fileName: string) => void;
  onClear: () => void;
};

const accentClasses = {
  fern: "border-fern/30 bg-mint/45 text-fern",
  ember: "border-ember/30 bg-orange-50 text-amber-800",
  berry: "border-berry/30 bg-fuchsia-50 text-berry"
};

export function ContactUploader({
  id,
  title,
  description,
  contactCount,
  droppedRows = 0,
  accent,
  onLoadText,
  onClear
}: ContactUploaderProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [isDragging, setIsDragging] = useState(false);

  async function readFile(file: File) {
    const text = await file.text();
    setFileName(file.name);
    onLoadText(text, file.name);
  }

  function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (file) {
      void readFile(file);
    }
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);

    const file = event.dataTransfer.files?.[0];
    if (file) {
      void readFile(file);
    }
  }

  return (
    <div
      onDragOver={(event) => {
        event.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      className={`rounded-lg border border-dashed p-4 transition ${
        isDragging ? "border-lagoon bg-sky-50" : "border-ink/15 bg-white"
      }`}
    >
      <input
        ref={inputRef}
        id={id}
        type="file"
        accept=".csv,text/csv,text/plain"
        className="sr-only"
        onChange={handleFile}
      />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-3">
          <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border ${accentClasses[accent]}`}>
            <FileSpreadsheet size={22} aria-hidden="true" />
          </div>
          <div>
            <h3 className="text-base font-bold text-ink">{title}</h3>
            <p className="mt-1 max-w-xl text-sm leading-6 text-ink/68">{description}</p>
            {fileName ? (
              <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-ink/50">
                {fileName}
              </p>
            ) : null}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            className="focus-ring inline-flex h-10 items-center gap-2 rounded-md bg-ink px-3 text-sm font-bold text-white hover:bg-ink/88"
            onClick={() => inputRef.current?.click()}
          >
            <Upload size={17} aria-hidden="true" />
            Upload
          </button>
          {contactCount > 0 ? (
            <button
              type="button"
              aria-label={`Clear ${title}`}
              className="focus-ring inline-flex h-10 w-10 items-center justify-center rounded-md border border-ink/10 bg-white text-ink/70 hover:text-ink"
              onClick={() => {
                setFileName("");
                onClear();
                if (inputRef.current) {
                  inputRef.current.value = "";
                }
              }}
            >
              <X size={17} aria-hidden="true" />
            </button>
          ) : null}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 text-sm sm:max-w-md">
        <div className="rounded-md border border-ink/10 bg-cloud px-3 py-2">
          <span className="block text-xs font-semibold uppercase text-ink/45">Usable contacts</span>
          <span className="mt-1 block text-lg font-black text-ink">{contactCount}</span>
        </div>
        <div className="rounded-md border border-ink/10 bg-cloud px-3 py-2">
          <span className="block text-xs font-semibold uppercase text-ink/45">Skipped rows</span>
          <span className="mt-1 block text-lg font-black text-ink">{droppedRows}</span>
        </div>
      </div>
    </div>
  );
}
