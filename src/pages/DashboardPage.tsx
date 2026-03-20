{/* ══════════════════════════
    HERO GREETING
══════════════════════════ */}
<div
  className="relative overflow-hidden rounded-xl bg-primary text-primary-foreground shadow-brand-lg"
  style={{ padding: "12px 14px", flexShrink: 0 }}>
  <div className="absolute inset-0 opacity-10 pointer-events-none">
    <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full border-2 border-white" />
    <div className="absolute -bottom-4 right-14 w-20 h-20 rounded-full border-2 border-white" />
  </div>
  <div className="relative flex items-center gap-3">
    <div style={{ flex: 1, minWidth: 0 }}>
      <div
        className="font-display font-black flex items-center gap-1.5"
        style={{
          fontSize: "15px",
          lineHeight: "1.3",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis"
        }}>
        {getGreeting()}, {displayName} ! 👋

        {/* ── Badge Premium / Admin vert brillant ── */}
        {hasBadge && (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "3px",
              flexShrink: 0,
              backgroundColor: "#16a34a",
              color: "white",
              fontSize: "10px",
              fontWeight: 800,
              padding: "2px 7px",
              borderRadius: "999px",
              boxShadow: "0 0 8px 2px #22c55e, 0 0 16px 4px #16a34a88",
              animation: "pulse-green 2s ease-in-out infinite",
              border: "1px solid #22c55e",
              letterSpacing: "0.03em",
            }}>
            {/* Étoile brillante */}
            <span style={{ fontSize: "9px" }}>✦</span>
            {nexoraUser?.is_admin ? "ADMIN" : "PREMIUM"}
          </span>
        )}
      </div>

      <div
        className="text-primary-foreground/70 capitalize"
        style={{
          fontSize: "11px",
          marginTop: "2px",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap"
        }}>
        {getDateStr()}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "4px", marginTop: "4px" }}>
        <Clock style={{ width: 11, height: 11, color: "var(--accent)" }} />
        <span
          className="font-mono font-black"
          style={{ fontSize: "11px", color: "var(--accent)", letterSpacing: "0.1em" }}>
          {clockStr}
        </span>
      </div>
    </div>

    <select
      value={devise}
      onChange={(e) => setDevise(e.target.value as "XOF" | "USD")}
      className="bg-primary-foreground/10 border border-primary-foreground/20 text-primary-foreground rounded-lg font-semibold cursor-pointer"
      style={{ padding: "4px 8px", fontSize: "11px", flexShrink: 0 }}>
      <option value="XOF">XOF</option>
      <option value="USD">USD</option>
    </select>
  </div>
</div>
