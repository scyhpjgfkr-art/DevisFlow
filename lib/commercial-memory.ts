export type CommercialMemoryImportRow = {
  rowNumber: number;
  values: Record<string, string>;
};

export type CommercialMemoryMapping = Record<string, string>;

export type CommercialMemoryHeaderCandidate = {
  rowNumber: number;
  score: number;
  values: string[];
  matchedKeywords: string[];
};

export type CommercialMemoryParsedFile = {
  headers: string[];
  rows: CommercialMemoryImportRow[];
  matrix: string[][];
  detectedHeaderRow: number;
  headerCandidates: CommercialMemoryHeaderCandidate[];
};

export type CommercialMemoryPreviewRow = {
  rowNumber: number;
  valid: boolean;
  duplicate: boolean;
  errors: string[];
  payload: Record<string, string | number | null>;
};

export type CommercialMemoryReport = {
  imported: number;
  ignored: number;
  errors: string[];
};

export type CommercialMemoryLine = {
  id?: string;
  importId?: string;
  documentNumero: string;
  documentType: "facture" | "devis" | "catalogue" | "autre";
  documentDate: string;
  clientNom: string;
  clientSociete: string;
  clientEmail: string;
  produitReference: string;
  produitNom: string;
  designation: string;
  categorie: string;
  quantite: number;
  prixUnitaireHT: number;
  montantHT: number;
  fingerprint: string;
};

export type CommercialMemoryCatalogItem = {
  key: string;
  nom: string;
  reference: string;
  categorie: string;
  ventes: number;
  quantiteTotale: number;
  prixMin: number;
  prixMax: number;
  prixMoyen: number;
  prixMedian: number;
  dernierPrix: number;
  derniereDate: string;
};

export type CommercialMemoryClientItem = {
  key: string;
  nom: string;
  societe: string;
  email: string;
  commandes: number;
  chiffreAffairesHT: number;
  panierMoyenHT: number;
  derniereCommande: string;
  produitsPrincipaux: string[];
};

export type PriceSuggestion = {
  suggestedPrice: number;
  confidence: "Élevée" | "Moyenne" | "Faible";
  matchesCount: number;
  medianPrice: number;
  minPrice: number;
  maxPrice: number;
  lastPrice: number;
  lastDate: string;
  reason: string;
  examples: CommercialMemoryLine[];
};

export const COMMERCIAL_MEMORY_FIELDS: {
  key: string;
  label: string;
  required?: boolean;
}[] = [
  { key: "documentNumero", label: "N° document" },
  { key: "documentType", label: "Type document" },
  { key: "documentDate", label: "Date document" },
  { key: "clientNom", label: "Nom client" },
  { key: "clientSociete", label: "Société client" },
  { key: "clientEmail", label: "Email client" },
  { key: "produitReference", label: "Référence produit" },
  { key: "produitNom", label: "Nom produit" },
  { key: "designation", label: "Désignation", required: true },
  { key: "categorie", label: "Catégorie" },
  { key: "quantite", label: "Quantité" },
  { key: "prixUnitaireHT", label: "Prix unitaire HT" },
  { key: "montantHT", label: "Montant HT" },
];

const COMMERCIAL_MEMORY_ALIASES: Record<string, string[]> = {
  documentNumero: [
    "numero",
    "numéro",
    "numero facture",
    "n facture",
    "n° facture",
    "facture",
    "devis",
    "numero devis",
    "document",
  ],
  documentType: ["type", "type document", "document type"],
  documentDate: ["date", "date facture", "date devis", "date document"],
  clientNom: ["client", "nom client", "nom", "contact"],
  clientSociete: ["societe", "société", "entreprise", "raison sociale", "company"],
  clientEmail: ["email", "mail", "email client", "courriel"],
  produitReference: ["reference", "référence", "ref", "sku", "code"],
  produitNom: ["produit", "prestation", "service", "nom produit", "nom"],
  designation: ["designation", "désignation", "libelle", "libellé", "description", "details"],
  categorie: ["categorie", "catégorie", "famille", "category"],
  quantite: ["quantite", "quantité", "qte", "qté", "qty"],
  prixUnitaireHT: [
    "prix unitaire",
    "prix unitaire ht",
    "pu",
    "pu ht",
    "tarif",
    "prix",
  ],
  montantHT: ["montant", "montant ht", "total ht", "ligne ht", "total ligne"],
};

