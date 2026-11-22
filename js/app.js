```javascript
import { initializeApp, getApps, deleteApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updatePassword
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  where,
  writeBatch
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// ============================================================================
// 1. KONFIGURASI FIREBASE LAMA (WAJIB SAMA PERSIS)
// ============================================================================
export const firebaseConfig = {
  apiKey: "AIzaSyDczk0n-4QvvwTDikDBnuTkRX_SlXIV9JQ",
  authDomain: "penilaian-proyek-teater-siswa.firebaseapp.com",
  projectId: "penilaian-proyek-teater-siswa",
  storageBucket: "penilaian-proyek-teater-siswa.firebasestorage.app",
  messagingSenderId: "278312873930",
  appId: "1:278312873930:web:22995ce3faecd43fa2e933"
};

export const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Nama koleksi terstruktur & dokumen legacy
export const LEGACY_DOC_PATH = ["sp_ppt_state", "production_v1"];
export const COLS = {
  USERS: "sp_ppt_users",
  CLASSES: "sp_ppt_classes",
  GROUPS: "sp_ppt_groups",
  TASKS: "sp_ppt_tasks",
  ASSESSMENTS: "sp_ppt_assessments",
  STAGES: "sp_ppt_stages",
  SCRIPTS: "sp_ppt_scripts",
  REFERENCES: "sp_ppt_references",
  SUBMISSIONS: "sp_ppt_submissions",
  BROADCASTS: "sp_ppt_broadcasts",
  ATTENDANCE: "sp_ppt_attendance",
  BLOCKING: "sp_ppt_blocking",
  INVENTORY: "sp_ppt_inventory",
  FINANCE: "sp_ppt_finance",
  AUDIENCE: "sp_ppt_audience",
  SETTINGS: "sp_ppt_settings"
};

// ============================================================================
// 2. KONSTANTA RUBRIK DETAIL, TAHAPAN, DIVISI & 10 TEMPLATE PRODUKSI
// ============================================================================
export const RUBRIC_ASPECTS = [
  {
    key: "disiplin",
    label: "Disiplin",
    desc: "Kehadiran latihan, ketepatan waktu, dan kepatuhan terhadap tata tertib produksi.",
    levels: {
      excellent: "90–100: Selalu hadir tepat waktu, siap sebelum latihan dimulai, dan mematuhi seluruh tata tertib produksi.",
      good: "80–89: Hadir konsisten dengan keterlambatan minimal dan mematuhi kesepakatan tim.",
      fair: "70–79: Beberapa kali terlambat atau kurang fokus saat latihan berlangsung.",
      poor: "<70: Sering absen tanpa keterangan dan menghambat jadwal latihan tim."
    }
  },
  {
    key: "kolaborasi",
    label: "Kolaborasi",
    desc: "Kerja sama lintas divisi, komunikasi tim, dan sikap saling mendukung selama proses.",
    levels: {
      excellent: "90–100: Proaktif menjembatani komunikasi lintas divisi, terbuka terhadap arahan sutradara, dan membantu rekan.",
      good: "80–89: Bekerja sama dengan baik dalam divisi dan menghargai masukan anggota lain.",
      fair: "70–79: Cenderung bekerja sendiri dan komunikasi dengan divisi lain masih terbatas.",
      poor: "<70: Sulit bekerja sama, memicu konflik internal, atau mengabaikan koordinasi tim."
    }
  },
  {
    key: "kualitas",
    label: "Kualitas",
    desc: "Capaian artistik maupun teknis sesuai peran dan standar pementasan teater.",
    levels: {
      excellent: "90–100: Penghayatan peran/eksekusi teknis sangat matang, detail artistik kuat, dan memukau.",
      good: "80–89: Eksekusi peran atau karya teknis sesuai konsep garap dengan kesalahan minimal.",
      fair: "70–79: Cukup memenuhi standar dasar namun masih kurang pendalaman detail artistik/teknis.",
      poor: "<70: Belum menguasai dialog/bloking atau perangkat teknis belum siap saat pementasan."
    }
  },
  {
    key: "tanggungJawab",
    label: "Tanggung Jawab",
    desc: "Ketuntasan tugas individu, perawatan properti/kostum/naskah, dan inisiatif.",
    levels: {
      excellent: "90–100: Menuntaskan seluruh tugas sebelum tenggat, menjaga inventaris, dan sigap mengatasi kendala.",
      good: "80–89: Menyelesaikan tugas divisi tepat waktu dan menjaga perlengkapan dengan baik.",
      fair: "70–79: Tugas selesai namun sering memerlukan pengingat dari Pimpinan Produksi/Guru.",
      poor: "<70: Melalaikan tugas utama atau merusak/menghilangkan properti dan naskah."
    }
  }
];

export const DEFAULT_WEIGHTS = {
  self: 15,
  peer: 25,
  teacher: 60
};

export const PRODUCTION_STAGES = [
  { key: "PERSIAPAN", label: "1. Persiapan & Pra-Produksi", desc: "Bedah naskah, pemilihan peran, penyusunan RAB & jadwal latihan." },
  { key: "PELAKSANAAN", label: "2. Pelaksanaan & Latihan", desc: "Latihan bloking, olah vokal/tubuh, pembuatan properti, kostum, dan artistik." },
  { key: "PERTUNJUKAN", label: "3. Gladi & Pertunjukan", desc: "Gladi kotor, gladi bersih, tata panggung, dan pementasan utama." },
  { key: "PASCA", label: "4. Pasca-Produksi & Evaluasi", desc: "Pengembalian inventaris, laporan pertanggungjawaban, dan refleksi akhir." }
];

export const THEATRE_ROLE_DETAILS = {
  "Pimpinan Produksi": {
    category: "NON_ARTISTIK",
    categoryLabel: "Non-Artistik (Manajemen)",
    tupoksi: "Memimpin manajemen produksi secara menyeluruh, mengoordinasikan lintas divisi, perizinan gedung, dan jadwal kerja tim."
  },
  "Sutradara": {
    category: "ARTISTIK",
    categoryLabel: "Artistik & Panggung",
    tupoksi: "Menafsirkan naskah lakon, menentukan konsep garap artistik, melatih keaktoran pemeran, dan merancang bloking panggung."
  },
  "Asisten Sutradara": {
    category: "ARTISTIK",
    categoryLabel: "Artistik & Panggung",
    tupoksi: "Membantu sutradara mencatat detail bloking, menjadi pencatat naskah (prompter) saat latihan, dan mengawal kontinuitas adegan."
  },
  "Penulis Naskah / Dramaturg": {
    category: "ARTISTIK",
    categoryLabel: "Artistik & Panggung",
    tupoksi: "Menyusun atau menyadur naskah lakon, melakukan riset latar cerita/penokohan, dan menyusun catatan dramaturgi."
  },
  "Stage Manager": {
    category: "ARTISTIK",
    categoryLabel: "Artistik & Panggung",
    tupoksi: "Mengendalikan seluruh operasional panggung saat gladi dan pementasan (cueing lighting, suara, keluar-masuk aktor & set)."
  },
  "Aktor / Pemeran": {
    category: "ARTISTIK",
    categoryLabel: "Artistik & Panggung",
    tupoksi: "Menghayati karakter tokoh, menguasai dialog, artikulasi, olah tubuh, serta mengeksekusi bloking di atas panggung."
  },
  "Penata Artistik & Panggung": {
    category: "ARTISTIK",
    categoryLabel: "Artistik & Panggung",
    tupoksi: "Merancang dan menyiapkan dekorasi set panggung, latar, serta pengadaan dan penataan properti pertunjukan."
  },
  "Penata Kostum & Tata Rias": {
    category: "ARTISTIK",
    categoryLabel: "Artistik & Panggung",
    tupoksi: "Merancang busana dan tata rias karakter sesuai era dan psikologi tokoh, serta mengatur simulasi quick change."
  },
  "Penata Cahaya (Lighting)": {
    category: "ARTISTIK",
    categoryLabel: "Artistik & Panggung",
    tupoksi: "Merancang tata pencahayaan dramatik, menyusun cue sheet lampu, dan mengoperasikan panel lighting saat pementasan."
  },
  "Penata Suara & Musik": {
    category: "ARTISTIK",
    categoryLabel: "Artistik & Panggung",
    tupoksi: "Menyusun ilustrasi musik, efek suara (SFX), pengecekan mikrofon/sound system, dan mengoperasikan audio saat pentas."
  },
  "Bendahara & Dana Usaha": {
    category: "NON_ARTISTIK",
    categoryLabel: "Non-Artistik (Manajemen)",
    tupoksi: "Menyusun Rencana Anggaran Biaya (RAB), mengelola pemasukan kas/dana usaha, mencatat transaksi, dan menyusun laporan keuangan."
  },
  "Sekretaris & Dokumentasi": {
    category: "NON_ARTISTIK",
    categoryLabel: "Non-Artistik (Manajemen)",
    tupoksi: "Mengelola surat-menyurat, mencatat presensi latihan harian, menyusun notulensi, publikasi poster, dan dokumentasi foto/video."
  }
};

export const THEATRE_ROLES = Object.keys(THEATRE_ROLE_DETAILS);

export function getRoleMetadata(roleName, fallbackUserRole = "STUDENT") {
  if (roleName && THEATRE_ROLE_DETAILS[roleName]) {
    return THEATRE_ROLE_DETAILS[roleName];
  }
  if (fallbackUserRole === "LEADER") {
    return THEATRE_ROLE_DETAILS["Pimpinan Produksi"];
  }
  return {
    category: "ARTISTIK",
    categoryLabel: "Tim Produksi",
    tupoksi: "Melaksanakan tugas divisi produksi teater sesuai arahan Pimpinan Produksi dan Sutradara."
  };
}

// Matriks hak akses penyuntingan dokumen & modul berdasarkan jabatan divisi (roleId)
export const DIVISION_TEMPLATE_OWNERS = {
  tpl_proposal: ["Pimpinan Produksi", "Sutradara", "Sekretaris & Dokumentasi"],
  tpl_kerabat_kerja: ["Pimpinan Produksi", "Sekretaris & Dokumentasi"],
  tpl_bedah_naskah: ["Pimpinan Produksi", "Sutradara", "Asisten Sutradara", "Penulis Naskah / Dramaturg"],
  tpl_jadwal_latihan: ["Pimpinan Produksi", "Sutradara", "Asisten Sutradara", "Stage Manager", "Sekretaris & Dokumentasi"],
  tpl_rab: ["Pimpinan Produksi", "Bendahara & Dana Usaha"],
  tpl_inventaris_properti: ["Pimpinan Produksi", "Penata Artistik & Panggung", "Penata Kostum & Tata Rias", "Stage Manager"],
  tpl_cue_sheet: ["Pimpinan Produksi", "Stage Manager", "Penata Cahaya (Lighting)", "Penata Suara & Musik", "Sutradara"],
  tpl_rundown_pentas: ["Pimpinan Produksi", "Stage Manager", "Asisten Sutradara", "Sekretaris & Dokumentasi"],
  tpl_presensi_latihan: ["Pimpinan Produksi", "Sekretaris & Dokumentasi"],
  tpl_lpj: ["Pimpinan Produksi", "Bendahara & Dana Usaha", "Sekretaris & Dokumentasi"]
};

export function getDivisionPermissions(user) {
  const sysRole = normalizeRole(user?.role);
  const roleId = String(user?.roleId || "").trim();
  const isLeader = sysRole === "LEADER" || roleId === "Pimpinan Produksi";

  const canEditScript =
    isLeader || ["Sutradara", "Asisten Sutradara", "Penulis Naskah / Dramaturg"].includes(roleId);

  const canEditBlocking =
    isLeader || ["Sutradara", "Asisten Sutradara", "Stage Manager", "Penata Artistik & Panggung"].includes(roleId);

  const canEditInventory =
    isLeader ||
    [
      "Penata Artistik & Panggung",
      "Penata Kostum & Tata Rias",
      "Stage Manager",
      "Penata Cahaya (Lighting)",
      "Penata Suara & Musik"
    ].includes(roleId);

  const canEditFinance = isLeader || roleId === "Bendahara & Dana Usaha";
  const canManageAttendance = isLeader || roleId === "Sekretaris & Dokumentasi";

  const recommendedTemplates = Object.entries(DIVISION_TEMPLATE_OWNERS)
    .filter(([, owners]) => owners.includes(roleId))
    .map(([tplId]) => tplId);

  return {
    isLeader,
    roleId,
    canManageGroup: isLeader,
    canManageAttendance,
    canEditScript,
    canEditBlocking,
    canEditInventory,
    canEditFinance,
    recommendedTemplates,
    canEditTemplate(tplId) {
      if (isLeader) return true;
      const allowed = DIVISION_TEMPLATE_OWNERS[tplId];
      if (!allowed) return true;
      return allowed.includes(roleId);
    },
    getTemplateOwnersLabel(tplId) {
      const allowed = DIVISION_TEMPLATE_OWNERS[tplId] || ["Pimpinan Produksi"];
      return allowed.join(", ");
    }
  };
}

export const STAGE_ZONES = [
  { key: "USR", code: "USR", label: "Upstage Right (Kanan Belakang)" },
  { key: "USC", code: "USC", label: "Upstage Center (Tengah Belakang)" },
  { key: "USL", code: "USL", label: "Upstage Left (Kiri Belakang)" },
  { key: "CSR", code: "CSR", label: "Center Right (Kanan Tengah)" },
  { key: "CS", code: "CS", label: "Center Stage (Pusat Panggung)" },
  { key: "CSL", code: "CSL", label: "Center Left (Kiri Tengah)" },
  { key: "DSR", code: "DSR", label: "Downstage Right (Kanan Depan)" },
  { key: "DSC", code: "DSC", label: "Downstage Center (Tengah Depan)" },
  { key: "DSL", code: "DSL", label: "Downstage Left (Kiri Depan)" }
];

export const DRIVE_FOLDERS_DEFAULT = [
  "01. Naskah & Dramaturgi",
  "02. Surat & Administrasi Produksi",
  "03. Rencana Anggaran Biaya (RAB)",
  "04. Jadwal & Presensi Latihan",
  "05. Desain Panggung & Artistik",
  "06. Desain Kostum & Tata Rias",
  "07. Tata Cahaya & Tata Suara",
  "08. Properti & Perlengkapan",
  "09. Publikasi & Desain Poster",
  "10. Dokumentasi Foto & Video Latihan",
  "11. Dokumentasi Pementasan Utama",
  "12. Laporan Pertanggungjawaban (LPJ)"
];

// 10 Template Dokumen Produksi Teater Terperinci
export const DOC_TEMPLATES = [
  {
    id: "tpl_proposal",
    code: "DOC-01",
    title: "Proposal Produksi & Konsep Penyutradaraan",
    category: "Pra-Produksi",
    desc: "Dokumen perencanaan pementasan meliputi tema, konsep garap artistik, target penonton, dan lini masa.",
    defaultIntro:
      "Pementasan teater ini dirancang sebagai wujud eksplorasi artistik dan kolaborasi lintas divisi dalam mata pelajaran Seni Teater. Konsep penyutradaraan menekankan kekuatan akting realis serta tata artistik simbolik.",
    columns: ["Komponen Perencanaan", "Uraian Konsep & Strategi", "Target Capaian", "Divisi Penanggung Jawab"],
    autoFillType: "EMPTY",
    sampleRows: [
      ["Tema & Pesan Lakon", "Konflik nilai keluarga dan kejujuran di tengah perubahan zaman", "Penonton memahami pesan moral lakon", "Sutradara & Dramaturg"],
      ["Gaya Penyutradaraan", "Realisme psikologis dengan tempo dramatik bertahap", "Akting natural dan artikulasi jelas", "Sutradara"],
      ["Konsep Tata Artistik", "Set ruang tamu era 1990-an dengan pencahayaan hangat", "Atmosfer panggung mendukung emosi adegan", "Penata Artistik & Cahaya"],
      ["Target Publikasi", "Publikasi poster digital dan undangan warga sekolah", "Minimal 120 penonton hadir saat pementasan", "Pimpinan Produksi & Dokumentasi"]
    ],
    signatories: {
      leftRole: "Sekretaris Produksi",
      centerRole: "Pimpinan Produksi",
      rightRole: "Guru Pengampu"
    }
  },
  {
    id: "tpl_kerabat_kerja",
    code: "DOC-02",
    title: "Susunan Kerabat Kerja Produksi (SK Tim)",
    category: "Administrasi",
    desc: "Daftar struktur pimpinan produksi, sutradara, pemeran, dan seluruh divisi artistik (otomatis terisi dari anggota kelompok).",
    defaultIntro:
      "Berikut adalah susunan resmi kerabat kerja produksi teater yang bertanggung jawab penuh atas kelancaran proses pra-produksi, latihan, pementasan, hingga pasca-produksi.",
    columns: ["No", "Nama Lengkap", "NIS", "Jabatan / Divisi", "Uraian Tugas Utama", "Kontak WA"],
    autoFillType: "MEMBERS",
    sampleRows: [
      ["1", "Andi Pratama", "230101", "Pimpinan Produksi", "Mengkoordinasikan seluruh divisi non-artistik, perizinan, dan anggaran", "081234567890"],
      ["2", "Siti Rahmawati", "230102", "Sutradara", "Menafsirkan naskah, melatih keaktoran, dan mengatur bloking panggung", "081298765432"]
    ],
    signatories: {
      leftRole: "Sekretaris Produksi",
      centerRole: "Pimpinan Produksi",
      rightRole: "Guru Pengampu"
    }
  },
  {
    id: "tpl_bedah_naskah",
    code: "DOC-03",
    title: "Lembar Bedah Naskah & Analisis Penokohan",
    category: "Dramaturgi",
    desc: "Pemetaan karakter tokoh dari dimensi fisiologis, sosiologis, psikologis, serta motif konflik tiap babak.",
    defaultIntro:
      "Analisis penokohan ini disusun sebagai acuan pemeran dan sutradara dalam membangun karakterisasi, intonasi dialog, serta gestur tubuh di atas panggung.",
    columns: ["Nama Tokoh", "Pemeran", "Dimensi Fisiologis & Usia", "Dimensi Sosiologis", "Dimensi Psikologis & Konflik Utama"],
    autoFillType: "EMPTY",
    sampleRows: [
      ["Raden Saleh (Ayah)", "Budi Santoso", "Pria 52 tahun, postur tegap namun mulai menua, suara berat", "Kepala keluarga terpandang, mantan pegawai negeri", "Keras kepala, menjunjung harga diri, berkonflik dengan anak sulungnya"],
      ["Ningsih (Ibu)", "Dewi Lestari", "Perempuan 48 tahun, gerak lembut, tatapan penuh harap", "Ibu rumah tangga yang menjadi penengah keluarga", "Penyabar, menyimpan kesedihan mendalam, berusaha mendamaikan keluarga"]
    ],
    signatories: {
      leftRole: "Dramaturg / Penulis",
      centerRole: "Sutradara",
      rightRole: "Guru Pengampu"
    }
  },
  {
    id: "tpl_jadwal_latihan",
    code: "DOC-04",
    title: "Matriks Jadwal Latihan & Bloking",
    category: "Manajemen Panggung",
    desc: "Jadwal latihan rutin dari reading, olah tubuh/vokal, bloking per adegan, hingga gladi bersih.",
    defaultIntro:
      "Seluruh kerabat kerja wajib hadir 15 menit sebelum jadwal latihan dimulai dengan membawa naskah cetak dan mengenakan pakaian latihan yang nyaman.",
    columns: ["Pertemuan", "Hari / Tanggal", "Waktu", "Materi / Fokus Adegan", "Lokasi", "Penanggung Jawab"],
    autoFillType: "EMPTY",
    sampleRows: [
      ["Ke-1", "Senin, 10 Nov 2026", "15.00 - 17.00", "Table Reading & Bedah Naskah Babak I–III", "Ruang Teater", "Sutradara"],
      ["Ke-2", "Rabu, 12 Nov 2026", "15.00 - 17.00", "Olah Vokal, Artikulasi & Latihan Dialog Babak I", "Aula Sekolah", "Asisten Sutradara"],
      ["Ke-3", "Jumat, 14 Nov 2026", "14.30 - 17.00", "Bloking Panggung Babak I & II + Pengukuran Set", "Panggung Utama", "Stage Manager"]
    ],
    signatories: {
      leftRole: "Stage Manager",
      centerRole: "Pimpinan Produksi",
      rightRole: "Guru Pengampu"
    }
  },
  {
    id: "tpl_rab",
    code: "DOC-05",
    title: "Rencana Anggaran Biaya (RAB) Produksi",
    category: "Keuangan",
    desc: "Rincian kebutuhan dana per divisi dengan kalkulasi otomatis Volume × Harga Satuan dan Total Anggaran.",
    defaultIntro:
      "Rencana Anggaran Biaya (RAB) ini disusun secara efisien dan transparan berdasarkan kebutuhan riil masing-masing divisi produksi teater.",
    columns: ["Divisi", "Uraian Kebutuhan", "Volume", "Harga Satuan (Rp)", "Jumlah (Rp)"],
    autoFillType: "EMPTY",
    calcConfig: {
      qtyCol: 2,
      priceCol: 3,
      totalCol: 4,
      grandTotalLabel: "TOTAL ANGGARAN PRODUKSI"
    },
    currencyCols: [3, 4],
    sampleRows: [
      ["Artistik & Panggung", "Cat tembok, kuas, dan triplek latar panggung", "3", "85000", "255000"],
      ["Kostum & Tata Rias", "Sewa kostum periode 1990-an (5 pemeran)", "5", "40000", "200000"],
      ["Tata Rias", "Paket makeup karakter & bedak panggung", "2", "65000", "130000"],
      ["Naskah & Administrasi", "Cetak naskah pemain & buku acara penonton", "25", "6000", "150000"]
    ],
    signatories: {
      leftRole: "Bendahara Produksi",
      centerRole: "Pimpinan Produksi",
      rightRole: "Guru Pengampu"
    }
  },
  {
    id: "tpl_inventaris_properti",
    code: "DOC-06",
    title: "Daftar Inventaris Properti, Set & Kostum",
    category: "Artistik",
    desc: "Pencatatan lengkap properti panggung, kostum tiap tokoh, sumber pengadaan, dan status kesiapan (otomatis terhubung ke Logistik).",
    defaultIntro:
      "Daftar inventaris ini digunakan oleh Stage Manager dan Divisi Artistik untuk memeriksa kelengkapan barang sebelum pementasan (pre-show check) dan pengembalian pasca-pentas.",
    columns: ["Kode", "Nama Properti / Kostum", "Tokoh / Adegan", "Jumlah", "Sumber Pengadaan", "Status Kesiapan"],
    autoFillType: "INVENTORY",
    sampleRows: [
      ["PRP-01", "Meja kayu klasik & taplak renda", "Set Utama Babak I–III", "1 set", "Inventaris Sekolah", "Siap Pentas"],
      ["PRP-02", "Koper kulit tua & surat wasiat", "Tokoh Ayah (Babak II)", "1 buah", "Properti Pribadi", "Siap Pentas"],
      ["KST-01", "Kemeja batik lengan panjang & peci hitam", "Tokoh Ayah", "1 stel", "Sewa Sanggar", "Dalam Proses"]
    ],
    signatories: {
      leftRole: "Penata Artistik & Kostum",
      centerRole: "Stage Manager",
      rightRole: "Guru Pengampu"
    }
  },
  {
    id: "tpl_cue_sheet",
    code: "DOC-07",
    title: "Master Cue Sheet Tata Cahaya & Tata Suara",
    category: "Teknis Pertunjukan",
    desc: "Panduan teknis detik demi detik pergantian lampu (lighting), efek suara (SFX), dan musik ilustrasi.",
    defaultIntro:
      "Cue sheet ini wajib dipegang oleh Stage Manager, Operator Lighting, dan Operator Sound System selama gladi bersih dan pementasan utama berlangsung.",
    columns: ["Cue #", "Babak / Adegan", "Dialog / Gerak Pemicu", "Instruksi Cahaya (Lighting)", "Instruksi Suara / Musik", "Durasi / Fade"],
    autoFillType: "EMPTY",
    sampleRows: [
      ["CUE-01", "Pembukaan", "MC selesai membacakan prolog", "House light OFF, Stage Warm Wash Fade In 50%", "Musik instrumen gamelan pelan Fade In", "5 detik"],
      ["CUE-02", "Babak I - Adegan 2", "Dialog Ayah: 'Keluar dari rumah ini!'", "Spot Center fokus ke Ayah & Anak (Amber)", "SFX petir menggelegar + musik tegang", "3 detik"],
      ["CUE-03", "Penutup Babak III", "Seluruh aktor membeku (Freeze) 4 hitungan", "Blackout serentak, lanjut Curtain Call 100%", "Musik tema penutup penuh (Full Volume)", "Fade Out 4 dtk"]
    ],
    signatories: {
      leftRole: "Penata Cahaya & Suara",
      centerRole: "Stage Manager",
      rightRole: "Guru Pengampu"
    }
  },
  {
    id: "tpl_rundown_pentas",
    code: "DOC-08",
    title: "Rundown & Stage Management Hari Pementasan",
    category: "Teknis Pertunjukan",
    desc: "Susunan waktu operasional mulai dari loading set, check sound, open gate penonton, hingga clear area.",
    defaultIntro:
      "Seluruh kru backstage dan pemeran wajib berada di area gedung pertunjukan sesuai jadwal call time yang tercantum dalam rundown berikut.",
    columns: ["Waktu", "Durasi", "Agenda / Tahapan Kegiatan", "Area / Lokasi", "Divisi Terlibat", "Keterangan Teknis"],
    autoFillType: "EMPTY",
    sampleRows: [
      ["07.30 - 08.30", "60 menit", "Call Time Kru, Loading Set & Cek Properti", "Panggung Utama", "Artistik & Stage Manager", "Pastikan posisi bloking bertanda lakban"],
      ["08.30 - 09.30", "60 menit", "Check Sound, Mic Wireless & Fokus Lampu", "Ruang Operator", "Lighting & Sound", "Uji seluruh cue sheet CUE-01 s.d. CUE-10"],
      ["09.30 - 10.15", "45 menit", "Tata Rias, Kostum & Pemanasan Vokal", "Ruang Rias", "Pemeran & Tata Rias", "Standby backstage 15 menit sebelum pentas"],
      ["10.30 - 11.30", "60 menit", "Pementasan Utama & Curtain Call", "Panggung Utama", "Seluruh Kerabat Kerja", "Dokumentasi video multi-angle"]
    ],
    signatories: {
      leftRole: "Stage Manager",
      centerRole: "Pimpinan Produksi",
      rightRole: "Guru Pengampu"
    }
  },
  {
    id: "tpl_presensi_latihan",
    code: "DOC-09",
    title: "Berita Acara & Rekap Kehadiran Latihan",
    category: "Evaluasi Kedisiplinan",
    desc: "Rekapitulasi kehadiran anggota tim selama proses latihan (otomatis terisi dari data Presensi Latihan Harian).",
    defaultIntro:
      "Rekap kehadiran latihan ini dicatat secara berkala oleh Sekretaris Produksi dan Pimpinan Produksi sebagai bahan pertimbangan penilaian aspek Disiplin.",
    columns: ["No", "Nama Lengkap", "Jabatan / Divisi", "Hadir", "Terlambat", "Izin/Sakit", "Alpa", "Persentase (%)"],
    autoFillType: "ATTENDANCE",
    sampleRows: [
      ["1", "Andi Pratama", "Pimpinan Produksi", "10", "0", "0", "0", "100%"],
      ["2", "Siti Rahmawati", "Sutradara", "9", "0", "1", "0", "90%"]
    ],
    signatories: {
      leftRole: "Sekretaris Produksi",
      centerRole: "Pimpinan Produksi",
      rightRole: "Guru Pengampu"
    }
  },
  {
    id: "tpl_lpj",
    code: "DOC-10",
    title: "Laporan Pertanggungjawaban (LPJ) & Evaluasi Akhir",
    category: "Pasca-Produksi",
    desc: "Laporan menyeluruh capaian pementasan, realisasi anggaran, kendala teknis, dan rekomendasi kelompok.",
    defaultIntro:
      "Puji syukur pementasan teater kelompok kami telah terlaksana dengan baik. Laporan Pertanggungjawaban ini disusun sebagai bentuk evaluasi menyeluruh atas kinerja setiap divisi.",
    columns: ["Bidang / Divisi", "Target Perencanaan", "Realisasi Capaian", "Kendala Lapangan", "Solusi & Rekomendasi"],
    autoFillType: "EMPTY",
    sampleRows: [
      ["Penyutradaraan & Akting", "Durasi pentas 50 menit dengan ritme terjaga", "Terlaksana 52 menit, emosi adegan tersampaikan", "Sempat terjadi jeda dialog 3 detik di Babak II", "Perlu latihan improvisasi penyelamat (ad-lib)"],
      ["Artistik & Properti", "Pergantian set antarbabak maksimal 45 detik", "Pergantian set tercapai dalam 38 detik", "Pencahayaan backstage agak gelap saat pindah set", "Gunakan senter biru redup untuk kru panggung"],
      ["Keuangan & Administrasi", "Pengeluaran tidak melebihi RAB Rp 735.000", "Realisasi Rp 710.000 (sisa saldo Rp 25.000)", "Harga sewa kostum naik sedikit dari estimasi", "Lakukan pemesanan kostum minimal H-14"]
    ],
    signatories: {
      leftRole: "Sekretaris & Bendahara",
      centerRole: "Pimpinan Produksi",
      rightRole: "Guru Pengampu"
    }
  }
];

export const DIALOGUE_10_STEPS = [
  "1. Membaca Naskah Utuh (Table Reading) — Pahami alur cerita, tema besar, dan pesan moral lakon.",
  "2. Analisis Latar Belakang Tokoh — Identifikasi dimensi fisiologis, sosiologis, dan psikologis karakter.",
  "3. Pemetaan Konflik & Tujuan (Objective) — Tentukan apa yang diinginkan tokoh di setiap adegan.",
  "4. Pengucapan & Artikulasi Jelas — Latih kejelasan huruf vokal dan konsonan tanpa terburu-buru.",
  "5. Pengaturan Intonasi, Tempo & Jeda — Gunakan jeda dramatik untuk menegaskan emosi dialog.",
  "6. Proyeksi Suara Ruang Panggung — Pastikan suara terdengar hingga barisan penonton paling belakang tanpa berteriak.",
  "7. Keselarasan Gestur & Ekspresi Wajah — Padukan bahasa tubuh alami dengan makna kalimat yang diucapkan.",
  "8. Mendengarkan Aktif (Active Listening) — Bereaksi jujur terhadap dialog lawan main, bukan sekadar menunggu giliran.",
  "9. Sinkronisasi Bloking & Ritme Adegan — Latih dialog sambil bergerak sesuai tata letak panggung.",
  "10. Run-Through Tanpa Naskah (Off-Book) — Uji kelancaran transisi antaradegan secara utuh."
];

// ============================================================================
// 3. UI, DEADLINE, PRESENSI & FORMAT HELPERS
// ============================================================================
export function escapeHtml(str) {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function parseNumericValue(val) {
  if (typeof val === "number") return Number.isFinite(val) ? val : 0;
  const cleaned = String(val ?? "").replace(/[^0-9]/g, "");
  return cleaned ? Number(cleaned) : 0;
}

export function formatRupiah(val) {
  const num = parseNumericValue(val);
  return "Rp " + num.toLocaleString("id-ID");
}

export function formatIndoDate(dateStr) {
  if (!dateStr) return "-";
  const parts = String(dateStr).split("-");
  if (parts.length !== 3) return dateStr;
  const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

export function getDeadlineStatus(deadlineStr, isDone = false) {
  if (isDone) {
    return {
      label: "Tuntas",
      badgeClass: "badge-success",
      daysDiff: 0,
      isOverdue: false,
      isUrgent: false,
      sortOrder: 5
    };
  }
  if (!deadlineStr) {
    return {
      label: "Tanpa Tenggat",
      badgeClass: "badge-neutral",
      daysDiff: 9999,
      isOverdue: false,
      isUrgent: false,
      sortOrder: 4
    };
  }
  const parts = String(deadlineStr).split("-");
  if (parts.length !== 3) {
    return {
      label: deadlineStr,
      badgeClass: "badge-neutral",
      daysDiff: 9999,
      isOverdue: false,
      isUrgent: false,
      sortOrder: 4
    };
  }

  const target = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diffDays = Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return {
      label: `Terlambat ${Math.abs(diffDays)} hari`,
      badgeClass: "badge-danger",
      daysDiff: diffDays,
      isOverdue: true,
      isUrgent: false,
      sortOrder: 1
    };
  }
  if (diffDays === 0) {
    return {
      label: "Hari Ini!",
      badgeClass: "badge-danger",
      daysDiff: 0,
      isOverdue: false,
      isUrgent: true,
      sortOrder: 2
    };
  }
  if (diffDays <= 3) {
    return {
      label: `H-${diffDays} (Segera)`,
      badgeClass: "badge-warning",
      daysDiff: diffDays,
      isOverdue: false,
      isUrgent: true,
      sortOrder: 2
    };
  }
  return {
    label: `H-${diffDays}`,
    badgeClass: "badge-info",
    daysDiff: diffDays,
    isOverdue: false,
    isUrgent: false,
    sortOrder: 3
  };
}

export function buildWaReminderUrl(phone, recipientName, taskTitle, deadlineStr, groupName = "") {
  const clean = String(phone || "").replace(/^0/, "62").replace(/[^0-9]/g, "");
  if (!clean) return "";
  const formattedDate = deadlineStr ? formatIndoDate(deadlineStr) : "segera";
  const text =
    `Halo ${recipientName || "Rekan Tim"}, pengingat tugas produksi teater` +
    `${groupName ? ` (${groupName})` : ""}: *"${taskTitle}"* dengan tenggat waktu *${formattedDate}*. ` +
    `Mohon segera diperbarui progresnya di aplikasi SP-PPT. Terima kasih!`;
  return `https://wa.me/${clean}?text=${encodeURIComponent(text)}`;
}

