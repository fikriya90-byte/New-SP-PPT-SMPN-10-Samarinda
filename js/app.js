// js/app.js — Modul inti SP-PPT (Firebase Auth + Firestore + helper UI & ekspor)
import { initializeApp, deleteApp } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  updatePassword
} from "https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js";
import {
  getFirestore,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  collection,
  query,
  where
} from "https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js";

// ============================================================================
// KONFIGURASI FIREBASE
// ============================================================================
const firebaseConfig = {
  apiKey: "AIzaSyDczk0n-4QvvwTDikDBnuTkRX_SlXIV9JQ",
  authDomain: "penilaian-proyek-teater-siswa.firebaseapp.com",
  projectId: "penilaian-proyek-teater-siswa",
  storageBucket: "penilaian-proyek-teater-siswa.firebasestorage.app",
  messagingSenderId: "278312873930",
  appId: "1:278312873930:web:99b43c8d1f923e94a2e933"
};

// Jika data Anda ada di database default, ganti argumen kedua menjadi "(default)"
const FIRESTORE_DB_ID = "penilaian-proyek-teater-siswa";

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, FIRESTORE_DB_ID);

// ============================================================================
// KONSTANTA
// ============================================================================
export const COLS = {
  USERS: "users",
  CLASSES: "classes",
  GROUPS: "groups",
  TASKS: "tasks",
  ASSESSMENTS: "assessments",
  STAGES: "stages",
  SCRIPTS: "scripts",
  REFERENCES: "references",
  SUBMISSIONS: "submissions",
  BROADCASTS: "broadcasts",
  ATTENDANCE: "attendance",
  BLOCKING: "blocking",
  INVENTORY: "inventory",
  FINANCE: "finance",
  AUDIENCE: "audience",
  SETTINGS: "settings"
};

export const PRODUCTION_STAGES = [
  { key: "PERSIAPAN", label: "1. Persiapan", desc: "Naskah, casting, dan perencanaan produksi." },
  { key: "PELAKSANAAN", label: "2. Pelaksanaan", desc: "Latihan, bloking, dan penggarapan artistik." },
  { key: "PERTUNJUKAN", label: "3. Pertunjukan", desc: "Gladi bersih dan pementasan." },
  { key: "PASCA", label: "4. Pasca-Produksi", desc: "Evaluasi, rapor, dan pengarsipan." }
];

export const RUBRIC_ASPECTS = [
  {
    key: "disiplin", label: "Disiplin",
    desc: "Ketepatan waktu, kehadiran latihan, dan kepatuhan pada jadwal.",
    levels: { excellent: "Sangat disiplin, tidak pernah terlambat", good: "Disiplin, hadir hampir penuh", fair: "Cukup, beberapa kali terlambat/izin", poor: "Kurang, sering alpa atau terlambat" }
  },
  {
    key: "kolaborasi", label: "Kolaborasi",
    desc: "Kerja sama dengan anggota tim dan komunikasi dalam kelompok.",
    levels: { excellent: "Sangat kolaboratif, aktif membantu tim", good: "Baik dalam kerja sama", fair: "Kadang berkontribusi dalam tim", poor: "Jarang bekerja sama" }
  },
  {
    key: "kualitas", label: "Kualitas",
    desc: "Mutu hasil kerja artistik maupun administratif.",
    levels: { excellent: "Hasil sangat baik dan matang", good: "Hasil baik", fair: "Hasil cukup, perlu perbaikan", poor: "Hasil belum memenuhi standar" }
  },
  {
    key: "tanggungJawab", label: "Tanggung Jawab",
    desc: "Penyelesaian tugas individu dan kepercayaan terhadap peran.",
    levels: { excellent: "Sangat bertanggung jawab, tuntas tepat waktu", good: "Bertanggung jawab", fair: "Kadang menunda tugas", poor: "Kurang bertanggung jawab" }
  }
];

export const THEATRE_ROLES = [
  "Pimpinan Produksi",
  "Sutradara",
  "Asisten Sutradara",
  "Penulis Naskah/Dramaturg",
  "Stage Manager",
  "Penata Artistik",
  "Penata Kostum & Rias",
  "Penata Cahaya/Suara",
  "Bendahara & Dana Usaha",
  "Sekretaris & Administrasi",
  "Aktor / Pemeran"
];