function normalizeKey(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeText(value: string) {
  return normalizeKey(value).replace(/[^a-z0-9]+/g, " ").trim();
}

function parseCsv(text: string) {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const nextChar = text[index + 1];

    if (char === '"' && inQuotes && nextChar === '"') {
      cell += '"';
      index += 1;
      continue;
    }

    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if ((char === "," || char === ";") && !inQuotes) {
      row.push(cell.trim());
      cell = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && nextChar === "\n") index += 1;
      row.push(cell.trim());
      if (row.some(Boolean)) rows.push(row);
      row = [];
      cell = "";
      continue;
    }

    cell += char;
  }

  row.push(cell.trim());
  if (row.some(Boolean)) rows.push(row);

  return rows;
}

function normalizeMatrix(matrix: unknown[][]) {
  return matrix.map((row) =>
    row.map((cell) => String(cell ?? "").trim())
  );
}

function uniqueHeaderName(header: string, existing: string[]) {
  if (!existing.includes(header)) return header;

  let index = 2;
  let candidate = `${header} (${index})`;
  while (existing.includes(candidate)) {
    index += 1;
    candidate = `${header} (${index})`;
  }
  return candidate;
}

function scoreHeaderRow(row: string[]) {
  const nonEmptyCells = row
    .map((cell) => normalizeText(cell))
    .filter(Boolean);
  const matched = new Set<string>();
  let score = 0;

  const has = (patterns: RegExp[]) =>
    nonEmptyCells.some((cell) => patterns.some((pattern) => pattern.test(cell)));

  if (has([/\breference\b/, /^ref$/, /\bref\b/])) {
    matched.add("Référence");
    score += 3;
  }

  if (has([/\bdesignation\b/, /\blibelle\b/, /\bdescription\b/, /\bdetail\b/])) {
    matched.add("Désignation");
    score += 5;
  }

  if (has([/\bquantite\b/, /^qte$/, /\bqte\b/, /^qty$/])) {
    matched.add("Quantité");
    score += 4;
  }

  if (has([/\bprix\b/, /^pu$/, /\bpu\b/, /\btarif\b/])) {
    matched.add("Prix");
    score += 4;
  }

  if (has([/\bmontant\b/, /\btotal\b/])) {
    matched.add("Montant");
    score += 4;
  }

  if (has([/^ht$/, /\bht\b/])) {
    matched.add("HT");
    score += 1;
  }

  if (matched.size >= 3) score += matched.size * 2;
  if (matched.has("Désignation") && (matched.has("Prix") || matched.has("Montant"))) {
    score += 3;
  }
  if (nonEmptyCells.length >= 4) score += 1;
  if (nonEmptyCells.length <= 1 && score < 6) score = 0;

  return {
    score,
    matchedKeywords: [...matched],
  };
}

function detectHeaderCandidates(matrix: string[][]) {
  const candidates = matrix
    .slice(0, 30)
    .map((row, index) => {
      const values = row.map((cell) => cell.trim()).filter(Boolean);
      const { score, matchedKeywords } = scoreHeaderRow(row);

      return {
        rowNumber: index + 1,
        score,
        values,
        matchedKeywords,
      };
    })
    .filter((candidate) => candidate.values.length > 0);

  if (candidates.length === 0) return [];

  return candidates;
}

function detectedHeaderRowFromCandidates(
  candidates: CommercialMemoryHeaderCandidate[]
) {
  if (candidates.length === 0) return 1;

  const scored = candidates.filter((candidate) => candidate.score > 0);
  const source = scored.length > 0 ? scored : candidates;
  const best = source.reduce((selected, candidate) =>
    candidate.score > selected.score ? candidate : selected
  );

  return best.rowNumber;
}

