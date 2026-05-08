export type ArciumPsiConfig = {
  programId?: string;
  clusterOffset?: string;
  computationName: string;
};

export type ArciumPreparedInput = {
  clientPublicKey: number[];
  nonce: number[];
  encryptedContactHashes: number[][];
};

export function getArciumPsiConfig(): ArciumPsiConfig {
  return {
    programId: process.env.NEXT_PUBLIC_ARCIUM_PROGRAM_ID,
    clusterOffset: process.env.NEXT_PUBLIC_ARCIUM_CLUSTER_OFFSET,
    computationName: process.env.NEXT_PUBLIC_ARCIUM_COMPUTATION_NAME || "private_friend_intersection"
  };
}

export function isArciumConfigured(config = getArciumPsiConfig()) {
  return Boolean(config.programId && config.clusterOffset && config.computationName);
}
