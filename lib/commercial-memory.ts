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

export type CommercialMemoryDocumentMetadata = {
  documentNumero: string;
  documentType: "facture" | "devis" | "catalogue" | "autre";
  documentDate: string;
  clientNom: string;
  clientSociete: string;
  clientEmail: string;
  commande: string;
  affaire: string;
  bl: string;
  totalHTDocument: number;
  tvaMontant: number;
  totalTTCDocument: number;
};

export type CommercialMemoryParsedFile = {
  headers: string[];
  rows: CommercialMemoryImportRow[];
  matrix: string[][];
  detectedHeaderRow: number;
  headerCandidates: CommercialMemoryHeaderCandidate[];
  metadata: CommercialMemoryDocumentMetadata;
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
  descriptionComplete: string;
  categorie: string;
  familleProduit: string;
  commande: string;
  affaire: string;
  bl: string;
  quantite: number;
  prixUnitaireHT: number;
  montantHT: number;
  totalHTDocument: number;
  tvaMontant: number;
  totalTTCDocument: number;
  dateFacture: string;
  numeroFacture: string;
  clientDetecte: string;
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
  premierPrix: number;
  premiereDate: string;
  dernierPrix: number;
  derniereDate: string;
};

export type CommercialMemoryClientLastPrice = {
  produit: string;
  prix: number;
  date: string;
  documentNumero: string;
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
  derniersPrix: CommercialMemoryClientLastPrice[];
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
  lastClient: string;
  lastDocumentNumero: string;
  clientMatchesCount: number;
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
  { key: "commande", label: "Commande" },
  { key: "affaire", label: "Affaire / projet" },
  { key: "bl", label: "BL" },
  { key: "clientNom", label: "Nom client" },
  { key: "clientSociete", label: "Société client" },
  { key: "clientEmail", label: "Email client" },
  { key: "produitReference", label: "Référence produit" },
  { key: "produitNom", label: "Nom produit" },
  { key: "designation", label: "Désignation", required: true },
  { key: "descriptionComplete", label: "Description complète" },
  { key: "categorie", label: "Catégorie" },
  { key: "quantite", label: "Quantité" },
  { key: "prixUnitaireHT", label: "Prix unitaire HT" },
  { key: "montantHT", label: "Montant HT" },
  { key: "totalHTDocument", label: "Total HT document" },
  { key: "tvaMontant", label: "TVA" },
  { key: "totalTTCDocument", label: "TTC" },
];

const COMMERCIAL_MEMORY_ALIASES: Record<string, string[]> = {
  documentNumero: [
    "numero",
    "numéro",
    "numero facture",
    "n facture",
    "n° facture",
    "numero devis",
  ],
  documentType: ["type", "type document", "document type"],
  documentDate: ["date", "date facture", "date devis", "date document"],
  commande: ["commande", "n commande", "n° commande", "votre commande"],
  affaire: ["affaire", "projet", "chantier", "dossier"],
  bl: ["bl", "bon livraison", "bon de livraison"],
  clientNom: ["client", "nom client", "nom", "contact"],
  clientSociete: ["societe", "société", "entreprise", "raison sociale", "company"],
  clientEmail: ["email", "mail", "email client", "courriel"],
  produitReference: ["reference", "référence", "ref", "sku", "code"],
  produitNom: ["produit", "prestation", "service", "nom produit", "nom"],
  designation: ["designation", "désignation", "libelle", "libellé", "description", "details"],
  descriptionComplete: [
    "description complete",
    "description complète",
    "designation complete",
    "désignation complète",
    "details",
  ],
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
  totalHTDocument: ["total ht document", "total ht facture", "total ht"],
  tvaMontant: ["tva", "montant tva", "taxe"],
  totalTTCDocument: ["ttc", "total ttc", "net a payer", "net à payer"],
};

