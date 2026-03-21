const handleLogin = async (e) => {
  e.preventDefault();
  if (!code.trim()) return;

  setLoading(true);
  try {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    const userId = params.get("user");

    if (token && userId && !isAdmin) {
      const result = await verifyUserToken(userId, code.trim());

      if (result) {
        setUserSession(userId, result.nom);
        navigate("/dashboard");
      } else {
        setCode("");
      }
    } else {
      const ok = await verifyAccessCode(code.trim());

      if (ok) {
        setSession();
        navigate("/dashboard");
      } else {
        setCode("");
      }
    }
  } catch (err) {
    console.error(err);
  } finally {
    setLoading(false);
  }
};
