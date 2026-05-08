"use client";

import { useMemo, useState } from "react";
import {
  CheckCircle2,
  DatabaseZap,
  EyeOff,
  Fingerprint,
  Link2,
  Loader2,
  LockKeyhole,
  Play,
  ShieldCheck,
  Sparkles,
  Users
} from "lucide-react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { ContactUploader } from "@/components/ContactUploader";
import { WalletButton } from "@/components/WalletButton";
import { ContactRecord, ParseContactsResult, parseContactCsv } from "@/lib/contacts";
import { getArciumPsiConfig, isArciumConfigured } from "@/lib/arcium/types";
import { PsiRunResult, runLocalPrivateSetIntersection } from "@/lib/psi";
import { sampleCounterpartyCsv, sampleOwnerCsv } from "@/lib/sampleData";
import { ProofMemoPayload, submitProofMemo } from "@/lib/solanaProof";
import { shortHash } from "@/lib/privacy";

type SourceState = ParseContactsResult;

const emptySource: SourceState = {
  contacts: [],
  droppedRows: 0,
  warnings: [],
  sourceName: ""
};

export default function Home() {
  const { connection } = useConnection();
  const wallet = useWallet();
  const arciumConfig = useMemo(() => getArciumPsiConfig(), []);
  const arciumReady = isArciumConfigured(arciumConfig);
  const [ownerSource, setOwnerSource] = useState<SourceState>(emptySource);
  const [counterpartySource, setCounterpartySource] = useState<SourceState>(emptySource);
  const [result, setResult] = useState<PsiRunResult | null>(null);
  const [status, setStatus] = useState<string>("Load contacts or use the sample set to start.");
  const [isRunning, setIsRunning] = useState(false);
  const [isLogging, setIsLogging] = useState(false);
  const [proofSignature, setProofSignature] = useState<string>("");
  const [error, setError] = useState<string>("");

  const canRun = ownerSource.contacts.length > 0 && counterpartySource.contacts.length > 0 && !isRunning;
  const canLog = Boolean(result && wallet.connected && wallet.publicKey && !isLogging);
  const cluster = process.env.NEXT_PUBLIC_SOLANA_CLUSTER || "devnet";

  function setOwnerFromText(text: string, fileName: string) {
    setOwnerSource(parseContactCsv(text, fileName));
    resetRun("Your contacts were parsed locally.");
  }

  function setCounterpartyFromText(text: string, fileName: string) {
    setCounterpartySource(parseContactCsv(text, fileName));
    resetRun("Counterparty set was parsed locally.");
  }

  function loadSampleData() {
    setOwnerSource(parseContactCsv(sampleOwnerCsv, "sample-my-contacts.csv"));
    setCounterpartySource(parseContactCsv(sampleCounterpartyCsv, "sample-private-network.csv"));
    resetRun("Sample contacts loaded. Two mutual friends are expected.");
  }

  function resetRun(nextStatus: string) {
    setResult(null);
    setProofSignature("");
    setError("");
    setStatus(nextStatus);
  }

  async function findMatches() {
    if (!canRun) {
      setError("Add both contact sets before running private set intersection.");
      return;
    }

    setIsRunning(true);
    setError("");
    setProofSignature("");
    setStatus("Hashing and comparing contact sets in this browser tab...");

    try {
      const nextResult = await runLocalPrivateSetIntersection({
        ownerContacts: ownerSource.contacts,
        counterpartyContacts: counterpartySource.contacts
      });
      setResult(nextResult);
      setStatus(
        `Found ${nextResult.matchCount} mutual friend${nextResult.matchCount === 1 ? "" : "s"} without uploading a CSV.`
      );
    } catch (runError) {
      setError(runError instanceof Error ? runError.message : "Unable to run the PSI demo.");
    } finally {
      setIsRunning(false);
    }
  }

  async function logProof() {
    if (!result || !wallet.publicKey) {
      return;
    }

    setIsLogging(true);
    setError("");
    setStatus("Preparing a compact Solana memo proof...");

    const payload: ProofMemoPayload = {
      app: "pff",
      v: 1,
      run: result.runId,
      mode: arciumReady ? "arcium-psi" : result.mode,
      owner: result.ownerCommitment.slice(0, 16),
      counterparty: result.counterpartyCommitment.slice(0, 16),
      result: result.resultCommitment.slice(0, 16),
      matches: result.matchCount
    };

    try {
      const signature = await submitProofMemo({
        connection,
        publicKey: wallet.publicKey,
        sendTransaction: wallet.sendTransaction,
        payload
      });
      setProofSignature(signature);
      setStatus("Proof memo confirmed on Solana.");
    } catch (proofError) {
      setError(proofError instanceof Error ? proofError.message : "Unable to submit the Solana proof memo.");
    } finally {
      setIsLogging(false);
    }
  }

  return (
    <main className="min-h-screen">
      <header className="border-b border-ink/10 bg-white/82 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-ink text-white">
              <Users size={22} aria-hidden="true" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-fern">Solana + Arcium MVP</p>
              <h1 className="text-xl font-black text-ink sm:text-2xl">Private Friend Finder</h1>
            </div>
          </div>
          <WalletButton />
        </div>
      </header>

      <section className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:px-8">
        <div className="space-y-6">
          <section className="surface rounded-lg p-5 sm:p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-lagoon">Find matches privately</p>
                <h2 className="mt-2 text-2xl font-black text-ink sm:text-3xl">Upload locally. Compare privately. Prove lightly.</h2>
                <p className="mt-3 max-w-3xl text-sm leading-6 text-ink/68 sm:text-base">
                  CSVs are parsed, normalized, and hashed in your browser. The demo engine returns only the intersection; the
                  Solana memo stores commitments and match count, never the address book.
                </p>
              </div>
              <button
                type="button"
                className="focus-ring inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-md border border-ink/10 bg-cloud px-4 text-sm font-bold text-ink hover:bg-mint"
                onClick={loadSampleData}
              >
                <Sparkles size={17} aria-hidden="true" />
                Load Sample
              </button>
            </div>

            <div className="mt-6 grid gap-4">
              <ContactUploader
                id="owner-contacts"
                title="Your contacts"
                description="Upload a CSV exported from your contacts app. The file never leaves this tab."
                contactCount={ownerSource.contacts.length}
                droppedRows={ownerSource.droppedRows}
                accent="fern"
                onLoadText={setOwnerFromText}
                onClear={() => setOwnerSource(emptySource)}
              />
              <ContactUploader
                id="counterparty-contacts"
                title="Private network set"
                description="For the MVP, load a second local CSV or sample set. In live mode this set is encrypted into Arcium."
                contactCount={counterpartySource.contacts.length}
                droppedRows={counterpartySource.droppedRows}
                accent="ember"
                onLoadText={setCounterpartyFromText}
                onClear={() => setCounterpartySource(emptySource)}
              />
            </div>

            <Warnings owner={ownerSource} counterparty={counterpartySource} />

            <div className="mt-5 flex flex-col gap-3 border-t border-ink/10 pt-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-h-6 text-sm font-semibold text-ink/68">{status}</div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <button
                  type="button"
                  disabled={!canRun}
                  className="focus-ring inline-flex h-11 items-center justify-center gap-2 rounded-md bg-fern px-4 text-sm font-bold text-white hover:bg-fern/90 disabled:cursor-not-allowed disabled:bg-ink/20"
                  onClick={() => void findMatches()}
                >
                  {isRunning ? <Loader2 className="animate-spin" size={17} aria-hidden="true" /> : <Play size={17} aria-hidden="true" />}
                  Find Matches
                </button>
                <button
                  type="button"
                  disabled={!canLog}
                  className="focus-ring inline-flex h-11 items-center justify-center gap-2 rounded-md bg-ink px-4 text-sm font-bold text-white hover:bg-ink/88 disabled:cursor-not-allowed disabled:bg-ink/20"
                  onClick={() => void logProof()}
                >
                  {isLogging ? <Loader2 className="animate-spin" size={17} aria-hidden="true" /> : <Link2 size={17} aria-hidden="true" />}
                  Log Proof
                </button>
              </div>
            </div>

            {error ? (
              <p className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
                {error}
              </p>
            ) : null}
          </section>

          <ResultsPanel result={result} proofSignature={proofSignature} cluster={cluster} />
        </div>

        <aside className="space-y-6">
          <section className="surface rounded-lg p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-ink text-white">
                <DatabaseZap size={20} aria-hidden="true" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-berry">PSI engine</p>
                <h2 className="text-lg font-black text-ink">Arcium-ready flow</h2>
              </div>
            </div>
            <div className="mt-5 space-y-3">
              <PrivacyStep
                icon={<EyeOff size={18} aria-hidden="true" />}
                title="No CSV upload"
                body="Contacts are parsed into normalized email or phone keys on-device."
              />
              <PrivacyStep
                icon={<LockKeyhole size={18} aria-hidden="true" />}
                title="Encrypted computation"
                body="The Arcium adapter is prepared for a deployed MXE that computes over encrypted sets."
              />
              <PrivacyStep
                icon={<Fingerprint size={18} aria-hidden="true" />}
                title="Small public proof"
                body="Solana receives commitments, run id, and match count. Raw contacts stay private."
              />
            </div>
            <div className="mt-5 rounded-md border border-ink/10 bg-cloud p-3 text-sm">
              <div className="flex items-center gap-2 font-bold text-ink">
                {arciumReady ? <CheckCircle2 size={17} className="text-fern" aria-hidden="true" /> : <ShieldCheck size={17} className="text-ember" aria-hidden="true" />}
                {arciumReady ? "Arcium env configured" : "Local simulator active"}
              </div>
              <p className="mt-2 leading-6 text-ink/65">
                {arciumReady
                  ? `Program ${arciumConfig.programId} is configured for ${arciumConfig.computationName}.`
                  : "Set Arcium program id and cluster offset after deploying the PSI circuit to switch from demo simulation to live MPC."}
              </p>
            </div>
          </section>

          <MetricsPanel owner={ownerSource.contacts} counterparty={counterpartySource.contacts} result={result} />
        </aside>
      </section>
    </main>
  );
}

