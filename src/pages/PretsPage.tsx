import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { formatAmount } from "@/lib/app-utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, FileDown, ChevronDown, ChevronUp, Trash2, HandCoins, Wallet } from "lucide-react";
import SignaturePad from "@/components/SignaturePad";
import AppLayout from "@/components/AppLayout";

// ─── Types ───────────────────────────────────────────────
type Devise = "XOF" | "USD";
type Statut = "en_attente" | "partiel" | "rembourse";
type TypePret = "pret" | "dette";

interface Pret {
  id: string;
  type: TypePret;
  nom_personne: string;
  montant: number;
  montant_rembourse: number;
  devise: Devise;
  objectif: string;
  date_pret: string;
  date_echeance: string | null;
  statut: Statut;
  signature_emprunteur: string | null;
  signature_temoin: string | null;
  signature_preteur: string | null;
  nom_temoin: string | null;
  note: string | null;
}

interface Remboursement {
  id: string;
  pret_id: string;
  montant: number;
  devise: Devise;
  date_remboursement: string;
  note: string | null;
}

// ─── Constantes ──────────────────────────────────────────
const STATUT_LABELS: Record<Statut, string> = {
  en_attente: "En attente",
  partiel: "Partiel",
  rembourse: "Remboursé",
};

const STATUT_COLORS: Record<Statut, string> = {
  en_attente: "bg-yellow-100 text-yellow-800",
  partiel: "bg-blue-100 text-blue-800",
  rembourse: "bg-green-100 text-green-800",
};