const EMPTY_DOCUMENT_METADATA: CommercialMemoryDocumentMetadata = {
  documentNumero: "",
  documentType: "facture",
  documentDate: "",
  clientNom: "",
  clientSociete: "",
  clientEmail: "",
  commande: "",
  affaire: "",
  bl: "",
  totalHTDocument: 0,
  tvaMontant: 0,
  totalTTCDocument: 0,
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

function compactText(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function uniqueTexts(values: string[]) {
  const seen = new Set<string>();
  return values
    .map(compactText)
    .filter(Boolean)
    .filter((value) => {
      const normalized = normalizeText(value);
      if (!normalized || seen.has(normalized)) return false;
      seen.add(normalized);
      return true;
    });
}

function rowText(row: string[]) {
  return compactText(row.filter(Boolean).join(" "));
}

function valueAfterLabel(text: string, label: RegExp) {
  const match = text.match(label);
  if (!match) return "";
  return compactText(match[1] || "");
}

function cleanMetadataLine(value: string) {
  return compactText(
    value
      .replace(/^[-–—:\s]+/, "")
      .replace(/\s*[:;]\s*$/, "")
  );
}

function stripFileExtension(fileName: string) {
  return fileName.replace(/\.[a-z0-9]+$/i, "");
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

function parseNumber(value: string) {
  const withoutSpaces = value
    .replace(/[€\u00a0\s]/g, "")
    .replace(/[^\d,.-]/g, "")
    .trim();

  if (!withoutSpaces) return NaN;

  const hasComma = withoutSpaces.includes(",");
  const hasDot = withoutSpaces.includes(".");
  let normalized = withoutSpaces;

  if (hasComma && hasDot) {
    normalized =
      withoutSpaces.lastIndexOf(",") > withoutSpaces.lastIndexOf(".")
        ? withoutSpaces.replace(/\./g, "").replace(",", ".")
        : withoutSpaces.replace(/,/g, "");
  } else if (hasComma) {
    normalized = withoutSpaces.replace(",", ".");
  }

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

  const trimmed = value.trim();
  const monthAliases: Record<string, number> = {
    jan: 1,
    janvier: 1,
    feb: 2,
    fev: 2,
    fevr: 2,
    fevrier: 2,
    mar: 3,
    mars: 3,
    apr: 4,
    avr: 4,
    avril: 4,
    may: 5,
    mai: 5,
    jun: 6,
    juin: 6,
    jul: 7,
    juil: 7,
    juillet: 7,
    aug: 8,
    aou: 8,
    aout: 8,
    sep: 9,
    sept: 9,
    septembre: 9,
    oct: 10,
    octobre: 10,
    nov: 11,
    novembre: 11,
    dec: 12,
    decembre: 12,
  };

  const textMonthMatch = trimmed.match(
    /^(\d{1,2})[\s./-]+([A-Za-zéûùôîïëêèàç]{3,})[\s./-]+(\d{2,4})$/i
  );

  if (textMonthMatch) {
    const [, day, monthLabel, year] = textMonthMatch;
    const month = monthAliases[normalizeText(monthLabel)];
    const fullYear = Number(year.length === 2 ? `20${year}` : year);
    if (month) {
      const date = new Date(Date.UTC(fullYear, month - 1, Number(day)));
      return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10);
    }
  }

  const direct = new Date(trimmed);
  if (!Number.isNaN(direct.getTime())) {
    return direct.toISOString().slice(0, 10);
  }

  const match = trimmed.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})$/);
  if (!match) return "";

  const [, day, month, year] = match;
  const fullYear = year.length === 2 ? `20${year}` : year;
  const date = new Date(Date.UTC(Number(fullYear), Number(month) - 1, Number(day)));
  return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10);
}

function extractDateFromText(value: string) {
  const compacted = compactText(value);
  const numericDate = compacted.match(/\b(\d{1,2}[./-]\d{1,2}[./-]\d{2,4})\b/);
  if (numericDate) return normalizeDate(numericDate[1]);

  const textDate = compacted.match(
    /\b(\d{1,2}[\s./-]+[A-Za-zéûùôîïëêèàç]{3,}[\s./-]+\d{2,4})\b/i
  );
  if (textDate) return normalizeDate(textDate[1]);

  return "";
}

function firstNumberInCells(cells: string[]) {
  for (const cell of cells) {
    const parsed = parseNumber(cell);
    if (Number.isFinite(parsed)) return parsed;
  }

  return 0;
}

function firstPositiveNumberInCells(cells: string[]) {
  return firstNumberInCells(cells.filter((cell) => parseNumber(cell) > 0));
}

function numbersInRow(row: string[]) {
  return row
    .map(parseNumber)
    .filter((value) => Number.isFinite(value));
}

function valueNearCell(matrix: string[][], rowIndex: number, columnIndex: number) {
  const row = matrix[rowIndex] || [];
  const right = row.slice(columnIndex + 1).find((cell) => cell.trim());
  if (right) return right;

  for (let index = rowIndex + 1; index < Math.min(rowIndex + 4, matrix.length); index += 1) {
    const below = matrix[index]?.[columnIndex];
    if (below?.trim()) return below;
  }

  return "";
}

function valueBelowCell(matrix: string[][], rowIndex: number, columnIndex: number) {
  for (let index = rowIndex + 1; index < Math.min(rowIndex + 5, matrix.length); index += 1) {
    const below = matrix[index]?.[columnIndex];
    if (below?.trim()) return below;
  }

  return "";
}

