# ⚡ Quick Start - Cara Cepat Menjalankan Proyek

Panduan singkat untuk menjalankan proyek ini di Visual Studio Code dalam 5 menit!

## 📦 Yang Anda Butuhkan

- [Node.js](https://nodejs.org/) (versi 18 atau lebih baru)
- [Visual Studio Code](https://code.visualstudio.com/)
- [Git](https://git-scm.com/)

## 🚀 3 Langkah Mudah

### 1️⃣ Clone & Buka Proyek

```bash
git clone https://github.com/Yossa123Michael/sistem-optimasi-rest.git
cd sistem-optimasi-rest
code .
```

### 2️⃣ Install Dependencies

Di terminal VS Code (tekan `Ctrl+` \` atau buka **Terminal > New Terminal**):

```bash
npm install
```

⏳ Tunggu beberapa menit hingga instalasi selesai...

### 3️⃣ Jalankan Aplikasi

```bash
npm run dev
```

🎉 **Selesai!** Buka browser dan kunjungi URL yang ditampilkan (biasanya http://localhost:5000)

## 📋 Perintah Penting

| Perintah | Fungsi |
|----------|--------|
| `npm run dev` | Jalankan development server |
| `npm run build` | Build untuk production |
| `npm run preview` | Preview production build |
| `npm run lint` | Check kode dengan linter |

## 💡 Tips

- **Terminal baru**: `Ctrl+` \` (backtick)
- **Format kode**: `Alt+Shift+F`
- **Save**: `Ctrl+S` (otomatis format jika Prettier terinstal)
- **Quick open**: `Ctrl+P` untuk cari file cepat

## 🔧 Install Ekstensi VS Code

Saat pertama kali buka proyek, VS Code akan menampilkan notifikasi untuk install ekstensi yang direkomendasikan. Klik **Install All** untuk pengalaman development yang lebih baik!

Ekstensi yang akan diinstall:
- ✅ ESLint - Detect errors
- ✅ Prettier - Format kode otomatis
- ✅ Tailwind CSS IntelliSense - Autocomplete
- ✅ React snippets - Code snippets
- ✅ Error Lens - Tampilkan error inline

## ❓ Masalah?

### Port sudah digunakan
```bash
npm run kill
npm run dev
```

### Module not found
```bash
rm -rf node_modules package-lock.json
npm install
```

### Lainnya?
Lihat [README.md](README.md) atau [SETUP_VSCODE.md](SETUP_VSCODE.md) untuk panduan lengkap.

---

**Butuh bantuan?** Buka issue di GitHub repository ini.