const ROLE_META = {
  "Pimpinan Produksi": { category: "NON_ARTISTIK", tupoksi: "Memimpin dan mengkoordinasikan seluruh divisi produksi." },
  "Sutradara": { category: "ARTISTIK", tupoksi: "Menerjemahkan naskah ke panggung dan mengarahkan aktor." },
  "Asisten Sutradara": { category: "ARTISTIK", tupoksi: "Membantu sutradara memimpin latihan dan mencatat progres." },
  "Penulis Naskah/Dramaturg": { category: "ARTISTIK", tupoksi: "Menulis dan menyempurnakan naskah serta alur dramaturgi." },
  "Stage Manager": { category: "ARTISTIK", tupoksi: "Mengatur pergantian adegan, properti, dan jalannya pertunjukan." },
  "Penata Artistik": { category: "ARTISTIK", tupoksi: "Merancang set, properti, dan tata panggung." },
  "Penata Kostum & Rias": { category: "ARTISTIK", tupoksi: "Merancang kostum dan tata rias tokoh." },
  "Penata Cahaya/Suara": { category: "ARTISTIK", tupoksi: "Merancang pencahayaan, musik, dan efek suara." },
  "Bendahara & Dana Usaha": { category: "NON_ARTISTIK", tupoksi: "Mengelola kas, anggaran, dan laporan keuangan produksi." },
  "Sekretaris & Administrasi": { category: "NON_ARTISTIK", tupoksi: "Mengelola surat, presensi, dan dokumen administrasi." },
  "Aktor / Pemeran": { category: "ARTISTIK", tupoksi: "Memerankan tokoh sesuai naskah dan arahan sutradara." }
};

export function getRoleMetadata(roleId, role) {
  const key = roleId || (role === "LEADER" ? "Pimpinan Produksi" : "");
  const m = ROLE_META[key] || { category: "NON_ARTISTIK", tupoksi: "Mendukung kelancaran produksi sesuai arahan pimpinan." };
  return { ...m, categoryLabel: m.category === "ARTISTIK" ? "Artistik & Panggung" : "Non-Artistik (Manajemen)" };
}

export const STAGE_ZONES = [
  { key: "UL", code: "UL", label: "Upstage Kiri (Upstage Left)" },
  { key: "UC", code: "UC", label: "Upstage Tengah (Upstage Center)" },
  { key: "UR", code: "UR", label: "Upstage Kanan (Upstage Right)" },
  { key: "ML", code: "ML", label: "Tengah Kiri (Middle Left)" },
  { key: "MC", code: "MC", label: "Tengah (Middle Center)" },
  { key: "MR", code: "MR", label: "Tengah Kanan (Middle Right)" },
  { key: "DL", code: "DL", label: "Downstage Kiri (Downstage Left)" },
  { key: "DC", code: "DC", label: "Downstage Tengah (Downstage Center)" },
  { key: "DR", code: "DR", label: "Downstage Kanan (Downstage Right)" }
];

export const DIALOGUE_10_STEPS = [
  "Pahami konteks dan tujuan setiap kalimat dalam adegan.",
  "Hafalkan teks dengan memahami maksud, bukan sekadar kata.",
  "Latih pernapasan diafragma sebelum mengucapkan dialog.",
  "Latih artikulasi konsonan dan vokal secara perlahan.",
  "Latih tempo: variasikan cepat dan lambat sesuai emosi.",
  "Latih proyeksi suara agar terdengar sampai baris belakang.",
  "Hubungkan dialog dengan lawan main (mendengar dan merespons).",
  "Gunakan jeda (pause) untuk menciptakan ketegangan.",
  "Sesuaikan intonasi dengan emosi dan perubahan tokoh.",
  "Rekam, dengarkan ulang, dan evaluasi kejelasan dialog."
];

// ============================================================================
// DOKUMEN PRODUKSI (10 TEMPLATE)
// ============================================================================
const TPL_DEFAULT_SIGN = [{ title: "Pimpinan Produksi" }, { title: "Guru Pengampu" }];

const tpl = (o) => ({ calcConfig: null, currencyCols: [], autoFillType: null, signatories: null, defaultIntro: o.desc, ...o });

