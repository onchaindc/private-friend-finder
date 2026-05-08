import type { ContactRecord } from "@/lib/contacts";
import { createResultCommitment, createSetCommitment, hashContacts, randomRunId } from "@/lib/privacy";

export type PsiMatch = {
  hash: string;
  ownerContact: ContactRecord;
  counterpartyKind: ContactRecord["kind"];
};

export type PsiRunResult = {
  runId: string;
  mode: "local-simulator";
  matchCount: number;
  ownerCount: number;
  counterpartyCount: number;
  ownerCommitment: string;
  counterpartyCommitment: string;
  resultCommitment: string;
  matches: PsiMatch[];
};

export async function runLocalPrivateSetIntersection({
  ownerContacts,
  counterpartyContacts
}: {
  ownerContacts: ContactRecord[];
  counterpartyContacts: ContactRecord[];
}): Promise<PsiRunResult> {
  const [ownerHashes, counterpartyHashes] = await Promise.all([
    hashContacts(ownerContacts),
    hashContacts(counterpartyContacts)
  ]);
  const counterpartyIndex = new Map(counterpartyHashes.map((entry) => [entry.hash, entry.contact]));
  const matches: PsiMatch[] = [];
  const seenMatches = new Set<string>();

  ownerHashes.forEach((entry) => {
    const counterpartyContact = counterpartyIndex.get(entry.hash);

    if (!counterpartyContact || seenMatches.has(entry.hash)) {
      return;
    }

    seenMatches.add(entry.hash);
    matches.push({
      hash: entry.hash,
      ownerContact: entry.contact,
      counterpartyKind: counterpartyContact.kind
    });
  });

  const matchHashes = matches.map((match) => match.hash);

  return {
    runId: randomRunId(),
    mode: "local-simulator",
    matchCount: matches.length,
    ownerCount: ownerContacts.length,
    counterpartyCount: counterpartyContacts.length,
    ownerCommitment: await createSetCommitment(ownerHashes.map((entry) => entry.hash)),
    counterpartyCommitment: await createSetCommitment(counterpartyHashes.map((entry) => entry.hash)),
    resultCommitment: await createResultCommitment(matchHashes),
    matches
  };
}
