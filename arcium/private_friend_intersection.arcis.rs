//! Starter sketch for the Arcium private friend finder circuit.
//! This file documents the intended MPC shape; wire it into an Anchor/Arcis
//! project before compiling.

use arcis::*;

const MAX_CONTACTS: usize = 256;
const MAX_MATCHES: usize = 64;

#[encrypted]
mod private_friend_finder {
    use super::*;

    pub struct ContactSet {
        pub values: [u128; MAX_CONTACTS],
        pub len: u16,
    }

    pub struct MatchResult {
        pub matches: [u128; MAX_MATCHES],
        pub count: u16,
    }

    #[instruction]
    pub fn private_friend_intersection(
        user_contacts: Enc<Shared, ContactSet>,
        registry_contacts: Enc<Mxe, ContactSet>,
    ) -> Enc<Shared, MatchResult> {
        let user = user_contacts.to_arcis();
        let registry = registry_contacts.to_arcis();
        let mut out = MatchResult {
            matches: [0u128; MAX_MATCHES],
            count: 0u16,
        };

        for user_index in 0..MAX_CONTACTS {
            for registry_index in 0..MAX_CONTACTS {
                let user_in_range = (user_index as u16) < user.len;
                let registry_in_range = (registry_index as u16) < registry.len;
                let is_match = user.values[user_index] == registry.values[registry_index];
                let can_write = out.count < (MAX_MATCHES as u16);

                if user_in_range & registry_in_range & is_match & can_write {
                    out.matches[out.count as usize] = user.values[user_index];
                    out.count += 1;
                }
            }
        }

        user_contacts.owner.from_arcis(out)
    }
}