export const DOC_TEMPLATES = [
  tpl({ id: "naskah", code: "DOC-01", title: "Naskah & Sinopsis Lakon", category: "Naskah & Artistik",
    desc: "Ringkasan babak dan adegan naskah produksi.", ownerRoles: ["Penulis Naskah/Dramaturg", "Sutradara"],
    columns: ["No", "Babak / Adegan", "Ringkasan Isi", "Durasi (menit)"],
    sampleRows: [["1", "Babak I - Adegan 1", "Pengenalan tokoh dan konflik keluarga", "5"]] }),
  tpl({ id: "rencana", code: "DOC-02", title: "Rencana Produksi", category: "Administrasi",
    desc: "Rencana kegiatan per tahap produksi beserta penanggung jawab.", ownerRoles: ["Asisten Sutradara"],
    columns: ["No", "Tahap", "Kegiatan", "Target Tanggal", "PIC"],
    sampleRows: [["1", "Persiapan", "Casting dan pembagian peran", "-", "Asisten Sutradara"]] }),
  tpl({ id: "jadwal", code: "DOC-03", title: "Jadwal Latihan", category: "Administrasi",
    desc: "Jadwal latihan rutin kelompok.", ownerRoles: ["Asisten Sutradara", "Stage Manager"],
    columns: ["No", "Tanggal", "Agenda", "Waktu", "Tempat"],
    sampleRows: [["1", "-", "Bloking Babak I", "15.00 - 17.00", "Aula Sekolah"]] }),
  tpl({ id: "pemeran", code: "DOC-04", title: "Daftar Pemeran & Kru", category: "Administrasi",
    desc: "Daftar anggota kelompok, otomatis terisi dari data siswa.", ownerRoles: ["Sekretaris & Administrasi"], autoFillType: "MEMBERS",
    columns: ["No", "Nama", "NIS", "Jabatan", "Tugas Pokok", "WhatsApp"], sampleRows: [] }),
  tpl({ id: "bloking", code: "DOC-05", title: "Catatan Bloking Panggung", category: "Artistik",
    desc: "Catatan posisi aktor dan arah gerak per adegan.", ownerRoles: ["Stage Manager", "Sutradara"],
    columns: ["No", "Adegan", "Zona", "Aktor / Properti", "Arah Gerak"],
    sampleRows: [["1", "Babak I - Adegan 1", "MC", "Ayah", "Masuk dari sayap kiri"]] }),
  tpl({ id: "inventaris", code: "DOC-06", title: "Daftar Inventaris", category: "Artistik",
    desc: "Daftar properti, set, dan kostum, otomatis terisi dari data inventaris.", ownerRoles: ["Penata Artistik", "Stage Manager"], autoFillType: "INVENTORY",
    columns: ["Kode", "Nama", "Tokoh / Adegan", "Jumlah", "Sumber", "Status"], sampleRows: [] }),
  tpl({ id: "rab", code: "DOC-07", title: "Rencana Anggaran Biaya (RAB)", category: "Keuangan",
    desc: "Rincian anggaran dengan total otomatis.", ownerRoles: ["Bendahara & Dana Usaha"],
    columns: ["No", "Uraian Kebutuhan", "Volume", "Harga Satuan (Rp)", "Total (Rp)"],
    calcConfig: { qtyCol: 2, priceCol: 3, totalCol: 4 }, currencyCols: [3, 4],
    sampleRows: [["1", "Kain beludru merah", "3", "75.000", "0"], ["2", "Cat dan kuas", "2", "45.000", "0"]] }),
  tpl({ id: "kas", code: "DOC-08", title: "Laporan Kas Produksi", category: "Keuangan",
    desc: "Rekap pemasukan dan pengeluaran kas.", ownerRoles: ["Bendahara & Dana Usaha"],
    columns: ["Tanggal", "Uraian", "Masuk (Rp)", "Keluar (Rp)"], currencyCols: [2, 3],
    sampleRows: [["-", "Iuran kas anggota", "50.000", "0"]] }),
  tpl({ id: "presensi", code: "DOC-09", title: "Rekap Presensi Latihan", category: "Administrasi",
    desc: "Rekap kehadiran anggota, otomatis terisi dari catatan presensi.", ownerRoles: ["Sekretaris & Administrasi"], autoFillType: "ATTENDANCE",
    columns: ["No", "Nama", "Jabatan", "Hadir", "Terlambat", "Izin", "Alpa", "Persentase"], sampleRows: [] }),
  tpl({ id: "rapor", code: "DOC-10", title: "Kartu Hasil Penilaian", category: "Penilaian",
    desc: "Rekap nilai aspek penilaian per anggota.", ownerRoles: ["Sekretaris & Administrasi"],
    columns: ["No", "Aspek", "Nilai", "Catatan"],
    sampleRows: [["1", "Disiplin", "85", "-"]] })
];

