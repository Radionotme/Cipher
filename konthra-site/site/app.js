(() => {
  const $ = (s) => document.querySelector(s);
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const init = (n) => n.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
  const FILTERS = [
    ["all", "All", () => true],
    ["party", "Party", (c) => c.tags.some((t) => /^(pc|former pc)$/i.test(t))],
    ["foes", "Antagonists", (c) => c.tags.some((t) => /antagonist|adversary/i.test(t))],
    ["dead", "Deceased", (c) => c.statusKind === "dead"],
  ];
  let chars = [], rels = [], byId = {}, filter = "all", cy = null, pushed = false;
  const modal = $("#modal");

  const portrait = (c) => {
    const ini = esc(init(c.name));
    const ok = c.portrait && /^(https?:\/\/|assets\/)/.test(c.portrait);
    return `<div class="por" data-init="${ini}">${ok
      ? `<img src="${esc(c.portrait)}" alt="Portrait of ${esc(c.name)}" loading="lazy" decoding="async">`
      : `<span aria-hidden="true">${ini}</span>`}</div>`;
  };
  // If an image fails to load (typo in the filename, bad URL), fall back to initials.
  document.addEventListener("error", (e) => {
    const img = e.target;
    if (img.tagName === "IMG" && img.parentElement?.classList.contains("por"))
      img.parentElement.innerHTML = `<span aria-hidden="true">${img.parentElement.dataset.init}</span>`;
  }, true);

  function renderGrid() {
    const q = $("#q").value.trim().toLowerCase(), fac = $("#fac").value;
    const test = FILTERS.find((f) => f[0] === filter)[2];
    const list = chars.filter((c) => test(c) && (!fac || c.faction === fac) &&
      (!q || [c.name, ...c.aliases, c.role, c.faction, c.firstLocation, c.currentLocation, ...c.tags].join(" ").toLowerCase().includes(q)));
    $("#grid").innerHTML = list.map((c) => `<a class="card" href="#${esc(c.id)}">${portrait(c)}
      <h2>${esc(c.name)}</h2><div class="role">${esc(c.role)}</div>
      <div class="row"><span class="b ${esc(c.statusKind)}">${esc(c.status || "Unknown")}</span><span class="fc">${esc(c.faction)}</span></div></a>`).join("");
    $("#count").textContent = `${list.length} of ${chars.length} records`;
    $("#empty").hidden = list.length > 0;
  }

  function links(c) {
    return rels.filter((r) => r.source === c.id || r.target === c.id).map((r) => {
      const out = r.source === c.id, other = byId[out ? r.target : r.source];
      return { other, label: out ? r.type : `${r.type} (inverse)`, r };
    });
  }

  function openProfile(c) {
    const L = links(c);
    const fact = (k, v) => v ? `<div><div class="lab">${k}</div>${esc(v)}</div>` : "";
    modal.innerHTML = `<div class="m"><div>${portrait(c)}
      <div class="badges"><span class="b ${esc(c.statusKind)}">${esc(c.status || "Unknown")}</span>${c.faction ? `<span class="b" style="color:var(--vtext)">${esc(c.faction)}</span>` : ""}</div>
      ${L.length ? `<div class="lab" style="margin:20px 0 6px">Web of ties</div><div id="cy" aria-label="Relationship graph for ${esc(c.name)}"></div>` : ""}</div>
      <div><div class="top2"><div><div class="lab">${esc(c.id.toUpperCase())}</div><h2 id="m-name">${esc(c.name)}</h2>
        ${c.aliases.length ? `<div class="ali">Also known as ${esc(c.aliases.join(", "))}</div>` : ""}</div>
        <button class="close" aria-label="Close">✕</button></div>
        <p>${[c.species && `<b>Species</b> ${esc(c.species)}`, c.role && `<b>Role</b> ${esc(c.role)}`].filter(Boolean).join(" &nbsp;·&nbsp; ")}</p>
        <p class="summ">${esc(c.summary)}</p>
        <div class="f facts">${fact("First encounter", [c.firstLocation, c.firstSession].filter(Boolean).join(" · "))}${fact("Last known location", c.currentLocation)}${fact("Disposition", c.disposition)}${fact("Threat level", c.threatLevel)}</div>
        ${L.length ? `<div class="f"><div class="lab" style="margin-bottom:8px">Connections</div>${L.map((x) => `<a class="chip" href="#${esc(x.other.id)}">${esc(x.label)} · ${esc(x.other.name)}</a>`).join("")}</div>` : ""}
        ${c.sessions.length ? `<div class="f"><div class="lab" style="margin-bottom:8px">Session appearances</div>${c.sessions.map((s) => `<span class="chip">${esc(s)}</span>`).join("")}</div>` : ""}
        <div class="f"><button class="share">Copy link to this NPC</button></div></div></div>`;
    modal.querySelector(".close").onclick = closeProfile;
    modal.querySelector(".share").onclick = (e) => navigator.clipboard?.writeText(location.href).then(() => (e.target.textContent = "Link copied"));
    if (!modal.open) modal.showModal();
    modal.scrollTop = 0;
    document.title = `${c.name} · Dramatis Personae`;
    if (L.length && window.cytoscape) drawGraph(c, L);
  }

  function drawGraph(c, L) {
    cy?.destroy();
    const nodes = [c, ...new Set(L.map((x) => x.other))];
    cy = cytoscape({
      container: $("#cy"), userZoomingEnabled: false, userPanningEnabled: false, boxSelectionEnabled: false,
      elements: [
        ...nodes.map((n) => ({ data: { id: n.id, label: n.name } })),
        ...L.map((x) => ({ data: { id: x.r.id, source: x.r.source, target: x.r.target } })),
      ],
      style: [
        { selector: "node", style: { label: "data(label)", color: "#e6e0f0", "font-size": 10, "font-family": "Cinzel, serif", "text-valign": "bottom", "text-margin-y": 4, "background-color": "#2a2536", "border-width": 1.5, "border-color": "#b39cf0", width: 24, height: 24 } },
        { selector: `node[id="${c.id}"]`, style: { "background-color": "#d4b06a", width: 32, height: 32 } },
        { selector: "edge", style: { width: 1.5, "line-color": "#5b4a7e" } },
      ],
      layout: { name: "concentric", concentric: (n) => (n.id() === c.id ? 2 : 1), levelWidth: () => 1, padding: 24 },
    });
    cy.on("tap", "node", (e) => { if (e.target.id() !== c.id) location.hash = e.target.id(); });
  }

  function closeProfile() {
    if (pushed) { history.back(); return; }
    history.replaceState(null, "", location.pathname + location.search);
    syncFromHash();
  }

  function syncFromHash() {
    const c = byId[location.hash.slice(1)];
    if (c) openProfile(c);
    else { if (modal.open) modal.close(); cy?.destroy(); cy = null; document.title = "Dramatis Personae · The Chronicles of Konthra"; }
  }

  window.addEventListener("hashchange", () => { pushed = !!location.hash; syncFromHash(); });
  modal.addEventListener("cancel", (e) => { e.preventDefault(); closeProfile(); });
  modal.addEventListener("click", (e) => { if (e.target === modal) closeProfile(); });

  Promise.all(["data/characters.json", "data/relationships.json"].map((u) => fetch(u).then((r) => r.json())))
    .then(([c, r]) => {
      chars = c; rels = r; byId = Object.fromEntries(c.map((x) => [x.id, x]));
      $("#chips").innerHTML = FILTERS.map((f) => `<button data-f="${f[0]}" aria-pressed="${f[0] === "all"}">${f[1]}</button>`).join("");
      $("#chips").onclick = (e) => { const b = e.target.closest("button"); if (!b) return; filter = b.dataset.f;
        document.querySelectorAll("#chips button").forEach((x) => x.setAttribute("aria-pressed", x === b)); renderGrid(); };
      $("#fac").innerHTML += [...new Set(c.map((x) => x.faction).filter(Boolean))].sort().map((f) => `<option>${esc(f)}</option>`).join("");
      $("#q").oninput = $("#fac").onchange = renderGrid;
      renderGrid(); syncFromHash();
    })
    .catch(() => { $("#empty").hidden = false; $("#empty").textContent = "Could not load the records."; });
})();
