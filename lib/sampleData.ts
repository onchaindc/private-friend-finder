import { contactsToCsv } from "@/lib/contacts";

export const sampleOwnerContacts = [
  { name: "Maya Chen", email: "maya@arcium.dev", phone: "+1 415 555 0142" },
  { name: "Noah Reid", email: "noah@example.com", phone: "+1 415 555 0160" },
  { name: "Rafael Okafor", email: "rafael@solana.dev", phone: "+234 801 555 0198" },
  { name: "Priya Shah", email: "priya@example.org", phone: "+44 7700 900123" },
  { name: "Sam Rivera", email: "sam@builder.test", phone: "+1 212 555 0181" }
];

export const sampleCounterpartyContacts = [
  { name: "Maya C.", email: "maya@arcium.dev", phone: "+1 415 555 0142" },
  { name: "Ife Adeyemi", email: "ife@example.net", phone: "+234 802 555 0111" },
  { name: "Rafael O.", email: "rafael@solana.dev", phone: "+234 801 555 0198" },
  { name: "Zoe Park", email: "zoe@example.io", phone: "+1 646 555 0194" }
];

export const sampleOwnerCsv = contactsToCsv(sampleOwnerContacts);
export const sampleCounterpartyCsv = contactsToCsv(sampleCounterpartyContacts);