export function computeMemberAttendance(member, groupSessions = []) {
  const memberIds = new Set([member.id, member.docId, member.authUid].filter(Boolean));
  let present = 0;
  let late = 0;
  let excused = 0;
  let absent = 0;
  let recordedSessions = 0;

  groupSessions.forEach((sess) => {
    const records = sess.records || {};
    let status = null;
    for (const id of memberIds) {
      if (records[id]) {
        status = records[id];
        break;
      }
    }
    if (status) {
      recordedSessions += 1;
      if (status === "HADIR") present += 1;
      else if (status === "TERLAMBAT") late += 1;
      else if (status === "IZIN") excused += 1;
      else if (status === "ALPA") absent += 1;
    }
  });

  const effectivePresent = present + late * 0.75;
  const percentage = recordedSessions > 0 ? Math.round((effectivePresent / recordedSessions) * 100) : 100;

  return {
    present,
    late,
    excused,
    absent,
    totalSessions: recordedSessions,
    percentage
  };
}

export function showLoader(show, text = "Memuat data...") {
  let el = document.getElementById("globalLoader");
  if (!el) {
    el = document.createElement("div");
    el.id = "globalLoader";
    el.className = "loader-overlay hidden";
    el.innerHTML = `<div class="spinner"></div><p id="globalLoaderText">${escapeHtml(text)}</p>`;
    document.body.appendChild(el);
  }
  const txt = document.getElementById("globalLoaderText");
  if (txt) txt.textContent = text;
  el.classList.toggle("hidden", !show);
}