// ============================================================================
// HELPER UMUM
// ============================================================================
export function escapeHtml(v) {
  return String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

const ROLE_LABELS = { ADMIN: "Super Admin", TEACHER: "Guru Pengampu", LEADER: "Pimpinan Produksi", STUDENT: "Anggota Produksi" };
export const getRoleLabel = (r) => ROLE_LABELS[r] || r || "-";
export const getRoleBadgeClass = (r) =>
  ({ ADMIN: "badge-admin", TEACHER: "badge-guru", LEADER: "badge-leader", STUDENT: "badge-student" })[r] || "badge-neutral";

export function showLoader(show, msg = "") {
  let el = document.getElementById("globalLoader");
  if (!el) {
    el = document.createElement("div");
    el.id = "globalLoader";
    el.className = "loader-overlay hidden";
    el.innerHTML = '<div class="spinner"></div><div id="globalLoaderMsg" style="font-size:13px;font-weight:600;"></div>';
    document.body.appendChild(el);
  }
  document.getElementById("globalLoaderMsg").textContent = msg;
  el.classList.toggle("hidden", !show);
}

export function showToast(message, type = "info", ms = 3500) {
  let wrap = document.querySelector(".toast-container");
  if (!wrap) {
    wrap = document.createElement("div");
    wrap.className = "toast-container";
    document.body.appendChild(wrap);
  }
  const t = document.createElement("div");
  t.className = `toast toast-${type}`;
  t.textContent = message;
  wrap.appendChild(t);
  requestAnimationFrame(() => t.classList.add("show"));
  setTimeout(() => {
    t.classList.remove("show");
    setTimeout(() => t.remove(), 300);
  }, ms);
}

export async function confirmDialog(title, message) {
  return window.confirm(`${title}\n\n${message}`);
}

export function formatIndoDate(d) {
  if (!d) return "-";
  const dt = new Date(`${d}T00:00:00`);
  if (isNaN(dt)) return d;
  return dt.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
}

export function formatRupiah(n) {
  return "Rp " + Number(n || 0).toLocaleString("id-ID");
}

export function parseNumericValue(v) {
  if (typeof v === "number") return v;
  const s = String(v ?? "").trim().replace(/\s/g, "").replace(/\./g, "").replace(/,/g, ".");
  const n = parseFloat(s.replace(/[^0-9.\-]/g, ""));
  return isNaN(n) ? 0 : n;
}

export function getDeadlineStatus(deadline, isDone) {
  if (isDone) return { label: "Tuntas", badgeClass: "badge-success", isOverdue: false, isUrgent: false, daysDiff: 9999, sortOrder: 5 };
  const dl = deadline ? new Date(`${deadline}T00:00:00`) : null;
  if (!dl || isNaN(dl)) return { label: "Belum ada tenggat", badgeClass: "badge-neutral", isOverdue: false, isUrgent: false, daysDiff: 9999, sortOrder: 4 };
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.round((dl - today) / 86400000);
  if (diff < 0) return { label: `Terlambat ${-diff} hari`, badgeClass: "badge-danger", isOverdue: true, isUrgent: false, daysDiff: diff, sortOrder: 0 };
  if (diff <= 3) return { label: diff === 0 ? "Hari ini" : `H-${diff}`, badgeClass: "badge-warning", isOverdue: false, isUrgent: true, daysDiff: diff, sortOrder: 1 };
  return { label: `${diff} hari lagi`, badgeClass: "badge-info", isOverdue: false, isUrgent: false, daysDiff: diff, sortOrder: 2 };
}

export function normalizeWa(wa) {
  let n = String(wa || "").replace(/[^0-9]/g, "");
  if (n.startsWith("0")) n = "62" + n.slice(1);
  return n;
}

export function buildWaReminderUrl(wa, name, title, deadline, groupName) {
  const n = normalizeWa(wa);
  if (!n) return "";
  const msg = `Halo ${name}, pengingat tugas produksi "${title}" (${groupName}) dengan tenggat ${formatIndoDate(deadline)}. Terima kasih.`;
  return `https://wa.me/${n}?text=${encodeURIComponent(msg)}`;
}

export function renderAvatarHtml(user, size = 44, showPhoto = true) {
  const style = `width:${size}px;height:${size}px;font-size:${Math.round(size * 0.36)}px;`;
  if (showPhoto && user?.avatarUrl) {
    return `<img src="${escapeHtml(user.avatarUrl)}" alt="" class="avatar-circle" style="${style}" />`;
  }
  const initials = String(user?.name || "U").split(/\s+/).filter(Boolean).slice(0, 2)
    .map((w) => w[0].toUpperCase()).join("") || "U";
  return `<span class="avatar-circle" style="${style}">${escapeHtml(initials)}</span>`;
}

export function compressImageFile(file, maxSize = 280, quality = 0.72) {
  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith("image/")) return reject(new Error("File harus berupa gambar."));
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Gagal membaca file."));
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
        const c = document.createElement("canvas");
        c.width = Math.round(img.width * scale);
        c.height = Math.round(img.height * scale);
        c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
        resolve(c.toDataURL("image/jpeg", quality));
      };
      img.onerror = () => reject(new Error("Gambar tidak dapat dimuat."));
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function safeName(s) {
  return String(s || "file").replace(/[^a-z0-9]+/gi, "_").slice(0, 60);
}

// ============================================================================
// FIRESTORE: CRUD & PENGATURAN
// ============================================================================
export async function fetchAllCollection(col) {
  const snap = await getDocs(collection(db, col));
  return snap.docs.map((d) => {
    const data = d.data();
    return { ...data, docId: d.id, id: data.id || d.id };
  });
}

export async function saveDocument(col, id, data) {
  await setDoc(doc(db, col, id), { ...data, updatedAt: new Date().toISOString() }, { merge: true });
}

export async function removeDocument(col, id) {
  await deleteDoc(doc(db, col, id));
}

const DEFAULT_WEIGHTS = { self: 15, peer: 25, teacher: 60 };

