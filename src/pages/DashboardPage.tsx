const loadStats = async () => {
    setLoading(true);
    
    // 1. Récupérer l'ID de l'utilisateur actuel via ton utilitaire nexora
    const user = getNexoraUser();
    if (!user || !user.id) {
      setLoading(false);
      return;
    }

    const toXOF = (m: number, dev: string) =>
      dev === "USD" ? convertAmount(m, "USD", "XOF") : m;

    // 2. On ajoute le filtre .eq("user_id", user.id) à CHAQUE requête
    const [depResult, entResult, coffreResult, liensResult, pretsResult, investResult] =
      await Promise.all([
        supabase.from("depenses").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
        supabase.from("entrees").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
        supabase.from("coffre_fort").select("id").eq("user_id", user.id),
        supabase.from("liens_contacts").select("id").eq("user_id", user.id),
        supabase.from("prets" as any).select("id").eq("user_id", user.id).eq("statut", "en_attente"),
        supabase.from("investissements" as any).select("id").eq("user_id", user.id).eq("statut", "actif"),
      ]);

    const deps = depResult.data || [];
    const ents = entResult.data || [];

    const totalEntrees = ents.reduce((s: number, e: any) => s + toXOF(Number(e.montant), e.devise), 0);
    const totalDepenses = deps.reduce((s: number, d: any) => s + toXOF(Number(d.montant), d.devise), 0);

    setStats({
      totalEntrees,
      totalDepenses,
      nbCoffre: coffreResult.data?.length || 0,
      nbLiens: liensResult.data?.length || 0,
      nbPrets: (pretsResult.data as any)?.length || 0,
      nbInvest: (investResult.data as any)?.length || 0,
      dernièresDepenses: deps.slice(0, 4),
      dernièresEntrees: ents.slice(0, 4),
    });
    setLoading(false);
  };