function valueDirectlyBelowCell(matrix: string[][], rowIndex: number, columnIndex: number) {
  return matrix[rowIndex + 1]?.[columnIndex]?.trim() || "";
}

function findNumberNearLabel(matrix: string[][], labels: RegExp[]) {
  for (let rowIndex = 0; rowIndex < matrix.length; rowIndex += 1) {
    const row = matrix[rowIndex] || [];

    for (let columnIndex = 0; columnIndex < row.length; columnIndex += 1) {
      const cell = row[columnIndex] || "";
      const normalizedCell = normalizeText(cell);
      const hasLabel = labels.some((label) => label.test(normalizedCell));

      if (!hasLabel) continue;

      const rowNumbers = numbersInRow(row.slice(columnIndex + 1)).filter(
        (value) => value > 0
      );
      if (rowNumbers.length > 0) return rowNumbers[rowNumbers.length - 1];

      const nearby = firstPositiveNumberInCells([
        valueBelowCell(matrix, rowIndex, columnIndex),
        valueNearCell(matrix, rowIndex, columnIndex),
      ]);
      if (nearby > 0) return nearby;
    }
  }

  return 0;
}

function clientFromFilename(fileName = "") {
  const withoutExtension = stripFileExtension(fileName);
  const cleaned = withoutExtension
    .replace(/facture/gi, " ")
    .replace(
      /\b(janvier|fevrier|février|mars|avril|mai|juin|juillet|aout|août|septembre|octobre|novembre|decembre|décembre)\b/gi,
      " "
    )
    .replace(/\b\d{1,4}([_\s-]+\d{1,4}){0,3}\b/g, " ")
    .replace(/[_-]+/g, " ");

  return compactText(cleaned);
}

function documentNumeroFromFilename(fileName = "") {
  const withoutExtension = stripFileExtension(fileName);
  const match =
    withoutExtension.match(/\b(\d{1,4}[\s_-]+\d{2,5})\b/) ||
    withoutExtension.match(/\b([A-Z]{1,5}[\s_-]?\d{2,6})\b/i);

  return match ? compactText(match[1].replace(/[_-]/g, " ")) : "";
}

function cleanClientCandidate(value: string) {
  const cleaned = cleanMetadataLine(value);
  const normalized = normalizeText(cleaned);
  if (
    !normalized ||
    normalized === "echeance" ||
    normalized.includes("virement") ||
    normalized.includes("reception de facture") ||
    normalized.includes("mode de reglement")
  ) {
    return "";
  }

  return cleaned;
}

function extractDocumentMetadata(
  matrix: string[][],
  fileName = ""
): CommercialMemoryDocumentMetadata {
  const metadata = { ...EMPTY_DOCUMENT_METADATA };
  const texts = matrix.map(rowText).filter(Boolean);

  for (let rowIndex = 0; rowIndex < matrix.length; rowIndex += 1) {
    const row = matrix[rowIndex] || [];
    const text = rowText(row);
    const normalized = normalizeText(text);

    if (!metadata.documentNumero) {
      const documentMatch = text.match(
        /\b(facture|devis|avoir)\s*(?:n[°o.]*|numero|numéro)\s*[:\-]?\s*([A-Z0-9][A-Z0-9\s./-]{2,})/i
      );
      if (documentMatch) {
        metadata.documentType = normalizeDocumentType(documentMatch[1]);
        metadata.documentNumero = compactText(documentMatch[2]);
      }
    }

    if (!metadata.commande) {
      const commande =
        valueAfterLabel(text, /(?:suivant\s+)?(?:votre\s+)?commande\s*(?:n[°o.]*)?\s*[:\-]?\s*(.+)$/i) ||
        valueAfterLabel(text, /(?:order|purchase order)\s*(?:n[°o.]*)?\s*[:\-]?\s*(.+)$/i);
      if (commande) metadata.commande = cleanMetadataLine(commande);
    }

    if (!metadata.affaire) {
      const affaire = valueAfterLabel(text, /(?:affaire|projet|chantier)\s*[:\-]\s*(.+)$/i);
      if (affaire) metadata.affaire = cleanMetadataLine(affaire);
    }

    if (!metadata.bl) {
      const bl = valueAfterLabel(text, /(?:\bbl\b|bon\s+de\s+livraison)\s*(?:n[°o.]*)?\s*[:\-]?\s*(.+)$/i);
      if (bl) metadata.bl = cleanMetadataLine(bl);
    }

    for (let columnIndex = 0; columnIndex < row.length; columnIndex += 1) {
      const cell = row[columnIndex] || "";
      const normalizedCell = normalizeText(cell);

      if (!metadata.documentDate && /^date$|date facture|date document/.test(normalizedCell)) {
        metadata.documentDate =
          normalizeDate(valueDirectlyBelowCell(matrix, rowIndex, columnIndex)) ||
          normalizeDate(valueNearCell(matrix, rowIndex, columnIndex));
      }

      if (!metadata.clientSociete && /^client$|societe client|société client/.test(normalizedCell)) {
        metadata.clientSociete =
          cleanClientCandidate(valueDirectlyBelowCell(matrix, rowIndex, columnIndex)) ||
          cleanClientCandidate(valueNearCell(matrix, rowIndex, columnIndex));
      }
    }

    if (!metadata.documentDate && normalized.includes("date")) {
      const maybeDate = texts
        .slice(rowIndex, rowIndex + 3)
        .flatMap((line) => [
          line,
          ...line.split(/\s{2,}|\t|;/),
        ])
        .map((line) => extractDateFromText(line) || normalizeDate(line))
        .find(Boolean);
      if (maybeDate) metadata.documentDate = maybeDate;
    }
  }

  if (!metadata.documentNumero) {
    metadata.documentNumero = documentNumeroFromFilename(fileName);
  }

  if (!metadata.documentDate) {
    metadata.documentDate = extractDateFromText(fileName);
  }

  if (!metadata.clientSociete) {
    metadata.clientSociete = clientFromFilename(fileName);
  }

  metadata.totalHTDocument = findNumberNearLabel(matrix, [
    /^total ht$/,
    /^base ht$/,
    /\btotal ht\b/,
    /\bbase ht\b/,
  ]);
  metadata.tvaMontant = findNumberNearLabel(matrix, [
    /^montant tva$/,
    /\bmontant tva\b/,
    /^tva$/,
    /^tva\b/,
  ]);
  metadata.totalTTCDocument = findNumberNearLabel(matrix, [
    /^total ttc$/,
    /\btotal ttc\b/,
    /\bnet a payer\b/,
  ]);

  return metadata;
}

