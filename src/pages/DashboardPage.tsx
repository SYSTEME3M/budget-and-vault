const loadStats = async () => {
  setLoading(true);
  
  // 1. Récupération sécurisée de l'utilisateur
  const nexoraUser = getNexoraUser();
  // On utilise l'ID de l'utilisateur connecté via Supabase ou ton utilitaire
  const userId = nexoraUser?.id;

  if (!userId) {
    console.warn("Utilisateur non connecté ou ID manquant");
    setLoading(false);
    return;
  }

  const toXOF = (m: number, dev: string) =>
    dev === "USD" ? convertAmount(m, "USD", "XOF") : m;

  try {
    // 2. Requêtes filtrées par user_id
    const [depRes, entRes, coffreRes, liensRes, pretsRes, investRes] =
      await Promise.all([
        supabase.from("depenses").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
        supabase.from("entrees").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
        supabase.from("coffre_fort").select("id").eq("user_id", userId),
        supabase.from("liens_contacts").select("id").eq("user_id", userId),
        supabase.from("prets" as any).select("id").eq("user_id", userId).eq("statut", "en_attente"),
        supabase.from("investissements" as any).select("id").eq("user_id", userId).eq("statut", "actif"),
      ]);

    const deps = depRes.data || [];
    const ents = entRes.data || [];

    const totalEntrees = ents.reduce((s: number, e: any) => s + toXOF(Number(e.montant), e.devise), 0);
    const totalDepenses = deps.reduce((s: number, d: any) => s + toXOF(Number(d.montant), d.devise), 0);

    setStats({
      totalEntrees,
      totalDepenses,
      nbCoffre: coffreRes.data?.length || 0,
      nbLiens: liensRes.data?.length || 0,
      nbPrets: (pretsRes.data as any)?.length || 0,
      nbInvest: (investRes.data as any)?.length || 0,
      dernièresDepenses: deps.slice(0, 4),
      dernièresEntrees: ents.slice(0, 4),
    });
  } catch (error) {
    console.error("Erreur lors du chargement des stats:", error);
  } finally {
    setLoading(false);
  }
};