function Warnings({ owner, counterparty }: { owner: SourceState; counterparty: SourceState }) {
  const warnings = [...owner.warnings, ...counterparty.warnings];

  if (warnings.length === 0) {
    return null;
  }

  return (
    <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
      {warnings.map((warning) => (
        <p key={warning}>{warning}</p>
      ))}
    </div>
  );
}

function ResultsPanel({
  result,
  proofSignature,
  cluster
}: {
  result: PsiRunResult | null;
  proofSignature: string;
  cluster: string;
}) {
  if (!result) {
    return (
      <section className="surface rounded-lg p-5 sm:p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-lagoon text-white">
            <Fingerprint size={20} aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-lg font-black text-ink">Matches appear here</h2>
            <p className="text-sm text-ink/62">Only masked labels and commitments are shown after a run.</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="surface rounded-lg p-5 sm:p-6">
      <div className="flex flex-col gap-4 border-b border-ink/10 pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-fern">Intersection result</p>
          <h2 className="mt-1 text-2xl font-black text-ink">
            {result.matchCount} mutual friend{result.matchCount === 1 ? "" : "s"}
          </h2>
        </div>
        <div className="rounded-md border border-ink/10 bg-cloud px-3 py-2 text-sm font-bold text-ink">
          Run {result.runId}
        </div>
      </div>

      {result.matches.length > 0 ? (
        <div className="mt-5 overflow-hidden rounded-lg border border-ink/10">
          <div className="grid grid-cols-[1.2fr_0.8fr_1fr] bg-ink px-3 py-2 text-xs font-bold uppercase text-white">
            <span>Local match</span>
            <span>Kind</span>
            <span>Commitment</span>
          </div>
          {result.matches.map((match) => (
            <div
              key={match.hash}
              className="grid grid-cols-[1.2fr_0.8fr_1fr] items-center gap-2 border-t border-ink/10 px-3 py-3 text-sm"
            >
              <span className="font-bold text-ink">{match.ownerContact.maskedLabel}</span>
              <span className="capitalize text-ink/65">{match.counterpartyKind}</span>
              <span className="font-mono text-xs text-ink/62">{shortHash(match.hash)}</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-5 rounded-lg border border-ink/10 bg-cloud p-5 text-sm font-semibold text-ink/65">
          No overlap found. The app still generated private set commitments for proof logging.
        </div>
      )}

      <div className="mt-5 grid gap-3 text-sm md:grid-cols-3">
        <Commitment label="Your set" value={result.ownerCommitment} />
        <Commitment label="Network set" value={result.counterpartyCommitment} />
        <Commitment label="Result" value={result.resultCommitment} />
      </div>

      {proofSignature ? (
        <a
          className="focus-ring mt-5 inline-flex min-h-11 items-center gap-2 rounded-md bg-mint px-4 py-2 text-sm font-bold text-fern hover:bg-mint/75"
          href={explorerUrl(proofSignature, cluster)}
          target="_blank"
          rel="noreferrer"
        >
          <CheckCircle2 size={17} aria-hidden="true" />
          View Solana proof
        </a>
      ) : null}
    </section>
  );
}

function Commitment({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-ink/10 bg-cloud p-3">
      <span className="block text-xs font-bold uppercase text-ink/45">{label}</span>
      <span className="mt-2 block break-all font-mono text-xs text-ink/72">{shortHash(value, 10, 8)}</span>
    </div>
  );
}

function PrivacyStep({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="flex gap-3 rounded-md border border-ink/10 bg-cloud p-3">
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-white text-fern">{icon}</div>
      <div>
        <h3 className="font-bold text-ink">{title}</h3>
        <p className="mt-1 text-sm leading-6 text-ink/65">{body}</p>
      </div>
    </div>
  );
}

function MetricsPanel({
  owner,
  counterparty,
  result
}: {
  owner: ContactRecord[];
  counterparty: ContactRecord[];
  result: PsiRunResult | null;
}) {
  const metrics = [
    { label: "Your set", value: owner.length },
    { label: "Network set", value: counterparty.length },
    { label: "Matches", value: result?.matchCount ?? 0 }
  ];

  return (
    <section className="surface rounded-lg p-5">
      <h2 className="text-lg font-black text-ink">Run summary</h2>
      <div className="mt-4 grid gap-3">
        {metrics.map((metric) => (
          <div key={metric.label} className="flex items-center justify-between rounded-md border border-ink/10 bg-cloud px-3 py-2">
            <span className="text-sm font-semibold text-ink/62">{metric.label}</span>
            <span className="text-xl font-black text-ink">{metric.value}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function explorerUrl(signature: string, cluster: string) {
  if (cluster === "mainnet-beta") {
    return `https://explorer.solana.com/tx/${signature}`;
  }

  return `https://explorer.solana.com/tx/${signature}?cluster=${cluster}`;
}
