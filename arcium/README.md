# Arcium PSI Notes

This folder documents the intended Arcium circuit for the hackathon build. The frontend is already structured so the local PSI simulator can be swapped for a deployed Arcium computation.

## Target Computation

`private_friend_intersection`

Inputs:

- user encrypted set: fixed-size array of contact hash scalars
- registry encrypted set: fixed-size array of registered friend hash scalars
- public lengths or padded lengths

Output:

- encrypted match count
- encrypted bounded list of matching hash commitments

The frontend should decrypt the result with the client-side key material and display only masked local labels for hashes that matched.

## Why Hash Before Arcium?

Emails and phone numbers should not become raw circuit inputs. The browser normalizes and hashes contact identifiers first, then maps those hashes into field elements for the Arcium circuit. The circuit only sees encrypted scalar values.

## Live Integration Checklist

1. Build the Arcis encrypted instruction.
2. Generate callback account/types with Arcium tooling.
3. Deploy the Anchor program to Solana devnet.
4. Upload and finalize the computation definition.
5. Add generated IDL/types to `lib/arcium/`.
6. Implement `submitArciumPsiComputation` in `lib/arcium/client.ts`.
7. Set the public env vars in `.env.local`.

The current `private_friend_intersection.arcis.rs` file is a starter sketch, not a compiled program.