export function showToast(message, type = "info", duration = 3500) {
  let container = document.getElementById("toastContainer");
  if (!container) {
    container = document.createElement("div");
    container.id = "toastContainer";
    container.className = "toast-container";
    document.body.appendChild(container);
  }
  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  container.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add("show"));
  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 250);
  }, duration);
}

export function confirmDialog(title, message, confirmLabel = "Ya, Lanjutkan", isDanger = true) {
  return new Promise((resolve) => {
    const backdrop = document.createElement("div");
    backdrop.className = "modal-backdrop";
    backdrop.innerHTML = `
      <div class="modal-card modal-sm">
        <div class="modal-header">
          <h3>${escapeHtml(title)}</h3>
          <button type="button" class="btn-close-modal" data-act="cancel">&times;</button>
        </div>
        <p class="confirm-text">${escapeHtml(message)}</p>
        <div class="modal-footer">
          <button type="button" class="btn btn-outline" data-act="cancel">Batal</button>
          <button type="button" class="btn ${isDanger ? "btn-danger" : "btn-primary"}" data-act="ok">${escapeHtml(confirmLabel)}</button>
        </div>
      </div>
    `;
    document.body.appendChild(backdrop);

    const cleanup = (val) => {
      backdrop.remove();
      resolve(val);
    };
    backdrop.querySelectorAll('[data-act="cancel"]').forEach((b) => b.addEventListener("click", () => cleanup(false)));
    backdrop.querySelector('[data-act="ok"]').addEventListener("click", () => cleanup(true));
  });
}