export function rowsFromCommercialMemoryMatrix(
  matrix: string[][],
  headerRowNumber: number
): {
  headers: string[];
  rows: CommercialMemoryImportRow[];
} {
  const headerRowIndex = Math.max(headerRowNumber - 1, 0);
  const headerCells = (matrix[headerRowIndex] || [])
    .map((header, columnIndex) => ({
      header: String(header || "").trim(),
      columnIndex,
    }))
    .filter((cell) => cell.header);
  const headers: string[] = [];
  const columns = headerCells.map((cell) => {
    const header = uniqueHeaderName(cell.header, headers);
    headers.push(header);

    return {
      ...cell,
      header,
    };
  });

  return {
    headers,
    rows: matrix
      .slice(headerRowIndex + 1)
      .map((cells, index) => ({
        rowNumber: headerRowIndex + index + 2,
        values: columns.reduce<Record<string, string>>((acc, column) => {
          acc[column.header] = String(cells[column.columnIndex] || "").trim();
          return acc;
        }, {}),
      }))
      .filter((row) => Object.values(row.values).some(Boolean)),
  };
}

function matrixToRows(matrix: unknown[][]): CommercialMemoryParsedFile {
  const normalizedMatrix = normalizeMatrix(matrix);
  const headerCandidates = detectHeaderCandidates(normalizedMatrix);
  const detectedHeaderRow = detectedHeaderRowFromCandidates(headerCandidates);
  const { headers, rows } = rowsFromCommercialMemoryMatrix(
    normalizedMatrix,
    detectedHeaderRow
  );

  return {
    headers,
    rows,
    matrix: normalizedMatrix,
    detectedHeaderRow,
    headerCandidates,
  };
}

export async function rowsFromCommercialMemoryFile(
  file: File
): Promise<CommercialMemoryParsedFile> {
  const extension = file.name.split(".").pop()?.toLowerCase();

  if (extension === "csv") {
    return matrixToRows(parseCsv(await file.text()));
  }

  if (extension === "xlsx") {
    const XLSX = await import("xlsx");
    const workbook = XLSX.read(await file.arrayBuffer(), {
      type: "array",
      cellDates: true,
    });
    const firstSheetName = workbook.SheetNames[0];
    const sheet = firstSheetName ? workbook.Sheets[firstSheetName] : null;

    if (!sheet) {
      return {
        headers: [],
        rows: [],
        matrix: [],
        detectedHeaderRow: 1,
        headerCandidates: [],
      };
    }

    const matrix = XLSX.utils.sheet_to_json(sheet, {
      header: 1,
      raw: false,
      defval: "",
    }) as unknown[][];

    return matrixToRows(matrix);
  }

  throw new Error("Format non supporté. Utilise un fichier CSV ou XLSX.");
}

export function detectCommercialMemoryMapping(
  headers: string[]
): CommercialMemoryMapping {
  return COMMERCIAL_MEMORY_FIELDS.reduce<CommercialMemoryMapping>((mapping, field) => {
    const aliases = [
      field.label,
      field.key,
      ...(COMMERCIAL_MEMORY_ALIASES[field.key] || []),
    ];
    const accepted = aliases.map(normalizeKey);
    const acceptedText = aliases.map(normalizeText).filter(Boolean);
    const header = headers.find((candidate) => {
      const normalized = normalizeKey(candidate);
      const normalizedText = normalizeText(candidate);

      return (
        accepted.includes(normalized) ||
        acceptedText.includes(normalizedText) ||
        acceptedText.some(
          (alias) =>
            alias.length > 2 &&
            (normalizedText.includes(alias) || alias.includes(normalizedText))
        )
      );
    });

    mapping[field.key] = header || "";
    return mapping;
  }, {});
}

function mappedValue(
  row: CommercialMemoryImportRow,
  mapping: CommercialMemoryMapping,
  key: string
) {
  const header = mapping[key];
  return header ? row.values[header]?.trim() || "" : "";
}

function parseNumber(value: string) {
  const normalized = value
    .replace(/[€\u00a0\s]/g, "")
    .replace(",", ".")
    .trim();

  if (!normalized) return NaN;

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : NaN;
}