function footerStartRowNumber(matrix: string[][], headerRowNumber: number) {
  for (let index = headerRowNumber; index < matrix.length; index += 1) {
    const normalized = normalizeText(rowText(matrix[index] || []));
    const isFooter =
      /\b(total ht|total ttc|base ht|montant tva|net a payer|arretee|arrete|conditions|reglement)\b/.test(
        normalized
      );

    if (isFooter) return index + 1;
  }

  return Number.POSITIVE_INFINITY;
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

function matrixToRows(matrix: unknown[][], fileName = ""): CommercialMemoryParsedFile {
  const normalizedMatrix = normalizeMatrix(matrix);
  const headerCandidates = detectHeaderCandidates(normalizedMatrix);
  const detectedHeaderRow = detectedHeaderRowFromCandidates(headerCandidates);
  const { headers, rows } = rowsFromCommercialMemoryMatrix(
    normalizedMatrix,
    detectedHeaderRow
  );
  const metadata = extractDocumentMetadata(normalizedMatrix, fileName);

  return {
    headers,
    rows,
    matrix: normalizedMatrix,
    detectedHeaderRow,
    headerCandidates,
    metadata,
  };
}

export async function rowsFromCommercialMemoryFile(
  file: File
): Promise<CommercialMemoryParsedFile> {
  const extension = file.name.split(".").pop()?.toLowerCase();

  if (extension === "csv") {
    return matrixToRows(parseCsv(await file.text()), file.name);
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
        metadata: EMPTY_DOCUMENT_METADATA,
      };
    }

    const matrix = XLSX.utils.sheet_to_json(sheet, {
      header: 1,
      raw: false,
      defval: "",
    }) as unknown[][];

    return matrixToRows(matrix, file.name);
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
            alias.length > 4 &&
            normalizedText.includes(alias)
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
    payload.client_detecte,
    payload.commande,
    payload.affaire,
    payload.bl,
    payload.produit_reference,
    payload.produit_nom,
    payload.designation,
    payload.description_complete,
    payload.quantite,
    payload.prix_unitaire_ht,
    payload.montant_ht,
  ]
    .map((value) => normalizeText(String(value || "")))
    .join("|")
    .slice(0, 600);
}

function meaningfulRowDescription(
  row: CommercialMemoryImportRow,
  mapping: CommercialMemoryMapping
) {
  const values = [
    mappedValue(row, mapping, "designation"),
    mappedValue(row, mapping, "descriptionComplete"),
    mappedValue(row, mapping, "produitNom"),
    mappedValue(row, mapping, "produitReference"),
  ];
  const direct = uniqueTexts(values).join(" / ");
  if (direct) return direct;

  return uniqueTexts(Object.values(row.values)).join(" / ");
}