export function compressImageFile(file, maxWidth = 420, quality = 0.72) {
  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith("image/")) {
      reject(new Error("File harus berupa gambar (JPG/PNG/WebP)."));
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let w = img.width;
        let h = img.height;
        if (w > maxWidth) {
          h = Math.round((h * maxWidth) / w);
          w = maxWidth;
        }
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.onerror = () => reject(new Error("Gagal memproses gambar."));
      img.src = e.target.result;
    };
    reader.onerror = () => reject(new Error("Gagal membaca file gambar."));
    reader.readAsDataURL(file);
  });
}

// Helper untuk menampilkan foto profil pengguna atau inisial nama secara konsisten
export function renderAvatarHtml(user, sizePx = 36, showPhoto = true) {
  const name = String(user?.name || "U").trim();
  const initials = name
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase() || "U";
  const fontSize = Math.max(11, Math.round(sizePx * 0.36));
  const styleAttr = `width:${sizePx}px;height:${sizePx}px;font-size:${fontSize}px;`;

  if (showPhoto && user?.avatarUrl) {
    return `<img src="${escapeHtml(user.avatarUrl)}" class="avatar-circle" style="${styleAttr}" alt="${escapeHtml(name)}" />`;
  }
  return `<div class="avatar-circle" style="${styleAttr}">${escapeHtml(initials)}</div>`;
}

// ============================================================================
// 4. AUTENTIKASI, NORMALISASI EMAIL & LEGACY LOGIN BRIDGE
// ============================================================================
export function usernameToAuthEmail(identifier) {
  const clean = String(identifier || "").trim().toLowerCase();
  if (!clean) return "";
  if (clean.includes("@")) return clean;
  const safeLocal = clean.replace(/[^a-z0-9._-]/g, "_");
  return `${safeLocal}@sp-ppt.local`;
}

export function normalizeRole(rawRole) {
  const r = String(rawRole || "").trim().toUpperCase();
  if (r === "ADMIN" || r === "SUPERADMIN") return "ADMIN";
  if (r === "TEACHER" || r === "GURU") return "TEACHER";
  if (r === "LEADER" || r === "KETUA" || r === "PIMPINAN") return "LEADER";
  return "STUDENT";
}

export function getDashboardUrlByRole(role) {
  const r = normalizeRole(role);
  if (r === "ADMIN") return "admin.html";
  if (r === "TEACHER") return "guru.html";
  return "siswa.html";
}

export function getRoleLabel(role) {
  const r = normalizeRole(role);
  if (r === "ADMIN") return "Super Admin";
  if (r === "TEACHER") return "Guru Pengampu";
  if (r === "LEADER") return "Pimpinan Produksi (Leader)";
  return "Anggota Produksi (Siswa)";
}

export function getRoleBadgeClass(role) {
  const r = normalizeRole(role);
  if (r === "ADMIN") return "badge-admin";
  if (r === "TEACHER") return "badge-guru";
  if (r === "LEADER") return "badge-leader";
  return "badge-student";
}

export async function getUserProfileByUid(uid) {
  const directSnap = await getDoc(doc(db, COLS.USERS, uid));
  if (directSnap.exists()) {
    return { docId: directSnap.id, ...directSnap.data() };
  }
  const q = query(collection(db, COLS.USERS), where("authUid", "==", uid));
  const snap = await getDocs(q);
  if (!snap.empty) {
    const d = snap.docs[0];
    return { docId: d.id, ...d.data() };
  }
  return null;
}