function normalizeDocumentType(value: string): CommercialMemoryLine["documentType"] {
  const normalized = normalizeKey(value);
  if (normalized.includes("devis")) return "devis";
  if (normalized.includes("catalogue")) return "catalogue";
  if (normalized.includes("facture")) return "facture";
  return normalized ? "autre" : "facture";
}

function normalizeDate(value: string) {
  if (!value.trim()) return "";

  const direct = new Date(value);
  if (!Number.isNaN(direct.getTime())) {
    return direct.toISOString().slice(0, 10);
  }

  const match = value.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/);
  if (!match) return "";

  const [, day, month, year] = match;
  const fullYear = year.length === 2 ? `20${year}` : year;
  const date = new Date(Number(fullYear), Number(month) - 1, Number(day));
  return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10);
}

function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}

function median(values: number[]) {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? roundMoney((sorted[middle - 1] + sorted[middle]) / 2)
    : roundMoney(sorted[middle]);
}

function lineUnitPrice(line: Pick<CommercialMemoryLine, "prixUnitaireHT" | "montantHT" | "quantite">) {
  if (line.prixUnitaireHT > 0) return line.prixUnitaireHT;
  if (line.montantHT > 0 && line.quantite > 0) return line.montantHT / line.quantite;
  return 0;
}

function commercialMemoryFingerprint(
  payload: Record<string, string | number | null>
) {
  return [
    payload.document_numero,
    payload.document_date,
    payload.client_nom,
    payload.client_societe,
    payload.produit_reference,
    payload.produit_nom,
    payload.designation,
    payload.quantite,
    payload.prix_unitaire_ht,
    payload.montant_ht,
  ]
    .map((value) => normalizeText(String(value || "")))
    .join("|")
    .slice(0, 600);
}

export function buildCommercialMemoryPreview(
  rows: CommercialMemoryImportRow[],
  mapping: CommercialMemoryMapping,
  existingLines: CommercialMemoryLine[]
): CommercialMemoryPreviewRow[] {
  const seen = new Set<string>();
  const existing = new Set(existingLines.map((line) => line.fingerprint).filter(Boolean));

  return rows.map((row) => {
    const errors: string[] = [];
    const documentNumero = mappedValue(row, mapping, "documentNumero");
    const documentType = normalizeDocumentType(mappedValue(row, mapping, "documentType"));
    const documentDate = normalizeDate(mappedValue(row, mapping, "documentDate"));
    const clientNom = mappedValue(row, mapping, "clientNom");
    const clientSociete = mappedValue(row, mapping, "clientSociete");
    const clientEmail = mappedValue(row, mapping, "clientEmail");
    const produitReference = mappedValue(row, mapping, "produitReference");
    const produitNom = mappedValue(row, mapping, "produitNom");
    const designation = mappedValue(row, mapping, "designation") || produitNom;
    const categorie = mappedValue(row, mapping, "categorie");
    const quantiteRaw = mappedValue(row, mapping, "quantite");
    const prixUnitaireRaw = mappedValue(row, mapping, "prixUnitaireHT");
    const montantRaw = mappedValue(row, mapping, "montantHT");
    const quantite = Number.isFinite(parseNumber(quantiteRaw))
      ? Math.max(parseNumber(quantiteRaw), 0)
      : 1;
    let prixUnitaireHT = parseNumber(prixUnitaireRaw);
    let montantHT = parseNumber(montantRaw);

    if (!Number.isFinite(prixUnitaireHT) && Number.isFinite(montantHT) && quantite > 0) {
      prixUnitaireHT = montantHT / quantite;
    }

    if (!Number.isFinite(montantHT) && Number.isFinite(prixUnitaireHT)) {
      montantHT = prixUnitaireHT * Math.max(quantite || 1, 1);
    }

    if (!designation.trim()) errors.push("Désignation manquante");
    if (!Number.isFinite(prixUnitaireHT) && !Number.isFinite(montantHT)) {
      errors.push("Prix ou montant HT manquant");
    }

    const payload: Record<string, string | number | null> = {
      document_numero: documentNumero,
      document_type: documentType,
      document_date: documentDate || null,
      client_nom: clientNom,
      client_societe: clientSociete,
      client_email: clientEmail,
      produit_reference: produitReference,
      produit_nom: produitNom || designation,
      designation,
      categorie,
      quantite: Number.isFinite(quantite) && quantite > 0 ? quantite : 1,
      prix_unitaire_ht: Number.isFinite(prixUnitaireHT)
        ? roundMoney(prixUnitaireHT)
        : null,
      montant_ht: Number.isFinite(montantHT) ? roundMoney(montantHT) : null,
      source_ligne: row.rowNumber,
    };
    const fingerprint = commercialMemoryFingerprint(payload);
    const duplicate = existing.has(fingerprint) || seen.has(fingerprint);
    seen.add(fingerprint);

    return {
      rowNumber: row.rowNumber,
      valid: errors.length === 0,
      duplicate,
      errors,
      payload: {
        ...payload,
        fingerprint,
      },
    };
  });
}