function isFooterOrTotalText(value: string) {
  const normalized = normalizeText(value);
  return /\b(total ht|total ttc|base ht|montant tva|net a payer|arretee|arrete|reglement|conditions)\b/.test(
    normalized
  );
}

function isUsefulContextText(value: string) {
  const normalized = normalizeText(value);
  if (!normalized || normalized.length < 3) return false;
  if (/^\d+([,.]\d+)?$/.test(normalized)) return false;
  if (isFooterOrTotalText(value)) return false;
  return true;
}

function extractLineMetadataFromParts(
  parts: string[],
  metadata: CommercialMemoryDocumentMetadata
) {
  const joined = parts.join(" / ");
  const commande =
    metadata.commande ||
    valueAfterLabel(joined, /(?:suivant\s+)?(?:votre\s+)?commande\s*(?:n[°o.]*)?\s*[:\-]?\s*([^/]+)/i);
  const affaire =
    metadata.affaire ||
    valueAfterLabel(joined, /(?:affaire|projet|chantier)\s*[:\-]\s*([^/]+)/i);
  const bl =
    metadata.bl ||
    valueAfterLabel(joined, /(?:\bbl\b|bon\s+de\s+livraison)\s*(?:n[°o.]*)?\s*[:\-]?\s*([^/]+)/i);
  const famille =
    parts.find((part) => {
      const normalized = normalizeText(part);
      return (
        normalized.length > 4 &&
        !normalized.includes("commande") &&
        !normalized.includes("affaire") &&
        !normalized.includes("bl") &&
        !normalized.includes("article")
      );
    }) || "";

  return {
    commande: cleanMetadataLine(commande),
    affaire: cleanMetadataLine(affaire),
    bl: cleanMetadataLine(bl),
    familleProduit: compactText(famille),
  };
}

function displayNameFromDescription(value: string) {
  const parts = value
    .split("/")
    .map(compactText)
    .filter(Boolean);
  return parts[parts.length - 1] || value || "Produit historique";
}

type CommercialMemoryPreviewOptions = {
  metadata?: CommercialMemoryDocumentMetadata;
  matrix?: string[][];
  headerRowNumber?: number;
};