export async function getRubricWeights() {
  const s = await getDoc(doc(db, COLS.SETTINGS, "rubric_weights"));
  return s.exists() ? { ...DEFAULT_WEIGHTS, ...s.data() } : { ...DEFAULT_WEIGHTS };
}

const DRIVE_DEFAULT_NAMES = [
  "01 Naskah & Sinopsis", "02 Administrasi & Surat", "03 Jadwal & Presensi",
  "04 Bloking & Denah Panggung", "05 Properti & Inventaris", "06 Kostum & Rias",
  "07 Musik, Suara & Cahaya", "08 Anggaran & Kas", "09 Dokumentasi Foto & Video",
  "10 Referensi Pementasan", "11 Penilaian & Rapor", "12 Arsip Akhir Produksi"
];

export async function getDriveFolders() {
  const s = await getDoc(doc(db, COLS.SETTINGS, "drive_folders"));
  if (s.exists() && Array.isArray(s.data().folders)) return s.data().folders;
  return DRIVE_DEFAULT_NAMES.map((name, i) => ({ index: i + 1, name, url: "" }));
}

// ============================================================================
// PENILAIAN 360° & PRESENSI
// ============================================================================
export function calculateAspectAverage(scores) {
  const vals = RUBRIC_ASPECTS.map((a) => Number(scores?.[a.key]) || 0);
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}

export function getPredikat(avg) {
  if (avg >= 90) return "Sangat Baik (A)";
  if (avg >= 80) return "Baik (B)";
  if (avg >= 70) return "Cukup (C)";
  return "Perlu Bimbingan (D)";
}

const round2 = (n) => Math.round(n * 100) / 100;

function idsOf(user) {
  return new Set([user.docId, user.id, user.authUid].filter(Boolean));
}

export function computeStudent360Summary(student, assessments, weights) {
  const ids = idsOf(student);
  const mine = assessments.filter((a) => ids.has(a.targetUserId));
  const avgOf = (list) =>
    list.length
      ? list.reduce((s, a) => s + (Number(a.average) || calculateAspectAverage(a.scores)), 0) / list.length
      : null;

  const selfAvg = avgOf(mine.filter((a) => a.evaluatorType === "SELF"));
  const peerList = mine.filter((a) => a.evaluatorType === "PEER");
  const peerAvg = avgOf(peerList);
  const teacherList = mine.filter((a) => a.evaluatorType === "TEACHER");
  const latestTeacher = teacherList.length ? teacherList[teacherList.length - 1] : null;
  const teacherAvg = latestTeacher ? avgOf([latestTeacher]) : null;

  // Nilai akhir = rata-rata terbobot dari sumber yang sudah ada (bobot yang kosong diabaikan)
  const parts = [[selfAvg, weights.self], [peerAvg, weights.peer], [teacherAvg, weights.teacher]]
    .filter(([v]) => v !== null);
  const wsum = parts.reduce((s, [, w]) => s + w, 0);
  const finalScore = wsum ? parts.reduce((s, [v, w]) => s + v * w, 0) / wsum : 0;

  return {
    selfAvg: selfAvg === null ? null : round2(selfAvg),
    peerAvg: peerAvg === null ? null : round2(peerAvg),
    teacherAvg: teacherAvg === null ? null : round2(teacherAvg),
    peerCount: peerList.length,
    latestTeacher,
    isGradedByTeacher: !!latestTeacher,
    finalScore: round2(finalScore),
    predikat: parts.length ? getPredikat(finalScore) : "Menunggu penilaian"
  };
}

export function computeMemberAttendance(member, sessions) {
  const ids = [...idsOf(member)];
  let present = 0, late = 0, excused = 0, absent = 0, total = 0;
  sessions.forEach((s) => {
    const rec = s.records || {};
    const key = ids.find((id) => rec[id] !== undefined);
    if (key === undefined) return;
    total++;
    const st = rec[key];
    if (st === "HADIR") present++;
    else if (st === "TERLAMBAT") late++;
    else if (st === "IZIN") excused++;
    else if (st === "ALPA") absent++;
  });
  const percentage = total ? Math.round(((present + late) / total) * 100) : 100;
  return { present, late, excused, absent, totalSessions: total, percentage };
}

export function getDivisionPermissions(profile) {
  const role = profile.roleId || "";
  const isLeader = profile.role === "LEADER";
  const is = (list) => isLeader || list.includes(role);
  const owners = (tplId) => DOC_TEMPLATES.find((t) => t.id === tplId)?.ownerRoles || [];
  return {
    isLeader,
    canManageGroup: isLeader,
    canManageAttendance: is(["Sekretaris & Administrasi"]),
    canEditScript: is(["Sutradara", "Asisten Sutradara", "Penulis Naskah/Dramaturg"]),
    canEditBlocking: is(["Sutradara", "Asisten Sutradara", "Stage Manager", "Penata Artistik"]),
    canEditInventory: is(["Penata Artistik", "Penata Kostum & Rias", "Stage Manager", "Penata Cahaya/Suara"]),
    canEditFinance: is(["Bendahara & Dana Usaha"]),
    recommendedTemplates: DOC_TEMPLATES.filter((t) => t.ownerRoles.includes(role)).map((t) => t.id),
    canEditTemplate: (tplId) => is(owners(tplId)),
    getTemplateOwnersLabel: (tplId) => owners(tplId).join(", ") || "Pimpinan Produksi"
  };
}