// ─── Génération PDF via jsPDF ─────────────────────────────
async function generatePDF(pret: Pret) {
  const { jsPDF } = await import("https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js" as any);
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const W = 210;
  const margin = 20;

  // Couleurs
  const bleu = [26, 86, 219] as [number, number, number];
  const bleuClair = [219, 234, 254] as [number, number, number];
  const gris = [100, 116, 139] as [number, number, number];
  const noir = [15, 23, 42] as [number, number, number];
  const vert = [22, 163, 74] as [number, number, number];

  // ── En-tête coloré
  doc.setFillColor(...bleu);
  doc.rect(0, 0, W, 40, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("CONTRAT DE PRÊT", W / 2, 18, { align: "center" });
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text(pret.type === "pret" ? "Vous êtes le PRÊTEUR" : "Vous êtes l'EMPRUNTEUR", W / 2, 28, { align: "center" });
  doc.text(`Ref: ${pret.id.substring(0, 8).toUpperCase()}`, W / 2, 35, { align: "center" });

  let y = 52;

  // ── Bloc infos principales
  doc.setFillColor(...bleuClair);
  doc.roundedRect(margin, y, W - margin * 2, 48, 3, 3, "F");
  doc.setTextColor(...bleu);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("INFORMATIONS DU CONTRAT", margin + 5, y + 8);

  doc.setTextColor(...noir);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");

  const dateStr = new Date(pret.date_pret).toLocaleDateString("fr-FR", {
    weekday: "long", day: "2-digit", month: "long", year: "numeric",
  });

  const infos = [
    ["Nom de l'autre partie :", pret.nom_personne],
    ["Montant du prêt :", formatAmount(pret.montant, pret.devise)],
    ["Date du prêt :", dateStr],
    ["Objectif :", pret.objectif],
  ];

  infos.forEach(([label, value], i) => {
    const row = y + 16 + i * 8;
    doc.setFont("helvetica", "bold");
    doc.text(label, margin + 5, row);
    doc.setFont("helvetica", "normal");
    doc.text(value, margin + 65, row);
  });

  y += 58;

  // ── Échéance
  if (pret.date_echeance) {
    doc.setFillColor(254, 249, 195);
    doc.roundedRect(margin, y, W - margin * 2, 12, 2, 2, "F");
    doc.setTextColor(133, 77, 14);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    const ech = new Date(pret.date_echeance).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
    doc.text(`Date de remboursement prévue : ${ech}`, margin + 5, y + 8);
    y += 20;
  }

  // ── Corps du contrat
  doc.setTextColor(...noir);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");

  const preteur = pret.type === "pret" ? "Eric Kpakpo" : pret.nom_personne;
  const emprunteur = pret.type === "pret" ? pret.nom_personne : "Eric Kpakpo";

  const texte = [
    `Entre les soussignés :`,
    ``,
    `- Le PRÊTEUR : ${preteur}`,
    `- L'EMPRUNTEUR : ${emprunteur}${pret.nom_temoin ? `\n- TÉMOIN : ${pret.nom_temoin}` : ""}`,
    ``,
    `Il a été convenu ce qui suit :`,
    ``,
    `Article 1 - OBJET DU PRÊT`,
    `Le prêteur consent à prêter à l'emprunteur la somme de`,
    `${formatAmount(pret.montant, pret.devise)} (${pret.objectif}).`,
    ``,
    `Article 2 - REMBOURSEMENT`,
    pret.date_echeance
      ? `L'emprunteur s'engage à rembourser la totalité de la somme au plus tard le ${new Date(pret.date_echeance).toLocaleDateString("fr-FR")}.`
      : `L'emprunteur s'engage à rembourser la totalité de la somme selon les modalités convenues.`,
    ``,
    `Article 3 - BONNE FOI`,
    `Les deux parties s'engagent à respecter les termes du présent contrat`,
    `de bonne foi et à se notifier mutuellement de tout empêchement.`,
  ];

  texte.forEach((ligne) => {
    if (y > 240) { doc.addPage(); y = 20; }
    if (ligne.startsWith("Article")) {
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...bleu);
    } else if (ligne.startsWith("Entre") || ligne.startsWith("Il a") || ligne.startsWith("- Le") || ligne.startsWith("- L'E") || ligne.startsWith("- TÉ")) {
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...noir);
    } else {
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...noir);
    }
    doc.text(ligne, margin, y);
    y += ligne === "" ? 4 : 6;
  });

  y += 8;

  // ── Statut remboursement
  doc.setFillColor(...(pret.statut === "rembourse" ? vert : pret.statut === "partiel" ? [59, 130, 246] : [234, 179, 8]) as [number, number, number]);
  doc.roundedRect(margin, y, W - margin * 2, 12, 2, 2, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text(`Statut : ${STATUT_LABELS[pret.statut]} — Remboursé : ${formatAmount(pret.montant_rembourse, pret.devise)} / ${formatAmount(pret.montant, pret.devise)}`, margin + 5, y + 8);
  y += 22;

  // ── Signatures
  if (y > 220) { doc.addPage(); y = 20; }

  doc.setFillColor(...bleuClair);
  doc.roundedRect(margin, y, W - margin * 2, 8, 2, 2, "F");
  doc.setTextColor(...bleu);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("SIGNATURES", W / 2, y + 5.5, { align: "center" });
  y += 14;

  const sigW = (W - margin * 2 - 10) / 3;

  const drawSigBox = async (title: string, sigData: string | null, nom: string, xPos: number) => {
    doc.setTextColor(...noir);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text(title, xPos + sigW / 2, y, { align: "center" });
    doc.setDrawColor(...bleu);
    doc.roundedRect(xPos, y + 3, sigW, 28, 2, 2);

    if (sigData) {
      try {
        doc.addImage(sigData, "PNG", xPos + 2, y + 5, sigW - 4, 22);
      } catch {}
    } else {
      doc.setTextColor(...gris);
      doc.setFontSize(8);
      doc.setFont("helvetica", "italic");
      doc.text("Non signé", xPos + sigW / 2, y + 18, { align: "center" });
    }

    doc.setTextColor(...noir);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text(nom, xPos + sigW / 2, y + 35, { align: "center" });
  };

  await drawSigBox("PRÊTEUR", pret.signature_preteur, preteur, margin);
  await drawSigBox("EMPRUNTEUR", pret.signature_emprunteur, emprunteur, margin + sigW + 5);
  await drawSigBox("TÉMOIN", pret.signature_temoin, pret.nom_temoin || "—", margin + (sigW + 5) * 2);

  y += 50;

  // ── Pied de page
  const today = new Date().toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
  doc.setFillColor(...bleu);
  doc.rect(0, 282, W, 15, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text(`Document généré le ${today} — Application MES SECRETS — Confidentiel`, W / 2, 291, { align: "center" });

  doc.save(`contrat_pret_${pret.nom_personne.replace(/\s/g, "_")}_${new Date(pret.date_pret).toLocaleDateString("fr-FR").replace(/\//g, "-")}.pdf`);
}

// ─── Composant principal ──────────────────────────────────
export default function PretsPage() {
  const { toast } = useToast();
  const [prets, setPrets] = useState<Pret[]>([]);
  const [remboursements, setRemboursements] = useState<Remboursement[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TypePret>("pret");
  const [showForm, setShowForm] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showRembForm, setShowRembForm] = useState<string | null>(null);

  // Formulaire nouveau prêt
  const [form, setForm] = useState({
    type: "pret" as TypePret,
    nom_personne: "",
    montant: "",
    devise: "XOF" as Devise,
    objectif: "",
    date_echeance: "",
    nom_temoin: "",
    note: "",
    signature_preteur: "",
    signature_emprunteur: "",
    signature_temoin: "",
  });

  // Formulaire remboursement
  const [rembForm, setRembForm] = useState({ montant: "", note: "" });

  // ── Chargement données
  const load = async () => {
    setLoading(true);
    const [{ data: p }, { data: r }] = await Promise.all([
      supabase.from("prets").select("*").order("created_at", { ascending: false }),
      supabase.from("remboursements").select("*").order("date_remboursement", { ascending: false }),
    ]);
    setPrets((p as Pret[]) || []);
    setRemboursements((r as Remboursement[]) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  // ── Ajouter un prêt
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nom_personne || !form.montant || !form.objectif) {
      toast({ title: "Champs requis", description: "Nom, montant et objectif sont obligatoires.", variant: "destructive" });
      return;
    }
    const { error } = await supabase.from("prets").insert({
      type: activeTab,
      nom_personne: form.nom_personne,
      montant: parseFloat(form.montant),
      devise: form.devise,
      objectif: form.objectif,
      date_echeance: form.date_echeance || null,
      nom_temoin: form.nom_temoin || null,
      note: form.note || null,
      signature_preteur: form.signature_preteur || null,
      signature_emprunteur: form.signature_emprunteur || null,
      signature_temoin: form.signature_temoin || null,
    });
    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "✅ Enregistré", description: `${activeTab === "pret" ? "Prêt" : "Dette"} ajouté avec succès !` });
    setShowForm(false);
    setForm({ type: "pret", nom_personne: "", montant: "", devise: "XOF", objectif: "", date_echeance: "", nom_temoin: "", note: "", signature_preteur: "", signature_emprunteur: "", signature_temoin: "" });
    load();
  };

  // ── Ajouter remboursement
  const handleRemboursement = async (pret: Pret) => {
    if (!rembForm.montant) return;
    const montant = parseFloat(rembForm.montant);
    const nouveauTotal = pret.montant_rembourse + montant;
    const nouveauStatut: Statut = nouveauTotal >= pret.montant ? "rembourse" : "partiel";

    const { error } = await supabase.from("remboursements").insert({
      pret_id: pret.id,
      montant,
      devise: pret.devise,
      note: rembForm.note || null,
    });
    if (!error) {
      await supabase.from("prets").update({
        montant_rembourse: nouveauTotal,
        statut: nouveauStatut,
      }).eq("id", pret.id);
      toast({ title: "✅ Remboursement enregistré !" });
      setShowRembForm(null);
      setRembForm({ montant: "", note: "" });
      load();
    }
  };

  // ── Supprimer
  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer ce prêt ?")) return;
    await supabase.from("prets").delete().eq("id", id);
    toast({ title: "Supprimé" });
    load();
  };

  const filteredPrets = prets.filter(p => p.type === activeTab);

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-foreground">Prêts & Dettes</h1>
            <p className="text-sm text-muted-foreground">Gérez vos prêts et dettes avec contrats</p>
          </div>
          <Button onClick={() => { setShowForm(!showForm); setActiveTab(activeTab); }} className="bg-primary text-white gap-1">
            <Plus className="w-4 h-4" /> Nouveau
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex bg-muted rounded-xl p-1">
          {(["pret", "dette"] as TypePret[]).map(tab => (
            <button key={tab} onClick={() => { setActiveTab(tab); setShowForm(false); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === tab ? "bg-white shadow text-primary" : "text-muted-foreground"}`}>
              {tab === "pret" ? <HandCoins className="w-4 h-4" /> : <Wallet className="w-4 h-4" />}
              {tab === "pret" ? "Mes Prêts" : "Mes Dettes"}
            </button>
          ))}
        </div>

        {/* Formulaire nouveau prêt */}
        {showForm && (
          <div className="bg-card border border-border rounded-2xl p-5 space-y-4 shadow-sm">
            <h2 className="font-bold text-lg text-foreground">
              {activeTab === "pret" ? "➕ Nouveau prêt accordé" : "➕ Nouvelle dette"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="text-sm font-medium">Nom de la personne *</label>
                  <Input value={form.nom_personne} onChange={e => setForm({ ...form, nom_personne: e.target.value })} placeholder="Ex: Jean Dupont" className="mt-1" />
                </div>
                <div>
                  <label className="text-sm font-medium">Montant *</label>
                  <Input type="number" value={form.montant} onChange={e => setForm({ ...form, montant: e.target.value })} placeholder="0" className="mt-1" />
                </div>
                <div>
                  <label className="text-sm font-medium">Devise</label>
                  <select value={form.devise} onChange={e => setForm({ ...form, devise: e.target.value as Devise })}
                    className="mt-1 w-full h-10 px-3 rounded-md border border-input bg-background text-sm">
                    <option value="XOF">FCFA (XOF)</option>
                    <option value="USD">Dollar (USD)</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="text-sm font-medium">Objectif du prêt *</label>
                  <Input value={form.objectif} onChange={e => setForm({ ...form, objectif: e.target.value })} placeholder="Ex: Achat de matériel, frais médicaux..." className="mt-1" />
                </div>
                <div>
                  <label className="text-sm font-medium">Date d'échéance</label>
                  <Input type="date" value={form.date_echeance} onChange={e => setForm({ ...form, date_echeance: e.target.value })} className="mt-1" />
                </div>
                <div>
                  <label className="text-sm font-medium">Nom du témoin</label>
                  <Input value={form.nom_temoin} onChange={e => setForm({ ...form, nom_temoin: e.target.value })} placeholder="Nom du témoin" className="mt-1" />
                </div>
                <div className="col-span-2">
                  <label className="text-sm font-medium">Note</label>
                  <Input value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} placeholder="Note optionnelle..." className="mt-1" />
                </div>
              </div>

              {/* Signatures */}
              <div className="space-y-4 pt-2 border-t border-border">
                <p className="font-semibold text-sm text-primary">Signatures</p>
                <SignaturePad label="Signature du Prêteur (Vous - Eric Kpakpo)" onSave={sig => setForm({ ...form, signature_preteur: sig })} />
                <SignaturePad label={`Signature de l'Emprunteur (${form.nom_personne || "..."})`} onSave={sig => setForm({ ...form, signature_emprunteur: sig })} />
                {form.nom_temoin && (
                  <SignaturePad label={`Signature du Témoin (${form.nom_temoin})`} onSave={sig => setForm({ ...form, signature_temoin: sig })} />
                )}
              </div>

              <div className="flex gap-2 pt-2">
                <Button type="submit" className="flex-1 bg-primary text-white">Enregistrer</Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Annuler</Button>
              </div>
            </form>
          </div>
        )}

        {/* Liste des prêts */}
        {loading ? (
          <div className="text-center py-10 text-muted-foreground">Chargement...</div>
        ) : filteredPrets.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground">
            <p className="text-4xl mb-3">{activeTab === "pret" ? "🤝" : "💸"}</p>
            <p>Aucun {activeTab === "pret" ? "prêt" : "dette"} enregistré</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredPrets.map(pret => {
              const reste = pret.montant - pret.montant_rembourse;
              const pct = Math.min((pret.montant_rembourse / pret.montant) * 100, 100);
              const isExpanded = expandedId === pret.id;
              const pretRembs = remboursements.filter(r => r.pret_id === pret.id);

              return (
                <div key={pret.id} className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
                  {/* Header carte */}
                  <div className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-foreground">{pret.nom_personne}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${STATUT_COLORS[pret.statut]}`}>
                            {STATUT_LABELS[pret.statut]}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-0.5">{pret.objectif}</p>
                        <p className="text-lg font-black text-primary mt-1">{formatAmount(pret.montant, pret.devise)}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button size="sm" variant="ghost" onClick={() => generatePDF(pret)} title="Télécharger contrat PDF">
                          <FileDown className="w-4 h-4 text-primary" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => handleDelete(pret.id)}>
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setExpandedId(isExpanded ? null : pret.id)}>
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </Button>
                      </div>
                    </div>

                    {/* Barre de progression */}
                    <div className="mt-3">
                      <div className="flex justify-between text-xs text-muted-foreground mb-1">
                        <span>Remboursé : {formatAmount(pret.montant_rembourse, pret.devise)}</span>
                        <span>Reste : {formatAmount(reste, pret.devise)}</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div className="bg-primary h-2 rounded-full transition-all" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  </div>

                  {/* Détails expandés */}
                  {isExpanded && (
                    <div className="border-t border-border px-4 pb-4 pt-3 space-y-3">
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div><span className="text-muted-foreground">Date :</span> <span className="font-medium">{new Date(pret.date_pret).toLocaleDateString("fr-FR")}</span></div>
                        {pret.date_echeance && <div><span className="text-muted-foreground">Échéance :</span> <span className="font-medium">{new Date(pret.date_echeance).toLocaleDateString("fr-FR")}</span></div>}
                        {pret.nom_temoin && <div><span className="text-muted-foreground">Témoin :</span> <span className="font-medium">{pret.nom_temoin}</span></div>}
                        {pret.note && <div className="col-span-2"><span className="text-muted-foreground">Note :</span> <span className="font-medium">{pret.note}</span></div>}
                      </div>

                      {/* Historique remboursements */}
                      {pretRembs.length > 0 && (
                        <div>
                          <p className="text-sm font-semibold text-foreground mb-2">Historique des remboursements</p>
                          <div className="space-y-1">
                            {pretRembs.map(r => (
                              <div key={r.id} className="flex justify-between items-center text-sm bg-muted/50 rounded-lg px-3 py-2">
                                <span>{new Date(r.date_remboursement).toLocaleDateString("fr-FR")}</span>
                                <span className="font-semibold text-green-600">+{formatAmount(r.montant, r.devise)}</span>
                                {r.note && <span className="text-muted-foreground text-xs">{r.note}</span>}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Formulaire remboursement */}
                      {pret.statut !== "rembourse" && (
                        <>
                          {showRembForm === pret.id ? (
                            <div className="bg-green-50 border border-green-200 rounded-xl p-3 space-y-2">
                              <p className="text-sm font-semibold text-green-800">Ajouter un remboursement</p>
                              <Input
                                type="number"
                                placeholder="Montant remboursé"
                                value={rembForm.montant}
                                onChange={e => setRembForm({ ...rembForm, montant: e.target.value })}
                                className="bg-white"
                              />
                              <Input
                                placeholder="Note (optionnel)"
                                value={rembForm.note}
                                onChange={e => setRembForm({ ...rembForm, note: e.target.value })}
                                className="bg-white"
                              />
                              <div className="flex gap-2">
                                <Button size="sm" className="bg-green-600 text-white flex-1" onClick={() => handleRemboursement(pret)}>
                                  Confirmer
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => setShowRembForm(null)}>Annuler</Button>
                              </div>
                            </div>
                          ) : (
                            <Button size="sm" className="w-full bg-green-600 hover:bg-green-700 text-white" onClick={() => setShowRembForm(pret.id)}>
                              + Enregistrer un remboursement
                            </Button>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
