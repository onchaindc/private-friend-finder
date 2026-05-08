import type { ArciumPreparedInput, ArciumPsiConfig } from "@/lib/arcium/types";

type PrepareInputArgs = {
  scalarHashes: bigint[];
};

export async function prepareArciumEncryptedInput({
  scalarHashes
}: PrepareInputArgs): Promise<ArciumPreparedInput> {
  const { RescueCipher, x25519 } = await import("@arcium-hq/client");
  const privateKey = x25519.utils.randomSecretKey();
  const clientPublicKey = x25519.getPublicKey(privateKey);

  // This uses an ephemeral local key so the UI can prepare the same encrypted
  // payload shape expected by an Arcium MXE. A deployed program must replace
  // this demo key agreement with getMXEPublicKey(provider, programId).
  const sharedSecret = x25519.getSharedSecret(privateKey, clientPublicKey);
  const cipher = new RescueCipher(sharedSecret);
  const nonce = crypto.getRandomValues(new Uint8Array(16));
  const encryptedContactHashes = cipher.encrypt(scalarHashes, nonce);

  return {
    clientPublicKey: Array.from(clientPublicKey),
    nonce: Array.from(nonce),
    encryptedContactHashes
  };
}

export async function submitArciumPsiComputation(_config: ArciumPsiConfig) {
  throw new Error(
    "Arcium live PSI requires the generated Anchor IDL and deployed private_friend_intersection MXE. See README.md and arcium/README.md."
  );
}