export function buildCommercialMemoryPreview(
  rows: CommercialMemoryImportRow[],
  mapping: CommercialMemoryMapping,
  existingLines: CommercialMemoryLine[],
  options: CommercialMemoryPreviewOptions = {}
): CommercialMemoryPreviewRow[] {
  const seen = new Set<string>();
  const existing = new Set(existingLines.map((line) => line.fingerprint).filter(Boolean));
  const metadata = options.metadata || EMPTY_DOCUMENT_METADATA;
  const footerRowNumber =
    options.matrix && options.headerRowNumber
      ? footerStartRowNumber(options.matrix, options.headerRowNumber)
      : Number.POSITIVE_INFINITY;
  const contextRows: string[] = [];
  const preview: CommercialMemoryPreviewRow[] = [];

  rows.forEach((row) => {
    if (row.rowNumber >= footerRowNumber) return;

    const errors: string[] = [];
    const documentNumero = mappedValue(row, mapping, "documentNumero") || metadata.documentNumero;
    const documentType = normalizeDocumentType(
      mappedValue(row, mapping, "documentType") || metadata.documentType
    );
    const documentDate =
      normalizeDate(mappedValue(row, mapping, "documentDate")) || metadata.documentDate;
    const clientNom = mappedValue(row, mapping, "clientNom") || metadata.clientNom;
    const clientSociete = mappedValue(row, mapping, "clientSociete") || metadata.clientSociete;
    const clientEmail = mappedValue(row, mapping, "clientEmail");
    const commande = mappedValue(row, mapping, "commande") || metadata.commande;
    const affaire = mappedValue(row, mapping, "affaire") || metadata.affaire;
    const bl = mappedValue(row, mapping, "bl") || metadata.bl;
    const produitReference = mappedValue(row, mapping, "produitReference");
    const produitNom = mappedValue(row, mapping, "produitNom");
    const designation = mappedValue(row, mapping, "designation") || produitNom;
    const mappedDescription = mappedValue(row, mapping, "descriptionComplete");
    const categorie = mappedValue(row, mapping, "categorie");
    const quantiteRaw = mappedValue(row, mapping, "quantite");
    const prixUnitaireRaw = mappedValue(row, mapping, "prixUnitaireHT");
    const montantRaw = mappedValue(row, mapping, "montantHT");
    const totalHTRaw = mappedValue(row, mapping, "totalHTDocument");
    const tvaRaw = mappedValue(row, mapping, "tvaMontant");
    const totalTTCRaw = mappedValue(row, mapping, "totalTTCDocument");
    const quantite = Number.isFinite(parseNumber(quantiteRaw))
      ? Math.max(parseNumber(quantiteRaw), 0)
      : 1;
    let prixUnitaireHT = parseNumber(prixUnitaireRaw);
    let montantHT = parseNumber(montantRaw);
    const rowDescription = meaningfulRowDescription(row, mapping);
    const hasPrice = Number.isFinite(prixUnitaireHT) || Number.isFinite(montantHT);

    if (!hasPrice) {
      if (isUsefulContextText(rowDescription)) {
        contextRows.push(rowDescription);
      }
      return;
    }

    if (!Number.isFinite(prixUnitaireHT) && Number.isFinite(montantHT) && quantite > 0) {
      prixUnitaireHT = montantHT / quantite;
    }

    if (!Number.isFinite(montantHT) && Number.isFinite(prixUnitaireHT)) {
      montantHT = prixUnitaireHT * Math.max(quantite || 1, 1);
    }

    const descriptionParts = uniqueTexts([
      ...contextRows,
      mappedDescription,
      designation,
      produitNom,
    ]);
    const descriptionComplete = descriptionParts.join(" / ") || rowDescription;
    const lineMetadata = extractLineMetadataFromParts(
      [...contextRows, mappedDescription, designation, produitNom],
      {
        ...metadata,
        commande,
        affaire,
        bl,
      }
    );
    const finalDesignation =
      designation ||
      displayNameFromDescription(descriptionComplete) ||
      produitNom ||
      produitReference;
    const finalProduitNom =
      produitNom || displayNameFromDescription(finalDesignation || descriptionComplete);
    const clientDetecte = clientSociete || clientNom || metadata.clientSociete || metadata.clientNom;

    if (!descriptionComplete.trim() && !finalDesignation.trim()) {
      errors.push("Désignation manquante");
    }
    if (!Number.isFinite(prixUnitaireHT) && !Number.isFinite(montantHT)) {
      errors.push("Prix ou montant HT manquant");
    }

    const payload: Record<string, string | number | null> = {
      document_numero: documentNumero,
      document_type: documentType,
      document_date: documentDate || null,
      numero_facture: documentNumero,
      date_facture: documentDate || null,
      client_nom: clientNom,
      client_societe: clientSociete,
      client_email: clientEmail,
      client_detecte: clientDetecte,
      commande: lineMetadata.commande || commande,
      affaire: lineMetadata.affaire || affaire,
      bl: lineMetadata.bl || bl,
      produit_reference: produitReference,
      produit_nom: finalProduitNom,
      designation: finalDesignation,
      description_complete: descriptionComplete || finalDesignation,
      categorie,
      famille_produit: categorie || lineMetadata.familleProduit,
      quantite: Number.isFinite(quantite) && quantite > 0 ? quantite : 1,
      prix_unitaire_ht: Number.isFinite(prixUnitaireHT)
        ? roundMoney(prixUnitaireHT)
        : null,
      montant_ht: Number.isFinite(montantHT) ? roundMoney(montantHT) : null,
      total_ht_document: Number.isFinite(parseNumber(totalHTRaw))
        ? roundMoney(parseNumber(totalHTRaw))
        : metadata.totalHTDocument || null,
      tva_montant: Number.isFinite(parseNumber(tvaRaw))
        ? roundMoney(parseNumber(tvaRaw))
        : metadata.tvaMontant || null,
      total_ttc_document: Number.isFinite(parseNumber(totalTTCRaw))
        ? roundMoney(parseNumber(totalTTCRaw))
        : metadata.totalTTCDocument || null,
      source_ligne: row.rowNumber,
    };
    const fingerprint = commercialMemoryFingerprint(payload);
    const duplicate = existing.has(fingerprint) || seen.has(fingerprint);
    seen.add(fingerprint);

    preview.push({
      rowNumber: row.rowNumber,
      valid: errors.length === 0,
      duplicate,
      errors,
      payload: {
        ...payload,
        fingerprint,
      },
    });

    contextRows.length = 0;
  });

  return preview;
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
    commande: String(row.commande || ""),
    affaire: String(row.affaire || ""),
    bl: String(row.bl || ""),
    produitReference: String(row.produit_reference || ""),
    produitNom: String(row.produit_nom || ""),
    designation: String(row.designation || ""),
    descriptionComplete: String(row.description_complete || row.designation || ""),
    categorie: String(row.categorie || ""),
    familleProduit: String(row.famille_produit || ""),
    quantite: Number(row.quantite || 1),
    prixUnitaireHT: Number(row.prix_unitaire_ht || 0),
    montantHT: Number(row.montant_ht || 0),
    totalHTDocument: Number(row.total_ht_document || 0),
    tvaMontant: Number(row.tva_montant || 0),
    totalTTCDocument: Number(row.total_ttc_document || 0),
    dateFacture: String(row.date_facture || row.document_date || ""),
    numeroFacture: String(row.numero_facture || row.document_numero || ""),
    clientDetecte: String(row.client_detecte || row.client_societe || row.client_nom || ""),
    fingerprint: String(row.fingerprint || ""),
  };
}

