export type ContactKind = "email" | "phone";

export type ContactRecord = {
  id: string;
  rowNumber: number;
  name?: string;
  email?: string;
  phone?: string;
  kind: ContactKind;
  normalizedValue: string;
  matchKey: string;
  maskedLabel: string;
};

export type ParseContactsResult = {
  contacts: ContactRecord[];
  droppedRows: number;
  warnings: string[];
  sourceName: string;
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function parseContactCsv(text: string, sourceName = "contacts.csv"): ParseContactsResult {
  const rows = parseCsvRows(text).filter((row) => row.some((cell) => cell.trim().length > 0));
  const warnings: string[] = [];

  if (rows.length === 0) {
    return { contacts: [], droppedRows: 0, warnings: ["No rows found."], sourceName };
  }

  const header = detectHeader(rows[0]);
  const dataRows = header.hasHeader ? rows.slice(1) : rows;
  const contacts: ContactRecord[] = [];
  let droppedRows = 0;

  dataRows.forEach((row, index) => {
    const rowNumber = header.hasHeader ? index + 2 : index + 1;
    const extracted = extractContact(row, header);

    if (!extracted) {
      droppedRows += 1;
      return;
    }

    const id = `${sourceName}:${rowNumber}:${extracted.kind}:${extracted.normalizedValue}`;
    contacts.push({
      id,
      rowNumber,
      name: extracted.name,
      email: extracted.email,
      phone: extracted.phone,
      kind: extracted.kind,
      normalizedValue: extracted.normalizedValue,
      matchKey: `${extracted.kind}:${extracted.normalizedValue}`,
      maskedLabel:
        extracted.kind === "email"
          ? maskEmail(extracted.normalizedValue)
          : maskPhone(extracted.normalizedValue)
    });
  });

  const deduped = dedupeContacts(contacts);
  const duplicateCount = contacts.length - deduped.length;

  if (duplicateCount > 0) {
    warnings.push(`${duplicateCount} duplicate contact${duplicateCount === 1 ? "" : "s"} collapsed locally.`);
  }

  return { contacts: deduped, droppedRows, warnings, sourceName };
}

export function contactsToCsv(contacts: Array<{ name: string; email: string; phone: string }>) {
  const rows = [["name", "email", "phone"], ...contacts.map((contact) => [contact.name, contact.email, contact.phone])];
  return rows.map((row) => row.map(escapeCsvCell).join(",")).join("\n");
}

function parseCsvRows(text: string) {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];

    if (char === "\"") {
      if (inQuotes && next === "\"") {
        cell += "\"";
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      row.push(cell.trim());
      cell = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") {
        index += 1;
      }
      row.push(cell.trim());
      rows.push(row);
      row = [];
      cell = "";
      continue;
    }

    cell += char;
  }

  row.push(cell.trim());
  rows.push(row);

  return rows;
}

function detectHeader(row: string[]) {
  const normalized = row.map((cell) => cell.toLowerCase().trim());
  const emailIndex = normalized.findIndex((cell) => ["email", "e-mail", "mail"].some((label) => cell.includes(label)));
  const phoneIndex = normalized.findIndex((cell) =>
    ["phone", "mobile", "cell", "telephone", "tel"].some((label) => cell.includes(label))
  );
  const nameIndex = normalized.findIndex((cell) => ["name", "full name", "contact"].some((label) => cell.includes(label)));
  const hasHeader = emailIndex >= 0 || phoneIndex >= 0 || nameIndex >= 0;

  return { hasHeader, emailIndex, phoneIndex, nameIndex };
}

function extractContact(
  row: string[],
  header: ReturnType<typeof detectHeader>
): Pick<ContactRecord, "email" | "phone" | "kind" | "name" | "normalizedValue"> | null {
  const name = getCell(row, header.nameIndex) || findNameCandidate(row);
  const headerEmail = normalizeEmail(getCell(row, header.emailIndex));
  const headerPhone = normalizePhone(getCell(row, header.phoneIndex));
  const scannedEmail = row.map(normalizeEmail).find(Boolean);
  const scannedPhone = row.map(normalizePhone).find(Boolean);
  const email = headerEmail || scannedEmail;
  const phone = headerPhone || scannedPhone;

  if (email) {
    return { email, phone, name, kind: "email", normalizedValue: email };
  }

  if (phone) {
    return { phone, name, kind: "phone", normalizedValue: phone };
  }

  return null;
}

function getCell(row: string[], index: number) {
  if (index < 0) {
    return undefined;
  }

  return row[index]?.trim() || undefined;
}

function normalizeEmail(value?: string) {
  if (!value) {
    return undefined;
  }

  const email = value.trim().toLowerCase();
  return emailPattern.test(email) ? email : undefined;
}

function normalizePhone(value?: string) {
  if (!value) {
    return undefined;
  }

  const digits = value.replace(/\D/g, "");

  if (digits.length < 7) {
    return undefined;
  }

  return digits.startsWith("00") ? digits.slice(2) : digits;
}

function findNameCandidate(row: string[]) {
  const candidate = row.find((cell) => cell && !normalizeEmail(cell) && !normalizePhone(cell));
  return candidate?.trim() || undefined;
}

function dedupeContacts(contacts: ContactRecord[]) {
  const seen = new Set<string>();
  const deduped: ContactRecord[] = [];

  contacts.forEach((contact) => {
    if (seen.has(contact.matchKey)) {
      return;
    }

    seen.add(contact.matchKey);
    deduped.push(contact);
  });

  return deduped;
}

function maskEmail(email: string) {
  const [name, domain] = email.split("@");
  const visible = name.slice(0, 2).padEnd(Math.min(2, name.length), "*");
  return `${visible}${name.length > 2 ? "***" : "*"}@${domain}`;
}

function maskPhone(phone: string) {
  const suffix = phone.slice(-4);
  return `***-***-${suffix}`;
}

function escapeCsvCell(value: string) {
  if (!/[",\n\r]/.test(value)) {
    return value;
  }

  return `"${value.replace(/"/g, "\"\"")}"`;
}
