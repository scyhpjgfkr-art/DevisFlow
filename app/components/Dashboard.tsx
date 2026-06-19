"use client";

import { useCallback, useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { supabase } from "@/lib/supabase";
import ParametresEntreprise from "./ParametresEntreprise";
import OnboardingPremiersPas from "./OnboardingPremiersPas";

type Statut = "Brouillon" | "Envoyé" | "À relancer" | "Accepté" | "Refusé";
type AcompteType = "none" | "percent" | "fixed";
type TypeClient = "B2B" | "B2C" | "B2G";
type CategorieOperation = "services" | "biens" | "mixte";
type StatutEFacture =
  | "non_transmise"
  | "a_preparer"
  | "transmise"
  | "rejetee"
  | "acceptee";

type LigneDevis = {
  reference: string;
  designation: string;
  quantite: number;
  prixUnitaire: number;
};

type Devis = {
  id?: string;
  numero: string;
  client: string;
  societe: string;
  email: string;
  telephone: string;
  typeClient: TypeClient;
  sirenClient: string;
  siretClient: string;
  tvaIntracomClient: string;
  paysClient: string;
  adresseCompleteClient: string;
  categorieOperation: CategorieOperation;
  statutEFacture: StatutEFacture;
  echeance: string;
  portHT: number;
  lignes: LigneDevis[];
  statut: Statut;
  dateCreation: string;
  dateEnvoi?: string;
  dateVue?: string;
  derniereVue?: string;
  nombreVues?: number;
  derniereRelance?: string;
  publicToken?: string;
  acompteType?: AcompteType;
  acompteMontant?: number;
  acomptePourcentage?: number;
  acompteStatut?: string;
  signataireNom?: string;
  commentaireClient?: string;
  dateReponse?: string;
  dateAcceptation?: string;
  dateRefus?: string;
  responseLockedAt?: string;
  ipReponse?: string;
  devisVersion?: number;
  conditionsDevis?: string;
};

type Settings = {
  nom: string;
  adresse: string;
  ville: string;
  telephone: string;
  email: string;
  siret: string;
  tva: string;
  logoUrl: string;
  siteWeb: string;
  couleurPrincipale: string;
};

type Client = {
  id?: string;
  nom: string;
  societe: string;
  email: string;
  telephone: string;
  adresse: string;
  ville: string;
  typeClient: TypeClient;
  sirenClient: string;
  siretClient: string;
  tvaIntracomClient: string;
  paysClient: string;
  adresseCompleteClient: string;
};

type Produit = {
  id?: string;
  reference: string;
  nom: string;
  designation: string;
  prixUnitaire: number;
};

type FactureLigne = {
  reference: string;
  designation: string;
  quantite: number;
  prixUnitaire: number;
};

type Facture = {
  id?: string;
  devisId?: string;
  numero: string;
  client: string;
  societe: string;
  email: string;
  telephone: string;
  typeClient: TypeClient;
  sirenClient: string;
  siretClient: string;
  tvaIntracomClient: string;
  paysClient: string;
  adresseCompleteClient: string;
  categorieOperation: CategorieOperation;
  statutEFacture: StatutEFacture;
  totalHT: number;
  totalTTC: number;
  dateCreation: string;
  dateEnvoi?: string;
  statut: "À payer" | "Payée";
  lignes?: FactureLigne[];
};

type ClientRow = {
  id?: string;
  nom?: string | null;
  societe?: string | null;
  email?: string | null;
  telephone?: string | null;
  adresse?: string | null;
  ville?: string | null;
  type_client?: string | null;
  siren_client?: string | null;
  siret_client?: string | null;
  tva_intracom_client?: string | null;
  pays_client?: string | null;
  adresse_complete_client?: string | null;
};

type ProduitRow = {
  id?: string;
  reference?: string | null;
  nom?: string | null;
  designation?: string | null;
  prix_unitaire?: number | null;
};

type LigneFactureRow = {
  facture_id?: string | null;
  reference?: string | null;
  designation?: string | null;
  quantite?: number | null;
  prix_unitaire?: number | null;
};

type FactureRow = {
  id?: string;
  devis_id?: string | null;
  numero?: string | null;
  client?: string | null;
  societe?: string | null;
  email?: string | null;
  telephone?: string | null;
  type_client?: string | null;
  siren_client?: string | null;
  siret_client?: string | null;
  tva_intracom_client?: string | null;
  pays_client?: string | null;
  adresse_complete_client?: string | null;
  categorie_operation?: string | null;
  statut_e_facture?: string | null;
  total_ht?: number | null;
  total_ttc?: number | null;
  date_creation?: string | null;
  date_envoi?: string | null;
  statut?: Facture["statut"] | null;
  lignes_factures?: LigneFactureRow[] | null;
};

type SendFactureResponse = {
  success?: boolean;
  error?: string;
  details?: string;
  warning?: string;
  testFallback?: boolean;
  sentToOriginalRecipient?: boolean;
};

type LigneDevisRow = {
  devis_id?: string | null;
  reference?: string | null;
  designation?: string | null;
  quantite?: number | null;
  prix_unitaire?: number | null;
};

type DevisRow = {
  id?: string;
  numero?: string | null;
  client?: string | null;
  societe?: string | null;
  email?: string | null;
  telephone?: string | null;
  type_client?: string | null;
  siren_client?: string | null;
  siret_client?: string | null;
  tva_intracom_client?: string | null;
  pays_client?: string | null;
  adresse_complete_client?: string | null;
  categorie_operation?: string | null;
  statut_e_facture?: string | null;
  echeance?: string | null;
  port_ht?: number | null;
  statut?: Statut | null;
  date_creation?: string | null;
  date_envoi?: string | null;
  date_vue?: string | null;
  derniere_vue?: string | null;
  nombre_vues?: number | null;
  derniere_relance?: string | null;
  public_token?: string | null;
  acompte_type?: AcompteType | null;
  acompte_montant?: number | null;
  acompte_pourcentage?: number | null;
  acompte_statut?: string | null;
  signataire_nom?: string | null;
  commentaire_client?: string | null;
  date_reponse?: string | null;
  date_acceptation?: string | null;
  date_refus?: string | null;
  response_locked_at?: string | null;
  ip_reponse?: string | null;
  devis_version?: number | null;
  conditions_devis?: string | null;
  lignes_devis?: LigneDevisRow[] | null;
};

type GeneratedDevis = {
  client?: string;
  societe?: string;
  email?: string;
  telephone?: string;
  echeance?: string;
  portHT?: number;
  lignes?: LigneDevis[];
};

type DevisAvecStatutAuto = Devis & {
  statutAffiche: Statut;
};

type PipelineStage =
  | "Envoyé"
  | "Vu"
  | "Accepté"
  | "Acompte payé"
  | "Facture envoyée"
  | "Facture payée";

type DevisTemplate = {
  name: string;
  description: string;
  echeance: string;
  conditions: string;
  lignes: LigneDevis[];
};

type AutoTableDoc = jsPDF & {
  lastAutoTable?: {
    finalY: number;
  };
};

const DEFAULT_BRAND_COLOR = "#0f172a";

const DEFAULT_CONDITIONS =
  "Devis valable 30 jours à compter de sa date d'émission.\n" +
  "Acompte payable à l'acceptation si indiqué sur le devis.\n" +
  "Le solde est dû selon les conditions de règlement convenues.\n" +
  "Toute prestation hors périmètre fera l'objet d'un devis complémentaire.";

const TYPE_CLIENT_OPTIONS: { value: TypeClient; label: string }[] = [
  { value: "B2B", label: "Entreprise (B2B)" },
  { value: "B2C", label: "Particulier (B2C)" },
  { value: "B2G", label: "Administration (B2G)" },
];

const CATEGORIE_OPERATION_OPTIONS: {
  value: CategorieOperation;
  label: string;
}[] = [
  { value: "services", label: "Services" },
  { value: "biens", label: "Biens" },
  { value: "mixte", label: "Biens et services" },
];

const STATUT_E_FACTURE_OPTIONS: { value: StatutEFacture; label: string }[] = [
  { value: "non_transmise", label: "Non transmise" },
  { value: "a_preparer", label: "À préparer" },
  { value: "transmise", label: "Transmise" },
  { value: "rejetee", label: "Rejetée" },
  { value: "acceptee", label: "Acceptée" },
];

const DEVIS_TEMPLATES: DevisTemplate[] = [
  {
    name: "Agence Web",
    description: "Site vitrine, cadrage, conception, développement et mise en ligne.",
    echeance: "50% à la validation, solde à la mise en ligne",
    conditions:
      "Devis valable 30 jours.\n" +
      "Le planning démarre après réception des contenus client et paiement de l'acompte.\n" +
      "Deux cycles de retours sont inclus par livrable.\n" +
      "Les demandes hors périmètre feront l'objet d'un devis complémentaire.",
    lignes: [
      {
        reference: "WEB-01",
        designation: "Cadrage, arborescence et maquettes principales",
        quantite: 1,
        prixUnitaire: 900,
      },
      {
        reference: "WEB-02",
        designation: "Développement du site vitrine responsive",
        quantite: 1,
        prixUnitaire: 2200,
      },
      {
        reference: "WEB-03",
        designation: "Mise en ligne, tests et accompagnement de prise en main",
        quantite: 1,
        prixUnitaire: 450,
      },
    ],
  },
  {
    name: "Consultant",
    description: "Mission de conseil structurée avec cadrage, ateliers et restitution.",
    echeance: "À réception de facture",
    conditions:
      "Devis valable 30 jours.\n" +
      "Les rendez-vous sont planifiés d'un commun accord.\n" +
      "Les livrables sont transmis au format numérique.\n" +
      "Toute journée supplémentaire fera l'objet d'une validation préalable.",
    lignes: [
      {
        reference: "CONS-01",
        designation: "Cadrage de mission et analyse initiale",
        quantite: 1,
        prixUnitaire: 650,
      },
      {
        reference: "CONS-02",
        designation: "Ateliers de travail et recommandations opérationnelles",
        quantite: 3,
        prixUnitaire: 750,
      },
      {
        reference: "CONS-03",
        designation: "Synthèse finale et plan d'action priorisé",
        quantite: 1,
        prixUnitaire: 700,
      },
    ],
  },
  {
    name: "Maintenance",
    description: "Intervention, maintenance préventive et compte rendu.",
    echeance: "30 jours fin de mois",
    conditions:
      "Devis valable 30 jours.\n" +
      "Intervention réalisée sur rendez-vous selon disponibilité des équipes.\n" +
      "Les pièces non prévues au devis seront facturées après validation client.\n" +
      "Un compte rendu d'intervention est remis après prestation.",
    lignes: [
      {
        reference: "MAINT-01",
        designation: "Diagnostic initial et préparation d'intervention",
        quantite: 1,
        prixUnitaire: 180,
      },
      {
        reference: "MAINT-02",
        designation: "Intervention de maintenance sur site",
        quantite: 4,
        prixUnitaire: 85,
      },
      {
        reference: "MAINT-03",
        designation: "Compte rendu et recommandations de suivi",
        quantite: 1,
        prixUnitaire: 120,
      },
    ],
  },
  {
    name: "Formation",
    description: "Session de formation avec préparation, animation et supports.",
    echeance: "À réception de facture",
    conditions:
      "Devis valable 30 jours.\n" +
      "La session est confirmée après validation du devis.\n" +
      "Les supports pédagogiques sont inclus au format numérique.\n" +
      "Toute annulation à moins de 7 jours ouvrés pourra être facturée.",
    lignes: [
      {
        reference: "FORM-01",
        designation: "Préparation pédagogique et adaptation du contenu",
        quantite: 1,
        prixUnitaire: 450,
      },
      {
        reference: "FORM-02",
        designation: "Animation formation intra-entreprise",
        quantite: 1,
        prixUnitaire: 1200,
      },
      {
        reference: "FORM-03",
        designation: "Supports, quiz et synthèse post-formation",
        quantite: 1,
        prixUnitaire: 250,
      },
    ],
  },
];

function normalizeBrandColor(value?: string) {
  return /^#[0-9a-fA-F]{6}$/.test(value || "")
    ? value || DEFAULT_BRAND_COLOR
    : DEFAULT_BRAND_COLOR;
}

function hexToRgb(value?: string): [number, number, number] {
  const color = normalizeBrandColor(value).replace("#", "");
  return [
    parseInt(color.slice(0, 2), 16),
    parseInt(color.slice(2, 4), 16),
    parseInt(color.slice(4, 6), 16),
  ];
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

function normalizeWebsite(value?: string) {
  const url = value?.trim();
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `https://${url}`;
}

function displayWebsite(value?: string) {
  return normalizeWebsite(value).replace(/^https?:\/\//, "");
}

function normalizeTypeClient(value?: string | null): TypeClient {
  if (value === "B2C" || value === "B2G") return value;
  return "B2B";
}

function normalizeCategorieOperation(value?: string | null): CategorieOperation {
  if (value === "biens" || value === "mixte") return value;
  return "services";
}

function normalizeStatutEFacture(value?: string | null): StatutEFacture {
  if (
    value === "a_preparer" ||
    value === "transmise" ||
    value === "rejetee" ||
    value === "acceptee"
  ) {
    return value;
  }

  return "non_transmise";
}

function statutEFactureLabel(value?: string | null) {
  const statut = normalizeStatutEFacture(value);
  return (
    STATUT_E_FACTURE_OPTIONS.find((option) => option.value === statut)?.label ||
    "Non transmise"
  );
}

async function logoToPngDataUrl(url?: string) {
  if (!url) return null;

  try {
    const response = await fetch(url);
    const blob = await response.blob();
    const bitmap = await createImageBitmap(blob);
    const maxSize = 320;
    const scale = Math.min(maxSize / bitmap.width, maxSize / bitmap.height, 1);
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const context = canvas.getContext("2d");
    if (!context) return null;
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/png");
  } catch (error) {
    console.warn("Logo PDF indisponible", error);
    return null;
  }
}

function drawPdfBrandMark(
  doc: jsPDF,
  settings: Settings,
  x: number,
  y: number,
  size: number,
  logoDataUrl: string | null
) {
  const [r, g, b] = hexToRgb(settings.couleurPrincipale);

  if (logoDataUrl) {
    try {
      doc.addImage(logoDataUrl, "PNG", x, y, size, size);
      return;
    } catch (error) {
      console.warn("Logo PDF ignore", error);
    }
  }

  doc.setFillColor(r, g, b);
  doc.roundedRect(x, y, size, size, 2, 2, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text(initials(settings.nom), x + size / 2, y + size / 2 + 3, {
    align: "center",
  });
}

function formatEuro(value: number) {
  return `${value.toFixed(2)} €`;
}

function formatDateTime(value?: string) {
  if (!value) return "-";

  return new Date(value).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

async function readApiResponse(response: Response): Promise<SendFactureResponse> {
  try {
    return (await response.json()) as SendFactureResponse;
  } catch {
    return {
      error: response.ok
        ? undefined
        : `Erreur HTTP ${response.status} ${response.statusText}`.trim(),
    };
  }
}

function apiErrorMessage(data: SendFactureResponse, fallback: string) {
  if (data.details && data.error) return `${data.error}\n\nDétail : ${data.details}`;
  return data.error || fallback;
}

function mapLigneDevis(ligne: LigneDevisRow): LigneDevis {
  return {
    reference: ligne.reference || "",
    designation: ligne.designation || "",
    quantite: Number(ligne.quantite || 1),
    prixUnitaire: Number(ligne.prix_unitaire || 0),
  };
}

function mapLigneFacture(ligne: LigneFactureRow): FactureLigne {
  return {
    reference: ligne.reference || "",
    designation: ligne.designation || "",
    quantite: Number(ligne.quantite || 1),
    prixUnitaire: Number(ligne.prix_unitaire || 0),
  };
}

export default function Dashboard({
  session,
  logout,
}: {
  session: Session;
  logout: () => void;
}) {
  const [onglet, setOnglet] = useState<
    | "dashboard"
    | "devis"
    | "clients"
    | "catalogue"
    | "factures"
    | "parametres"
    | "tarifs"
  >("dashboard");

  const [devis, setDevis] = useState<Devis[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [produits, setProduits] = useState<Produit[]>([]);
  const [factures, setFactures] = useState<Facture[]>([]);

  const [showForm, setShowForm] = useState(false);
  const [preview, setPreview] = useState<Devis | null>(null);
  const [editingDevis, setEditingDevis] = useState<Devis | null>(null);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [relanceSendingId, setRelanceSendingId] = useState<string | null>(null);
  const [factureSendingId, setFactureSendingId] = useState<string | null>(null);
  const [logoUploading, setLogoUploading] = useState(false);

  const [settings, setSettings] = useState<Settings>({
    nom: "DevisFlow",
    adresse: "12 rue de la Productivité",
    ville: "75000 Paris",
    telephone: "01 00 00 00 00",
    email: "contact@devisflow.fr",
    siret: "123 456 789 00012",
    tva: "FR12 123456789",
    logoUrl: "",
    siteWeb: "",
    couleurPrincipale: DEFAULT_BRAND_COLOR,
  });

  const [client, setClient] = useState("");
  const [societe, setSociete] = useState("");
  const [email, setEmail] = useState("");
  const [telephone, setTelephone] = useState("");
  const [typeClient, setTypeClient] = useState<TypeClient>("B2B");
  const [sirenClient, setSirenClient] = useState("");
  const [siretClient, setSiretClient] = useState("");
  const [tvaIntracomClient, setTvaIntracomClient] = useState("");
  const [paysClient, setPaysClient] = useState("France");
  const [adresseCompleteClient, setAdresseCompleteClient] = useState("");
  const [categorieOperation, setCategorieOperation] =
    useState<CategorieOperation>("services");
  const [echeance, setEcheance] = useState("À réception de facture");
  const [conditionsDevis, setConditionsDevis] = useState(DEFAULT_CONDITIONS);
  const [portHT, setPortHT] = useState(0);
  const [acompteType, setAcompteType] = useState<AcompteType>("none");
  const [acompteMontant, setAcompteMontant] = useState(0);
  const [acomptePourcentage, setAcomptePourcentage] = useState(30);

  const [promptIA, setPromptIA] = useState("");
  const [loadingIA, setLoadingIA] = useState(false);

  const [newClient, setNewClient] = useState<Client>({
    nom: "",
    societe: "",
    email: "",
    telephone: "",
    adresse: "",
    ville: "",
    typeClient: "B2B",
    sirenClient: "",
    siretClient: "",
    tvaIntracomClient: "",
    paysClient: "France",
    adresseCompleteClient: "",
  });

  const [newProduit, setNewProduit] = useState<Produit>({
    reference: "",
    nom: "",
    designation: "",
    prixUnitaire: 0,
  });

  const [lignes, setLignes] = useState<LigneDevis[]>([
    { reference: "", designation: "", quantite: 1, prixUnitaire: 0 },
  ]);

  const chargerSettings = useCallback(async () => {
    const { data } = await supabase
      .from("entreprise_settings")
      .select("*")
      .eq("user_id", session.user.id)
      .maybeSingle();

    if (data) {
      setSettings({
        nom: data.nom || "",
        adresse: data.adresse || "",
        ville: data.ville || "",
        telephone: data.telephone || "",
        email: data.email || "",
        siret: data.siret || "",
        tva: data.tva || "",
        logoUrl: data.logo_url || "",
        siteWeb: data.site_web || "",
        couleurPrincipale: data.couleur_principale || DEFAULT_BRAND_COLOR,
      });
    }
  }, [session.user.id]);

  useEffect(() => {
    const chargerDonnees = async () => {
      await Promise.all([
        chargerDevis(),
        chargerSettings(),
        chargerClients(),
        chargerProduits(),
        chargerFactures(),
      ]);
    };

    void chargerDonnees();
  }, [chargerSettings]);

  async function sauvegarderSettings(nextSettings = settings) {
    const { error } = await supabase.from("entreprise_settings").upsert({
      user_id: session.user.id,
      nom: nextSettings.nom,
      adresse: nextSettings.adresse,
      ville: nextSettings.ville,
      telephone: nextSettings.telephone,
      email: nextSettings.email,
      siret: nextSettings.siret,
      tva: nextSettings.tva,
      logo_url: nextSettings.logoUrl,
      site_web: nextSettings.siteWeb,
      couleur_principale: normalizeBrandColor(nextSettings.couleurPrincipale),
    });

    if (error) {
      alert("Erreur sauvegarde paramètres");
      console.error(error);
      return;
    }

    alert("Paramètres sauvegardés.");
  }

  async function uploadLogo(file: File) {
    if (!file.type.startsWith("image/")) {
      alert("Le fichier choisi doit être une image.");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      alert("Le logo doit faire moins de 2 Mo.");
      return;
    }

    setLogoUploading(true);

    const extension = file.name.split(".").pop()?.toLowerCase() || "png";
    const safeExtension = ["png", "jpg", "jpeg", "webp"].includes(extension)
      ? extension
      : "png";
    const path = `${session.user.id}/logo-${Date.now()}.${safeExtension}`;

    const { error } = await supabase.storage
      .from("entreprise-logos")
      .upload(path, file, {
        cacheControl: "3600",
        upsert: true,
      });

    if (error) {
      console.error(error);
      alert("Erreur upload logo. Vérifie que le SQL Sprint 29 a été appliqué.");
      setLogoUploading(false);
      return;
    }

    const { data } = supabase.storage
      .from("entreprise-logos")
      .getPublicUrl(path);

    const nextSettings = {
      ...settings,
      logoUrl: data.publicUrl,
    };

    setSettings(nextSettings);
    await sauvegarderSettings(nextSettings);
    setLogoUploading(false);
  }

  async function supprimerLogo() {
    const nextSettings = {
      ...settings,
      logoUrl: "",
    };

    setSettings(nextSettings);
    await sauvegarderSettings(nextSettings);
  }

  async function chargerClients() {
    const { data, error } = await supabase
      .from("clients")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      alert("Erreur chargement clients");
      return;
    }

    setClients(
      ((data as ClientRow[] | null) || []).map((c) => ({
        id: c.id,
        nom: c.nom || "",
        societe: c.societe || "",
        email: c.email || "",
        telephone: c.telephone || "",
        adresse: c.adresse || "",
        ville: c.ville || "",
        typeClient: normalizeTypeClient(c.type_client),
        sirenClient: c.siren_client || "",
        siretClient: c.siret_client || "",
        tvaIntracomClient: c.tva_intracom_client || "",
        paysClient: c.pays_client || "France",
        adresseCompleteClient:
          c.adresse_complete_client ||
          [c.adresse, c.ville].filter(Boolean).join(", "),
      }))
    );
  }

  async function ajouterClient() {
    if (!newClient.nom.trim()) {
      alert("Le nom du client est obligatoire.");
      return;
    }

    const { error } = await supabase.from("clients").insert({
      user_id: session.user.id,
      nom: newClient.nom,
      societe: newClient.societe,
      email: newClient.email,
      telephone: newClient.telephone,
      adresse: newClient.adresse,
      ville: newClient.ville,
      type_client: newClient.typeClient,
      siren_client: newClient.sirenClient,
      siret_client: newClient.siretClient,
      tva_intracom_client: newClient.tvaIntracomClient,
      pays_client: newClient.paysClient,
      adresse_complete_client:
        newClient.adresseCompleteClient ||
        [newClient.adresse, newClient.ville].filter(Boolean).join(", "),
    });

    if (error) {
      console.error(error);
      alert("Erreur ajout client");
      return;
    }

    setNewClient({
      nom: "",
      societe: "",
      email: "",
      telephone: "",
      adresse: "",
      ville: "",
      typeClient: "B2B",
      sirenClient: "",
      siretClient: "",
      tvaIntracomClient: "",
      paysClient: "France",
      adresseCompleteClient: "",
    });

    await chargerClients();
  }

  async function supprimerClient(id?: string) {
    if (!id) return;
    await supabase.from("clients").delete().eq("id", id);
    await chargerClients();
  }

  async function chargerProduits() {
    const { data, error } = await supabase
      .from("produits")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      alert("Erreur chargement catalogue");
      return;
    }

    setProduits(
      ((data as ProduitRow[] | null) || []).map((p) => ({
        id: p.id,
        reference: p.reference || "",
        nom: p.nom || "",
        designation: p.designation || "",
        prixUnitaire: Number(p.prix_unitaire || 0),
      }))
    );
  }

  async function ajouterProduit() {
    if (!newProduit.nom.trim()) {
      alert("Le nom du produit est obligatoire.");
      return;
    }

    const { error } = await supabase.from("produits").insert({
      user_id: session.user.id,
      reference: newProduit.reference,
      nom: newProduit.nom,
      designation: newProduit.designation,
      prix_unitaire: newProduit.prixUnitaire,
    });

    if (error) {
      console.error(error);
      alert("Erreur ajout produit");
      return;
    }

    setNewProduit({
      reference: "",
      nom: "",
      designation: "",
      prixUnitaire: 0,
    });

    await chargerProduits();
  }

  async function supprimerProduit(id?: string) {
    if (!id) return;
    await supabase.from("produits").delete().eq("id", id);
    await chargerProduits();
  }

  async function chargerFactures() {
    const { data, error } = await supabase
      .from("factures")
      .select("*, lignes_factures(*)")
      .order("date_creation", { ascending: false });

    if (error) {
      console.error(error);
      alert("Erreur chargement factures");
      return;
    }

    const facturesRows = (data as FactureRow[] | null) || [];
    const factureIds = facturesRows
      .map((f) => f.id)
      .filter((id): id is string => Boolean(id));
    const lignesParFacture = new Map<string, LigneFactureRow[]>();

    if (factureIds.length > 0) {
      const { data: lignesData, error: lignesError } = await supabase
        .from("lignes_factures")
        .select("*")
        .in("facture_id", factureIds);

      if (lignesError) {
        console.warn("Lignes factures indisponibles:", lignesError);
      } else {
        ((lignesData as LigneFactureRow[] | null) || []).forEach((ligne) => {
          if (!ligne.facture_id) return;
          const lignes = lignesParFacture.get(ligne.facture_id) || [];
          lignes.push(ligne);
          lignesParFacture.set(ligne.facture_id, lignes);
        });
      }
    }

    setFactures(
      facturesRows.map((f) => {
        const lignesSource =
          (f.id && lignesParFacture.get(f.id)?.length
            ? lignesParFacture.get(f.id)
            : f.lignes_factures) || [];

        return {
          id: f.id,
          devisId: f.devis_id || undefined,
          numero: f.numero || "",
          client: f.client || "",
          societe: f.societe || "",
          email: f.email || "",
          telephone: f.telephone || "",
          typeClient: normalizeTypeClient(f.type_client),
          sirenClient: f.siren_client || "",
          siretClient: f.siret_client || "",
          tvaIntracomClient: f.tva_intracom_client || "",
          paysClient: f.pays_client || "",
          adresseCompleteClient: f.adresse_complete_client || "",
          categorieOperation: normalizeCategorieOperation(f.categorie_operation),
          statutEFacture: normalizeStatutEFacture(f.statut_e_facture),
          totalHT: Number(f.total_ht || 0),
          totalTTC: Number(f.total_ttc || 0),
          dateCreation: f.date_creation || new Date().toISOString(),
          dateEnvoi: f.date_envoi || undefined,
          statut: f.statut || "À payer",
          lignes: lignesSource.map(mapLigneFacture),
        };
      })
    );
  }

  async function transformerEnFacture(d: Devis) {
    if (!d.id) return;

    const existe = factures.find((f) => f.devisId === d.id);
    if (existe) {
      alert("Ce devis a déjà été transformé en facture.");
      return;
    }

    const numeroFacture = `FAC-${new Date().getFullYear()}-${String(
      factures.length + 1
    ).padStart(4, "0")}`;

    const { data: facture, error } = await supabase
      .from("factures")
      .insert({
        user_id: session.user.id,
        devis_id: d.id,
        numero: numeroFacture,
        client: d.client,
        societe: d.societe,
        email: d.email,
        telephone: d.telephone,
        type_client: d.typeClient,
        siren_client: d.sirenClient,
        siret_client: d.siretClient,
        tva_intracom_client: d.tvaIntracomClient,
        pays_client: d.paysClient,
        adresse_complete_client: d.adresseCompleteClient,
        categorie_operation: d.categorieOperation,
        statut_e_facture: "non_transmise",
        total_ht: totalHT(d.lignes, d.portHT),
        total_ttc: totalTTC(d.lignes, d.portHT),
        statut: "À payer",
      })
      .select()
      .single();

    if (error || !facture) {
      console.error(error);
      alert("Erreur création facture");
      return;
    }

    const { error: lignesError } = await supabase.from("lignes_factures").insert(
      d.lignes.map((ligne) => ({
        facture_id: facture.id,
        reference: ligne.reference,
        designation: ligne.designation,
        quantite: ligne.quantite,
        prix_unitaire: ligne.prixUnitaire,
      }))
    );

    if (lignesError) {
      console.error(lignesError);
      alert("Facture créée, mais erreur sur les lignes de facture.");
      return;
    }

    await supabase.from("devis").update({ statut: "Accepté" }).eq("id", d.id);

    await chargerFactures();
    await chargerDevis();

    alert("Facture détaillée créée.");
    setOnglet("factures");
  }

  async function marquerFacturePayee(f: Facture) {
    if (!f.id) return;

    await supabase
      .from("factures")
      .update({ statut: "Payée" })
      .eq("id", f.id);

    await chargerFactures();
  }

  async function supprimerFacture(f: Facture) {
    if (!f.id) return;
    await supabase.from("factures").delete().eq("id", f.id);
    await chargerFactures();
  }

  async function telechargerFacturePDF(f: Facture) {
    const doc = new jsPDF();
    const logoDataUrl = await logoToPngDataUrl(settings.logoUrl);
    const [r, g, b] = hexToRgb(settings.couleurPrincipale);
    const totalTVAValue = f.totalTTC - f.totalHT;

    doc.setFillColor(248, 250, 252);
    doc.rect(0, 0, 210, 297, "F");

    doc.setFillColor(r, g, b);
    doc.rect(0, 0, 210, 40, "F");

    drawPdfBrandMark(doc, settings, 14, 10, 18, logoDataUrl);

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text(settings.nom || "Entreprise", 38, 18);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.text(displayWebsite(settings.siteWeb) || settings.email || "", 38, 25);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.text("FACTURE", 196, 18, { align: "right" });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(f.numero, 196, 26, { align: "right" });
    doc.text(new Date(f.dateCreation).toLocaleDateString("fr-FR"), 196, 33, {
      align: "right",
    });

    doc.setFillColor(255, 255, 255);
    doc.roundedRect(14, 52, 84, 42, 3, 3, "F");
    doc.roundedRect(112, 52, 84, 42, 3, 3, "F");

    doc.setTextColor(15, 23, 42);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("Émetteur", 20, 63);
    doc.text("Client", 118, 63);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(71, 85, 105);
    doc.text(settings.adresse || "-", 20, 71);
    doc.text(settings.ville || "-", 20, 77);
    doc.text(`Tél : ${settings.telephone || "-"}`, 20, 83);
    doc.text(`Email : ${settings.email || "-"}`, 20, 89);

    doc.text(f.client || "-", 118, 71);
    doc.text(f.societe || "-", 118, 77);
    doc.text(f.email || "-", 118, 83);
    doc.text(f.telephone || "-", 118, 89);

    autoTable(doc, {
      startY: 108,
      head: [["Référence", "Désignation", "Qté", "PU HT", "Montant HT"]],
      body:
        f.lignes && f.lignes.length > 0
          ? f.lignes.map((l) => [
              l.reference || "-",
              l.designation || "-",
              l.quantite,
              formatEuro(l.prixUnitaire),
              formatEuro(l.quantite * l.prixUnitaire),
            ])
          : [["-", "Facture sans détail de ligne", "-", "-", formatEuro(f.totalHT)]],
      styles: {
        fontSize: 9,
        cellPadding: 3.5,
        lineColor: [226, 232, 240],
        lineWidth: 0.1,
      },
      headStyles: {
        fillColor: [r, g, b],
        textColor: [255, 255, 255],
        fontStyle: "bold",
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
    });

    const finalY = ((doc as AutoTableDoc).lastAutoTable?.finalY ?? 108) + 10;
    const totalBoxY = Math.min(finalY, 198);

    doc.setFillColor(255, 255, 255);
    doc.roundedRect(112, totalBoxY, 84, 48, 3, 3, "F");

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(71, 85, 105);
    doc.text("Total HT", 120, totalBoxY + 12);
    doc.text(formatEuro(f.totalHT), 188, totalBoxY + 12, { align: "right" });
    doc.text("TVA 20%", 120, totalBoxY + 22);
    doc.text(formatEuro(totalTVAValue), 188, totalBoxY + 22, { align: "right" });

    doc.setFillColor(r, g, b);
    doc.roundedRect(112, totalBoxY + 30, 84, 18, 2, 2, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.text("Total TTC", 120, totalBoxY + 42);
    doc.text(formatEuro(f.totalTTC), 188, totalBoxY + 42, { align: "right" });

    doc.setTextColor(15, 23, 42);
    doc.setFontSize(10);
    doc.text("Conditions", 14, 232);

    doc.setFont("helvetica", "normal");
    doc.setTextColor(71, 85, 105);
    doc.setFontSize(10);
    doc.text(`Statut : ${f.statut}`, 14, 241);
    doc.text("Règlement selon les conditions convenues entre les parties.", 14, 249);
    doc.text(`SIRET : ${settings.siret || "-"} · TVA : ${settings.tva || "-"}`, 14, 257);
    doc.text("Merci pour votre confiance.", 14, 278);

    doc.save(`${f.numero}.pdf`);
  }

  async function chargerDevis() {
    const { data, error } = await supabase
      .from("devis")
      .select("*, lignes_devis(*)")
      .order("created_at", { ascending: false });

    if (error) {
      alert("Erreur chargement devis");
      console.error(error);
      return;
    }

    const devisRows = (data as DevisRow[] | null) || [];
    const devisIds = devisRows
      .map((d) => d.id)
      .filter((id): id is string => Boolean(id));
    const lignesParDevis = new Map<string, LigneDevisRow[]>();

    if (devisIds.length > 0) {
      const { data: lignesData, error: lignesError } = await supabase
        .from("lignes_devis")
        .select("*")
        .in("devis_id", devisIds);

      if (lignesError) {
        console.warn("Lignes devis indisponibles:", lignesError);
      } else {
        ((lignesData as LigneDevisRow[] | null) || []).forEach((ligne) => {
          if (!ligne.devis_id) return;
          const lignes = lignesParDevis.get(ligne.devis_id) || [];
          lignes.push(ligne);
          lignesParDevis.set(ligne.devis_id, lignes);
        });
      }
    }

    setDevis(
      devisRows.map((d) => {
        const lignesSource =
          (d.id && lignesParDevis.get(d.id)?.length
            ? lignesParDevis.get(d.id)
            : d.lignes_devis) || [];

        return {
          id: d.id,
          numero: d.numero || "",
          client: d.client || "",
          societe: d.societe || "",
          email: d.email || "",
          telephone: d.telephone || "",
          typeClient: normalizeTypeClient(d.type_client),
          sirenClient: d.siren_client || "",
          siretClient: d.siret_client || "",
          tvaIntracomClient: d.tva_intracom_client || "",
          paysClient: d.pays_client || "",
          adresseCompleteClient: d.adresse_complete_client || "",
          categorieOperation: normalizeCategorieOperation(d.categorie_operation),
          statutEFacture: normalizeStatutEFacture(d.statut_e_facture),
          echeance: d.echeance || "À réception de facture",
          portHT: Number(d.port_ht || 0),
        statut: d.statut || "Brouillon",
        dateCreation: d.date_creation || new Date().toISOString(),
        dateEnvoi: d.date_envoi || undefined,
        dateVue: d.date_vue || undefined,
        derniereVue: d.derniere_vue || undefined,
        nombreVues: Number(d.nombre_vues || 0),
        derniereRelance: d.derniere_relance || undefined,
        publicToken: d.public_token || undefined,
        acompteType: d.acompte_type || "none",
        acompteMontant: Number(d.acompte_montant || 0),
        acomptePourcentage: Number(d.acompte_pourcentage || 0),
        acompteStatut: d.acompte_statut || undefined,
        signataireNom: d.signataire_nom || undefined,
        commentaireClient: d.commentaire_client || undefined,
        dateReponse: d.date_reponse || undefined,
        dateAcceptation: d.date_acceptation || undefined,
        dateRefus: d.date_refus || undefined,
        responseLockedAt: d.response_locked_at || undefined,
        ipReponse: d.ip_reponse || undefined,
        devisVersion: Number(d.devis_version || 1),
        conditionsDevis: d.conditions_devis || "",
        lignes: lignesSource.map(mapLigneDevis),
      };
      })
    );
  }

  function totalHT(lignes: LigneDevis[], port = 0) {
    return lignes.reduce((sum, l) => sum + l.quantite * l.prixUnitaire, 0) + port;
  }

  function totalTVA(lignes: LigneDevis[], port = 0) {
    return totalHT(lignes, port) * 0.2;
  }

  function totalTTC(lignes: LigneDevis[], port = 0) {
    return totalHT(lignes, port) + totalTVA(lignes, port);
  }

  function montantAcompte(d: Devis) {
    const total = totalTTC(d.lignes, d.portHT);

    if (d.acompteType === "percent") {
      return total * (Number(d.acomptePourcentage || 0) / 100);
    }

    if (d.acompteType === "fixed") {
      return Number(d.acompteMontant || 0);
    }

    return 0;
  }

  function getClientLink(d: Devis) {
    if (!d.publicToken) return "";
    if (typeof window === "undefined") return `/devis/${d.publicToken}`;
    return `${window.location.origin}/devis/${d.publicToken}`;
  }

  function apiHeaders() {
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
    };
  }

  async function copierLienClient(d: Devis) {
    const lien = getClientLink(d);

    if (!lien) {
      alert("Ce devis n'a pas encore de lien public. Modifie/enregistre le devis ou crée un nouveau devis.");
      return;
    }

    await navigator.clipboard.writeText(lien);
    alert("Lien client copié.");
  }

  function joursDepuis(date?: string) {
    if (!date) return 0;
    return Math.floor(
      (Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24)
    );
  }

  function statutAuto(d: Devis): Statut {
    if (d.statut === "Accepté" || d.statut === "Refusé") return d.statut;
    if (d.statut === "Brouillon") return "Brouillon";
    return joursDepuis(d.derniereRelance || d.dateEnvoi) >= 3
      ? "À relancer"
      : "Envoyé";
  }

  function facturePourDevis(d: Devis) {
    return factures.find((f) => f.devisId === d.id);
  }

  function pipelineStage(d: Devis): PipelineStage {
    const facture = facturePourDevis(d);

    if (facture?.statut === "Payée") return "Facture payée";
    if (facture?.dateEnvoi) return "Facture envoyée";
    if (d.acompteStatut === "paid") return "Acompte payé";
    if (d.statut === "Accepté" || d.dateAcceptation) return "Accepté";
    if (d.dateVue) return "Vu";
    return "Envoyé";
  }

  function timelineSteps(d: Devis) {
    const facture = facturePourDevis(d);

    return [
      {
        label: "Envoyé",
        done: Boolean(d.dateEnvoi || d.statut !== "Brouillon"),
        detail: d.dateEnvoi ? formatDateTime(d.dateEnvoi) : "",
      },
      {
        label: "Vu",
        done: Boolean(d.dateVue),
        detail: d.dateVue
          ? `${formatDateTime(d.dateVue)}${
              d.nombreVues ? ` · ${d.nombreVues} vue${d.nombreVues > 1 ? "s" : ""}` : ""
            }`
          : "",
      },
      {
        label: "Accepté",
        done: Boolean(d.dateAcceptation || d.statut === "Accepté"),
        detail: d.dateAcceptation
          ? `${formatDateTime(d.dateAcceptation)} · ${d.signataireNom || "Signataire"}`
          : "",
      },
      {
        label: "Acompte payé",
        done: d.acompteStatut === "paid",
        detail: d.acompteStatut === "paid" ? "Paiement confirmé" : "",
      },
      {
        label: "Facture envoyée",
        done: Boolean(facture?.dateEnvoi),
        detail: facture?.dateEnvoi ? formatDateTime(facture.dateEnvoi) : "",
      },
      {
        label: "Facture payée",
        done: facture?.statut === "Payée",
        detail: facture?.statut === "Payée" ? "Réglée" : "",
      },
    ];
  }

  function resetForm() {
    setClient("");
    setSociete("");
    setEmail("");
    setTelephone("");
    setTypeClient("B2B");
    setSirenClient("");
    setSiretClient("");
    setTvaIntracomClient("");
    setPaysClient("France");
    setAdresseCompleteClient("");
    setCategorieOperation("services");
    setEcheance("À réception de facture");
    setConditionsDevis(DEFAULT_CONDITIONS);
    setPortHT(0);
    setAcompteType("none");
    setAcompteMontant(0);
    setAcomptePourcentage(30);
    setPromptIA("");
    setLignes([{ reference: "", designation: "", quantite: 1, prixUnitaire: 0 }]);
    setPreview(null);
    setEditingDevis(null);
    setShowForm(false);
  }

  function updateLigne(index: number, field: keyof LigneDevis, value: string) {
    const copy = [...lignes];

    if (field === "reference" || field === "designation") {
      copy[index][field] = value;
    } else {
      copy[index][field] = Number(value);
    }

    setLignes(copy);
  }

  function appliquerClient(clientId: string) {
    const selected = clients.find((c) => c.id === clientId);
    if (!selected) return;

    setClient(selected.nom);
    setSociete(selected.societe);
    setEmail(selected.email);
    setTelephone(selected.telephone);
    setTypeClient(selected.typeClient);
    setSirenClient(selected.sirenClient);
    setSiretClient(selected.siretClient);
    setTvaIntracomClient(selected.tvaIntracomClient);
    setPaysClient(selected.paysClient || "France");
    setAdresseCompleteClient(
      selected.adresseCompleteClient ||
        [selected.adresse, selected.ville].filter(Boolean).join(", ")
    );
  }

  function appliquerProduit(index: number, produitId: string) {
    const selected = produits.find((p) => p.id === produitId);
    if (!selected) return;

    const copy = [...lignes];
    copy[index] = {
      reference: selected.reference,
      designation: selected.designation || selected.nom,
      quantite: copy[index]?.quantite || 1,
      prixUnitaire: selected.prixUnitaire,
    };

    setLignes(copy);
  }

  function appliquerModele(template: DevisTemplate) {
    setEcheance(template.echeance);
    setConditionsDevis(template.conditions);
    setLignes(template.lignes.map((ligne) => ({ ...ligne })));
    setShowForm(true);
    setPreview(null);
  }

  async function genererAvecIA() {
    if (!promptIA.trim()) {
      alert("Décris la demande client.");
      return;
    }

    setLoadingIA(true);

    try {
      const response = await fetch("/api/generate-devis", {
        method: "POST",
        headers: apiHeaders(),
        body: JSON.stringify({
          prompt: promptIA,
        }),
      });

      const data = (await response.json()) as GeneratedDevis & { error?: string };

      if (!response.ok) {
        console.error(data);
        alert(data?.error || "Erreur de génération côté serveur.");
        setLoadingIA(false);
        return;
      }

      setClient(data.client || "");
      setSociete(data.societe || "");
      setEmail(data.email || "");
      setTelephone(data.telephone || "");
      setEcheance(data.echeance || "À réception de facture");
      setPortHT(Number(data.portHT || 0));

      if (Array.isArray(data.lignes) && data.lignes.length > 0) {
        setLignes(
          data.lignes.map((ligne) => ({
            reference: ligne.reference || "",
            designation: ligne.designation || "",
            quantite: Number(ligne.quantite || 1),
            prixUnitaire: Number(ligne.prixUnitaire || 0),
          }))
        );
      }

      alert("Devis généré.");
    } catch (error) {
      console.error(error);
      alert("Erreur de génération.");
    }

    setLoadingIA(false);
  }

  function genererApercu() {
    setPreview({
      id: editingDevis?.id,
      numero:
        editingDevis?.numero ??
        `DEV-${new Date().getFullYear()}-${String(devis.length + 1).padStart(
          4,
          "0"
        )}`,
      client,
      societe,
      email,
      telephone,
      typeClient,
      sirenClient,
      siretClient,
      tvaIntracomClient,
      paysClient,
      adresseCompleteClient,
      categorieOperation,
      statutEFacture: editingDevis?.statutEFacture ?? "non_transmise",
      echeance,
      conditionsDevis,
      portHT,
      lignes,
      statut: editingDevis?.statut ?? "Brouillon",
      dateCreation: editingDevis?.dateCreation ?? new Date().toISOString(),
      dateEnvoi: editingDevis?.dateEnvoi,
      derniereRelance: editingDevis?.derniereRelance,
      publicToken: editingDevis?.publicToken,
      acompteType,
      acompteMontant: acompteType === "fixed" ? acompteMontant : 0,
      acomptePourcentage: acompteType === "percent" ? acomptePourcentage : 0,
      acompteStatut: editingDevis?.acompteStatut,
      signataireNom: editingDevis?.signataireNom,
      dateAcceptation: editingDevis?.dateAcceptation,
      responseLockedAt: editingDevis?.responseLockedAt,
      ipReponse: editingDevis?.ipReponse,
      commentaireClient: editingDevis?.commentaireClient,
      dateReponse: editingDevis?.dateReponse,
      dateRefus: editingDevis?.dateRefus,
      devisVersion: editingDevis?.devisVersion || 1,
    });
  }

  async function enregistrerDevis() {
    if (!preview) return;

    if (preview.id) {
      await supabase
        .from("devis")
        .update({
          client: preview.client,
          societe: preview.societe,
          email: preview.email,
          telephone: preview.telephone,
          type_client: preview.typeClient,
          siren_client: preview.sirenClient,
          siret_client: preview.siretClient,
          tva_intracom_client: preview.tvaIntracomClient,
          pays_client: preview.paysClient,
          adresse_complete_client: preview.adresseCompleteClient,
          categorie_operation: preview.categorieOperation,
          statut_e_facture: preview.statutEFacture,
          echeance: preview.echeance,
          conditions_devis: preview.conditionsDevis,
          port_ht: preview.portHT,
          statut: preview.statut,
          devis_version: Number(preview.devisVersion || 1) + 1,
          acompte_type: preview.acompteType || "none",
          acompte_montant: preview.acompteType === "fixed" ? preview.acompteMontant || 0 : 0,
          acompte_pourcentage:
            preview.acompteType === "percent" ? preview.acomptePourcentage || 0 : 0,
        })
        .eq("id", preview.id);

      await supabase.from("lignes_devis").delete().eq("devis_id", preview.id);

      await supabase.from("lignes_devis").insert(
        preview.lignes.map((l) => ({
          devis_id: preview.id,
          reference: l.reference,
          designation: l.designation,
          quantite: l.quantite,
          prix_unitaire: l.prixUnitaire,
        }))
      );
    } else {
      const { data, error } = await supabase
        .from("devis")
        .insert({
          user_id: session.user.id,
          numero: preview.numero,
          client: preview.client,
          societe: preview.societe,
          email: preview.email,
          telephone: preview.telephone,
          type_client: preview.typeClient,
          siren_client: preview.sirenClient,
          siret_client: preview.siretClient,
          tva_intracom_client: preview.tvaIntracomClient,
          pays_client: preview.paysClient,
          adresse_complete_client: preview.adresseCompleteClient,
          categorie_operation: preview.categorieOperation,
          statut_e_facture: preview.statutEFacture,
          echeance: preview.echeance,
          conditions_devis: preview.conditionsDevis,
          port_ht: preview.portHT,
          statut: preview.statut,
          date_creation: preview.dateCreation,
          devis_version: 1,
          public_token: preview.publicToken || crypto.randomUUID(),
          acompte_type: preview.acompteType || "none",
          acompte_montant: preview.acompteType === "fixed" ? preview.acompteMontant || 0 : 0,
          acompte_pourcentage:
            preview.acompteType === "percent" ? preview.acomptePourcentage || 0 : 0,
          acompte_statut: "not_required",
        })
        .select()
        .single();

      if (error) {
        alert("Erreur enregistrement devis");
        console.error(error);
        return;
      }

      await supabase.from("lignes_devis").insert(
        preview.lignes.map((l) => ({
          devis_id: data.id,
          reference: l.reference,
          designation: l.designation,
          quantite: l.quantite,
          prix_unitaire: l.prixUnitaire,
        }))
      );
    }

    await chargerDevis();
    resetForm();
  }

  function modifierDevis(d: Devis) {
    setClient(d.client);
    setSociete(d.societe);
    setEmail(d.email);
    setTelephone(d.telephone);
    setTypeClient(d.typeClient);
    setSirenClient(d.sirenClient);
    setSiretClient(d.siretClient);
    setTvaIntracomClient(d.tvaIntracomClient);
    setPaysClient(d.paysClient || "France");
    setAdresseCompleteClient(d.adresseCompleteClient);
    setCategorieOperation(d.categorieOperation);
    setEcheance(d.echeance);
    setConditionsDevis(d.conditionsDevis || DEFAULT_CONDITIONS);
    setPortHT(d.portHT);
    setAcompteType(d.acompteType || "none");
    setAcompteMontant(d.acompteMontant || 0);
    setAcomptePourcentage(d.acomptePourcentage || 30);
    setLignes(d.lignes);
    setEditingDevis(d);
    setShowForm(true);
    setPreview(null);
  }

  async function supprimerDevis(d: Devis) {
    if (!d.id) return;
    await supabase.from("devis").delete().eq("id", d.id);
    await chargerDevis();
  }

  async function marquerEnvoye(d: Devis) {
    if (!d.id) return;
    await supabase
      .from("devis")
      .update({
        statut: "Envoyé",
        date_envoi: new Date().toISOString(),
      })
      .eq("id", d.id);
    await chargerDevis();
  }

  async function marquerAccepte(d: Devis) {
    if (!d.id) return;
    await supabase.from("devis").update({ statut: "Accepté" }).eq("id", d.id);
    await chargerDevis();
  }

  async function marquerRefuse(d: Devis) {
    if (!d.id) return;
    await supabase.from("devis").update({ statut: "Refusé" }).eq("id", d.id);
    await chargerDevis();
  }

  async function relancer(d: Devis) {
    if (!d.id) return;
    await supabase
      .from("devis")
      .update({
        statut: "Envoyé",
        derniere_relance: new Date().toISOString(),
      })
      .eq("id", d.id);
    await chargerDevis();
  }

  async function relancerParEmail(d: Devis) {
    if (!d.id) return;

    if (!d.email) {
      alert("Impossible de relancer : email client manquant.");
      return;
    }

    setRelanceSendingId(d.id);

    const response = await fetch("/api/relance-devis", {
      method: "POST",
      headers: apiHeaders(),
      body: JSON.stringify({
        client: d.client,
        email: d.email,
        numero: d.numero,
        totalHT: totalHT(d.lignes, d.portHT).toFixed(2),
        totalTTC: totalTTC(d.lignes, d.portHT).toFixed(2),
        entreprise: settings,
        acceptUrl: getClientLink(d),
      }),
    });

    setRelanceSendingId(null);
    const data = await readApiResponse(response);

    if (!response.ok) {
      console.error(data);
      alert(apiErrorMessage(data, "Erreur lors de la relance email."));
      return;
    }

    if (data.testFallback && !data.sentToOriginalRecipient) {
      alert(data.warning || "Email redirigé vers l'adresse de test Resend.");
      return;
    }

    await supabase
      .from("devis")
      .update({
        statut: "Envoyé",
        derniere_relance: new Date().toISOString(),
      })
      .eq("id", d.id);

    await chargerDevis();
    alert("Relance envoyée par email.");
  }

  async function envoyerParEmail(d: Devis) {
    if (!d.id) return;

    if (!d.email) {
      alert("Impossible d'envoyer : email client manquant.");
      return;
    }

    setSendingId(d.id);

    const response = await fetch("/api/send-devis", {
      method: "POST",
      headers: apiHeaders(),
      body: JSON.stringify({
        client: d.client,
        email: d.email,
        numero: d.numero,
        totalHT: totalHT(d.lignes, d.portHT).toFixed(2),
        totalTTC: totalTTC(d.lignes, d.portHT).toFixed(2),
        entreprise: settings,
        lignes: d.lignes,
        acceptUrl: getClientLink(d),
        acompteTTC:
          montantAcompte(d) > 0 ? montantAcompte(d).toFixed(2) : null,
      }),
    });

    setSendingId(null);
    const data = await readApiResponse(response);

    if (!response.ok) {
      console.error(data);
      alert(apiErrorMessage(data, "Erreur lors de l'envoi de l'email."));
      return;
    }

    if (data.testFallback && !data.sentToOriginalRecipient) {
      alert(data.warning || "Email redirigé vers l'adresse de test Resend.");
      return;
    }

    await supabase
      .from("devis")
      .update({
        statut: "Envoyé",
        date_envoi: new Date().toISOString(),
      })
      .eq("id", d.id);

    await chargerDevis();
    alert("Devis envoyé par email.");
  }

  async function envoyerFactureParEmail(f: Facture) {
    if (!f.id) return;

    if (!f.email) {
      alert("Impossible d'envoyer : email client manquant.");
      return;
    }

    setFactureSendingId(f.id);

    const response = await fetch("/api/send-facture", {
      method: "POST",
      headers: apiHeaders(),
      body: JSON.stringify({
        factureId: f.id,
      }),
    });

    setFactureSendingId(null);

    const data = await readApiResponse(response);

    if (!response.ok) {
      console.error(data);
      alert(apiErrorMessage(data, "Erreur lors de l'envoi de la facture."));
      return;
    }

    if (data.testFallback && !data.sentToOriginalRecipient) {
      alert(data.warning || "Email redirigé vers l'adresse de test Resend.");
      return;
    }

    await chargerFactures();
    alert("Facture envoyée par email.");
  }

  async function telechargerPDF(d: Devis) {
    const doc = new jsPDF();
    const logoDataUrl = await logoToPngDataUrl(settings.logoUrl);
    const [r, g, b] = hexToRgb(settings.couleurPrincipale);

    const totalHTValue = totalHT(d.lignes, d.portHT);
    const totalTVAValue = totalTVA(d.lignes, d.portHT);
    const totalTTCValue = totalTTC(d.lignes, d.portHT);
    const acompteValue =
      d.acompteType === "percent"
        ? totalTTCValue * (Number(d.acomptePourcentage || 0) / 100)
        : d.acompteType === "fixed"
        ? Number(d.acompteMontant || 0)
        : 0;
    const conditions = (d.conditionsDevis || DEFAULT_CONDITIONS)
      .split("\n")
      .map((condition) => condition.trim())
      .filter(Boolean)
      .slice(0, 4);

    doc.setFillColor(248, 250, 252);
    doc.rect(0, 0, 210, 297, "F");

    doc.setFillColor(r, g, b);
    doc.rect(0, 0, 210, 42, "F");

    drawPdfBrandMark(doc, settings, 14, 11, 18, logoDataUrl);

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text(settings.nom || "Entreprise", 38, 18);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.text(displayWebsite(settings.siteWeb) || settings.email || "", 38, 25);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.text("DEVIS", 196, 18, { align: "right" });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(d.numero, 196, 26, { align: "right" });
    doc.text(`Statut : ${d.statut}`, 196, 33, { align: "right" });

    doc.setFillColor(255, 255, 255);
    doc.roundedRect(14, 54, 84, 48, 3, 3, "F");
    doc.roundedRect(112, 54, 84, 48, 3, 3, "F");

    doc.setTextColor(15, 23, 42);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("Émetteur", 20, 65);
    doc.text("Client", 118, 65);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(71, 85, 105);
    doc.text(settings.adresse || "-", 20, 73);
    doc.text(settings.ville || "-", 20, 79);
    doc.text(`Téléphone : ${settings.telephone || "-"}`, 20, 85);
    doc.text(`Email : ${settings.email || "-"}`, 20, 91);
    doc.text(`SIRET : ${settings.siret || "-"}`, 20, 97);

    doc.text(d.client || "-", 118, 73);
    doc.text(d.societe || "-", 118, 79);
    doc.text(d.email || "-", 118, 85);
    doc.text(d.telephone || "-", 118, 91);
    doc.text(`Validité : 30 jours`, 118, 97);

    autoTable(doc, {
      startY: 116,
      head: [["Référence", "Désignation", "Qté", "PU HT", "Montant HT"]],
      body: d.lignes.map((l) => [
        l.reference || "-",
        l.designation,
        l.quantite,
        formatEuro(l.prixUnitaire),
        formatEuro(l.quantite * l.prixUnitaire),
      ]),
      styles: {
        fontSize: 9,
        cellPadding: 3.5,
        lineColor: [226, 232, 240],
        lineWidth: 0.1,
      },
      headStyles: {
        fillColor: [r, g, b],
        textColor: [255, 255, 255],
        fontStyle: "bold",
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
      columnStyles: {
        0: { cellWidth: 28 },
        1: { cellWidth: 78 },
        2: { cellWidth: 16 },
        3: { cellWidth: 28 },
        4: { cellWidth: 32 },
      },
    });

    const finalY = ((doc as AutoTableDoc).lastAutoTable?.finalY ?? 116) + 10;
    const totalBoxY = Math.min(finalY, 190);

    doc.setFillColor(255, 255, 255);
    doc.roundedRect(112, totalBoxY, 84, 58, 3, 3, "F");

    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    doc.text("Sous-total HT", 120, totalBoxY + 11);
    doc.text(formatEuro(totalHTValue - d.portHT), 188, totalBoxY + 11, {
      align: "right",
    });
    doc.text("Port HT", 120, totalBoxY + 20);
    doc.text(formatEuro(d.portHT), 188, totalBoxY + 20, { align: "right" });
    doc.text("Total HT", 120, totalBoxY + 29);
    doc.text(formatEuro(totalHTValue), 188, totalBoxY + 29, { align: "right" });
    doc.text("TVA 20%", 120, totalBoxY + 38);
    doc.text(formatEuro(totalTVAValue), 188, totalBoxY + 38, { align: "right" });

    doc.setFillColor(r, g, b);
    doc.roundedRect(112, totalBoxY + 44, 84, 14, 2, 2, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.text("Total TTC", 120, totalBoxY + 53);
    doc.text(formatEuro(totalTTCValue), 188, totalBoxY + 53, { align: "right" });

    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(10);
    doc.text("Conditions commerciales", 14, 218);

    doc.setFont("helvetica", "normal");
    doc.setTextColor(71, 85, 105);
    doc.setFontSize(9);
    conditions.forEach((condition, index) => {
      doc.text(condition, 14, 227 + index * 8, { maxWidth: 90 });
    });

    if (acompteValue > 0) {
      doc.text(`Acompte à la validation : ${formatEuro(acompteValue)} TTC.`, 14, 259);
    }

    if (d.signataireNom || d.dateAcceptation || d.responseLockedAt) {
      doc.setFillColor(236, 253, 245);
      doc.roundedRect(14, 258, 84, 22, 2, 2, "F");
      doc.setTextColor(6, 95, 70);
      doc.setFont("helvetica", "bold");
      doc.text("Acceptation enregistrée", 20, 267);
      doc.setFont("helvetica", "normal");
      doc.text(`Signataire : ${d.signataireNom || "-"}`, 20, 274);
    }

    if (!d.signataireNom) {
      doc.setDrawColor(203, 213, 225);
      doc.line(14, 268, 96, 268);
      doc.setTextColor(71, 85, 105);
      doc.text("Signature client précédée de la mention Bon pour accord", 14, 275);
    }

    doc.save(`${d.numero}.pdf`);
  }

  async function telechargerPreuveAcceptationPDF(d: Devis) {
    if (!d.signataireNom && !d.dateAcceptation && d.statut !== "Accepté") {
      alert("La preuve d'acceptation est disponible après acceptation du devis.");
      return;
    }

    const doc = new jsPDF();
    const logoDataUrl = await logoToPngDataUrl(settings.logoUrl);
    const [r, g, b] = hexToRgb(settings.couleurPrincipale);
    const totalHTValue = totalHT(d.lignes, d.portHT);
    const totalTTCValue = totalTTC(d.lignes, d.portHT);
    const responseDate = d.dateReponse || d.dateAcceptation || d.responseLockedAt;

    doc.setFillColor(248, 250, 252);
    doc.rect(0, 0, 210, 297, "F");
    doc.setFillColor(r, g, b);
    doc.rect(0, 0, 210, 42, "F");

    drawPdfBrandMark(doc, settings, 14, 11, 18, logoDataUrl);

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text(settings.nom || "Entreprise", 38, 18);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.text(settings.email || "", 38, 25);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(19);
    doc.text("PREUVE D'ACCEPTATION", 196, 19, { align: "right" });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(d.numero, 196, 29, { align: "right" });

    doc.setFillColor(255, 255, 255);
    doc.roundedRect(14, 56, 182, 58, 3, 3, "F");
    doc.setTextColor(15, 23, 42);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Document", 22, 70);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(71, 85, 105);
    doc.text(`Numéro devis : ${d.numero || "-"}`, 22, 82);
    doc.text(`Version du devis : ${d.devisVersion || 1}`, 22, 90);
    doc.text(`Statut : ${d.statut}`, 22, 98);
    doc.text(`Montant HT : ${formatEuro(totalHTValue)}`, 116, 82);
    doc.text(`Montant TTC : ${formatEuro(totalTTCValue)}`, 116, 90);
    doc.text(`Date du devis : ${formatDateTime(d.dateCreation)}`, 116, 98);

    doc.setFillColor(255, 255, 255);
    doc.roundedRect(14, 124, 182, 76, 3, 3, "F");
    doc.setTextColor(15, 23, 42);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Acceptation client", 22, 138);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(71, 85, 105);
    doc.text(`Nom du signataire : ${d.signataireNom || "-"}`, 22, 150);
    doc.text(`Date et heure : ${formatDateTime(responseDate)}`, 22, 158);
    doc.text(`Adresse IP : ${d.ipReponse || "Non renseignée"}`, 22, 166);
    doc.text(`Client : ${d.client || "-"}${d.societe ? ` / ${d.societe}` : ""}`, 22, 174);
    doc.text(`Email client : ${d.email || "-"}`, 22, 182);

    const commentaire = d.commentaireClient || "Aucun commentaire client.";
    doc.text("Commentaire :", 22, 190);
    doc.text(commentaire, 58, 190, { maxWidth: 126 });

    doc.setFillColor(255, 255, 255);
    doc.roundedRect(14, 212, 182, 48, 3, 3, "F");
    doc.setTextColor(15, 23, 42);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Identité entreprise", 22, 226);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(71, 85, 105);
    doc.text(settings.nom || "-", 22, 238);
    doc.text(settings.adresse || "-", 22, 246);
    doc.text(settings.ville || "-", 22, 254);
    doc.text(`SIRET : ${settings.siret || "-"}`, 116, 238);
    doc.text(`TVA : ${settings.tva || "-"}`, 116, 246);
    doc.text(`Email : ${settings.email || "-"}`, 116, 254);

    doc.setTextColor(100, 116, 139);
    doc.setFontSize(8);
    doc.text(
      "Document généré depuis DevisFlow à partir des données enregistrées au moment de la réponse client.",
      14,
      280
    );

    doc.save(`preuve-acceptation-${d.numero}.pdf`);
  }

  const devisAvecStatutAuto = devis.map((d) => ({
    ...d,
    statutAffiche: statutAuto(d),
  }));

  const devisAcceptes = devisAvecStatutAuto.filter((d) => d.statutAffiche === "Accepté");
  const devisRelance = devisAvecStatutAuto.filter((d) => d.statutAffiche === "À relancer");
  const devisEnvoyes = devisAvecStatutAuto.filter((d) => d.statutAffiche === "Envoyé");
  const devisVus = devisAvecStatutAuto.filter((d) => Boolean(d.dateVue));
  const devisAcomptePaye = devisAvecStatutAuto.filter(
    (d) => d.acompteStatut === "paid"
  );
  const facturesEnvoyees = factures.filter((f) => Boolean(f.dateEnvoi));
  const facturesPayees = factures.filter((f) => f.statut === "Payée");
  const devisParEtape = {
    "Envoyé": devisAvecStatutAuto.filter((d) => pipelineStage(d) === "Envoyé"),
    "Vu": devisAvecStatutAuto.filter((d) => pipelineStage(d) === "Vu"),
    "Accepté": devisAvecStatutAuto.filter((d) => pipelineStage(d) === "Accepté"),
    "Acompte payé": devisAvecStatutAuto.filter(
      (d) => pipelineStage(d) === "Acompte payé"
    ),
    "Facture envoyée": devisAvecStatutAuto.filter(
      (d) => pipelineStage(d) === "Facture envoyée"
    ),
    "Facture payée": devisAvecStatutAuto.filter(
      (d) => pipelineStage(d) === "Facture payée"
    ),
  } satisfies Record<PipelineStage, DevisAvecStatutAuto[]>;

  const chiffreSigne = devisAcceptes.reduce((s, d) => s + totalHT(d.lignes, d.portHT), 0);
  const chiffreFacture = factures.reduce((s, f) => s + f.totalHT, 0);
  const chiffrePaye = factures
    .filter((f) => f.statut === "Payée")
    .reduce((s, f) => s + f.totalHT, 0);

  const montantPotentiel = devisAvecStatutAuto
    .filter((d) => d.statutAffiche === "Envoyé" || d.statutAffiche === "À relancer")
    .reduce((s, d) => s + totalHT(d.lignes, d.portHT), 0);

  const argentARelancer = devisRelance.reduce((s, d) => s + totalHT(d.lignes, d.portHT), 0);

  const tauxAcceptation =
    devis.length === 0 ? 0 : Math.round((devisAcceptes.length / devis.length) * 100);

  const plusGrosDevis = devis.reduce<Devis | null>((max, d) => {
    if (!max) return d;
    return totalHT(d.lignes, d.portHT) > totalHT(max.lignes, max.portHT) ? d : max;
  }, null);

  const meilleurClient = Object.entries(
    devisAcceptes.reduce<Record<string, number>>((acc, d) => {
      const nom = d.societe || d.client || "Client inconnu";
      acc[nom] = (acc[nom] || 0) + totalHT(d.lignes, d.portHT);
      return acc;
    }, {})
  ).sort((a, b) => b[1] - a[1])[0];

  const montantMoyenDevis =
    devis.length === 0
      ? 0
      : devis.reduce((s, d) => s + totalHT(d.lignes, d.portHT), 0) / devis.length;

  const montantMoyenFacture =
    factures.length === 0
      ? 0
      : factures.reduce((s, f) => s + f.totalHT, 0) / factures.length;

  const prochaineAction =
    devisRelance.length > 0
      ? `Relancer ${devisRelance.length} devis`
      : devisEnvoyes.length > 0
      ? "Suivre les devis envoyés"
      : "Créer un nouveau devis";
  const entrepriseOk =
    Boolean(settings.nom?.trim()) &&
    Boolean(settings.email?.trim()) &&
    Boolean(settings.siret?.trim());
  const montantAcomptePreview =
    acompteType === "percent"
      ? totalTTC(lignes, portHT) * (Number(acomptePourcentage || 0) / 100)
      : acompteType === "fixed"
      ? Number(acompteMontant || 0)
      : 0;

  return (
    <main className="min-h-screen bg-slate-950 p-6 text-white md:p-8">
      <div className="mx-auto max-w-7xl">
        <header className="rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-4">
              <BrandAvatar settings={settings} size="large" />
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
                  Activité commerciale
                </p>
                <h1 className="mt-3 text-4xl font-black">
                  {settings.nom || "DevisFlow"}
                </h1>
                <p className="mt-3 max-w-2xl text-slate-300">
                  Suivez les devis envoyés, les accords signés et les montants à
                  relancer depuis une vue claire.
                </p>
                {settings.siteWeb && (
                  <p className="mt-2 text-sm text-slate-500">
                    {displayWebsite(settings.siteWeb)}
                  </p>
                )}
              </div>
            </div>

            <button
              onClick={logout}
              className="rounded-xl border border-slate-700 px-5 py-3 text-slate-200 hover:bg-slate-900"
            >
              Déconnexion
            </button>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-4">
            <Card title="Pipeline potentiel" value={`${montantPotentiel.toFixed(0)} €`} />
            <Card title="Chiffre signé" value={`${chiffreSigne.toFixed(0)} €`} />
            <Card title="Facturé HT" value={`${chiffreFacture.toFixed(0)} €`} />
            <Card title="Prochaine action" value={prochaineAction} />
          </div>
        </header>

        <div className="mt-8 flex flex-wrap gap-3">
          <Tab label="Tableau de bord" active={onglet === "dashboard"} onClick={() => setOnglet("dashboard")} />
          <Tab label="Devis" active={onglet === "devis"} onClick={() => setOnglet("devis")} />
          <Tab label="Clients" active={onglet === "clients"} onClick={() => setOnglet("clients")} />
          <Tab label="Catalogue" active={onglet === "catalogue"} onClick={() => setOnglet("catalogue")} />
          <Tab label="Factures" active={onglet === "factures"} onClick={() => setOnglet("factures")} />
          <Tab label="Tarifs" active={onglet === "tarifs"} onClick={() => setOnglet("tarifs")} />
          <Tab label="Paramètres" active={onglet === "parametres"} onClick={() => setOnglet("parametres")} />
        </div>

        {onglet === "parametres" && (
          <ParametresEntreprise
            settings={settings}
            setSettings={setSettings}
            sauvegarderSettings={sauvegarderSettings}
            onLogoUpload={uploadLogo}
            onLogoRemove={supprimerLogo}
            logoUploading={logoUploading}
          />
        )}


        {onglet === "dashboard" && (
          <>
            <OnboardingPremiersPas
              entrepriseOk={entrepriseOk}
              clientsCount={clients.length}
              produitsCount={produits.length}
              devisCount={devis.length}
              onGoParametres={() => setOnglet("parametres")}
              onGoClients={() => setOnglet("clients")}
              onGoCatalogue={() => setOnglet("catalogue")}
              onGoDevis={() => {
                resetForm();
                setShowForm(true);
                setOnglet("devis");
              }}
            />

            <section className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-4">
              <ActionCard
                title="Nouveau devis"
                description="Préparer une proposition client"
                onClick={() => {
                  resetForm();
                  setShowForm(true);
                  setOnglet("devis");
                }}
              />
              <ActionCard
                title="Pipeline"
                description="Voir les devis par statut"
                onClick={() => setOnglet("dashboard")}
              />
              <ActionCard
                title="Clients"
                description="Gérer la base clients"
                onClick={() => setOnglet("clients")}
              />
              <ActionCard
                title="Catalogue"
                description="Préparer les produits récurrents"
                onClick={() => setOnglet("catalogue")}
              />
            </section>

            <section className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-4">
              <Card title="Potentiel à signer" value={`${montantPotentiel.toFixed(0)} €`} />
              <Card title="Montant accepté" value={`${chiffreSigne.toFixed(0)} €`} />
              <Card title="Facturé HT" value={`${chiffreFacture.toFixed(0)} €`} />
              <Card title="Encaissé HT" value={`${chiffrePaye.toFixed(0)} €`} />
            </section>

            <section className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-6">
              <Card title="Envoyés" value={devisEnvoyes.length} />
              <Card title="Vus" value={devisVus.length} />
              <Card title="Acceptés" value={devisAcceptes.length} />
              <Card title="Acomptes payés" value={devisAcomptePaye.length} />
              <Card title="Factures envoyées" value={facturesEnvoyees.length} />
              <Card title="Factures payées" value={facturesPayees.length} />
            </section>

            <section className="mt-8 rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow">
              <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                <div>
                  <h2 className="text-2xl font-bold">Pipeline commercial</h2>
                  <p className="mt-2 text-slate-400">
                    Les devis sont regroupés par étape pour identifier rapidement
                    les propositions à suivre.
                  </p>
                </div>

                <div className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-200">
                  Prochaine action : {prochaineAction}
                </div>
              </div>

              <div className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-6">
                <PipelineColumn
                  title="Envoyé"
                  devis={devisParEtape["Envoyé"]}
                  totalHT={totalHT}
                />
                <PipelineColumn
                  title="Vu"
                  devis={devisParEtape["Vu"]}
                  totalHT={totalHT}
                />
                <PipelineColumn
                  title="Accepté"
                  devis={devisParEtape["Accepté"]}
                  totalHT={totalHT}
                />
                <PipelineColumn
                  title="Acompte payé"
                  devis={devisParEtape["Acompte payé"]}
                  totalHT={totalHT}
                />
                <PipelineColumn
                  title="Facture envoyée"
                  devis={devisParEtape["Facture envoyée"]}
                  totalHT={totalHT}
                />
                <PipelineColumn
                  title="Facture payée"
                  devis={devisParEtape["Facture payée"]}
                  totalHT={totalHT}
                />
              </div>
            </section>

            <section className="mt-8 rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow">
              <h2 className="text-2xl font-bold">Indicateurs de conversion</h2>
              <p className="mt-2 text-slate-400">
                Quelques repères pour comprendre la performance des devis envoyés.
              </p>

              <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-5">
                <Insight title="Taux d'acceptation" value={`${tauxAcceptation} %`} />
                <Insight title="Devis moyen" value={`${montantMoyenDevis.toFixed(0)} €`} />
                <Insight title="Facture moyenne" value={`${montantMoyenFacture.toFixed(0)} €`} />
                <Insight title="Meilleur client" value={meilleurClient ? `${meilleurClient[0]}` : "-"} />
                <Insight title="Montant à relancer" value={`${argentARelancer.toFixed(0)} €`} />
              </div>
            </section>
          </>
        )}

        {onglet === "factures" && (
          <section className="mt-8 rounded-2xl bg-slate-900 p-6 shadow">
            <h2 className="text-2xl font-bold">Factures détaillées</h2>
            <p className="mt-2 text-slate-400">
              Les factures conservent les lignes du devis : référence, désignation, quantité et prix.
            </p>

            <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
              <Card title="Factures créées" value={factures.length} />
              <Card title="Chiffre facturé HT" value={`${chiffreFacture.toFixed(0)} €`} />
              <Card title="Chiffre payé HT" value={`${chiffrePaye.toFixed(0)} €`} />
            </div>

            <DataTable>
              <thead>
                <tr className="border-b border-slate-700 text-sm text-slate-300">
                  <th className="py-3">Numéro</th>
                  <th>Client</th>
                  <th>Lignes</th>
                  <th>Total HT</th>
                  <th>Total TTC</th>
                  <th>Statut</th>
                  <th>E-facture</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {factures.map((f) => (
                  <tr key={f.id} className="border-b border-slate-800">
                    <td className="py-3">{f.numero}</td>
                    <td>{f.client}</td>
                    <td>{f.lignes?.length || 0}</td>
                    <td>{f.totalHT.toFixed(2)} €</td>
                    <td>{f.totalTTC.toFixed(2)} €</td>
                    <td>{f.statut}</td>
                    <td>{statutEFactureLabel(f.statutEFacture)}</td>
                    <td className="flex flex-wrap gap-2 py-3">
                      {f.statut !== "Payée" && (
                        <button
                          onClick={() => marquerFacturePayee(f)}
                          className="rounded-lg border border-green-500 px-3 py-2 text-green-300"
                        >
                          Marquer payée
                        </button>
                      )}

	                      <button
	                        onClick={() => telechargerFacturePDF(f)}
	                        className="rounded-lg border border-slate-700 px-3 py-2"
	                      >
	                        PDF détaillé
	                      </button>

	                      <button
	                        onClick={() => envoyerFactureParEmail(f)}
	                        disabled={factureSendingId === f.id}
	                        className="rounded-lg border border-blue-500 px-3 py-2 text-blue-300 disabled:opacity-50"
	                      >
	                        {factureSendingId === f.id ? "Envoi..." : "Envoyer"}
	                      </button>

	                      <button
                        onClick={() => supprimerFacture(f)}
                        className="rounded-lg border border-red-500 px-3 py-2 text-red-300"
                      >
                        Supprimer
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </DataTable>
          </section>
        )}

        {onglet === "clients" && (
          <section className="mt-8 rounded-2xl bg-slate-900 p-6 shadow">
            <h2 className="text-2xl font-bold">Base clients</h2>
            <p className="mt-2 text-slate-400">
              Ajoute les clients récurrents pour créer les devis plus vite.
            </p>

            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
              <Input label="Nom" value={newClient.nom} onChange={(v) => setNewClient({ ...newClient, nom: v })} />
              <Input label="Société" value={newClient.societe} onChange={(v) => setNewClient({ ...newClient, societe: v })} />
              <Input label="Email" value={newClient.email} onChange={(v) => setNewClient({ ...newClient, email: v })} />
              <Input label="Téléphone" value={newClient.telephone} onChange={(v) => setNewClient({ ...newClient, telephone: v })} />
              <Input label="Adresse" value={newClient.adresse} onChange={(v) => setNewClient({ ...newClient, adresse: v })} />
              <Input label="Ville" value={newClient.ville} onChange={(v) => setNewClient({ ...newClient, ville: v })} />
              <SelectInput
                label="Type client"
                value={newClient.typeClient}
                options={TYPE_CLIENT_OPTIONS}
                onChange={(v) => setNewClient({ ...newClient, typeClient: v })}
              />
              <Input label="SIREN client" value={newClient.sirenClient} onChange={(v) => setNewClient({ ...newClient, sirenClient: v })} />
              <Input label="SIRET client" value={newClient.siretClient} onChange={(v) => setNewClient({ ...newClient, siretClient: v })} />
              <Input label="TVA intracom client" value={newClient.tvaIntracomClient} onChange={(v) => setNewClient({ ...newClient, tvaIntracomClient: v })} />
              <Input label="Pays client" value={newClient.paysClient} onChange={(v) => setNewClient({ ...newClient, paysClient: v })} />
              <Input label="Adresse complète e-facture" value={newClient.adresseCompleteClient} onChange={(v) => setNewClient({ ...newClient, adresseCompleteClient: v })} />
            </div>

            <button onClick={ajouterClient} className="mt-6 rounded-xl bg-white px-5 py-3 font-semibold text-black">
              + Ajouter client
            </button>

            <DataTable>
              <thead>
                <tr className="border-b border-slate-700 text-sm text-slate-300">
                  <th className="py-3">Nom</th>
                  <th>Société</th>
                  <th>Email</th>
                  <th>Téléphone</th>
                  <th>Type</th>
                  <th>SIREN/SIRET</th>
                  <th>Ville</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {clients.map((c) => (
                  <tr key={c.id} className="border-b border-slate-800">
                    <td className="py-3">{c.nom}</td>
                    <td>{c.societe}</td>
                    <td>{c.email}</td>
                    <td>{c.telephone}</td>
                    <td>{c.typeClient}</td>
                    <td>{c.sirenClient || c.siretClient || "-"}</td>
                    <td>{c.ville}</td>
                    <td>
                      <button onClick={() => supprimerClient(c.id)} className="rounded-lg border border-red-500 px-3 py-2 text-red-300">
                        Supprimer
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </DataTable>
          </section>
        )}

        {onglet === "catalogue" && (
          <section className="mt-8 rounded-2xl bg-slate-900 p-6 shadow">
            <h2 className="text-2xl font-bold">Catalogue produits</h2>
            <p className="mt-2 text-slate-400">
              Ajoute les prestations fréquentes pour remplir les lignes automatiquement.
            </p>

            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-4">
              <Input label="Référence" value={newProduit.reference} onChange={(v) => setNewProduit({ ...newProduit, reference: v })} />
              <Input label="Nom" value={newProduit.nom} onChange={(v) => setNewProduit({ ...newProduit, nom: v })} />
              <Input label="Prix unitaire HT" type="number" value={String(newProduit.prixUnitaire)} onChange={(v) => setNewProduit({ ...newProduit, prixUnitaire: Number(v) })} />
              <Textarea label="Désignation" value={newProduit.designation} onChange={(v) => setNewProduit({ ...newProduit, designation: v })} />
            </div>

            <button onClick={ajouterProduit} className="mt-6 rounded-xl bg-white px-5 py-3 font-semibold text-black">
              + Ajouter produit
            </button>

            <DataTable>
              <thead>
                <tr className="border-b border-slate-700 text-sm text-slate-300">
                  <th className="py-3">Référence</th>
                  <th>Nom</th>
                  <th>Désignation</th>
                  <th>PU HT</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {produits.map((p) => (
                  <tr key={p.id} className="border-b border-slate-800">
                    <td className="py-3">{p.reference}</td>
                    <td>{p.nom}</td>
                    <td>{p.designation}</td>
                    <td>{p.prixUnitaire.toFixed(2)} €</td>
                    <td>
                      <button onClick={() => supprimerProduit(p.id)} className="rounded-lg border border-red-500 px-3 py-2 text-red-300">
                        Supprimer
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </DataTable>
          </section>
        )}

        {onglet === "tarifs" && (
          <section className="mt-8 rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow">
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
                  Offre commerciale
                </p>
                <h2 className="mt-2 text-2xl font-bold">Tarifs recommandés</h2>
                <p className="mt-2 max-w-2xl text-slate-400">
                  Deux offres simples pour vendre DevisFlow à des TPE/PME de services.
                </p>
              </div>
            </div>

            <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2">
              <PricingCard
                name="Essentiel"
                price="19€"
                description="Pour créer, envoyer et faire accepter ses devis plus vite."
                features={[
                  "Devis et factures illimités",
                  "Lien client sécurisé",
                  "Acceptation ou refus en ligne",
                  "Paiement facture Stripe",
                  "Relance manuelle par email",
                ]}
              />
              <PricingCard
                name="Pro"
                price="29€"
                description="Pour accélérer l'accord client et encaisser un acompte."
                highlighted
                features={[
                  "Tout Essentiel",
                  "Acompte Stripe sur devis accepté",
                  "Page devis premium",
                  "Suivi du pipeline commercial",
                  "Préparation aux relances automatiques",
                ]}
              />
            </div>
          </section>
        )}

        {onglet === "devis" && (
          <>
            <section className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-4">
              <Card title="Devis créés" value={devis.length} />
              <Card title="À relancer" value={devisRelance.length} />
              <Card title="Envoyés" value={devisEnvoyes.length} />
              <Card title="Acceptés" value={devisAcceptes.length} />
            </section>

            <section className="mt-8 rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow">
              <h2 className="text-2xl font-bold">Performance des devis</h2>
              <p className="mt-2 text-slate-400">
                Les montants clés pour prioriser les suivis commerciaux.
              </p>

              <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-5">
                <Insight title="Montant accepté" value={`${chiffreSigne.toFixed(0)} €`} />
                <Insight title="À relancer" value={`${argentARelancer.toFixed(0)} €`} />
                <Insight title="Taux d'acceptation" value={`${tauxAcceptation} %`} />
                <Insight title="Plus gros devis" value={plusGrosDevis ? `${totalHT(plusGrosDevis.lignes, plusGrosDevis.portHT).toFixed(0)} €` : "-"} />
                <Insight title="Meilleur client" value={meilleurClient ? `${meilleurClient[0]} — ${meilleurClient[1].toFixed(0)} €` : "-"} />
              </div>
            </section>

            <button onClick={() => { resetForm(); setShowForm(true); }} className="mt-8 rounded-xl bg-white px-5 py-3 font-semibold text-black">
              Nouveau devis
            </button>

            {showForm && (
              <section className="mt-8 rounded-2xl bg-slate-900 p-6 shadow">
                <h2 className="text-2xl font-bold">
                  {editingDevis ? "Modifier le devis" : "Créer un devis"}
                </h2>

                <div className="mt-6 rounded-2xl border border-slate-700 bg-slate-950 p-5">
                  <h3 className="text-xl font-bold">Modèles métier</h3>
                  <p className="mt-2 text-sm text-slate-400">
                    Démarre avec une structure simple, puis ajuste les lignes et
                    conditions au client.
                  </p>
                  <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-4">
                    {DEVIS_TEMPLATES.map((template) => (
                      <button
                        key={template.name}
                        type="button"
                        onClick={() => appliquerModele(template)}
                        className="rounded-xl border border-slate-700 bg-slate-900 p-4 text-left hover:border-slate-500"
                      >
                        <p className="font-semibold text-white">{template.name}</p>
                        <p className="mt-2 text-xs text-slate-400">
                          {template.description}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>

                {clients.length > 0 && (
                  <div className="mt-6">
                    <label className="block">
                      <span className="text-sm text-slate-300">Sélectionner un client existant</span>
                      <select onChange={(e) => appliquerClient(e.target.value)} defaultValue="" className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white">
                        <option value="" disabled>Choisir un client</option>
                        {clients.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.nom} {c.societe ? `— ${c.societe}` : ""}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                )}

                <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
                  <Input label="Nom du client" value={client} onChange={setClient} />
                  <Input label="Société" value={societe} onChange={setSociete} />
                  <Input label="Email" value={email} onChange={setEmail} />
                  <Input label="Téléphone" value={telephone} onChange={setTelephone} />
                  <Input label="Échéance" value={echeance} onChange={setEcheance} />
                  <Input label="Port HT" type="number" value={String(portHT)} onChange={(v) => setPortHT(Number(v))} />
                </div>

                <div className="mt-6 rounded-2xl border border-slate-700 bg-slate-950 p-5">
                  <h3 className="text-xl font-bold">Fondations e-facture</h3>
                  <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
                    <SelectInput
                      label="Type client"
                      value={typeClient}
                      options={TYPE_CLIENT_OPTIONS}
                      onChange={setTypeClient}
                    />
                    <Input label="SIREN client" value={sirenClient} onChange={setSirenClient} />
                    <Input label="SIRET client" value={siretClient} onChange={setSiretClient} />
                    <Input label="TVA intracom client" value={tvaIntracomClient} onChange={setTvaIntracomClient} />
                    <Input label="Pays client" value={paysClient} onChange={setPaysClient} />
                    <SelectInput
                      label="Catégorie opération"
                      value={categorieOperation}
                      options={CATEGORIE_OPERATION_OPTIONS}
                      onChange={setCategorieOperation}
                    />
                  </div>
                  <div className="mt-4">
                    <Input
                      label="Adresse complète client"
                      value={adresseCompleteClient}
                      onChange={setAdresseCompleteClient}
                    />
                  </div>
                  <p className="mt-3 text-sm text-slate-500">
                    Statut e-facture : {statutEFactureLabel("non_transmise")}
                  </p>
                </div>

                <div className="mt-6 rounded-2xl border border-slate-700 bg-slate-950 p-5">
                  <Textarea
                    label="Conditions du devis"
                    value={conditionsDevis}
                    onChange={setConditionsDevis}
                  />
                  <p className="mt-2 text-xs text-slate-500">
                    Ces conditions sont affichées sur le PDF et sur la page client.
                  </p>
                </div>

                <div className="mt-6 rounded-2xl border border-slate-700 bg-slate-950 p-5">
                  <h3 className="text-xl font-bold">Acompte à la validation</h3>
                  <p className="mt-2 text-sm text-slate-400">
                    Optionnel. Si le client accepte le devis, il pourra payer cet acompte depuis le lien sécurisé.
                  </p>

                  <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
                    <label className="block">
                      <span className="text-sm text-slate-300">Type d&apos;acompte</span>
                      <select
                        value={acompteType}
                        onChange={(e) => setAcompteType(e.target.value as AcompteType)}
                        className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white"
                      >
                        <option value="none">Aucun acompte</option>
                        <option value="percent">Pourcentage du TTC</option>
                        <option value="fixed">Montant fixe</option>
                      </select>
                    </label>

                    {acompteType === "percent" && (
                      <Input
                        label="Pourcentage"
                        type="number"
                        value={String(acomptePourcentage)}
                        onChange={(v) => setAcomptePourcentage(Number(v))}
                      />
                    )}

                    {acompteType === "fixed" && (
                      <Input
                        label="Montant acompte TTC"
                        type="number"
                        value={String(acompteMontant)}
                        onChange={(v) => setAcompteMontant(Number(v))}
                      />
                    )}

                    {acompteType !== "none" && (
                      <div className="rounded-xl border border-slate-700 bg-slate-900 p-4">
                        <p className="text-sm text-slate-400">Acompte estimé</p>
                        <p className="mt-1 text-xl font-bold">
                          {montantAcomptePreview.toFixed(2)} € TTC
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-8 rounded-2xl border border-slate-700 bg-slate-950 p-5">
                  <h3 className="text-xl font-bold text-slate-100">Assistant de rédaction</h3>
                  <p className="mt-2 text-sm text-slate-400">
                    Optionnel. Utilise-le seulement pour préparer une première version du devis.
                  </p>
                  <textarea value={promptIA} onChange={(e) => setPromptIA(e.target.value)} placeholder="Exemple : 500 flyers A5 recto verso papier couché 135g" rows={4} className="mt-4 w-full rounded-xl border border-slate-700 bg-slate-900 p-4 text-white outline-none focus:border-violet-400" />
                  <button onClick={genererAvecIA} disabled={loadingIA} className="mt-4 rounded-xl bg-white px-5 py-3 font-semibold text-slate-950 disabled:opacity-50">
                    {loadingIA ? "Génération..." : "Générer une proposition"}
                  </button>
                </div>

                <h3 className="mt-8 text-xl font-semibold">Lignes du devis</h3>

                <div className="mt-4 space-y-4">
                  {lignes.map((ligne, index) => (
                    <div key={index} className="grid grid-cols-1 gap-4 rounded-xl border border-slate-700 p-4 md:grid-cols-5">
                      {produits.length > 0 && (
                        <label className="block">
                          <span className="text-sm text-slate-300">Produit catalogue</span>
                          <select onChange={(e) => appliquerProduit(index, e.target.value)} defaultValue="" className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white">
                            <option value="" disabled>Choisir</option>
                            {produits.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.reference ? `${p.reference} — ` : ""}{p.nom}
                              </option>
                            ))}
                          </select>
                        </label>
                      )}

                      <Input label="Référence" value={ligne.reference} onChange={(v) => updateLigne(index, "reference", v)} />
                      <Textarea label="Désignation" value={ligne.designation} onChange={(v) => updateLigne(index, "designation", v)} />
                      <Input label="Quantité" type="number" value={String(ligne.quantite)} onChange={(v) => updateLigne(index, "quantite", v)} />
                      <Input label="Prix unitaire HT" type="number" value={String(ligne.prixUnitaire)} onChange={(v) => updateLigne(index, "prixUnitaire", v)} />

                      <button onClick={() => setLignes(lignes.filter((_, i) => i !== index))} className="rounded-xl border border-red-500 px-4 py-2 text-red-300">
                        Supprimer ligne
                      </button>
                    </div>
                  ))}
                </div>

                <button onClick={() => setLignes([...lignes, { reference: "", designation: "", quantite: 1, prixUnitaire: 0 }])} className="mt-4 rounded-xl border border-slate-700 px-4 py-2">
                  Ajouter une ligne
                </button>

                <div className="mt-6 rounded-xl bg-slate-800 p-5">
                  <p>HT : {totalHT(lignes, portHT).toFixed(2)} €</p>
                  <p>TVA 20% : {totalTVA(lignes, portHT).toFixed(2)} €</p>
                  <p className="text-xl font-bold">TTC : {totalTTC(lignes, portHT).toFixed(2)} €</p>
                </div>

                <button onClick={genererApercu} className="mt-6 rounded-xl bg-white px-5 py-3 font-semibold text-black">
                  Prévisualiser le devis
                </button>
              </section>
            )}

            {preview && (
              <section className="mt-8 rounded-2xl bg-slate-900 p-8 shadow">
                <h2 className="text-2xl font-bold">Aperçu du devis</h2>
                <p className="mt-2 text-slate-300">{preview.numero}</p>

                <div className="mt-6 flex gap-3">
                  <button onClick={() => telechargerPDF(preview)} className="rounded-xl border border-slate-700 px-5 py-3">
                    Télécharger PDF
                  </button>

                  <button onClick={enregistrerDevis} className="rounded-xl bg-white px-5 py-3 font-semibold text-black">
                    Enregistrer
                  </button>
                </div>
              </section>
            )}

            <section className="mt-8 rounded-2xl bg-slate-900 p-6 shadow">
              <h2 className="text-xl font-bold">Devis récents</h2>
              <p className="mt-2 text-slate-400">
                Priorisez l&apos;envoi, la relance et le suivi client depuis cette liste.
              </p>

              <DataTable>
                <thead>
                  <tr className="border-b border-slate-700 text-sm text-slate-300">
                    <th className="py-3">Numéro</th>
                    <th>Client</th>
                    <th>Montant HT</th>
                    <th>Statut</th>
                    <th>Suivi</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {devisAvecStatutAuto.map((d) => (
                    <tr key={d.numero} className="border-b border-slate-800">
                      <td className="py-3">{d.numero}</td>
                      <td>{d.client}</td>
                      <td>{totalHT(d.lignes, d.portHT).toFixed(2)} €</td>
                      <td>{d.statutAffiche}</td>
                      <td className="min-w-[260px] py-3">
                        <p className="text-sm font-semibold text-white">
                          {pipelineStage(d)}
                        </p>
                        <div className="mt-2 grid gap-1">
                          {timelineSteps(d).map((step) => (
                            <div
                              key={step.label}
                              className="flex items-start gap-2 text-xs text-slate-400"
                            >
                              <span
                                className={`mt-1 h-2 w-2 shrink-0 rounded-full ${
                                  step.done ? "bg-emerald-400" : "bg-slate-700"
                                }`}
                              />
                              <span>
                                <span
                                  className={
                                    step.done ? "text-slate-200" : "text-slate-500"
                                  }
                                >
                                  {step.label}
                                </span>
                                {step.detail && (
                                  <span className="ml-1 text-slate-500">
                                    {step.detail}
                                  </span>
                                )}
                              </span>
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="flex flex-wrap gap-2 py-3">
                        {d.statutAffiche === "Brouillon" && (
                          <button onClick={() => marquerEnvoye(d)} className="rounded-lg border border-slate-700 px-3 py-2">
                            Envoyer
                          </button>
                        )}

                        <button onClick={() => envoyerParEmail(d)} disabled={sendingId === d.id} className="rounded-lg border border-blue-500 px-3 py-2 text-blue-300 disabled:opacity-50">
                          {sendingId === d.id ? "Envoi..." : "Envoyer"}
                        </button>

                        <button onClick={() => relancerParEmail(d)} disabled={relanceSendingId === d.id} className="rounded-lg border border-yellow-500 px-3 py-2 text-yellow-300 disabled:opacity-50">
                          {relanceSendingId === d.id ? "Relance..." : "Relancer par email"}
                        </button>

                        <button onClick={() => copierLienClient(d)} className="rounded-lg border border-violet-500 px-3 py-2 text-violet-300">
                          Copier lien
                        </button>

                        <button onClick={() => transformerEnFacture(d)} className="rounded-lg border border-green-500 px-3 py-2 text-green-300">
                          Transformer en facture
                        </button>

                        {d.statutAffiche === "À relancer" && (
                          <button onClick={() => relancer(d)} className="rounded-lg border border-slate-700 px-3 py-2">
                            Relancer sans email
                          </button>
                        )}

                        <button onClick={() => marquerAccepte(d)} className="rounded-lg border border-slate-700 px-3 py-2">
                          Accepté
                        </button>

                        <button onClick={() => marquerRefuse(d)} className="rounded-lg border border-slate-700 px-3 py-2">
                          Refusé
                        </button>

                        <button onClick={() => telechargerPDF(d)} className="rounded-lg border border-slate-700 px-3 py-2">
                          PDF
                        </button>

                        {(d.statut === "Accepté" || d.signataireNom) && (
                          <button
                            onClick={() => telechargerPreuveAcceptationPDF(d)}
                            className="rounded-lg border border-emerald-500 px-3 py-2 text-emerald-300"
                          >
                            Preuve
                          </button>
                        )}

                        <button onClick={() => modifierDevis(d)} className="rounded-lg border border-slate-700 px-3 py-2">
                          Modifier
                        </button>

                        <button onClick={() => supprimerDevis(d)} className="rounded-lg border border-red-500 px-3 py-2 text-red-300">
                          Supprimer
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </DataTable>
            </section>
          </>
        )}
      </div>
    </main>
  );
}

function Tab({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-xl px-5 py-3 ${
        active ? "bg-white text-black" : "bg-slate-900 text-white hover:bg-slate-800"
      }`}
    >
      {label}
    </button>
  );
}

function BrandAvatar({
  settings,
  size = "normal",
}: {
  settings: Settings;
  size?: "normal" | "large";
}) {
  const dimension = size === "large" ? "h-16 w-16" : "h-12 w-12";
  const textSize = size === "large" ? "text-xl" : "text-base";
  const color = normalizeBrandColor(settings.couleurPrincipale);

  return (
    <div
      className={`${dimension} flex shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-slate-700 bg-slate-950`}
    >
      {settings.logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={settings.logoUrl}
          alt={settings.nom || "Logo entreprise"}
          className="h-full w-full object-contain p-2"
        />
      ) : (
        <span
          className={`flex h-full w-full items-center justify-center font-black text-white ${textSize}`}
          style={{ backgroundColor: color }}
        >
          {initials(settings.nom)}
        </span>
      )}
    </div>
  );
}


function ActionCard({
  title,
  description,
  onClick,
}: {
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="rounded-2xl border border-slate-800 bg-slate-900 p-6 text-left shadow transition hover:border-slate-500 hover:bg-slate-800"
    >
      <p className="text-xl font-bold text-white">{title}</p>
      <p className="mt-2 text-sm text-slate-400">{description}</p>
    </button>
  );
}

function PricingCard({
  name,
  price,
  description,
  features,
  highlighted = false,
}: {
  name: string;
  price: string;
  description: string;
  features: string[];
  highlighted?: boolean;
}) {
  return (
    <article
      className={`rounded-2xl border p-6 ${
        highlighted
          ? "border-white bg-white text-slate-950"
          : "border-slate-800 bg-slate-950 text-white"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-2xl font-bold">{name}</h3>
          <p
            className={`mt-2 text-sm ${
              highlighted ? "text-slate-600" : "text-slate-400"
            }`}
          >
            {description}
          </p>
        </div>
        {highlighted && (
          <span className="rounded-full bg-slate-950 px-3 py-1 text-xs font-semibold text-white">
            Recommandé
          </span>
        )}
      </div>

      <p className="mt-6 text-4xl font-black">
        {price}
        <span
          className={`text-base font-medium ${
            highlighted ? "text-slate-500" : "text-slate-400"
          }`}
        >
          /mois HT
        </span>
      </p>

      <ul className="mt-6 space-y-3 text-sm">
        {features.map((feature) => (
          <li key={feature} className="flex gap-3">
            <span
              className={`mt-2 h-1.5 w-1.5 shrink-0 rounded-full ${
                highlighted ? "bg-slate-950" : "bg-slate-400"
              }`}
            />
            <span>{feature}</span>
          </li>
        ))}
      </ul>
    </article>
  );
}

function PipelineColumn({
  title,
  devis,
  totalHT,
}: {
  title: string;
  devis: DevisAvecStatutAuto[];
  totalHT: (lignes: LigneDevis[], port?: number) => number;
  portKey?: string;
}) {
  const total = devis.reduce((sum, d) => sum + totalHT(d.lignes, d.portHT), 0);

  return (
    <div className="min-h-[280px] rounded-2xl border border-slate-800 bg-slate-950 p-4">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-bold">{title}</h3>
        <span className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-300">
          {devis.length}
        </span>
      </div>

      <p className="mb-4 text-sm text-slate-400">{total.toFixed(0)} € HT</p>

      <div className="space-y-3">
        {devis.length === 0 && (
          <p className="rounded-xl border border-dashed border-slate-800 p-4 text-sm text-slate-500">
            Aucun devis
          </p>
        )}

        {devis.map((d) => (
          <div key={d.id || d.numero} className="rounded-xl border border-slate-800 bg-slate-900 p-4">
            <p className="font-semibold">{d.numero}</p>
            <p className="mt-1 text-sm text-slate-400">{d.client || "Client inconnu"}</p>
            <p className="mt-2 text-sm font-bold text-white">
              {totalHT(d.lignes, d.portHT).toFixed(2)} €
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function Card({ title, value }: { title: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow">
      <p className="text-sm text-slate-400">{title}</p>
      <p className="mt-2 text-2xl font-bold text-white">{value}</p>
    </div>
  );
}

function Insight({ title, value }: { title: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
      <p className="text-sm text-slate-400">{title}</p>
      <p className="mt-2 text-lg font-bold text-white">{value}</p>
    </div>
  );
}

function DataTable({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-8 overflow-x-auto">
      <table className="w-full text-left">{children}</table>
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="text-sm text-slate-300">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-white"
      />
    </label>
  );
}

function SelectInput<T extends string>({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: string }[];
}) {
  return (
    <label className="block">
      <span className="text-sm text-slate-300">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-white"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function Textarea({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-sm text-slate-300">{label}</span>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={4}
        className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-white"
      />
    </label>
  );
}
