import type { ContactRecord } from "@/lib/contacts";

export type HashedContact = {
  contact: ContactRecord;
  hash: string;
};

export async function hashContact(contact: ContactRecord) {
  return sha256Hex(`private-friend-finder:v1:${contact.matchKey}`);
}

export async function hashContacts(contacts: ContactRecord[]) {
  return Promise.all(
    contacts.map(async (contact) => ({
      contact,
      hash: await hashContact(contact)
    }))
  );
}

export async function createSetCommitment(hashes: string[]) {
  return sha256Hex(`set:v1:${hashes.slice().sort().join("|")}`);
}

export async function createResultCommitment(matchHashes: string[]) {
  return sha256Hex(`result:v1:${matchHashes.slice().sort().join("|")}`);
}

export async function sha256Hex(value: string) {
  const encoded = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", encoded);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function shortHash(hash: string, prefix = 7, suffix = 5) {
  return `${hash.slice(0, prefix)}...${hash.slice(-suffix)}`;
}

export function randomRunId() {
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  return [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}