// ============================================================================
// AUTENTIKASI
// ============================================================================
function friendlyAuthError(err) {
  const map = {
    "auth/invalid-credential": "Username/email atau kata sandi salah.",
    "auth/wrong-password": "Username/email atau kata sandi salah.",
    "auth/user-not-found": "Username/email atau kata sandi salah.",
    "auth/invalid-email": "Format email tidak valid.",
    "auth/email-already-in-use": "Username ini sudah terdaftar.",
    "auth/weak-password": "Kata sandi minimal 6 karakter.",
    "auth/too-many-requests": "Terlalu banyak percobaan. Coba lagi beberapa menit lagi.",
    "auth/requires-recent-login": "Silakan keluar lalu masuk kembali, kemudian ulangi.",
    "auth/network-request-failed": "Koneksi internet bermasalah."
  };
  return map[err?.code] || err?.message || "Terjadi kesalahan.";
}

function toProfile(snap, uid) {
  const d = snap.data();
  return { ...d, docId: snap.id, id: d.id || snap.id, authUid: d.authUid || uid };
}

async function resolveProfile(user) {
  const direct = await getDoc(doc(db, COLS.USERS, user.uid));
  if (direct.exists()) return toProfile(direct, user.uid);
  const byAuth = await getDocs(query(collection(db, COLS.USERS), where("authUid", "==", user.uid)));
  if (!byAuth.empty) return toProfile(byAuth.docs[0], user.uid);
  if (user.email) {
    const byEmail = await getDocs(query(collection(db, COLS.USERS), where("email", "==", user.email)));
    if (!byEmail.empty) return toProfile(byEmail.docs[0], user.uid);
  }
  return null;
}

export function redirectByRole(role) {
  const map = { ADMIN: "admin.html", TEACHER: "guru.html", LEADER: "siswa.html", STUDENT: "siswa.html" };
  location.replace(map[role] || "index.html");
}

export async function loginWithIdentifier(identifier, password) {
  let email = identifier.trim();
  if (!email.includes("@")) {
    const snap = await getDocs(query(collection(db, COLS.USERS), where("username", "==", email.toLowerCase())));
    if (snap.empty) throw new Error("Username tidak ditemukan di sistem.");
    const data = snap.docs[0].data();
    if (!data.email) throw new Error("Akun lama belum terhubung dengan email. Minta Admin menyinkronkan akun Anda.");
    email = data.email;
  }
  try {
    await signInWithEmailAndPassword(auth, email, password);
  } catch (err) {
    throw new Error(friendlyAuthError(err));
  }
  const profile = await resolveProfile(auth.currentUser);
  if (!profile) {
    await signOut(auth);
    throw new Error("Profil pengguna tidak ditemukan di database. Minta Admin menambahkan akun Anda.");
  }
  if (profile.status === "SUSPENDED") {
    await signOut(auth);
    throw new Error("Akun Anda sedang dinonaktifkan. Hubungi Admin.");
  }
  return profile;
}

export function requireAuthRole(roles, callback) {
  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      location.replace("index.html");
      return;
    }
    try {
      const profile = await resolveProfile(user);
      if (!profile || profile.status === "SUSPENDED") {
        await signOut(auth);
        location.replace("index.html");
        return;
      }
      if (!roles.includes(profile.role)) {
        redirectByRole(profile.role);
        return;
      }
      await callback(profile);
    } catch (err) {
      console.error(err);
      showToast("Gagal memuat profil: " + err.message, "danger", 6000);
    }
  });
}

export async function logoutUser() {
  await signOut(auth);
  location.replace("index.html");
}

export async function changeOwnPassword(newPassword) {
  if (!auth.currentUser) throw new Error("Sesi login tidak ditemukan.");
  try {
    await updatePassword(auth.currentUser, newPassword);
  } catch (err) {
    throw new Error(friendlyAuthError(err));
  }
}

// Membuat akun Auth tanpa memutus sesi Admin (memakai app Firebase sekunder)
export async function createAuthAccountByAdmin(username, password) {
  const email = `${username}@sp-ppt.local`;
  const secondary = initializeApp(firebaseConfig, `sec-${Date.now()}`);
  try {
    const secAuth = getAuth(secondary);
    const cred = await createUserWithEmailAndPassword(secAuth, email, password);
    await signOut(secAuth);
    return { uid: cred.user.uid, email };
  } catch (err) {
    throw new Error(friendlyAuthError(err));
  } finally {
    await deleteApp(secondary);
  }
}