export function mapCommercialMemoryLineRow(row: Record<string, unknown>): CommercialMemoryLine {
  return {
    id: String(row.id || ""),
    importId: String(row.import_id || ""),
    documentNumero: String(row.document_numero || ""),
    documentType: normalizeDocumentType(String(row.document_type || "facture")),
    documentDate: String(row.document_date || ""),
    clientNom: String(row.client_nom || ""),
    clientSociete: String(row.client_societe || ""),
    clientEmail: String(row.client_email || ""),
    produitReference: String(row.produit_reference || ""),
    produitNom: String(row.produit_nom || ""),
    designation: String(row.designation || ""),
    categorie: String(row.categorie || ""),
    quantite: Number(row.quantite || 1),
    prixUnitaireHT: Number(row.prix_unitaire_ht || 0),
    montantHT: Number(row.montant_ht || 0),
    fingerprint: String(row.fingerprint || ""),
  };
}

function catalogKey(line: CommercialMemoryLine) {
  const reference = normalizeText(line.produitReference);
  if (reference) return `ref:${reference}`;
  return `name:${normalizeText(line.produitNom || line.designation)}`;
}

export function buildCommercialMemoryCatalog(
  lines: CommercialMemoryLine[]
): CommercialMemoryCatalogItem[] {
  const groups = new Map<string, CommercialMemoryLine[]>();

  lines.forEach((line) => {
    const key = catalogKey(line);
    const group = groups.get(key) || [];
    group.push(line);
    groups.set(key, group);
  });

  return [...groups.entries()]
    .map(([key, group]) => {
      const prices = group
        .map(lineUnitPrice)
        .filter((value) => Number.isFinite(value) && value > 0)
        .map(roundMoney);
      const sortedByDate = [...group].sort((a, b) =>
        (b.documentDate || "").localeCompare(a.documentDate || "")
      );
      const last = sortedByDate.find((line) => lineUnitPrice(line) > 0) || sortedByDate[0];
      const lastPrice = last ? lineUnitPrice(last) : 0;

      return {
        key,
        nom: group[0]?.produitNom || group[0]?.designation || "Produit historique",
        reference: group[0]?.produitReference || "",
        categorie: group.find((line) => line.categorie)?.categorie || "",
        ventes: group.length,
        quantiteTotale: roundMoney(
          group.reduce((sum, line) => sum + Number(line.quantite || 0), 0)
        ),
        prixMin: prices.length ? Math.min(...prices) : 0,
        prixMax: prices.length ? Math.max(...prices) : 0,
        prixMoyen: prices.length
          ? roundMoney(prices.reduce((sum, price) => sum + price, 0) / prices.length)
          : 0,
        prixMedian: median(prices),
        dernierPrix: roundMoney(lastPrice),
        derniereDate: last?.documentDate || "",
      };
    })
    .sort((a, b) => b.ventes - a.ventes);
}

function clientKey(line: CommercialMemoryLine) {
  const email = normalizeText(line.clientEmail);
  if (email) return `email:${email}`;
  return `client:${normalizeText(line.clientSociete || line.clientNom || "client inconnu")}`;
}

