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
  echeance: string;
  portHT: number;
  lignes: LigneDevis[];
  statut: Statut;
  dateCreation: string;
  dateEnvoi?: string;
  derniereRelance?: string;
  publicToken?: string;
  acompteType?: AcompteType;
  acompteMontant?: number;
  acomptePourcentage?: number;
  acompteStatut?: string;
};

type Settings = {
  nom: string;
  adresse: string;
  ville: string;
  telephone: string;
  email: string;
  siret: string;
  tva: string;
};

type Client = {
  id?: string;
  nom: string;
  societe: string;
  email: string;
  telephone: string;
  adresse: string;
  ville: string;
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
  totalHT: number;
  totalTTC: number;
  dateCreation: string;
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
};

type ProduitRow = {
  id?: string;
  reference?: string | null;
  nom?: string | null;
  designation?: string | null;
  prix_unitaire?: number | null;
};

type LigneFactureRow = {
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
  total_ht?: number | null;
  total_ttc?: number | null;
  date_creation?: string | null;
  statut?: Facture["statut"] | null;
  lignes_factures?: LigneFactureRow[] | null;
};

type LigneDevisRow = {
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
  echeance?: string | null;
  port_ht?: number | null;
  statut?: Statut | null;
  date_creation?: string | null;
  date_envoi?: string | null;
  derniere_relance?: string | null;
  public_token?: string | null;
  acompte_type?: AcompteType | null;
  acompte_montant?: number | null;
  acompte_pourcentage?: number | null;
  acompte_statut?: string | null;
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

type AutoTableDoc = jsPDF & {
  lastAutoTable?: {
    finalY: number;
  };
};

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

  const [settings, setSettings] = useState<Settings>({
    nom: "DevisFlow",
    adresse: "12 rue de la Productivité",
    ville: "75000 Paris",
    telephone: "01 00 00 00 00",
    email: "contact@devisflow.fr",
    siret: "123 456 789 00012",
    tva: "FR12 123456789",
  });

  const [client, setClient] = useState("");
  const [societe, setSociete] = useState("");
  const [email, setEmail] = useState("");
  const [telephone, setTelephone] = useState("");
  const [echeance, setEcheance] = useState("À réception de facture");
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

  async function sauvegarderSettings() {
    const { error } = await supabase.from("entreprise_settings").upsert({
      user_id: session.user.id,
      ...settings,
    });

    if (error) {
      alert("Erreur sauvegarde paramètres");
      console.error(error);
      return;
    }

    alert("Paramètres sauvegardés.");
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

    setFactures(
      ((data as FactureRow[] | null) || []).map((f) => ({
        id: f.id,
        devisId: f.devis_id || undefined,
        numero: f.numero || "",
        client: f.client || "",
        societe: f.societe || "",
        email: f.email || "",
        telephone: f.telephone || "",
        totalHT: Number(f.total_ht || 0),
        totalTTC: Number(f.total_ttc || 0),
        dateCreation: f.date_creation || new Date().toISOString(),
        statut: f.statut || "À payer",
        lignes:
          f.lignes_factures?.map((l) => ({
            reference: l.reference || "",
            designation: l.designation || "",
            quantite: Number(l.quantite || 1),
            prixUnitaire: Number(l.prix_unitaire || 0),
          })) || [],
      }))
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

  function telechargerFacturePDF(f: Facture) {
    const doc = new jsPDF();

    doc.setFillColor(8, 14, 28);
    doc.rect(0, 0, 210, 34, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.text("FACTURE", 14, 21);

    doc.setFontSize(10);
    doc.text(f.numero, 150, 15);
    doc.text(new Date(f.dateCreation).toLocaleDateString("fr-FR"), 150, 23);

    doc.setTextColor(0, 0, 0);

    doc.setFontSize(14);
    doc.text(settings.nom || "Entreprise", 14, 49);

    doc.setFontSize(10);
    doc.text(settings.adresse || "-", 14, 57);
    doc.text(settings.ville || "-", 14, 64);
    doc.text(`Tél : ${settings.telephone || "-"}`, 14, 71);
    doc.text(`Email : ${settings.email || "-"}`, 14, 78);
    doc.text(`SIRET : ${settings.siret || "-"}`, 14, 85);
    doc.text(`TVA : ${settings.tva || "-"}`, 14, 92);

    doc.setFontSize(14);
    doc.text("Client", 120, 49);

    doc.setFontSize(10);
    doc.text(f.client || "-", 120, 57);
    doc.text(f.societe || "-", 120, 64);
    doc.text(f.email || "-", 120, 71);
    doc.text(f.telephone || "-", 120, 78);

    autoTable(doc, {
      startY: 110,
      head: [["Référence", "Désignation", "Qté", "PU HT", "Montant HT"]],
      body:
        f.lignes && f.lignes.length > 0
          ? f.lignes.map((l) => [
              l.reference || "-",
              l.designation || "-",
              l.quantite,
              `${l.prixUnitaire.toFixed(2)} €`,
              `${(l.quantite * l.prixUnitaire).toFixed(2)} €`,
            ])
          : [["-", "Facture sans détail de ligne", "-", "-", `${f.totalHT.toFixed(2)} €`]],
      styles: {
        fontSize: 9,
        cellPadding: 3,
      },
      headStyles: {
        fillColor: [8, 14, 28],
      },
    });

    const finalY = ((doc as AutoTableDoc).lastAutoTable?.finalY ?? 110) + 10;

    doc.setFontSize(10);
    doc.text(`Total HT : ${f.totalHT.toFixed(2)} €`, 135, finalY);
    doc.text(`TVA 20% : ${(f.totalTTC - f.totalHT).toFixed(2)} €`, 135, finalY + 8);

    doc.setFontSize(15);
    doc.text(`Total TTC : ${f.totalTTC.toFixed(2)} €`, 135, finalY + 22);

    doc.setFontSize(10);
    doc.text(`Statut : ${f.statut}`, 14, finalY + 28);
    doc.text("Merci pour votre confiance.", 14, 275);

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

    setDevis(
      ((data as DevisRow[] | null) || []).map((d) => ({
        id: d.id,
        numero: d.numero || "",
        client: d.client || "",
        societe: d.societe || "",
        email: d.email || "",
        telephone: d.telephone || "",
        echeance: d.echeance || "À réception de facture",
        portHT: Number(d.port_ht || 0),
        statut: d.statut || "Brouillon",
        dateCreation: d.date_creation || new Date().toISOString(),
        dateEnvoi: d.date_envoi || undefined,
        derniereRelance: d.derniere_relance || undefined,
        publicToken: d.public_token || undefined,
        acompteType: d.acompte_type || "none",
        acompteMontant: Number(d.acompte_montant || 0),
        acomptePourcentage: Number(d.acompte_pourcentage || 0),
        acompteStatut: d.acompte_statut || undefined,
        lignes: (d.lignes_devis || []).map((l) => ({
          reference: l.reference || "",
          designation: l.designation || "",
          quantite: Number(l.quantite || 1),
          prixUnitaire: Number(l.prix_unitaire || 0),
        })),
      }))
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

  function resetForm() {
    setClient("");
    setSociete("");
    setEmail("");
    setTelephone("");
    setEcheance("À réception de facture");
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
      echeance,
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
          echeance: preview.echeance,
          port_ht: preview.portHT,
          statut: preview.statut,
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
          echeance: preview.echeance,
          port_ht: preview.portHT,
          statut: preview.statut,
          date_creation: preview.dateCreation,
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
    setEcheance(d.echeance);
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
      }),
    });

    setRelanceSendingId(null);

    if (!response.ok) {
      const error = await response.json();
      console.error(error);
      alert(error?.error || "Erreur lors de la relance email.");
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
      }),
    });

    setSendingId(null);

    if (!response.ok) {
      const error = await response.json();
      console.error(error);
      alert("Erreur lors de l'envoi de l'email.");
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

  function telechargerPDF(d: Devis) {
    const doc = new jsPDF();

    const totalHTValue = totalHT(d.lignes, d.portHT);
    const totalTVAValue = totalTVA(d.lignes, d.portHT);
    const totalTTCValue = totalTTC(d.lignes, d.portHT);
    const acompteValue =
      d.acompteType === "percent"
        ? totalTTCValue * (Number(d.acomptePourcentage || 0) / 100)
        : d.acompteType === "fixed"
        ? Number(d.acompteMontant || 0)
        : 0;

    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, 210, 36, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.text("Devis", 14, 22);

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(`N° ${d.numero}`, 145, 15);
    doc.text(`Date : ${new Date(d.dateCreation).toLocaleDateString("fr-FR")}`, 145, 22);
    doc.text(`Statut : ${d.statut}`, 145, 29);

    doc.setTextColor(15, 23, 42);
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.text(settings.nom || "Entreprise", 14, 51);

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(71, 85, 105);
    doc.text(settings.adresse || "-", 14, 59);
    doc.text(settings.ville || "-", 14, 66);
    doc.text(`Téléphone : ${settings.telephone || "-"}`, 14, 73);
    doc.text(`Email : ${settings.email || "-"}`, 14, 80);
    doc.text(`SIRET : ${settings.siret || "-"}`, 14, 87);
    doc.text(`TVA : ${settings.tva || "-"}`, 14, 94);

    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(118, 46, 78, 54, 2, 2);

    doc.setTextColor(15, 23, 42);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("Client", 124, 57);

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(71, 85, 105);
    doc.text(d.client || "-", 124, 67);
    doc.text(d.societe || "-", 124, 74);
    doc.text(d.email || "-", 124, 81);
    doc.text(d.telephone || "-", 124, 88);
    doc.text(`Échéance : ${d.echeance || "-"}`, 124, 95);

    autoTable(doc, {
      startY: 114,
      head: [["Référence", "Désignation", "Qté", "PU HT", "Montant HT"]],
      body: d.lignes.map((l) => [
        l.reference || "-",
        l.designation,
        l.quantite,
        `${l.prixUnitaire.toFixed(2)} €`,
        `${(l.quantite * l.prixUnitaire).toFixed(2)} €`,
      ]),
      styles: {
        fontSize: 9,
        cellPadding: 3.5,
        lineColor: [226, 232, 240],
        lineWidth: 0.1,
      },
      headStyles: {
        fillColor: [15, 23, 42],
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

    const finalY = ((doc as AutoTableDoc).lastAutoTable?.finalY ?? 114) + 10;
    const totalBoxY = Math.min(finalY, 194);

    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(118, totalBoxY, 78, 44, 2, 2);

    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    doc.text(`Port HT`, 124, totalBoxY + 10);
    doc.text(`${d.portHT.toFixed(2)} €`, 174, totalBoxY + 10, { align: "right" });
    doc.text(`Total HT`, 124, totalBoxY + 18);
    doc.text(`${totalHTValue.toFixed(2)} €`, 174, totalBoxY + 18, { align: "right" });
    doc.text(`TVA 20%`, 124, totalBoxY + 26);
    doc.text(`${totalTVAValue.toFixed(2)} €`, 174, totalBoxY + 26, { align: "right" });

    doc.setFillColor(15, 23, 42);
    doc.roundedRect(118, totalBoxY + 32, 78, 12, 2, 2, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.text(`Total TTC`, 124, totalBoxY + 40);
    doc.text(`${totalTTCValue.toFixed(2)} €`, 190, totalBoxY + 40, { align: "right" });

    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(10);
    doc.text("Conditions commerciales", 14, 220);

    doc.setFont("helvetica", "normal");
    doc.setTextColor(71, 85, 105);
    doc.setFontSize(9);
    doc.text("Devis valable 30 jours à compter de sa date d'émission.", 14, 229);
    doc.text(`Règlement : ${d.echeance || "selon conditions indiquées"}.`, 14, 237);
    doc.text(
      acompteValue > 0
        ? `Acompte à la validation : ${acompteValue.toFixed(2)} € TTC.`
        : "Acompte : selon conditions convenues.",
      14,
      245
    );
    doc.text("Solde payable selon l'échéance convenue entre les parties.", 14, 253);

    doc.setDrawColor(203, 213, 225);
    doc.line(14, 268, 96, 268);
    doc.setTextColor(71, 85, 105);
    doc.text("Signature client précédée de la mention Bon pour accord", 14, 275);

    doc.save(`${d.numero}.pdf`);
  }

  const devisAvecStatutAuto = devis.map((d) => ({
    ...d,
    statutAffiche: statutAuto(d),
  }));

  const devisAcceptes = devisAvecStatutAuto.filter((d) => d.statutAffiche === "Accepté");
  const devisRelance = devisAvecStatutAuto.filter((d) => d.statutAffiche === "À relancer");
  const devisEnvoyes = devisAvecStatutAuto.filter((d) => d.statutAffiche === "Envoyé");

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
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
                Activité commerciale
              </p>
              <h1 className="mt-3 text-4xl font-black">DevisFlow</h1>
              <p className="mt-3 max-w-2xl text-slate-300">
                Suivez les devis envoyés, les accords signés et les montants à
                relancer depuis une vue claire.
              </p>
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

              <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-5">
                <PipelineColumn
                  title="Brouillons"
                  devis={devisAvecStatutAuto.filter((d) => d.statutAffiche === "Brouillon")}
                  totalHT={totalHT}
                  portKey="portHT"
                />
                <PipelineColumn
                  title="Envoyés"
                  devis={devisAvecStatutAuto.filter((d) => d.statutAffiche === "Envoyé")}
                  totalHT={totalHT}
                  portKey="portHT"
                />
                <PipelineColumn
                  title="À relancer"
                  devis={devisAvecStatutAuto.filter((d) => d.statutAffiche === "À relancer")}
                  totalHT={totalHT}
                  portKey="portHT"
                />
                <PipelineColumn
                  title="Acceptés"
                  devis={devisAvecStatutAuto.filter((d) => d.statutAffiche === "Accepté")}
                  totalHT={totalHT}
                  portKey="portHT"
                />
                <FacturesPipelineColumn factures={factures} />
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

function FacturesPipelineColumn({ factures }: { factures: Facture[] }) {
  const total = factures.reduce((sum, f) => sum + Number(f.totalHT || 0), 0);

  return (
    <div className="min-h-[280px] rounded-2xl border border-slate-800 bg-slate-950 p-4">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-bold">Facturé</h3>
        <span className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-300">
          {factures.length}
        </span>
      </div>

      <p className="mb-4 text-sm text-slate-400">{total.toFixed(0)} € HT</p>

      <div className="space-y-3">
        {factures.length === 0 && (
          <p className="rounded-xl border border-dashed border-slate-800 p-4 text-sm text-slate-500">
            Aucune facture
          </p>
        )}

        {factures.map((f) => (
          <div key={f.id || f.numero} className="rounded-xl border border-slate-800 bg-slate-900 p-4">
            <p className="font-semibold">{f.numero}</p>
            <p className="mt-1 text-sm text-slate-400">{f.client || "Client inconnu"}</p>
            <p className="mt-2 text-sm font-bold text-green-300">
              {Number(f.totalHT || 0).toFixed(2)} €
            </p>
            <p className="mt-1 text-xs text-slate-500">{f.statut}</p>
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
