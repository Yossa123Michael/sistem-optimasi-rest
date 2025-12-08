# Panduan Upload Code ke GitHub

## Cara 1: Menggunakan Terminal di GitHub Codespace

Jika Anda bekerja di GitHub Codespace, ikuti langkah berikut:

### 1. Buka Terminal
Tekan `Ctrl + ` ` (backtick) atau buka dari menu Terminal → New Terminal

### 2. Konfigurasi Git (jika belum)
```bash
git config --global user.name "Nama Anda"
git config --global user.email "email@anda.com"
```

### 3. Cek Status Repository
```bash
git status
```

### 4. Tambahkan Semua File yang Berubah
```bash
git add .
```

### 5. Commit Perubahan
```bash
git commit -m "Update: RouteOptima delivery management system"
```

### 6. Push ke GitHub
```bash
git push origin main
```

Jika branch Anda bernama `master` bukan `main`, gunakan:
```bash
git push origin master
```

---

## Cara 2: Membuat Repository Baru di GitHub

Jika Anda ingin membuat repository GitHub baru:

### 1. Buat Repository Baru di GitHub.com
- Pergi ke https://github.com/new
- Beri nama repository (contoh: `routeoptima-delivery`)
- Pilih Public atau Private
- **JANGAN** centang "Initialize with README"
- Klik "Create repository"

### 2. Di Terminal Codespace, Jalankan:
```bash
# Inisialisasi git jika belum
git init

# Tambahkan remote repository
git remote add origin https://github.com/USERNAME/NAMA-REPO.git

# Atau jika sudah ada remote, ganti dengan:
git remote set-url origin https://github.com/USERNAME/NAMA-REPO.git

# Tambahkan semua file
git add .

# Commit
git commit -m "Initial commit: RouteOptima delivery management"

# Push ke GitHub
git branch -M main
git push -u origin main
```

Ganti `USERNAME` dengan username GitHub Anda dan `NAMA-REPO` dengan nama repository yang Anda buat.

---

## Cara 3: Menggunakan GitHub Desktop (untuk lokal)

Jika Anda bekerja di komputer lokal:

1. Download dan install GitHub Desktop dari https://desktop.github.com
2. Login dengan akun GitHub Anda
3. Pilih "Add" → "Add Existing Repository"
4. Pilih folder project Anda
5. Tulis commit message
6. Klik "Commit to main"
7. Klik "Push origin"

---

## Troubleshooting

### Error: "remote origin already exists"
```bash
git remote remove origin
git remote add origin https://github.com/USERNAME/NAMA-REPO.git
```

### Error: "Permission denied"
Anda mungkin perlu menggunakan Personal Access Token:
1. Pergi ke GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Generate new token dengan scope `repo`
3. Copy token tersebut
4. Saat push, gunakan token sebagai password

### Atau gunakan SSH:
```bash
git remote set-url origin git@github.com:USERNAME/NAMA-REPO.git
```

---

## File yang Penting

Proyek ini sudah memiliki `.gitignore` yang akan mengabaikan:
- `node_modules/` (dependencies tidak perlu di-upload)
- `.env` (file rahasia)
- `dist/` (build output)
- Files lainnya yang tidak perlu

Semua source code Anda di folder `src/` akan di-upload ke GitHub.

---

## Verifikasi Upload Berhasil

Setelah push, buka repository GitHub Anda di browser:
```
https://github.com/USERNAME/NAMA-REPO
```

Anda seharusnya melihat semua file proyek Anda di sana.

---

## Struktur Project yang Akan Di-upload

```
/
├── src/
│   ├── components/      # Semua React components
│   ├── lib/            # Types dan utilities
│   ├── App.tsx         # Main app
│   ├── index.css       # Styles
│   └── ...
├── index.html
├── package.json
├── tailwind.config.js
├── vite.config.ts
├── PRD.md
└── README.md
```

---

## Catatan Penting

⚠️ **JANGAN upload:**
- File `.env` dengan API keys atau secrets
- Folder `node_modules/` (sudah di-ignore)
- Personal access tokens atau credentials

✅ **DO upload:**
- Semua source code di `src/`
- Configuration files (`package.json`, `tsconfig.json`, dll)
- Documentation (`README.md`, `PRD.md`)

---

Jika Anda mengalami masalah, periksa:
1. Apakah Anda sudah login ke GitHub?
2. Apakah Anda punya permission untuk push ke repository?
3. Apakah ada conflict yang perlu di-resolve?
