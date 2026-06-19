type BrandInfo = {
  nom?: string;
  adresse?: string;
  ville?: string;
  telephone?: string;
  email?: string;
  siret?: string;
  tva?: string;
  logoUrl?: string;
  logo_url?: string;
  siteWeb?: string;
  site_web?: string;
  couleurPrincipale?: string;
  couleur_principale?: string;
};

type EmailLine = {
  reference?: string;
  designation?: string;
  quantite?: number;
  prixUnitaire?: number;
};

type BuildDocumentEmailOptions = {
  brand?: BrandInfo;
  eyebrow: string;
  title: string;
  intro: string;
  client?: string;
  numero?: string;
  totalHT?: string | number;
  totalTTC?: string | number;
  lignes?: EmailLine[];
  ctaLabel?: string;
  ctaUrl?: string;
  note?: string;
  secondaryNote?: string;
  acompteTTC?: string | number | null;
};

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function normalizeUrl(value?: string) {
  const url = value?.trim();
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `https://${url}`;
}

function normalizeColor(value?: string) {
  const color = value?.trim();
  if (!color) return "#0f172a";
  return /^#[0-9a-fA-F]{6}$/.test(color) ? color : "#0f172a";
}

function initials(value?: string) {
  const source = value?.trim() || "DF";
  return source
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}

function brandLogo(brand: BrandInfo, color: string) {
  const logo = brand.logoUrl || brand.logo_url;

  if (logo) {
    return `
      <img src="${escapeHtml(logo)}" alt="${escapeHtml(
        brand.nom || "Logo entreprise"
      )}" style="width:52px;height:52px;border-radius:12px;object-fit:contain;background:#ffffff;border:1px solid #e2e8f0;" />
    `;
  }

  return `
    <div style="width:52px;height:52px;border-radius:12px;background:${color};color:#ffffff;display:inline-flex;align-items:center;justify-content:center;font-weight:800;font-size:18px;">
      ${escapeHtml(initials(brand.nom))}
    </div>
  `;
}

function contactLine(brand: BrandInfo) {
  const site = normalizeUrl(brand.siteWeb || brand.site_web);
  const items = [
    brand.email,
    brand.telephone,
    site ? `<a href="${escapeHtml(site)}" style="color:#475569;text-decoration:none;">${escapeHtml(site.replace(/^https?:\/\//, ""))}</a>` : "",
  ].filter(Boolean);

  return items.join(" · ");
}