function commercialLineName(line: CommercialMemoryLine) {
  return (
    line.produitNom ||
    line.designation ||
    displayNameFromDescription(line.descriptionComplete) ||
    "Produit historique"
  );
}

function catalogKey(line: CommercialMemoryLine) {
  const reference = normalizeText(line.produitReference);
  if (reference) return `ref:${reference}`;
  return `name:${normalizeText(commercialLineName(line))}`;
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
        (b.dateFacture || b.documentDate || "").localeCompare(
          a.dateFacture || a.documentDate || ""
        )
      );
      const sortedByDateAsc = [...group].sort((a, b) =>
        (a.dateFacture || a.documentDate || "").localeCompare(
          b.dateFacture || b.documentDate || ""
        )
      );
      const last = sortedByDate.find((line) => lineUnitPrice(line) > 0) || sortedByDate[0];
      const first =
        sortedByDateAsc.find((line) => lineUnitPrice(line) > 0) || sortedByDateAsc[0];
      const lastPrice = last ? lineUnitPrice(last) : 0;
      const firstPrice = first ? lineUnitPrice(first) : 0;

      return {
        key,
        nom: commercialLineName(group[0]),
        reference: group[0]?.produitReference || "",
        categorie:
          group.find((line) => line.familleProduit)?.familleProduit ||
          group.find((line) => line.categorie)?.categorie ||
          "",
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
        premierPrix: roundMoney(firstPrice),
        premiereDate: first?.dateFacture || first?.documentDate || "",
        dernierPrix: roundMoney(lastPrice),
        derniereDate: last?.dateFacture || last?.documentDate || "",
      };
    })
    .sort((a, b) => b.ventes - a.ventes);
}

function clientKey(line: CommercialMemoryLine) {
  const email = normalizeText(line.clientEmail);
  if (email) return `email:${email}`;
  return `client:${normalizeText(
    line.clientDetecte || line.clientSociete || line.clientNom || "client inconnu"
  )}`;
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
        group.map((line) => line.numeroFacture || line.documentNumero || line.fingerprint).filter(Boolean)
      );
      const documentTotals = new Map<string, number>();
      group.forEach((line) => {
        const key = line.numeroFacture || line.documentNumero || line.fingerprint;
        if (!key) return;
        if (line.totalHTDocument > 0) {
          documentTotals.set(key, line.totalHTDocument);
        } else {
          documentTotals.set(key, (documentTotals.get(key) || 0) + Number(line.montantHT || 0));
        }
      });
      const total =
        documentTotals.size > 0
          ? [...documentTotals.values()].reduce((sum, value) => sum + value, 0)
          : group.reduce((sum, line) => sum + Number(line.montantHT || 0), 0);
      const products = group.reduce<Record<string, number>>((acc, line) => {
        const name = commercialLineName(line);
        acc[name] = (acc[name] || 0) + 1;
        return acc;
      }, {});
      const latestLines = [...group]
        .filter((line) => lineUnitPrice(line) > 0)
        .sort((a, b) =>
          (b.dateFacture || b.documentDate || "").localeCompare(
            a.dateFacture || a.documentDate || ""
          )
        )
        .slice(0, 4);

      return {
        key,
        nom: group[0]?.clientNom || "",
        societe: group[0]?.clientDetecte || group[0]?.clientSociete || "",
        email: group[0]?.clientEmail || "",
        commandes: documents.size || group.length,
        chiffreAffairesHT: roundMoney(total),
        panierMoyenHT: documents.size ? roundMoney(total / documents.size) : roundMoney(total),
        derniereCommande:
          [...group].sort((a, b) =>
            (b.dateFacture || b.documentDate || "").localeCompare(
              a.dateFacture || a.documentDate || ""
            )
          )[0]?.dateFacture ||
          [...group].sort((a, b) =>
            (b.documentDate || "").localeCompare(a.documentDate || "")
          )[0]?.documentDate ||
          "",
        produitsPrincipaux: Object.entries(products)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(([name]) => name),
        derniersPrix: latestLines.map((line) => ({
          produit: commercialLineName(line),
          prix: roundMoney(lineUnitPrice(line)),
          date: line.dateFacture || line.documentDate,
          documentNumero: line.numeroFacture || line.documentNumero,
        })),
      };
    })
    .sort((a, b) => b.chiffreAffairesHT - a.chiffreAffairesHT);
}