// ============================================================================
// EKSPOR: CSV, JSON, DOCX
// ============================================================================
export function exportGradeRecapCSV(rows, filename) {
  if (!rows.length) return;
  const keys = Object.keys(rows[0]);
  const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const csv = "\uFEFF" + [keys.join(","), ...rows.map((r) => keys.map((k) => esc(r[k])).join(","))].join("\r\n");
  downloadBlob(new Blob([csv], { type: "text/csv;charset=utf-8;" }), filename);
}

export async function exportFullDatabaseBackupJSON() {
  const out = { exportedAt: new Date().toISOString() };
  for (const col of Object.values(COLS)) {
    out[col] = await fetchAllCollection(col);
  }
  const date = new Date().toISOString().slice(0, 10);
  downloadBlob(new Blob([JSON.stringify(out, null, 2)], { type: "application/json" }), `backup_sp_ppt_${date}.json`);
}

function needDocx() {
  if (!window.docx) throw new Error("Pustaka Word (docx) belum termuat. Muat ulang halaman.");
  return window.docx;
}

const P = (D, text, o = {}) =>
  new D.Paragraph({
    alignment: o.center ? D.AlignmentType.CENTER : undefined,
    children: [new D.TextRun({ text: String(text ?? ""), bold: !!o.bold, size: o.size || 22 })]
  });

const cellOf = (D, text, o = {}) =>
  new D.TableCell({
    shading: o.header ? { fill: "7F1D1D", color: "auto" } : undefined,
    children: [new D.Paragraph({
      children: [new D.TextRun({ text: String(text ?? ""), bold: !!(o.header || o.bold), size: 20, color: o.header ? "FFFFFF" : undefined })]
    })]
  });

const makeTable = (D, cols, rows) =>
  new D.Table({
    width: { size: 100, type: D.WidthType.PERCENTAGE },
    rows: [
      new D.TableRow({ tableHeader: true, children: cols.map((c) => cellOf(D, c, { header: true })) }),
      ...rows.map((r) => new D.TableRow({ children: r.map((v) => cellOf(D, v)) }))
    ]
  });

async function saveDocx(children, filename) {
  const D = needDocx();
  const d = new D.Document({ sections: [{ properties: {}, children }] });
  downloadBlob(await D.Packer.toBlob(d), filename);
}

export async function exportProductionDocx(p) {
  const D = needDocx();
  const m = p.meta || {};
  const cur = p.currencyCols || [];
  const rows = (p.rows || []).map((r) =>
    p.columns.map((_, c) => (cur.includes(c) ? parseNumericValue(r[c]).toLocaleString("id-ID") : String(r[c] ?? "")))
  );
  if (p.calcConfig) {
    const { qtyCol, priceCol, totalCol } = p.calcConfig;
    const grand = (p.rows || []).reduce((s, r) => s + parseNumericValue(r[qtyCol]) * parseNumericValue(r[priceCol]), 0);
    rows.push(p.columns.map((_, c) => (c === 1 ? "TOTAL ANGGARAN" : c === totalCol ? grand.toLocaleString("id-ID") : "")));
  }
  const info = [
    ["Nama Sekolah / Sanggar", m.schoolName], ["Nomor Dokumen", m.docNumber],
    ["Kelas", p.className], ["Kelompok", p.groupName], ["Judul Produksi", p.productionTitle],
    ["Tanggal Pelaksanaan", m.eventDate], ["Tempat", m.venue],
    ["Pimpinan Produksi", m.leaderName], ["Guru Pengampu", m.teacherName], ["Penyusun", p.authorName]
  ];
  const sign = p.signatories || TPL_DEFAULT_SIGN;
  const children = [
    P(D, p.title, { center: true, bold: true, size: 28 }),
    P(D, `${p.docCode} • ${p.category}`, { center: true }),
    P(D, ""),
    ...info.map(([k, v]) => P(D, `${k}: ${v || "-"}`, { size: 20 })),
    ...(p.introText ? [P(D, ""), P(D, p.introText, { size: 20 })] : []),
    P(D, ""),
    makeTable(D, p.columns, rows),
    ...(p.notes ? [P(D, ""), P(D, `Catatan: ${p.notes}`, { size: 20 })] : []),
    P(D, ""), P(D, ""),
    ...sign.flatMap((s) => [P(D, s.title, { bold: true }), P(D, ""), P(D, "( ........................................ )")])
  ];
  await saveDocx(children, `${p.docCode}_${safeName(p.groupName)}.docx`);
}

