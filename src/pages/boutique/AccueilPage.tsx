const load = async () => {
    setLoading(true);
    
    // 1. Récupérer l'utilisateur connecté
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    // 2. Chercher UNIQUEMENT la boutique de cet utilisateur
    const { data: b, error: bError } = await supabase
      .from("boutiques")
      .select("*")
      .eq("user_id", user.id) // FILTRE CRUCIAL
      .maybeSingle(); 

    if (!b || bError) { 
      setLoading(false); 
      setBoutique(null);
      return; 
    }
    setBoutique(b);

    // 3. Charger les commandes et produits liés à CETTE boutique précise
    const [cmdsRes, prodsRes] = await Promise.all([
      supabase.from("commandes").select("*, articles_commande(*)").eq("boutique_id", b.id).order("created_at", { ascending: false }),
      supabase.from("produits").select("*").eq("boutique_id", b.id)
    ]);

    setCommandes(cmdsRes.data || []);
    setProduits(prodsRes.data || []);
    setLoading(false);
  };