const PRICE_SUGGESTION_STOP_TOKENS = new Set([
  "avec",
  "pour",
  "sans",
  "sur",
  "sous",
  "dans",
  "des",
  "les",
  "une",
  "votre",
  "notre",
  "prix",
  "ensemble",
  "forfait",
  "fourniture",
  "impression",
  "quadri",
  "format",
  "maquette",
  "compris",
]);

function tokens(value: string) {
  return normalizeText(value)
    .split(" ")
    .filter((token) => token.length >= 3)
    .filter((token) => !PRICE_SUGGESTION_STOP_TOKENS.has(token));
}

function overlapScore(source: string[], target: string[]) {
  if (source.length === 0 || target.length === 0) return 0;
  const targetSet = new Set(target);
  const matches = source.filter((token) => targetSet.has(token)).length;
  return matches / source.length;
}

function overlapMatches(source: string[], target: string[]) {
  if (source.length === 0 || target.length === 0) return 0;
  const targetSet = new Set(target);
  return source.filter((token) => targetSet.has(token)).length;
}

export function suggestPriceForLine(
  line: {
    reference: string;
    designation: string;
    quantite: number;
    clientNom?: string;
    clientSociete?: string;
  },
  history: CommercialMemoryLine[]
): PriceSuggestion | null {
  const reference = normalizeText(line.reference);
  const designationTokens = tokens(line.designation);
  const clientTokens = tokens(`${line.clientSociete || ""} ${line.clientNom || ""}`);

  if (!reference && designationTokens.length === 0) return null;

  const scored = history
    .map((candidate) => {
      const candidateReference = normalizeText(candidate.produitReference);
      const candidateTokens = tokens(
        `${candidate.produitNom} ${candidate.designation} ${candidate.descriptionComplete} ${candidate.familleProduit}`
      );
      const candidateClientTokens = tokens(
        `${candidate.clientDetecte} ${candidate.clientSociete} ${candidate.clientNom}`
      );
      const productMatches = overlapMatches(designationTokens, candidateTokens);
      let productScore = overlapScore(designationTokens, candidateTokens);
      const clientScore = overlapScore(clientTokens, candidateClientTokens);
      const hasExactReference = Boolean(
        reference && candidateReference && reference === candidateReference
      );

      if (hasExactReference) {
        productScore += 2;
      }

      if (!hasExactReference) {
        const minimumMatches = designationTokens.length >= 2 ? 2 : 1;
        if (productMatches < minimumMatches) {
          return { candidate, score: 0, clientScore };
        }
      }

      if (productScore < 0.45) return { candidate, score: 0, clientScore };

      let score = productScore;

      if (clientScore > 0) score += Math.min(clientScore, 0.35);

      if (line.quantite > 0 && candidate.quantite > 0) {
        const ratio =
          Math.max(line.quantite, candidate.quantite) /
          Math.max(Math.min(line.quantite, candidate.quantite), 1);
        if (ratio <= 1.5) score += 0.4;
        else if (ratio <= 3) score += 0.15;
      }

      return { candidate, score, clientScore };
    })
    .filter(({ candidate, score }) => score >= 0.25 && lineUnitPrice(candidate) > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 30);

  if (scored.length === 0) return null;

  const matches = scored.map((item) => item.candidate);
  const prices = matches.map(lineUnitPrice).map(roundMoney);
  const sortedByDate = [...matches].sort((a, b) =>
    (b.dateFacture || b.documentDate || "").localeCompare(
      a.dateFacture || a.documentDate || ""
    )
  );
  const latest = sortedByDate[0];
  const medianPrice = median(prices);
  const maxScore = scored[0]?.score || 0;
  const clientMatchesCount = scored.filter((item) => item.clientScore > 0).length;
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
    lastPrice: latest ? roundMoney(lineUnitPrice(latest)) : 0,
    lastDate: latest?.dateFacture || latest?.documentDate || "",
    lastClient: latest ? latest.clientDetecte || latest.clientSociete || latest.clientNom : "",
    lastDocumentNumero: latest?.numeroFacture || latest?.documentNumero || "",
    clientMatchesCount,
    reason:
      reference && maxScore >= 1
        ? "Référence historique similaire"
        : clientMatchesCount > 0
        ? "Vente similaire pour ce client ou une désignation proche"
        : "Désignation proche dans l'historique",
    examples: sortedByDate.slice(0, 3),
  };
}