export async function loginWithIdentifier(identifier, password) {
  const cleanId = String(identifier || "").trim();
  const cleanPass = String(password || "");
  if (!cleanId || !cleanPass) {
    throw new Error("Username/Email dan kata sandi wajib diisi.");
  }

  const emailCandidate = usernameToAuthEmail(cleanId);

  try {
    const cred = await signInWithEmailAndPassword(auth, emailCandidate, cleanPass);
    let profile = await getUserProfileByUid(cred.user.uid);
    if (!profile) {
      profile = await syncLegacyProfileForAuthUser(cred.user, cleanId);
    }
    if (!profile) {
      throw new Error("Profil pengguna tidak ditemukan di database. Hubungi Admin.");
    }
    if (profile.status === "SUSPENDED" || profile.active === false) {
      await signOut(auth);
      throw new Error("Akun Anda sedang dinonaktifkan oleh Admin.");
    }
    return profile;
  } catch (err) {
    const code = err?.code || "";
    const canTryLegacy =
      code === "auth/user-not-found" ||
      code === "auth/invalid-credential" ||
      code === "auth/invalid-login-credentials";

    if (!canTryLegacy) {
      throw new Error(mapFirebaseError(err));
    }

    const legacyMatch = await findLegacyUserMatch(cleanId, cleanPass);
    if (!legacyMatch) {
      throw new Error("Username/Email atau kata sandi salah.");
    }
    if (legacyMatch.status === "SUSPENDED" || legacyMatch.active === false) {
      throw new Error("Akun Anda sedang dinonaktifkan oleh Admin.");
    }

    const authPass = cleanPass.length >= 6 ? cleanPass : cleanPass.padEnd(6, "0");
    const targetEmail = legacyMatch.email && legacyMatch.email.includes("@")
      ? legacyMatch.email.trim().toLowerCase()
      : usernameToAuthEmail(legacyMatch.username || cleanId);

    let cred;
    try {
      cred = await createUserWithEmailAndPassword(auth, targetEmail, authPass);
    } catch (createErr) {
      if (createErr?.code === "auth/email-already-in-use") {
        cred = await signInWithEmailAndPassword(auth, targetEmail, authPass);
      } else {
        throw new Error(mapFirebaseError(createErr));
      }
    }

    const profileData = {
      id: legacyMatch.id || cred.user.uid,
      authUid: cred.user.uid,
      username: legacyMatch.username || cleanId.split("@")[0],
      email: targetEmail,
      name: legacyMatch.name || legacyMatch.nama || cleanId,
      role: normalizeRole(legacyMatch.role),
      classId: legacyMatch.classId || legacyMatch.kelasId || "",
      groupId: legacyMatch.groupId || legacyMatch.kelompokId || "",
      roleId: legacyMatch.roleId || legacyMatch.jabatan || "",
      nis: legacyMatch.nis || "",
      whatsapp: legacyMatch.whatsapp || legacyMatch.wa || "",
      avatarUrl: legacyMatch.avatarUrl || "",
      status: "ACTIVE",
      migratedFromLegacy: true,
      updatedAt: new Date().toISOString()
    };

    await setDoc(doc(db, COLS.USERS, cred.user.uid), profileData, { merge: true });
    return { docId: cred.user.uid, ...profileData };
  }
}

async function findLegacyUserMatch(identifier, password) {
  const lower = identifier.toLowerCase();

  try {
    const legacyStateSnap = await getDoc(doc(db, LEGACY_DOC_PATH[0], LEGACY_DOC_PATH[1]));
    if (legacyStateSnap.exists()) {
      const state = legacyStateSnap.data();
      const users = Array.isArray(state.users) ? state.users : [];
      const found = users.find((u) => {
        const uName = String(u.username || "").trim().toLowerCase();
        const uEmail = String(u.email || "").trim().toLowerCase();
        const uPass = String(u.password || "");
        return (uName === lower || uEmail === lower) && uPass === password;
      });
      if (found) return found;
    }
  } catch (e) {
    console.warn("Info cek legacy state:", e.message);
  }

  try {
    const snap = await getDocs(collection(db, COLS.USERS));
    for (const d of snap.docs) {
      const u = d.data();
      const uName = String(u.username || "").trim().toLowerCase();
      const uEmail = String(u.email || "").trim().toLowerCase();
      if ((uName === lower || uEmail === lower) && u.legacyPassword === password) {
        return { id: u.id || d.id, ...u };
      }
    }
  } catch (e) {
    console.warn("Info cek koleksi users:", e.message);
  }

  return null;
}

async function syncLegacyProfileForAuthUser(firebaseUser, fallbackIdentifier) {
  const emailLower = String(firebaseUser.email || "").toLowerCase();
  const userPrefix = emailLower.split("@")[0];

  const snap = await getDocs(collection(db, COLS.USERS));
  for (const d of snap.docs) {
    const u = d.data();
    if (
      String(u.email || "").toLowerCase() === emailLower ||
      String(u.username || "").toLowerCase() === userPrefix
    ) {
      const updated = { ...u, authUid: firebaseUser.uid, updatedAt: new Date().toISOString() };
      await setDoc(doc(db, COLS.USERS, firebaseUser.uid), updated, { merge: true });
      return { docId: firebaseUser.uid, ...updated };
    }
  }

  const legacySnap = await getDoc(doc(db, LEGACY_DOC_PATH[0], LEGACY_DOC_PATH[1]));
  if (legacySnap.exists()) {
    const users = legacySnap.data().users || [];
    const found = users.find(
      (u) =>
        String(u.email || "").toLowerCase() === emailLower ||
        String(u.username || "").toLowerCase() === userPrefix
    );
    if (found) {
      const profile = {
        id: found.id || firebaseUser.uid,
        authUid: firebaseUser.uid,
        username: found.username || userPrefix,
        email: emailLower,
        name: found.name || found.nama || fallbackIdentifier,
        role: normalizeRole(found.role),
        classId: found.classId || "",
        groupId: found.groupId || "",
        roleId: found.roleId || "",
        nis: found.nis || "",
        whatsapp: found.whatsapp || "",
        avatarUrl: found.avatarUrl || "",
        status: "ACTIVE",
        updatedAt: new Date().toISOString()
      };
      await setDoc(doc(db, COLS.USERS, firebaseUser.uid), profile, { merge: true });
      return { docId: firebaseUser.uid, ...profile };
    }
  }
  return null;
}

export function requireAuthRole(allowedRoles, onReady) {
  showLoader(true, "Memverifikasi sesi pengguna...");
  onAuthStateChanged(auth, async (fbUser) => {
    if (!fbUser) {
      showLoader(false);
      window.location.replace("index.html");
      return;
    }
    try {
      const profile = await getUserProfileByUid(fbUser.uid);
      if (!profile) {
        await signOut(auth);
        showLoader(false);
        window.location.replace("index.html");
        return;
      }
      if (profile.status === "SUSPENDED" || profile.active === false) {
        await signOut(auth);
        showLoader(false);
        window.location.replace("index.html");
        return;
      }
      const role = normalizeRole(profile.role);
      if (!allowedRoles.includes(role)) {
        showLoader(false);
        window.location.replace(getDashboardUrlByRole(role));
        return;
      }
      showLoader(false);
      onReady({ ...profile, role }, fbUser);
    } catch (err) {
      console.error("Gagal memverifikasi role:", err);
      showLoader(false);
      showToast("Gagal memuat profil pengguna: " + mapFirebaseError(err), "danger");
    }
  });
}

export async function logoutUser() {
  try {
    await signOut(auth);
    window.location.replace("index.html");
  } catch (err) {
    showToast("Gagal keluar: " + mapFirebaseError(err), "danger");
  }
}

export async function createAuthAccountByAdmin(usernameOrEmail, password) {
  const email = usernameToAuthEmail(usernameOrEmail);
  const safePass = String(password || "");
  if (safePass.length < 6) {
    throw new Error("Kata sandi minimal 6 karakter agar sesuai standar keamanan.");
  }
  const secondaryName = "SecondaryAdminWorker_" + Date.now();
  const secondaryApp = initializeApp(firebaseConfig, secondaryName);
  const secondaryAuth = getAuth(secondaryApp);
  try {
    const cred = await createUserWithEmailAndPassword(secondaryAuth, email, safePass);
    const uid = cred.user.uid;
    await signOut(secondaryAuth);
    return { uid, email };
  } finally {
    await deleteApp(secondaryApp);
  }
}

export async function changeOwnPassword(newPassword) {
  if (!auth.currentUser) throw new Error("Sesi login tidak ditemukan.");
  if (String(newPassword || "").length < 6) {
    throw new Error("Kata sandi baru minimal 6 karakter.");
  }
  await updatePassword(auth.currentUser, newPassword);
}

export function mapFirebaseError(err) {
  const code = err?.code || "";
  if (code === "auth/user-not-found" || code === "auth/wrong-password" || code === "auth/invalid-credential") {
    return "Username/Email atau kata sandi tidak sesuai.";
  }
  if (code === "auth/email-already-in-use") {
    return "Username atau email tersebut sudah terdaftar di sistem.";
  }
  if (code === "auth/weak-password") {
    return "Kata sandi terlalu lemah (minimal 6 karakter).";
  }
  if (code === "auth/too-many-requests") {
    return "Terlalu banyak percobaan login. Silakan tunggu beberapa saat.";
  }
  if (code === "auth/requires-recent-login") {
    return "Demi keamanan, silakan keluar lalu masuk kembali sebelum mengganti kata sandi.";
  }
  if (code === "permission-denied") {
    return "Akses ditolak oleh aturan keamanan database (Firestore Security Rules).";
  }
  return err?.message || "Terjadi kesalahan sistem.";
}

// ============================================================================
// 5. MIGRASI OTOMATIS 1-KLIK DARI DATABASE LAMA (sp_ppt_state/production_v1)
// ============================================================================
export async function inspectLegacyDatabase() {
  const legacyRef = doc(db, LEGACY_DOC_PATH[0], LEGACY_DOC_PATH[1]);
  const legacySnap = await getDoc(legacyRef);
  const metaSnap = await getDoc(doc(db, COLS.SETTINGS, "migration_meta"));

  if (!legacySnap.exists()) {
    return {
      hasLegacy: false,
      alreadyMigrated: metaSnap.exists() ? Boolean(metaSnap.data().completed) : false,
      counts: null
    };
  }

  const data = legacySnap.data() || {};
  return {
    hasLegacy: true,
    alreadyMigrated: metaSnap.exists() ? Boolean(metaSnap.data().completed) : false,
    migratedAt: metaSnap.exists() ? metaSnap.data().migratedAt : null,
    counts: {
      users: Array.isArray(data.users) ? data.users.length : 0,
      classes: Array.isArray(data.classes) ? data.classes.length : 0,
      groups: Array.isArray(data.groups) ? data.groups.length : 0,
      tasks: Array.isArray(data.tasks) ? data.tasks.length : 0,
      assessments: Array.isArray(data.assessments) ? data.assessments.length : 0,
      scripts: Array.isArray(data.scripts) ? data.scripts.length : 0,
      references: Array.isArray(data.references) ? data.references.length : 0,
      submissions: Array.isArray(data.submissions) ? data.submissions.length : 0,
      broadcasts: Array.isArray(data.broadcasts) ? data.broadcasts.length : 0
    }
  };
}

