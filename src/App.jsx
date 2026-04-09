import { useState, useEffect } from "react";

const ROLES = ["Sekretaris", "PIC", "Kadept", "Kadiv", "PIC", "Sekretaris"];
const ROLE_ICONS = ["📋", "👤", "🏢", "🏛️", "👤", "✅"];
const ROLE_COLORS = ["#0F4C81", "#1B6CA8", "#2E7D32", "#C8102E", "#1B6CA8", "#0F4C81"];
const ROLE_ACTIONS = ["Input & Validasi", "Review & Teruskan", "Persetujuan Dept", "Persetujuan Div", "Finalisasi", "Arsip & Kirim"];

const WORK_HOURS_PER_DAY = 8;
const SLA_HOURS = WORK_HOURS_PER_DAY; // 1 hari kerja

function formatDuration(ms) {
  if (!ms) return "-";
  const totalMinutes = Math.floor(ms / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes}m`;
  return `${hours}j ${minutes}m`;
}

function generateId() {
  const date = new Date();
  return `PIP-${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}-${String(Math.floor(Math.random() * 9000) + 1000)}`;
}

const SAMPLE_REQUESTS = [
  {
    id: "PIP-2026-0042",
    title: "Izin Prinsip Pengembangan Sistem Informasi SDM",
    unit: "Divisi Teknologi Informasi",
    priority: "Tinggi",
    submittedAt: new Date(Date.now() - 3 * 3600000).toISOString(),
    currentStep: 2,
    steps: [
      { role: "Sekretaris", startTime: new Date(Date.now() - 3 * 3600000).toISOString(), endTime: new Date(Date.now() - 2.5 * 3600000).toISOString(), status: "done", note: "Dokumen lengkap, diteruskan ke PIC." },
      { role: "PIC", startTime: new Date(Date.now() - 2.5 * 3600000).toISOString(), endTime: new Date(Date.now() - 1.5 * 3600000).toISOString(), status: "done", note: "Review selesai, eskalasi ke Kadiv." },
      { role: "Kadiv", startTime: new Date(Date.now() - 1.5 * 3600000).toISOString(), endTime: null, status: "active", note: "" },
      { role: "PIC", startTime: null, endTime: null, status: "pending", note: "" },
      { role: "Sekretaris", startTime: null, endTime: null, status: "pending", note: "" },
    ],
  },
  {
    id: "PIP-2026-0038",
    title: "Izin Prinsip Kerjasama Vendor Logistik",
    unit: "Divisi Pengadaan",
    priority: "Normal",
    submittedAt: new Date(Date.now() - 26 * 3600000).toISOString(),
    currentStep: 4,
    steps: [
      { role: "Sekretaris", startTime: new Date(Date.now() - 26 * 3600000).toISOString(), endTime: new Date(Date.now() - 25 * 3600000).toISOString(), status: "done", note: "" },
      { role: "PIC", startTime: new Date(Date.now() - 25 * 3600000).toISOString(), endTime: new Date(Date.now() - 17 * 3600000).toISOString(), status: "done", note: "" },
      { role: "Kadiv", startTime: new Date(Date.now() - 17 * 3600000).toISOString(), endTime: new Date(Date.now() - 9 * 3600000).toISOString(), status: "done", note: "Disetujui." },
      { role: "PIC", startTime: new Date(Date.now() - 9 * 3600000).toISOString(), endTime: new Date(Date.now() - 1 * 3600000).toISOString(), status: "done", note: "" },
      { role: "Sekretaris", startTime: new Date(Date.now() - 1 * 3600000).toISOString(), endTime: null, status: "active", note: "" },
    ],
  },
];

export default function PIPApp() {
  const [view, setView] = useState("dashboard");
  const [requests, setRequests] = useState(SAMPLE_REQUESTS);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ dari: "", kepada: "", title: "", unit: "", priority: "Normal", description: "" });
  const [actionNote, setActionNote] = useState("");
  const [tick, setTick] = useState(0);
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    const t = setInterval(() => setTick(x => x + 1), 30000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (notification) {
      const t = setTimeout(() => setNotification(null), 3500);
      return () => clearTimeout(t);
    }
  }, [notification]);

  const notify = (msg, type = "success") => setNotification({ msg, type });

  const submitRequest = () => {
    if (!form.title || !form.unit) return notify("Lengkapi judul dan unit terlebih dahulu.", "error");
    const now = new Date().toISOString();
    const newReq = {
      id: generateId(),
      title: form.title,
      unit: form.unit,
      priority: form.priority,
      submittedAt: now,
      currentStep: 0,
      steps: ROLES.map((role, i) => ({
        role,
        startTime: i === 0 ? now : null,
        endTime: null,
        status: i === 0 ? "active" : "pending",
        note: "",
      })),
    };
    setRequests(prev => [newReq, ...prev]);
    setForm({ title: "", unit: "", priority: "Normal", description: "" });
    notify(`Permohonan ${newReq.id} berhasil dibuat & diteruskan ke Sekretaris.`);
    setView("dashboard");
  };

  const advanceStep = (reqId) => {
    const now = new Date().toISOString();
    setRequests(prev => prev.map(r => {
      if (r.id !== reqId) return r;
      const steps = [...r.steps];
      const cur = r.currentStep;
      steps[cur] = { ...steps[cur], endTime: now, status: "done", note: actionNote };
      const next = cur + 1;
      if (next < steps.length) {
        steps[next] = { ...steps[next], startTime: now, status: "active" };
      }
      const isComplete = next >= steps.length;
      notify(isComplete
        ? `✅ ${reqId} selesai diproses!`
        : `Permohonan diteruskan ke ${ROLES[next]}.`);
      setActionNote("");
      return { ...r, steps, currentStep: isComplete ? cur : next, completed: isComplete };
    }));
  };

  const stats = {
    total: requests.length,
    active: requests.filter(r => !r.completed).length,
    completed: requests.filter(r => r.completed).length,
    breached: requests.filter(r => {
      if (r.completed) return false;
      const step = r.steps[r.currentStep];
      const s = getSLAStatus(step.startTime, null, true);
      return s?.breached;
    }).length,
  };

  const selectedReq = requests.find(r => r.id === selected);

  return (
    <div style={{ fontFamily: "'IBM Plex Sans', 'Segoe UI', sans-serif", background: "#F0F4F8", minHeight: "100vh", color: "#1A2B3C" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@300;400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 6px; } ::-webkit-scrollbar-track { background: #E8EEF4; } ::-webkit-scrollbar-thumb { background: #9DB5CC; border-radius: 3px; }
        .btn { cursor: pointer; border: none; border-radius: 6px; font-family: inherit; font-weight: 600; transition: all .18s; }
        .btn-primary { background: #0F4C81; color: #fff; padding: 10px 20px; font-size: 14px; }
        .btn-primary:hover { background: #0a3460; transform: translateY(-1px); }
        .btn-danger { background: #C8102E; color: #fff; padding: 10px 20px; font-size: 14px; }
        .btn-danger:hover { background: #a00e26; }
        .btn-ghost { background: transparent; color: #0F4C81; border: 1.5px solid #0F4C81; padding: 8px 16px; font-size: 13px; }
        .btn-ghost:hover { background: #0F4C8115; }
        .card { background: #fff; border-radius: 12px; border: 1px solid #D8E4EF; }
        .badge { display: inline-flex; align-items: center; gap: 4px; padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 600; letter-spacing: .04em; }
        .input { width: 100%; padding: 10px 14px; border: 1.5px solid #C8D9EA; border-radius: 8px; font-family: inherit; font-size: 14px; background: #F8FAFC; color: #1A2B3C; outline: none; transition: border .15s; }
        .input:focus { border-color: #0F4C81; background: #fff; }
        .nav-item { display: flex; align-items: center; gap: 8px; padding: 10px 16px; border-radius: 8px; cursor: pointer; font-weight: 500; font-size: 14px; transition: all .15s; color: #4A6A85; }
        .nav-item:hover, .nav-item.active { background: #0F4C8115; color: #0F4C81; }
        .row-item { display: flex; align-items: center; padding: 14px 20px; border-bottom: 1px solid #EEF3F8; cursor: pointer; transition: background .12s; gap: 12px; }
        .row-item:hover { background: #F5F8FC; }
        @keyframes slideIn { from { transform: translateY(-12px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: .5; } }
        .pulse { animation: pulse 2s infinite; }
      `}</style>

      {/* Notification */}
      {notification && (
        <div style={{ position: "fixed", top: 20, right: 20, zIndex: 9999, background: notification.type === "error" ? "#C8102E" : "#0F4C81", color: "#fff", padding: "12px 20px", borderRadius: 10, boxShadow: "0 8px 24px #0003", animation: "slideIn .3s ease", maxWidth: 340, fontSize: 14, fontWeight: 500 }}>
          {notification.msg}
        </div>
      )}

      <div style={{ display: "flex", minHeight: "100vh" }}>
        {/* Sidebar */}
        <aside style={{ width: 220, background: "#0F4C81", display: "flex", flexDirection: "column", padding: "0 0 24px", flexShrink: 0 }}>
          <div style={{ padding: "24px 20px 20px", borderBottom: "1px solid #ffffff18" }}>
            <div style={{ fontSize: 11, letterSpacing: ".1em", color: "#88B8D8", fontWeight: 600, marginBottom: 6 }}>SISTEM PERIZINAN</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: "#fff", lineHeight: 1.2 }}>PIP Workflow</div>
            <div style={{ fontSize: 11, color: "#88B8D8", marginTop: 4 }}>Permohonan Izin Prinsip</div>
          </div>
          <nav style={{ padding: "16px 12px", flex: 1 }}>
            {[
              { key: "dashboard", icon: "📊", label: "Dashboard" },
              { key: "list", icon: "📋", label: "Semua Permohonan" },
              { key: "new", icon: "➕", label: "Buat Permohonan" },
              { key: "sla", icon: "⏱️", label: "Monitor SLA" },
            ].map(n => (
              <div key={n.key} className={`nav-item ${view === n.key || (view === "detail" && n.key === "list") ? "active" : ""}`}
                style={{ color: view === n.key ? "#fff" : "#88B8D8", background: view === n.key ? "#ffffff20" : "" }}
                onClick={() => setView(n.key)}>
                <span>{n.icon}</span> {n.label}
              </div>
            ))}
          </nav>
          <div style={{ padding: "0 16px" }}>
            <div style={{ background: "#ffffff12", borderRadius: 8, padding: "12px 14px" }}>
              <div style={{ fontSize: 11, color: "#88B8D8", marginBottom: 6, fontWeight: 600 }}>INTEGRASI</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {["📧 Outlook", "💬 Teams", "📁 SharePoint"].map(s => (
                  <div key={s} style={{ fontSize: 12, color: "#C8DCEC", display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#4CAF50", display: "inline-block" }}></span>
                    {s}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </aside>

        {/* Main */}
        <main style={{ flex: 1, overflow: "auto", padding: "28px 0px" }}>

          {/* DASHBOARD */}
          {view === "dashboard" && (
            <div>
              <div style={{ marginBottom: 28 }}>
                <h1 style={{ fontSize: 24, fontWeight: 700, color: "#0F4C81" }}>Dashboard PIP</h1>
                <p style={{ color: "#6A8CA0", fontSize: 14, marginTop: 4 }}>Pantau status permohonan izin prinsip secara real-time</p>
              </div>

              {/* Stat Cards */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 28 }}>
                {[
                  { label: "Total Permohonan", value: stats.total, color: "#0F4C81", bg: "#E8F0F8", icon: "📋" },
                  { label: "Sedang Proses", value: stats.active, color: "#1B6CA8", bg: "#E8F2FA", icon: "🔄" },
                  { label: "Selesai", value: stats.completed, color: "#2E7D32", bg: "#E8F5E9", icon: "✅" },
                  { label: "SLA Terlewat", value: stats.breached, color: "#C8102E", bg: "#FDECEA", icon: "⚠️" },
                ].map(s => (
                  <div key={s.label} className="card" style={{ padding: "20px 22px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div>
                        <div style={{ fontSize: 11, color: "#6A8CA0", fontWeight: 600, letterSpacing: ".05em", marginBottom: 8 }}>{s.label.toUpperCase()}</div>
                        <div style={{ fontSize: 32, fontWeight: 700, color: s.color }}>{s.value}</div>
                      </div>
                      <div style={{ background: s.bg, borderRadius: 10, width: 44, height: 44, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>{s.icon}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Workflow Overview */}
              <div className="card" style={{ padding: "24px", marginBottom: 24 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#0F4C81", marginBottom: 20, letterSpacing: ".05em" }}>ALUR PROSES PIP — SLA 1 HARI KERJA/TAHAP</div>
                <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
                  {ROLES.map((role, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", flex: 1 }}>
                      <div style={{ flex: 1, textAlign: "center" }}>
                        <div style={{ width: 52, height: 52, borderRadius: "50%", background: ROLE_COLORS[i], color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, margin: "0 auto 8px" }}>{ROLE_ICONS[i]}</div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: ROLE_COLORS[i] }}>{role}</div>
                        <div style={{ fontSize: 11, color: "#6A8CA0", marginTop: 2 }}>{ROLE_ACTIONS[i]}</div>
                        <div style={{ fontSize: 10, color: "#9DB5CC", marginTop: 4, background: "#F0F4F8", borderRadius: 4, padding: "2px 6px", display: "inline-block" }}>≤ 8 jam kerja</div>
                      </div>
                      {i < ROLES.length - 1 && (
                        <div style={{ color: "#0F4C81", fontSize: 20, flexShrink: 0, margin: "0 4px", marginBottom: 24 }}>→</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent */}
              <div className="card" style={{ overflow: "hidden" }}>
                <div style={{ padding: "18px 20px", borderBottom: "1px solid #EEF3F8", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#0F4C81", letterSpacing: ".05em" }}>PERMOHONAN TERBARU</div>
                  <button className="btn btn-ghost" onClick={() => setView("list")}>Lihat Semua →</button>
                </div>
                {requests.slice(0, 4).map(r => <RequestRow key={r.id} r={r} onSelect={() => { setSelected(r.id); setView("detail"); }} />)}
              </div>
            </div>
          )}

          {/* LIST */}
          {view === "list" && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                <div>
                  <h1 style={{ fontSize: 24, fontWeight: 700, color: "#0F4C81" }}>Semua Permohonan</h1>
                  <p style={{ color: "#6A8CA0", fontSize: 14, marginTop: 4 }}>{requests.length} total permohonan</p>
                </div>
                <button className="btn btn-primary" onClick={() => setView("new")}>+ Buat Permohonan</button>
              </div>
              <div className="card" style={{ overflow: "hidden" }}>
                {requests.length === 0 && <div style={{ padding: 40, textAlign: "center", color: "#9DB5CC" }}>Belum ada permohonan.</div>}
                {requests.map(r => <RequestRow key={r.id} r={r} onSelect={() => { setSelected(r.id); setView("detail"); }} />)}
              </div>
            </div>
          )}

          {/* NEW REQUEST */}
          {view === "new" && (
            <div style={{ width: "100%" }}>
              <h1 style={{ fontSize: 24, fontWeight: 700, color: "#0F4C81", marginBottom: 6 }}>Buat Permohonan Baru</h1>
              <p style={{ color: "#6A8CA0", fontSize: 14, marginBottom: 28 }}>Permohonan akan otomatis diteruskan ke Sekretaris dan alur SLA dimulai.</p>
              <div className="card" style={{ padding: 28 }}>
                {[
                  { label: "Dari", key: "dari", placeholder: "Contoh: Nama Pengirim..." },
            { label: "Kepada", key: "kepada", placeholder: "Contoh: Nama Penerima..." },
            { label: "Judul Permohonan *", key: "title", placeholder: "Contoh: Izin Prinsip Pengembangan Sistem..." },
                  { label: "Unit / Divisi *", key: "unit", placeholder: "Contoh: Divisi Teknologi Informasi" },
                  { label: "Deskripsi Singkat", key: "description", placeholder: "Jelaskan latar belakang dan tujuan permohonan ini..." },
                ].map(f => (
                  <div key={f.key} style={{ marginBottom: 18 }}>
                    <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#3A5A70", marginBottom: 6 }}>{f.label}</label>
                    {f.key === "description"
                      ? <textarea className="input" style={{ minHeight: 80, resize: "vertical" }} placeholder={f.placeholder} value={form[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} />
                      : <input className="input" placeholder={f.placeholder} value={form[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} />
                    }
                  </div>
                ))}
                {/* Auto-routing preview */}
                <div style={{ background: "#F0F4F8", borderRadius: 8, padding: "14px 16px", marginBottom: 24 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#0F4C81", marginBottom: 10 }}>🔁 OTOMATIS DITERUSKAN VIA</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                    {ROLES.map((r, i) => (
                      <span key={i} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <span style={{ fontSize: 12, color: ROLE_COLORS[i], fontWeight: 600 }}>{r}</span>
                        {i < ROLES.length - 1 && <span style={{ color: "#9DB5CC", fontSize: 12 }}>→</span>}
                      </span>
                    ))}
                  </div>
                  <div style={{ fontSize: 11, color: "#6A8CA0", marginTop: 8 }}>📧 Notifikasi Outlook + 💬 Teams dikirim otomatis tiap tahap</div>
                </div>

                <div style={{ display: "flex", gap: 12 }}>
                  <button className="btn btn-primary" style={{ flex: 1 }} onClick={submitRequest}>🚀 Submit & Mulai Alur</button>
                  <button className="btn btn-ghost" onClick={() => setView("dashboard")}>Batal</button>
                </div>
              </div>
            </div>
          )}

          {/* DETAIL */}
          {view === "detail" && selectedReq && (
            <DetailView r={selectedReq} onAdvance={advanceStep} actionNote={actionNote} setActionNote={setActionNote} onBack={() => setView("list")} />
          )}

          {/* SLA MONITOR */}
          {view === "sla" && (
            <div>
              <div style={{ marginBottom: 24 }}>
                <h1 style={{ fontSize: 24, fontWeight: 700, color: "#0F4C81" }}>Monitor SLA</h1>
                <p style={{ color: "#6A8CA0", fontSize: 14, marginTop: 4 }}>Pantau waktu pemrosesan tiap tahap — batas 1 hari kerja (8 jam)</p>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {requests.filter(r => !r.completed).map(r => {
                  const step = r.steps[r.currentStep];
                  const sla = getSLAStatus(step.startTime, null, true);
                  return (
                    <div key={r.id} className="card" style={{ padding: "20px 24px", borderLeft: `4px solid ${sla?.breached ? "#C8102E" : "#0F4C81"}` }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
                        <div>
                          <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 4 }}>
                            <span style={{ fontSize: 12, fontWeight: 700, color: "#0F4C81", fontFamily: "IBM Plex Mono, monospace" }}>{r.id}</span>
                            <PriorityBadge p={r.priority} />
                            {sla?.breached && <span className="badge" style={{ background: "#FDECEA", color: "#C8102E" }}>⚠️ SLA Terlewat</span>}
                          </div>
                          <div style={{ fontSize: 14, fontWeight: 600 }}>{r.title}</div>
                          <div style={{ fontSize: 12, color: "#6A8CA0", marginTop: 2 }}>Saat ini di: <strong>{ROLES[r.currentStep]}</strong> — {ROLE_ACTIONS[r.currentStep]}</div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontSize: 22, fontWeight: 700, color: sla?.breached ? "#C8102E" : "#0F4C81" }}>{sla ? sla.elapsed.toFixed(1) + "j" : "-"}</div>
                          <div style={{ fontSize: 11, color: "#9DB5CC" }}>dari 8 jam SLA</div>
                        </div>
                      </div>
                      <div style={{ background: "#F0F4F8", borderRadius: 6, height: 8, overflow: "hidden" }}>
                        <div style={{ height: "100%", borderRadius: 6, background: sla?.breached ? "#C8102E" : sla?.pct > 75 ? "#FF9800" : "#0F4C81", width: `${sla?.pct || 0}%`, transition: "width .4s" }} />
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#9DB5CC", marginTop: 4 }}>
                        <span>0</span><span>4 jam</span><span>8 jam (batas)</span>
                      </div>

                      {/* Per-step timeline */}
                      <div style={{ marginTop: 16, display: "flex", gap: 6 }}>
                        {r.steps.map((s, i) => {
                          const done = s.status === "done";
                          const active = s.status === "active";
                          const dur = done && s.startTime && s.endTime ? ((new Date(s.endTime) - new Date(s.startTime)) / 3600000).toFixed(1) + "j" : active ? "Aktif" : "-";
                          return (
                            <div key={i} style={{ flex: 1, background: done ? "#E8F5E9" : active ? "#E8F0F8" : "#F0F4F8", borderRadius: 6, padding: "8px 10px", border: active ? "1.5px solid #0F4C81" : "1px solid transparent" }}>
                              <div style={{ fontSize: 10, fontWeight: 700, color: done ? "#2E7D32" : active ? "#0F4C81" : "#9DB5CC" }}>{ROLES[i]}</div>
                              <div style={{ fontSize: 11, fontWeight: 600, color: done ? "#2E7D32" : active ? "#0F4C81" : "#C8D9EA", marginTop: 2 }}>{dur}</div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
                {requests.filter(r => !r.completed).length === 0 && (
                  <div className="card" style={{ padding: 40, textAlign: "center", color: "#9DB5CC" }}>Tidak ada permohonan aktif.</div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

function priorityColor(p) {
  return p === "Mendesak" ? "#C8102E" : p === "Tinggi" ? "#E65100" : "#1B6CA8";
}

function PriorityBadge({ p }) {
  const c = priorityColor(p);
  return <span className="badge" style={{ background: c + "15", color: c }}>{p}</span>;
}

function getSLAStatus(startTime, endTime, isCurrent) {
  if (!startTime) return null;
  const end = endTime ? new Date(endTime) : new Date();
  const elapsed = (end - new Date(startTime)) / (1000 * 60 * 60);
  const pct = Math.min((elapsed / 8) * 100, 100);
  const breached = elapsed > 8;
  return { elapsed, pct, breached, isCurrent };
}

function StatusBadge({ r }) {
  if (r.completed) return <span className="badge" style={{ background: "#E8F5E9", color: "#2E7D32" }}>✅ Selesai</span>;
  const step = r.steps[r.currentStep];
  const sla = getSLAStatus(step.startTime, null, true);
  if (sla?.breached) return <span className="badge" style={{ background: "#FDECEA", color: "#C8102E" }}>⚠️ SLA Terlewat</span>;
  return <span className="badge" style={{ background: "#E8F0F8", color: "#0F4C81" }}>🔄 Proses</span>;
}

function RequestRow({ r, onSelect }) {
  return (
    <div className="row-item" onClick={onSelect}>
      <div style={{ flex: 1 }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 3 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: "#0F4C81", fontFamily: "IBM Plex Mono, monospace" }}>{r.id}</span>
          <PriorityBadge p={r.priority} />
          <StatusBadge r={r} />
        </div>
        <div style={{ fontSize: 14, fontWeight: 600, color: "#1A2B3C" }}>{r.title}</div>
        <div style={{ fontSize: 12, color: "#6A8CA0", marginTop: 2 }}>{r.unit} · {r.completed ? "Selesai" : `Tahap ${r.currentStep + 1}/5: ${ROLES[r.currentStep]}`}</div>
      </div>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        {!r.completed && (
          <div style={{ display: "flex", gap: 4 }}>
            {r.steps.map((s, i) => (
              <div key={i} style={{ width: 10, height: 10, borderRadius: "50%", background: s.status === "done" ? "#2E7D32" : s.status === "active" ? "#0F4C81" : "#C8D9EA" }} />
            ))}
          </div>
        )}
        <span style={{ fontSize: 18, color: "#9DB5CC" }}>›</span>
      </div>
    </div>
  );
}

function DetailView({ r, onAdvance, actionNote, setActionNote, onBack }) {
  const currentRole = ROLES[r.currentStep];
  const currentStep = r.steps[r.currentStep];
  const sla = getSLAStatus(currentStep.startTime, null, true);

  return (
    <div>
      <button className="btn btn-ghost" style={{ marginBottom: 20 }} onClick={onBack}>← Kembali</button>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 20 }}>
        <div>
          <div className="card" style={{ padding: "24px 28px", marginBottom: 20 }}>
            <div style={{ display: "flex", gap: 10, alignItems: "flex-start", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontSize: 12, fontFamily: "IBM Plex Mono, monospace", color: "#0F4C81", fontWeight: 700, marginBottom: 6 }}>{r.id}</div>
                <h2 style={{ fontSize: 20, fontWeight: 700, color: "#0F4C81", marginBottom: 6 }}>{r.title}</h2>
                <div style={{ fontSize: 13, color: "#6A8CA0" }}>{r.unit}</div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <PriorityBadge p={r.priority} />
                <StatusBadge r={r} />
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="card" style={{ padding: "24px 28px", marginBottom: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#0F4C81", letterSpacing: ".05em", marginBottom: 20 }}>ALUR PERMOHONAN</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              {r.steps.map((s, i) => {
                const done = s.status === "done";
                const active = s.status === "active";
                const dur = done && s.startTime && s.endTime
                  ? ((new Date(s.endTime) - new Date(s.startTime)) / 3600000).toFixed(1) + " jam"
                  : active ? "Sedang berlangsung..." : "Menunggu";
                return (
                  <div key={i} style={{ display: "flex", gap: 16, paddingBottom: i < r.steps.length - 1 ? 20 : 0, position: "relative" }}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
                      <div style={{ width: 40, height: 40, borderRadius: "50%", background: done ? "#2E7D32" : active ? ROLE_COLORS[i] : "#E8EEF4", color: done || active ? "#fff" : "#9DB5CC", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 700, border: active ? `3px solid ${ROLE_COLORS[i]}40` : "none", zIndex: 1 }}>
                        {done ? "✓" : active ? <span className="pulse">{ROLE_ICONS[i]}</span> : ROLE_ICONS[i]}
                      </div>
                      {i < r.steps.length - 1 && <div style={{ width: 2, flex: 1, minHeight: 20, background: done ? "#2E7D32" : "#E8EEF4", marginTop: 4 }} />}
                    </div>
                    <div style={{ flex: 1, paddingTop: 8 }}>
                      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        <span style={{ fontSize: 14, fontWeight: 700, color: done ? "#2E7D32" : active ? ROLE_COLORS[i] : "#9DB5CC" }}>{ROLES[i]}</span>
                        <span style={{ fontSize: 11, color: "#9DB5CC" }}>— {ROLE_ACTIONS[i]}</span>
                      </div>
                      <div style={{ fontSize: 12, color: "#6A8CA0", marginTop: 2 }}>⏱ {dur}</div>
                      {s.note && <div style={{ fontSize: 12, color: "#3A5A70", marginTop: 4, background: "#F5F8FC", padding: "6px 10px", borderRadius: 6, borderLeft: "3px solid #0F4C81" }}>"{s.note}"</div>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action panel */}
          {!r.completed && (
            <div className="card" style={{ padding: "24px 28px", borderLeft: "4px solid #0F4C81" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#0F4C81", letterSpacing: ".05em", marginBottom: 16 }}>
                AKSI SEKARANG — {currentRole.toUpperCase()}
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#3A5A70", marginBottom: 6 }}>Catatan (opsional)</label>
                <textarea className="input" style={{ minHeight: 70, resize: "vertical" }} placeholder={`Catatan dari ${currentRole}...`} value={actionNote} onChange={e => setActionNote(e.target.value)} />
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => onAdvance(r.id)}>
                  {r.currentStep < r.steps.length - 1 ? `✅ Selesai & Teruskan ke ${ROLES[r.currentStep + 1]}` : "✅ Selesaikan Permohonan"}
                </button>
              </div>
              <div style={{ fontSize: 11, color: "#9DB5CC", marginTop: 10 }}>📧 Notifikasi Outlook & Teams akan dikirim otomatis ke penerima berikutnya</div>
            </div>
          )}

          {r.completed && (
            <div className="card" style={{ padding: "20px 24px", background: "#F0FFF4", border: "1.5px solid #2E7D32" }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: "#2E7D32" }}>✅ Permohonan Selesai Diproses</div>
              <div style={{ fontSize: 13, color: "#388E3C", marginTop: 6 }}>Dokumen telah diarsipkan ke SharePoint dan notifikasi telah dikirim ke pemohon.</div>
            </div>
          )}
        </div>

        {/* Right panel */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* SLA gauge */}
          {!r.completed && sla && (
            <div className="card" style={{ padding: "20px" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#0F4C81", letterSpacing: ".05em", marginBottom: 14 }}>SLA TAHAP AKTIF</div>
              <div style={{ textAlign: "center", marginBottom: 14 }}>
                <div style={{ fontSize: 36, fontWeight: 700, color: sla.breached ? "#C8102E" : "#0F4C81" }}>{sla.elapsed.toFixed(1)}<span style={{ fontSize: 16 }}>j</span></div>
                <div style={{ fontSize: 12, color: "#9DB5CC" }}>dari 8 jam batas SLA</div>
              </div>
              <div style={{ background: "#F0F4F8", borderRadius: 8, height: 12, overflow: "hidden", marginBottom: 8 }}>
                <div style={{ height: "100%", borderRadius: 8, width: `${sla.pct}%`, background: sla.breached ? "#C8102E" : sla.pct > 75 ? "#FF9800" : "#0F4C81", transition: "width .4s" }} />
              </div>
              <div style={{ fontSize: 11, color: sla.breached ? "#C8102E" : "#6A8CA0", textAlign: "center", fontWeight: 600 }}>
                {sla.breached ? "⚠️ SLA TERLEWAT" : sla.pct > 75 ? "⏳ Hampir batas" : "✅ Dalam batas SLA"}
              </div>
            </div>
          )}

          {/* Progress */}
          <div className="card" style={{ padding: "20px" }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#0F4C81", letterSpacing: ".05em", marginBottom: 14 }}>PROGRESS TAHAP</div>
            <div style={{ display: "flex", gap: 4, marginBottom: 10 }}>
              {r.steps.map((s, i) => (
                <div key={i} style={{ flex: 1, height: 8, borderRadius: 4, background: s.status === "done" ? "#2E7D32" : s.status === "active" ? "#0F4C81" : "#E8EEF4" }} />
              ))}
            </div>
            <div style={{ fontSize: 13, color: "#3A5A70", fontWeight: 600 }}>
              {r.completed ? "Selesai (5/5)" : `Tahap ${r.currentStep + 1} dari 5`}
            </div>
          </div>

          {/* Info */}
          <div className="card" style={{ padding: "20px" }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#0F4C81", letterSpacing: ".05em", marginBottom: 12 }}>INFORMASI</div>
            {[
              { label: "Dibuat", value: new Date(r.submittedAt).toLocaleString("id-ID") },
              { label: "Prioritas", value: r.priority },
              { label: "Unit", value: r.unit },
            ].map(f => (
              <div key={f.label} style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 11, color: "#9DB5CC", fontWeight: 600 }}>{f.label.toUpperCase()}</div>
                <div style={{ fontSize: 13, color: "#3A5A70", fontWeight: 500, marginTop: 2 }}>{f.value}</div>
              </div>
            ))}
          </div>

          {/* M365 integrations */}
          <div className="card" style={{ padding: "20px" }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#0F4C81", letterSpacing: ".05em", marginBottom: 12 }}>NOTIFIKASI OTOMATIS</div>
            {[
              { icon: "📧", label: "Outlook", desc: "Email ke penerima berikutnya" },
              { icon: "💬", label: "Teams", desc: "Pesan ke channel divisi" },
              { icon: "📁", label: "SharePoint", desc: "Arsip dokumen final" },
            ].map(n => (
              <div key={n.label} style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 10 }}>
                <div style={{ fontSize: 20 }}>{n.icon}</div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#3A5A70" }}>{n.label}</div>
                  <div style={{ fontSize: 11, color: "#9DB5CC" }}>{n.desc}</div>
                </div>
                <div style={{ marginLeft: "auto", width: 8, height: 8, borderRadius: "50%", background: "#4CAF50" }} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