export async function exportIndividualReportDocx({ student, className, groupName, productionTitle, teacherName, summary360, attendanceStats, weights }) {
  const D = needDocx();
  const sc = summary360.latestTeacher?.scores || {};
  const children = [
    P(D, "RAPOR EVALUASI INDIVIDU", { center: true, bold: true, size: 30 }),
    P(D, productionTitle || "", { center: true }),
    P(D, ""),
    P(D, `Nama: ${student.name}`, { bold: true }),
    P(D, `NIS: ${student.nis || "-"} • Kelas: ${className} • Kelompok: ${groupName}`),
    P(D, `Jabatan: ${student.roleId || "Anggota"} • Guru Pengampu: ${teacherName}`),
    P(D, ""),
    P(D, "Penilaian Aspek (Guru)", { bold: true }),
    makeTable(D, ["Aspek", "Nilai"], RUBRIC_ASPECTS.map((a) => [a.label, sc[a.key] ?? "-"])),
    P(D, ""),
    P(D, "Ringkasan 360°", { bold: true }),
    makeTable(D, ["Sumber", "Bobot", "Nilai"], [
      ["Diri Sendiri (Self)", `${weights.self}%`, summary360.selfAvg ?? "-"],
      ["Teman Sejawat (Peer)", `${weights.peer}%`, summary360.peerAvg ?? "-"],
      ["Guru Pengampu", `${weights.teacher}%`, summary360.teacherAvg ?? "-"],
      ["NILAI AKHIR", "-", summary360.finalScore.toFixed(2)]
    ]),
    P(D, ""),
    P(D, `Kehadiran latihan: ${attendanceStats.percentage}% (${attendanceStats.present} hadir, ${attendanceStats.late} terlambat, ${attendanceStats.excused} izin, ${attendanceStats.absent} alpa dari ${attendanceStats.totalSessions} sesi)`),
    P(D, ""),
    P(D, `Catatan Guru: ${summary360.latestTeacher?.feedback || "-"}`)
  ];
  await saveDocx(children, `Rapor_${safeName(student.name)}.docx`);
}

export async function exportEProgramDocx({ group, className, members, script, teacherName }) {
  const D = needDocx();
  const children = [
    P(D, "BUKU ACARA PEMENTASAN", { center: true, bold: true, size: 30 }),
    P(D, `"${group.title}"`, { center: true, bold: true, size: 26 }),
    P(D, `${group.name} • ${className}`, { center: true }),
    P(D, ""),
    P(D, "Sinopsis", { bold: true }),
    P(D, group.synopsis || "-", { size: 20 }),
    P(D, ""),
    P(D, `Penulis Naskah: ${script?.author || "-"}`, { size: 20 }),
    P(D, `Pembimbing: ${teacherName || "-"}`, { size: 20 }),
    P(D, ""),
    P(D, "Pemeran & Kerabat Kerja", { bold: true }),
    makeTable(D, ["No", "Nama", "Jabatan / Divisi", "Kategori"],
      members.map((m, i) => [String(i + 1), m.name, m.roleId || m.role, getRoleMetadata(m.roleId, m.role).categoryLabel]))
  ];
  await saveDocx(children, `E-Program_${safeName(group.name)}.docx`);
}

// ============================================================================
// LEGACY (sp_ppt_state/production_v1)
// Asumsi struktur: field array "users", "classes", "groups", "tasks", "assessments".
// Sesuaikan jika struktur dokumen lama berbeda.
// ============================================================================
const LEGACY_REF = () => doc(db, "sp_ppt_state", "production_v1");

export async function inspectLegacyDatabase() {
  const s = await getDoc(LEGACY_REF());
  if (!s.exists()) return { hasLegacy: false, alreadyMigrated: false, counts: {} };
  const d = s.data();
  const n = (k) => (Array.isArray(d[k]) ? d[k].length : 0);
  return {
    hasLegacy: true,
    alreadyMigrated: !!d.migratedAt,
    counts: { users: n("users"), classes: n("classes"), groups: n("groups"), tasks: n("tasks"), assessments: n("assessments") }
  };
}

export async function runOneClickLegacyMigration(user) {
  const s = await getDoc(LEGACY_REF());
  if (!s.exists()) throw new Error("Dokumen data lama tidak ditemukan.");
  const d = s.data();
  const map = [
    ["users", COLS.USERS], ["classes", COLS.CLASSES], ["groups", COLS.GROUPS],
    ["tasks", COLS.TASKS], ["assessments", COLS.ASSESSMENTS]
  ];
  let total = 0;
  for (const [key, col] of map) {
    for (const item of d[key] || []) {
      const id = String(item.id || item.docId || crypto.randomUUID());
      await saveDocument(col, id, { ...item, id });
      total++;
    }
  }
  await setDoc(LEGACY_REF(), { migratedAt: new Date().toISOString(), migratedBy: user?.name || "" }, { merge: true });
  return total;
}