export async function runOneClickLegacyMigration(adminUser) {
  const legacyRef = doc(db, LEGACY_DOC_PATH[0], LEGACY_DOC_PATH[1]);
  const legacySnap = await getDoc(legacyRef);
  if (!legacySnap.exists()) {
    throw new Error("Dokumen database lama (sp_ppt_state/production_v1) tidak ditemukan.");
  }

  const old = legacySnap.data() || {};
  const operations = [];

  const classes = Array.isArray(old.classes) ? old.classes : [];
  classes.forEach((c, idx) => {
    const id = String(c.id || `class_${idx + 1}`);
    operations.push({
      ref: doc(db, COLS.CLASSES, id),
      data: {
        id,
        name: c.name || c.nama || `Kelas ${idx + 1}`,
        teacherId: c.teacherId || "",
        academicYear: c.academicYear || "2025/2026",
        migratedFromLegacy: true,
        updatedAt: new Date().toISOString()
      }
    });
  });

  const groups = Array.isArray(old.groups) ? old.groups : [];
  groups.forEach((g, idx) => {
    const id = String(g.id || `group_${idx + 1}`);
    const parentClass = classes.find((c) => c.id === g.classId);
    operations.push({
      ref: doc(db, COLS.GROUPS, id),
      data: {
        id,
        classId: g.classId || "",
        name: g.name || g.nama || `Kelompok ${idx + 1}`,
        title: g.title || g.judul || g.productionTitle || g.name || `Proyek Teater ${idx + 1}`,
        teacherId: g.teacherId || parentClass?.teacherId || "",
        leaderId: g.leaderId || "",
        logoUrl: g.logoUrl || "",
        showMemberPhotos: g.showMemberPhotos !== false,
        synopsis: g.synopsis || "",
        migratedFromLegacy: true,
        updatedAt: new Date().toISOString()
      }
    });
  });

  const users = Array.isArray(old.users) ? old.users : [];
  users.forEach((u, idx) => {
    const isCurrentAdmin =
      (u.username && u.username.toLowerCase() === String(adminUser.username || "").toLowerCase()) ||
      (u.email && u.email.toLowerCase() === String(adminUser.email || "").toLowerCase());

    const docId = isCurrentAdmin ? adminUser.docId : String(u.id || `legacy_user_${idx + 1}`);
    const targetEmail = u.email && u.email.includes("@")
      ? u.email.trim().toLowerCase()
      : usernameToAuthEmail(u.username || `user_${idx + 1}`);

    operations.push({
      ref: doc(db, COLS.USERS, docId),
      data: {
        id: String(u.id || docId),
        authUid: isCurrentAdmin ? adminUser.authUid : (u.authUid || ""),
        username: u.username || `user_${idx + 1}`,
        email: targetEmail,
        name: u.name || u.nama || u.username || `Pengguna ${idx + 1}`,
        role: normalizeRole(u.role),
        classId: u.classId || "",
        groupId: u.groupId || "",
        roleId: u.roleId || "",
        nis: u.nis || "",
        whatsapp: u.whatsapp || "",
        avatarUrl: u.avatarUrl || "",
        status: u.status || "ACTIVE",
        legacyPassword: u.password || "",
        migratedFromLegacy: true,
        updatedAt: new Date().toISOString()
      }
    });
  });

  const tasks = Array.isArray(old.tasks) ? old.tasks : [];
  tasks.forEach((t, idx) => {
    const id = String(t.id || `task_${idx + 1}`);
    operations.push({
      ref: doc(db, COLS.TASKS, id),
      data: {
        id,
        title: t.title || t.judul || `Tugas ${idx + 1}`,
        description: t.description || t.deskripsi || "",
        stage: t.stage || "PERSIAPAN",
        status: t.status || "TODO",
        classId: t.classId || "",
        groupId: t.groupId || "",
        assigneeId: t.assigneeId || t.userId || "",
        roleId: t.roleId || "",
        deadline: t.deadline || "",
        migratedFromLegacy: true,
        updatedAt: new Date().toISOString()
      }
    });
  });

  const assessments = Array.isArray(old.assessments) ? old.assessments : [];
  assessments.forEach((a, idx) => {
    const id = String(a.id || `assess_${idx + 1}`);
    const scores = a.scores || {};
    const disiplin = Number(scores.disiplin ?? a.disiplin ?? a.score ?? 0);
    const kolaborasi = Number(scores.kolaborasi ?? a.kolaborasi ?? a.score ?? 0);
    const kualitas = Number(scores.kualitas ?? a.kualitas ?? a.score ?? 0);
    const tanggungJawab = Number(scores.tanggungJawab ?? a.tanggungJawab ?? a.score ?? 0);
    const avg = Number(((disiplin + kolaborasi + kualitas + tanggungJawab) / 4).toFixed(2));

    let evalType = String(a.type || a.evaluatorType || "TEACHER").toUpperCase();
    if (!["SELF", "PEER", "TEACHER"].includes(evalType)) evalType = "TEACHER";

    operations.push({
      ref: doc(db, COLS.ASSESSMENTS, id),
      data: {
        id,
        targetUserId: String(a.targetUserId || a.studentId || a.userId || ""),
        evaluatorId: String(a.evaluatorId || a.teacherId || ""),
        evaluatorType: evalType,
        classId: a.classId || "",
        groupId: a.groupId || "",
        stage: a.stage || "PERTUNJUKAN",
        scores: { disiplin, kolaborasi, kualitas, tanggungJawab },
        average: avg,
        feedback: a.feedback || a.comment || a.catatan || "",
        projectNote: a.projectNote || "",
        migratedFromLegacy: true,
        updatedAt: a.updatedAt || a.date || new Date().toISOString()
      }
    });
  });

  const stageConfigs = Array.isArray(old.stages) ? old.stages : [];
  const activeStage = old.activeStage || "PERSIAPAN";
  PRODUCTION_STAGES.forEach((st) => {
    const found = stageConfigs.find((x) => x.stage === st.key || x.id === st.key) || {};
    operations.push({
      ref: doc(db, COLS.STAGES, st.key),
      data: {
        id: st.key,
        stage: st.key,
        label: st.label,
        desc: st.desc,
        isActive: activeStage === st.key || Boolean(found.isActive),
        startDate: found.startDate || "",
        endDate: found.endDate || "",
        updatedAt: new Date().toISOString()
      }
    });
  });

  const scripts = Array.isArray(old.scripts) ? old.scripts : [];
  scripts.forEach((s, idx) => {
    const id = String(s.id || `script_${idx + 1}`);
    operations.push({
      ref: doc(db, COLS.SCRIPTS, id),
      data: {
        id,
        title: s.title || `Naskah ${idx + 1}`,
        author: s.author || "",
        classId: s.classId || "",
        groupId: s.groupId || "",
        content: s.content || "",
        reviewStatus: s.reviewStatus || "DRAFT",
        teacherFeedback: s.teacherFeedback || "",
        updatedAt: s.updatedAt || new Date().toISOString()
      }
    });
  });

  const references = Array.isArray(old.references) ? old.references : [];
  references.forEach((r, idx) => {
    const id = String(r.id || `ref_${idx + 1}`);
    operations.push({
      ref: doc(db, COLS.REFERENCES, id),
      data: {
        id,
        title: r.title || `Referensi ${idx + 1}`,
        category: r.category || "Musik Ilustrasi",
        url: r.url || "",
        classId: r.classId || "",
        notes: r.notes || "",
        createdBy: r.createdBy || "",
        updatedAt: new Date().toISOString()
      }
    });
  });

  const submissions = Array.isArray(old.submissions) ? old.submissions : [];
  submissions.forEach((sub, idx) => {
    const id = String(sub.id || `sub_${idx + 1}`);
    operations.push({
      ref: doc(db, COLS.SUBMISSIONS, id),
      data: {
        id,
        templateId: sub.templateId || "tpl_custom",
        templateTitle: sub.templateTitle || sub.title || `Dokumen ${idx + 1}`,
        classId: sub.classId || "",
        groupId: sub.groupId || "",
        submittedBy: sub.submittedBy || "",
        submittedByName: sub.submittedByName || "",
        rows: Array.isArray(sub.rows) ? sub.rows : [],
        notes: sub.notes || "",
        driveUrl: sub.driveUrl || "",
        updatedAt: sub.updatedAt || new Date().toISOString()
      }
    });
  });

  const broadcasts = Array.isArray(old.broadcasts) ? old.broadcasts : [];
  broadcasts.forEach((b, idx) => {
    const id = String(b.id || `bc_${idx + 1}`);
    operations.push({
      ref: doc(db, COLS.BROADCASTS, id),
      data: {
        id,
        title: b.title || "Pengumuman Produksi",
        message: b.message || b.content || "",
        targetClassIds: Array.isArray(b.targetClassIds) ? b.targetClassIds : [],
        linkUrl: b.linkUrl || "",
        imageUrl: b.imageUrl || "",
        senderName: b.senderName || "Admin",
        createdAt: b.createdAt || new Date().toISOString()
      }
    });
  });

  const oldWeights = old.rubricWeights || old.weights || DEFAULT_WEIGHTS;
  operations.push({
    ref: doc(db, COLS.SETTINGS, "rubric_weights"),
    data: {
      self: Number(oldWeights.self ?? 15),
      peer: Number(oldWeights.peer ?? 25),
      teacher: Number(oldWeights.teacher ?? 60),
      updatedAt: new Date().toISOString()
    }
  });

  const oldFolders = Array.isArray(old.driveFolders) && old.driveFolders.length
    ? old.driveFolders
    : DRIVE_FOLDERS_DEFAULT.map((name, i) => ({ index: i + 1, name, url: "" }));
  operations.push({
    ref: doc(db, COLS.SETTINGS, "drive_folders"),
    data: {
      folders: oldFolders,
      updatedAt: new Date().toISOString()
    }
  });

  operations.push({
    ref: doc(db, COLS.SETTINGS, "migration_meta"),
    data: {
      completed: true,
      migratedAt: new Date().toISOString(),
      migratedBy: adminUser.name || adminUser.email,
      totalRecords: operations.length
    }
  });

  const CHUNK_SIZE = 400;
  for (let i = 0; i < operations.length; i += CHUNK_SIZE) {
    const batch = writeBatch(db);
    const slice = operations.slice(i, i + CHUNK_SIZE);
    slice.forEach((op) => batch.set(op.ref, op.data, { merge: true }));
    await batch.commit();
  }

  return operations.length;
}