export function buildCommercialMemoryClients(
  lines: CommercialMemoryLine[]
): CommercialMemoryClientItem[] {
  const groups = new Map<string, CommercialMemoryLine[]>();

  lines.forEach((line) => {
    const key = clientKey(line);
    const group = groups.get(key) || [];
    group.push(line);
    groups.set(key, group);
  });

  return [...groups.entries()]
    .map(([key, group]) => {
      const documents = new Set(
        group.map((line) => line.documentNumero || line.fingerprint).filter(Boolean)
      );
      const total = group.reduce((sum, line) => sum + Number(line.montantHT || 0), 0);
      const products = group.reduce<Record<string, number>>((acc, line) => {
        const name = line.produitNom || line.designation || "Produit";
        acc[name] = (acc[name] || 0) + 1;
        return acc;
      }, {});

      return {
        key,
        nom: group[0]?.clientNom || "",
        societe: group[0]?.clientSociete || "",
        email: group[0]?.clientEmail || "",
        commandes: documents.size || group.length,
        chiffreAffairesHT: roundMoney(total),
        panierMoyenHT: documents.size ? roundMoney(total / documents.size) : roundMoney(total),
        derniereCommande:
          [...group].sort((a, b) => (b.documentDate || "").localeCompare(a.documentDate || ""))[0]
            ?.documentDate || "",
        produitsPrincipaux: Object.entries(products)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(([name]) => name),
      };
    })
    .sort((a, b) => b.chiffreAffairesHT - a.chiffreAffairesHT);
}

function tokens(value: string) {
  return normalizeText(value)
    .split(" ")
    .filter((token) => token.length >= 3);
}

function overlapScore(source: string[], target: string[]) {
  if (source.length === 0 || target.length === 0) return 0;
  const targetSet = new Set(target);
  const matches = source.filter((token) => targetSet.has(token)).length;
  return matches / Math.max(source.length, target.length);
}

export function suggestPriceForLine(
  line: { reference: string; designation: string; quantite: number },
  history: CommercialMemoryLine[]
): PriceSuggestion | null {
  const reference = normalizeText(line.reference);
  const designationTokens = tokens(line.designation);

  if (!reference && designationTokens.length === 0) return null;

  const scored = history
    .map((candidate) => {
      const candidateReference = normalizeText(candidate.produitReference);
      const candidateTokens = tokens(`${candidate.produitNom} ${candidate.designation}`);
      let score = overlapScore(designationTokens, candidateTokens);

      if (reference && candidateReference && reference === candidateReference) {
        score += 2;
      }

      if (line.quantite > 0 && candidate.quantite > 0) {
        const ratio =
          Math.max(line.quantite, candidate.quantite) /
          Math.max(Math.min(line.quantite, candidate.quantite), 1);
        if (ratio <= 1.5) score += 0.4;
        else if (ratio <= 3) score += 0.15;
      }

      return { candidate, score };
    })
    .filter(({ candidate, score }) => score >= 0.25 && lineUnitPrice(candidate) > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 30);

  if (scored.length === 0) return null;

  const matches = scored.map((item) => item.candidate);
  const prices = matches.map(lineUnitPrice).map(roundMoney);
  const sortedByDate = [...matches].sort((a, b) =>
    (b.documentDate || "").localeCompare(a.documentDate || "")
  );
  const medianPrice = median(prices);
  const maxScore = scored[0]?.score || 0;
  const confidence =
    matches.length >= 5 && maxScore >= 0.75
      ? "Élevée"
      : matches.length >= 3 || maxScore >= 1
      ? "Moyenne"
      : "Faible";

  return {
    suggestedPrice: medianPrice,
    confidence,
    matchesCount: matches.length,
    medianPrice,
    minPrice: Math.min(...prices),
    maxPrice: Math.max(...prices),
    lastPrice: roundMoney(lineUnitPrice(sortedByDate[0])),
    lastDate: sortedByDate[0]?.documentDate || "",
    reason:
      reference && maxScore >= 1
        ? "Référence historique similaire"
        : "Désignation proche dans l'historique",
    examples: sortedByDate.slice(0, 3),
  };
}