function linesTable(lignes?: EmailLine[]) {
  if (!lignes || lignes.length === 0) return "";

  const rows = lignes
    .map(
      (ligne) => `
        <tr>
          <td style="padding:12px 0;border-bottom:1px solid #e5e7eb;color:#64748b;">${escapeHtml(ligne.reference || "-")}</td>
          <td style="padding:12px 10px;border-bottom:1px solid #e5e7eb;color:#0f172a;font-weight:600;">${escapeHtml(ligne.designation || "-")}</td>
          <td style="padding:12px 10px;border-bottom:1px solid #e5e7eb;color:#64748b;text-align:center;">${escapeHtml(ligne.quantite ?? "-")}</td>
          <td style="padding:12px 0;border-bottom:1px solid #e5e7eb;color:#64748b;text-align:right;">${escapeHtml(ligne.prixUnitaire ?? "-")} € HT</td>
        </tr>
      `
    )
    .join("");

  return `
    <table style="width:100%;border-collapse:collapse;margin-top:24px;">
      <thead>
        <tr>
          <th style="text-align:left;padding:0 0 10px;border-bottom:2px solid #0f172a;color:#0f172a;font-size:11px;text-transform:uppercase;letter-spacing:.08em;">Réf.</th>
          <th style="text-align:left;padding:0 10px 10px;border-bottom:2px solid #0f172a;color:#0f172a;font-size:11px;text-transform:uppercase;letter-spacing:.08em;">Désignation</th>
          <th style="text-align:center;padding:0 10px 10px;border-bottom:2px solid #0f172a;color:#0f172a;font-size:11px;text-transform:uppercase;letter-spacing:.08em;">Qté</th>
          <th style="text-align:right;padding:0 0 10px;border-bottom:2px solid #0f172a;color:#0f172a;font-size:11px;text-transform:uppercase;letter-spacing:.08em;">PU HT</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}

export function buildPremiumDocumentEmail({
  brand = {},
  eyebrow,
  title,
  intro,
  client,
  numero,
  totalHT,
  totalTTC,
  lignes,
  ctaLabel,
  ctaUrl,
  note,
  secondaryNote,
  acompteTTC,
}: BuildDocumentEmailOptions) {
  const brandName = brand.nom || "Entreprise";
  const color = normalizeColor(brand.couleurPrincipale || brand.couleur_principale);
  const contact = contactLine(brand);
  const safeCtaUrl = ctaUrl ? escapeHtml(ctaUrl) : "";

  return `
    <div style="margin:0;background:#f4f6f8;padding:34px 16px;font-family:Arial,Helvetica,sans-serif;color:#0f172a;line-height:1.6;">
      <div style="max-width:700px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden;box-shadow:0 18px 45px rgba(15,23,42,.08);">
        <div style="padding:28px 32px;border-bottom:1px solid #e2e8f0;">
          <table style="width:100%;border-collapse:collapse;">
            <tr>
              <td style="width:64px;vertical-align:top;">${brandLogo(brand, color)}</td>
              <td style="vertical-align:top;">
                <p style="margin:0;font-size:13px;font-weight:700;color:#0f172a;">${escapeHtml(brandName)}</p>
                <p style="margin:4px 0 0;font-size:12px;color:#64748b;">${escapeHtml(brand.adresse || "")}${brand.ville ? ` · ${escapeHtml(brand.ville)}` : ""}</p>
                ${contact ? `<p style="margin:4px 0 0;font-size:12px;color:#64748b;">${contact}</p>` : ""}
              </td>
            </tr>
          </table>
        </div>

        <div style="padding:30px 32px 10px;">
          <p style="margin:0 0 10px;font-size:12px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:${color};">${escapeHtml(eyebrow)}</p>
          <h1 style="margin:0;font-size:28px;line-height:1.2;color:#0f172a;">${escapeHtml(title)}</h1>
          ${numero ? `<p style="margin:10px 0 0;font-size:14px;color:#64748b;">Document ${escapeHtml(numero)}</p>` : ""}
        </div>

        <div style="padding:18px 32px 32px;">
          <p style="margin:0 0 14px;">Bonjour ${escapeHtml(client || "")},</p>
          <p style="margin:0 0 22px;color:#334155;">${escapeHtml(intro)}</p>

          ${linesTable(lignes)}

          <div style="margin-top:24px;border:1px solid #e2e8f0;border-radius:14px;overflow:hidden;">
            <div style="display:flex;justify-content:space-between;padding:14px 18px;background:#f8fafc;border-bottom:1px solid #e2e8f0;color:#475569;">
              <span>Total HT</span>
              <strong style="color:#0f172a;">${escapeHtml(totalHT ?? "-")} €</strong>
            </div>
            <div style="display:flex;justify-content:space-between;padding:16px 18px;background:${color};color:#ffffff;">
              <span style="font-weight:700;">Total TTC</span>
              <strong style="font-size:20px;">${escapeHtml(totalTTC ?? "-")} €</strong>
            </div>
          </div>

          ${
            acompteTTC
              ? `<div style="margin-top:18px;padding:16px 18px;border-radius:12px;background:#fffbeb;border:1px solid #fde68a;color:#92400e;">
                  <strong>Acompte prévu :</strong> ${escapeHtml(acompteTTC)} € TTC après acceptation du devis.
                </div>`
              : ""
          }

          ${
            safeCtaUrl && ctaLabel
              ? `<p style="margin:28px 0 0;">
                  <a href="${safeCtaUrl}" style="display:inline-block;background:${color};color:#ffffff;padding:14px 22px;border-radius:10px;text-decoration:none;font-weight:800;">
                    ${escapeHtml(ctaLabel)}
                  </a>
                </p>`
              : ""
          }

          ${note ? `<p style="margin:24px 0 0;color:#475569;font-size:14px;">${escapeHtml(note)}</p>` : ""}
          ${secondaryNote ? `<p style="margin:12px 0 0;color:#64748b;font-size:13px;">${escapeHtml(secondaryNote)}</p>` : ""}

          <p style="margin:30px 0 0;">Bien cordialement,<br/><strong>${escapeHtml(brandName)}</strong></p>
        </div>

        <div style="padding:18px 32px;background:#f8fafc;border-top:1px solid #e2e8f0;color:#64748b;font-size:12px;">
          ${brand.siret ? `<span>SIRET : ${escapeHtml(brand.siret)}</span>` : ""}
          ${brand.tva ? `<span>${brand.siret ? " · " : ""}TVA : ${escapeHtml(brand.tva)}</span>` : ""}
        </div>
      </div>
    </div>
  `;
}