// ============================================================================
// 6. OPERASI DATA FIRESTORE (CRUD BERSAMA)
// ============================================================================
export async function fetchAllCollection(colName) {
  const snap = await getDocs(collection(db, colName));
  return snap.docs.map((d) => ({ docId: d.id, ...d.data() }));
}

export async function saveDocument(colName, docId, payload) {
  const clean = { ...payload, updatedAt: new Date().toISOString() };
  await setDoc(doc(db, colName, docId), clean, { merge: true });
  return { docId, ...clean };
}

export async function removeDocument(colName, docId) {
  await deleteDoc(doc(db, colName, docId));
}

export async function getRubricWeights() {
  const snap = await getDoc(doc(db, COLS.SETTINGS, "rubric_weights"));
  if (snap.exists()) {
    const d = snap.data();
    return {
      self: Number(d.self ?? 15),
      peer: Number(d.peer ?? 25),
      teacher: Number(d.teacher ?? 60)
    };
  }
  return { ...DEFAULT_WEIGHTS };
}

export async function getDriveFolders() {
  const snap = await getDoc(doc(db, COLS.SETTINGS, "drive_folders"));
  if (snap.exists() && Array.isArray(snap.data().folders)) {
    return snap.data().folders;
  }
  return DRIVE_FOLDERS_DEFAULT.map((name, idx) => ({ index: idx + 1, name, url: "" }));
}

// ============================================================================
// 7. KALKULATOR RUBRIK 4 ASPEK & BOBOT 360° (SELF 15%, PEER 25%, TEACHER 60%)
// ============================================================================
export function calculateAspectAverage(scores) {
  const d = Number(scores?.disiplin || 0);
  const k = Number(scores?.kolaborasi || 0);
  const q = Number(scores?.kualitas || 0);
  const t = Number(scores?.tanggungJawab || 0);
  return Number(((d + k + q + t) / 4).toFixed(2));
}

export function getPredikat(score) {
  const n = Number(score || 0);
  if (n >= 90) return "A (Sangat Baik)";
  if (n >= 80) return "B (Baik)";
  if (n >= 70) return "C (Cukup)";
  if (n > 0) return "D (Perlu Bimbingan)";
  return "Belum Dinilai";
}

export function computeStudent360Summary(student, allAssessments, weights = DEFAULT_WEIGHTS) {
  const targetIds = new Set([student.id, student.docId, student.authUid].filter(Boolean));
  const mine = allAssessments.filter((a) => targetIds.has(a.targetUserId));

  const selfItems = mine.filter((a) => a.evaluatorType === "SELF");
  const peerItems = mine.filter((a) => a.evaluatorType === "PEER");
  const teacherItems = mine.filter((a) => a.evaluatorType === "TEACHER");

  const avgOf = (arr) => {
    if (!arr.length) return null;
    const sum = arr.reduce((acc, item) => acc + calculateAspectAverage(item.scores), 0);
    return Number((sum / arr.length).toFixed(2));
  };

  const selfAvg = avgOf(selfItems);
  const peerAvg = avgOf(peerItems);
  const teacherAvg = avgOf(teacherItems);

  const latestTeacher = teacherItems.sort((a, b) =>
    String(b.updatedAt || "").localeCompare(String(a.updatedAt || ""))
  )[0] || null;

  const sVal = selfAvg ?? 0;
  const pVal = peerAvg ?? 0;
  const tVal = teacherAvg ?? 0;

  const finalScore = Number(
    ((sVal * weights.self + pVal * weights.peer + tVal * weights.teacher) / 100).toFixed(2)
  );

  return {
    selfAvg,
    peerAvg,
    teacherAvg,
    peerCount: peerItems.length,
    isGradedByTeacher: teacherItems.length > 0,
    latestTeacher,
    finalScore,
    predikat: teacherItems.length > 0 || selfAvg !== null || peerAvg !== null ? getPredikat(finalScore) : "Belum Dinilai"
  };
}

// ============================================================================
// 8. EKSPOR CSV, DOCX DOKUMEN PRODUKSI, RAPOR INDIVIDU & E-PROGRAM BUKU ACARA
// ============================================================================
export function exportGradeRecapCSV(rows, filename = "rekap_nilai_proyek_teater.csv") {
  const headers = [
    "No",
    "Nama Siswa",
    "NIS",
    "Kelas",
    "Kelompok / Proyek",
    "Peran / Divisi",
    "Disiplin (Guru)",
    "Kolaborasi (Guru)",
    "Kualitas (Guru)",
    "Tanggung Jawab (Guru)",
    "Rata-rata Guru",
    "Rata-rata Self",
    "Rata-rata Peer",
    "Nilai Akhir 360",
    "Predikat",
    "Status Penilaian",
    "Catatan Guru"
  ];

  const escapeCsv = (val) => {
    const s = String(val ?? "").replace(/"/g, '""');
    return `"${s}"`;
  };

  const csvLines = [headers.map(escapeCsv).join(",")];
  rows.forEach((r, idx) => {
    const line = [
      idx + 1,
      r.studentName,
      r.nis || "-",
      r.className || "-",
      r.groupName || "-",
      r.roleName || "-",
      r.disiplin ?? "-",
      r.kolaborasi ?? "-",
      r.kualitas ?? "-",
      r.tanggungJawab ?? "-",
      r.teacherAvg ?? "-",
      r.selfAvg ?? "-",
      r.peerAvg ?? "-",
      r.finalScore,
      r.predikat,
      r.isGraded ? "Sudah Dinilai" : "Belum Dinilai",
      r.feedback || "-"
    ];
    csvLines.push(line.map(escapeCsv).join(","));
  });

  const blob = new Blob(["\uFEFF" + csvLines.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export async function exportProductionDocx({
  docCode = "DOC-SPPPT",
  title,
  category,
  className,
  groupName,
  productionTitle,
  authorName,
  meta = {},
  introText = "",
  columns,
  rows,
  calcConfig = null,
  currencyCols = [],
  signatories = null,
  notes = ""
}) {
  const docxLib = window.docx;
  if (!docxLib) {
    throw new Error("Library DOCX belum termuat. Periksa koneksi internet Anda lalu coba lagi.");
  }

  const {
    Document,
    Packer,
    Paragraph,
    TextRun,
    Table,
    TableRow,
    TableCell,
    WidthType,
    AlignmentType,
    BorderStyle
  } = docxLib;

  const schoolName = meta.schoolName || "UNIT PRODUKSI SENI TEATER SEKOLAH";
  const docNumber = meta.docNumber || `${docCode}/${new Date().getFullYear()}`;
  const eventDate = meta.eventDate || "-";
  const venue = meta.venue || "Panggung Pertunjukan Sekolah";
  const leaderName = meta.leaderName || ".........................";
  const teacherName = meta.teacherName || ".........................";

  const noBorders = {
    top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
    bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
    left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
    right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" }
  };

  const metaPairs = [
    ["Nomor Dokumen", docNumber, "Kelas / Kelompok", `${className || "-"} / ${groupName || "-"}`],
    ["Kategori", category || "Produksi Teater", "Judul Lakon", productionTitle || "-"],
    ["Tanggal Pementasan", eventDate, "Tempat / Gedung", venue],
    ["Penyusun Dokumen", authorName || "-", "Tanggal Cetak", new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })]
  ];

  const metaTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      ...noBorders,
      insideHorizontal: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
      insideVertical: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" }
    },
    rows: metaPairs.map(
      ([l1, v1, l2, v2]) =>
        new TableRow({
          children: [
            new TableCell({
              width: { size: 18, type: WidthType.PERCENTAGE },
              borders: noBorders,
              children: [new Paragraph({ children: [new TextRun({ text: l1, bold: true, size: 19, color: "334155" })] })]
            }),
            new TableCell({
              width: { size: 32, type: WidthType.PERCENTAGE },
              borders: noBorders,
              children: [new Paragraph({ children: [new TextRun({ text: `: ${v1}`, size: 19 })] })]
            }),
            new TableCell({
              width: { size: 18, type: WidthType.PERCENTAGE },
              borders: noBorders,
              children: [new Paragraph({ children: [new TextRun({ text: l2, bold: true, size: 19, color: "334155" })] })]
            }),
            new TableCell({
              width: { size: 32, type: WidthType.PERCENTAGE },
              borders: noBorders,
              children: [new Paragraph({ children: [new TextRun({ text: `: ${v2}`, size: 19 })] })]
            })
          ]
        })
    )
  });

  let grandTotal = 0;
  const computedRows = (rows.length ? rows : [columns.map(() => "-")]).map((rawRow) => {
    const rowCopy = [...rawRow];
    if (calcConfig && rows.length) {
      const qty = parseNumericValue(rowCopy[calcConfig.qtyCol]);
      const price = parseNumericValue(rowCopy[calcConfig.priceCol]);
      const subtotal = qty * price;
      rowCopy[calcConfig.totalCol] = subtotal;
      grandTotal += subtotal;
    }
    return rowCopy;
  });

  const tableHeaderRow = new TableRow({
    tableHeader: true,
    children: columns.map(
      (col, idx) =>
        new TableCell({
          shading: { fill: "7F1D1D" },
          children: [
            new Paragraph({
              alignment: currencyCols.includes(idx) ? AlignmentType.RIGHT : AlignmentType.LEFT,
              children: [new TextRun({ text: String(col), bold: true, color: "FFFFFF", size: 19 })]
            })
          ]
        })
    )
  });

  const dataRows = computedRows.map(
    (rowArr, rIdx) =>
      new TableRow({
        children: columns.map((_, cIdx) => {
          const isCurr = currencyCols.includes(cIdx) && rows.length > 0;
          const displayVal = isCurr ? formatRupiah(rowArr[cIdx]) : String(rowArr[cIdx] ?? "");
          return new TableCell({
            shading: rIdx % 2 === 1 ? { fill: "F8FAFC" } : undefined,
            children: [
              new Paragraph({
                alignment: isCurr ? AlignmentType.RIGHT : AlignmentType.LEFT,
                children: [new TextRun({ text: displayVal, size: 19 })]
              })
            ]
          });
        })
      })
  );

  if (calcConfig && rows.length) {
    const totalCells = columns.map((_, cIdx) => {
      if (cIdx === 0) {
        return new TableCell({
          shading: { fill: "FEF2F2" },
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: calcConfig.grandTotalLabel || "TOTAL KESELURUHAN",
                  bold: true,
                  color: "7F1D1D",
                  size: 19
                })
              ]
            })
          ]
        });
      }
      if (cIdx === calcConfig.totalCol) {
        return new TableCell({
          shading: { fill: "FEF2F2" },
          children: [
            new Paragraph({
              alignment: AlignmentType.RIGHT,
              children: [
                new TextRun({
                  text: formatRupiah(grandTotal),
                  bold: true,
                  color: "7F1D1D",
                  size: 20
                })
              ]
            })
          ]
        });
      }
      return new TableCell({
        shading: { fill: "FEF2F2" },
        children: [new Paragraph({ children: [new TextRun({ text: "", size: 19 })] })]
      });
    });
    dataRows.push(new TableRow({ children: totalCells }));
  }

  const sig = signatories || {
    leftRole: "Penyusun Dokumen",
    centerRole: "Pimpinan Produksi",
    rightRole: "Guru Pengampu"
  };

  const signatureTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      ...noBorders,
      insideHorizontal: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
      insideVertical: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" }
    },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 33, type: WidthType.PERCENTAGE },
            borders: noBorders,
            children: [
              new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Dibuat oleh,", size: 19 })] }),
              new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 640 }, children: [new TextRun({ text: sig.leftRole, bold: true, size: 19 })] }),
              new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `(${authorName || "........................."})`, bold: true, size: 19 })] })
            ]
          }),
          new TableCell({
            width: { size: 34, type: WidthType.PERCENTAGE },
            borders: noBorders,
            children: [
              new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Disetujui oleh,", size: 19 })] }),
              new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 640 }, children: [new TextRun({ text: sig.centerRole, bold: true, size: 19 })] }),
              new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `(${leaderName})`, bold: true, size: 19 })] })
            ]
          }),
          new TableCell({
            width: { size: 33, type: WidthType.PERCENTAGE },
            borders: noBorders,
            children: [
              new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Mengetahui,", size: 19 })] }),
              new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 640 }, children: [new TextRun({ text: sig.rightRole, bold: true, size: 19 })] }),
              new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `(${teacherName})`, bold: true, size: 19 })] })
            ]
          })
        ]
      })
    ]
  });

  const childrenBlocks = [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: String(schoolName).toUpperCase(),
          bold: true,
          size: 24,
          color: "7F1D1D"
        })
      ]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: "SISTEM PENILAIAN PROYEK PRODUKSI TEATER (SP-PPT)",
          size: 18,
          color: "475569"
        })
      ]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 120, after: 200 },
      border: {
        bottom: { style: BorderStyle.DOUBLE, size: 6, color: "7F1D1D" }
      },
      children: [
        new TextRun({
          text: String(title || "DOKUMEN PRODUKSI TEATER").toUpperCase(),
          bold: true,
          size: 26
        })
      ]
    }),
    metaTable,
    new Paragraph({ text: "", spacing: { after: 120 } })
  ];

  if (introText && introText.trim()) {
    childrenBlocks.push(
      new Paragraph({
        spacing: { after: 160 },
        children: [
          new TextRun({ text: "Ringkasan / Deskripsi Produksi:\n", bold: true, size: 20, color: "1E293B" }),
          new TextRun({ text: introText.trim(), size: 20 })
        ]
      })
    );
  }

  childrenBlocks.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: {
        top: { style: BorderStyle.SINGLE, size: 1, color: "CBD5E1" },
        bottom: { style: BorderStyle.SINGLE, size: 1, color: "CBD5E1" },
        left: { style: BorderStyle.SINGLE, size: 1, color: "CBD5E1" },
        right: { style: BorderStyle.SINGLE, size: 1, color: "CBD5E1" },
        insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: "CBD5E1" },
        insideVertical: { style: BorderStyle.SINGLE, size: 1, color: "CBD5E1" }
      },
      rows: [tableHeaderRow, ...dataRows]
    }),
    new Paragraph({
      spacing: { before: 200, after: 280 },
      children: [
        new TextRun({ text: "Catatan Tambahan / Instruksi Khusus:\n", bold: true, size: 20 }),
        new TextRun({ text: notes || "Tidak ada catatan tambahan.", size: 19 })
      ]
    }),
    signatureTable
  );

  const docObj = new Document({
    sections: [{ children: childrenBlocks }]
  });

  const blob = await Packer.toBlob(docObj);
  const safeName = String(title || "dokumen_teater")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_");
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${safeName}.docx`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// ============================================================================
// 9. GENERATOR RAPOR INDIVIDU (.DOCX) & E-PROGRAM BUKU ACARA (.DOCX)
// ============================================================================
export async function exportIndividualReportDocx({
  student,
  className = "-",
  groupName = "-",
  productionTitle = "-",
  teacherName = "Guru Pengampu",
  summary360,
  attendanceStats = null,
  weights = DEFAULT_WEIGHTS
}) {
  const sc = summary360?.latestTeacher?.scores || {};
  const aspectRows = RUBRIC_ASPECTS.map((asp, i) => [
    String(i + 1),
    asp.label,
    asp.desc,
    summary360?.isGradedByTeacher ? String(sc[asp.key] ?? "-") : "Belum Dinilai"
  ]);

  aspectRows.push(
    ["5", "Penilaian Diri Sendiri (Self)", `Bobot ${weights.self}% dalam komposisi nilai akhir`, summary360?.selfAvg !== null ? String(summary360.selfAvg) : "-"],
    ["6", "Penilaian Teman Sejawat (Peer)", `Bobot ${weights.peer}% (${summary360?.peerCount || 0} penilai)`, summary360?.peerAvg !== null ? String(summary360.peerAvg) : "-"],
    ["7", "Penilaian Guru Pengampu", `Bobot ${weights.teacher}% dalam komposisi nilai akhir`, summary360?.teacherAvg !== null ? String(summary360.teacherAvg) : "-"],
    ["★", "NILAI AKHIR PROYEK 360°", `Predikat Capaian: ${summary360?.predikat || "-"}`, String(summary360?.finalScore ?? "0")]
  );

  const attText = attendanceStats
    ? `Rekap Kehadiran Latihan: Hadir ${attendanceStats.present}x, Terlambat ${attendanceStats.late}x, Izin ${attendanceStats.excused}x, Alpa ${attendanceStats.absent}x (${attendanceStats.percentage}%).`
    : "";

  await exportProductionDocx({
    docCode: "RAPOR-TEATER",
    title: `KARTU HASIL PENILAIAN PROYEK TEATER — ${student.name}`,
    category: "Rapor Evaluasi Individu 360°",
    className,
    groupName,
    productionTitle,
    authorName: student.name,
    meta: {
      docNumber: `RAPOR/${student.nis || "SISWA"}/${new Date().getFullYear()}`,
      teacherName
    },
    introText:
      `Identitas Peserta Didik: ${student.name} (NIS: ${student.nis || "-"}) • Jabatan/Divisi: ${student.roleId || student.role}. ${attText}`,
    columns: ["No", "Komponen / Aspek Penilaian", "Indikator Capaian", "Skor"],
    rows: aspectRows,
    signatories: {
      leftRole: "Peserta Didik",
      centerRole: "Orang Tua / Wali",
      rightRole: "Guru Pengampu Seni Teater"
    },
    notes: summary360?.latestTeacher?.feedback || "Terus kembangkan kepekaan artistik dan kerja sama kolaboratif."
  });
}

export async function exportEProgramDocx({
  group,
  className = "-",
  members = [],
  script = null,
  teacherName = "-"
}) {
  const crewRows = members.map((m, idx) => {
    const meta = getRoleMetadata(m.roleId, m.role);
    return [
      String(idx + 1),
      m.name,
      m.roleId || (m.role === "LEADER" ? "Pimpinan Produksi" : "Anggota Produksi"),
      meta.categoryLabel
    ];
  });

  await exportProductionDocx({
    docCode: "E-PROGRAM",
    title: `BUKU ACARA PEMENTASAN: "${group?.title || "PROYEK TEATER"}"`,
    category: "E-Program & Publikasi Pertunjukan",
    className,
    groupName: group?.name || "-",
    productionTitle: group?.title || "-",
    authorName: group?.name || "Tim Produksi",
    meta: {
      docNumber: `PROGRAM/${new Date().getFullYear()}`,
      teacherName
    },
    introText:
      `Sinopsis Lakon: ${group?.synopsis || "Pementasan karya teater kolaboratif siswa."} ` +
      (script?.author ? `Naskah oleh: ${script.author}.` : ""),
    columns: ["No", "Nama Kerabat Kerja / Pemeran", "Peran / Jabatan Produksi", "Bidang Divisi"],
    rows: crewRows,
    signatories: {
      leftRole: "Sutradara",
      centerRole: "Pimpinan Produksi",
      rightRole: "Guru Pembimbing"
    },
    notes: "Terima kasih atas apresiasi dan kehadiran seluruh penonton dalam pementasan teater ini."
  });
}

// ============================================================================
// 10. BACKUP PENUH SELURUH KOLEKSI DATABASE FIREBASE (.JSON)
// ============================================================================
export async function exportFullDatabaseBackupJSON() {
  const backupData = {
    meta: {
      app: "SP-PPT (Sistem Penilaian Proyek Produksi Teater)",
      projectId: firebaseConfig.projectId,
      exportedAt: new Date().toISOString()
    },
    collections: {},
    legacyDocument: null
  };

  for (const [, colName] of Object.entries(COLS)) {
    try {
      const snap = await getDocs(collection(db, colName));
      backupData.collections[colName] = snap.docs.map((d) => ({ docId: d.id, ...d.data() }));
    } catch (err) {
      backupData.collections[colName] = { error: err.message };
    }
  }

  try {
    const legacySnap = await getDoc(doc(db, LEGACY_DOC_PATH[0], LEGACY_DOC_PATH[1]));
    if (legacySnap.exists()) {
      backupData.legacyDocument = legacySnap.data();
    }
  } catch (err) {
    backupData.legacyDocument = { error: err.message };
  }

  const jsonStr = JSON.stringify(backupData, null, 2);
  const blob = new Blob([jsonStr], { type: "application/json;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `backup_firebase_sp_ppt_${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
```