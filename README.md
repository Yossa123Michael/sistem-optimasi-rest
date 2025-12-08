# 🚚 Sistem Optimasi Rute Pengiriman

Aplikasi web manajemen logistik yang komprehensif untuk mengoptimalkan rute pengiriman dengan dukungan multi-role (Admin, Kurir, Pelanggan) dan kemampuan pelacakan paket secara real-time.

## 📋 Prasyarat

Sebelum menjalankan proyek ini, pastikan Anda telah menginstal:

- **Node.js** (versi 18.x atau lebih baru) - [Download di sini](https://nodejs.org/)
- **npm** (biasanya sudah termasuk dengan Node.js)
- **Visual Studio Code** - [Download di sini](https://code.visualstudio.com/)
- **Git** - [Download di sini](https://git-scm.com/)

Untuk memeriksa apakah Node.js dan npm sudah terinstal, buka terminal dan jalankan:
```bash
node --version
npm --version
```

## 🚀 Cara Menjalankan di Visual Studio Code

### 1. Clone Repository

Buka terminal dan clone repository ini:
```bash
git clone https://github.com/Yossa123Michael/sistem-optimasi-rest.git
cd sistem-optimasi-rest
```

### 2. Buka di Visual Studio Code

Buka Visual Studio Code, lalu:
- Pilih **File > Open Folder** (atau **Ctrl+K Ctrl+O** di Windows/Linux, **Cmd+K Cmd+O** di Mac)
- Navigasi ke folder `sistem-optimasi-rest` yang baru saja di-clone
- Klik **Select Folder**

Atau, dari terminal di dalam folder proyek, jalankan:
```bash
code .
```

### 3. Install Dependencies

Buka terminal di VS Code (**Terminal > New Terminal** atau **Ctrl+`**) dan jalankan:
```bash
npm install
```

Proses ini akan mengunduh semua package yang diperlukan. Tunggu hingga selesai (bisa memakan waktu beberapa menit).

### 4. Jalankan Development Server

Setelah instalasi selesai, jalankan development server dengan perintah:
```bash
npm run dev
```

Anda akan melihat output seperti:
```
  VITE v7.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5000/
  ➜  Network: use --host to expose
```

### 5. Buka di Browser

Buka browser Anda dan kunjungi URL yang ditampilkan di output (biasanya):
```
http://localhost:5000
```

**Catatan**: Port mungkin berbeda tergantung konfigurasi. Perhatikan output terminal untuk URL yang tepat.

Aplikasi sekarang sudah berjalan! 🎉

## 🛠️ Perintah-Perintah Tersedia

Berikut adalah perintah-perintah yang dapat Anda jalankan di terminal VS Code:

| Perintah | Deskripsi |
|----------|-----------|
| `npm run dev` | Menjalankan development server (port 5173) |
| `npm run build` | Build aplikasi untuk production |
| `npm run preview` | Preview build production secara lokal |
| `npm run lint` | Memeriksa kode dengan ESLint |
| `npm run optimize` | Optimasi dependencies dengan Vite |

## 🔧 Ekstensi VS Code yang Direkomendasikan

Untuk pengalaman development yang lebih baik, install ekstensi-ekstensi berikut di VS Code:

1. **ESLint** - Deteksi error dan enforce coding standards
2. **Prettier - Code formatter** - Format kode otomatis
3. **Tailwind CSS IntelliSense** - Autocomplete untuk Tailwind CSS
4. **TypeScript Vue Plugin (Volar)** - Dukungan TypeScript yang lebih baik
5. **ES7+ React/Redux/React-Native snippets** - Snippets untuk React

Anda akan menerima notifikasi untuk menginstal ekstensi yang direkomendasikan saat pertama kali membuka proyek.

## 🐛 Debugging di VS Code

Untuk melakukan debugging:

1. Buka tab **Run and Debug** di sidebar kiri (atau tekan **Ctrl+Shift+D**)
2. Pilih konfigurasi "Launch Chrome against localhost"
3. Tekan **F5** atau klik tombol hijau untuk mulai debugging
4. Set breakpoints di kode dengan mengklik di sebelah kiri nomor baris

## 📱 Fitur Utama Aplikasi

- **Autentikasi & Manajemen Role**: Login/register dengan role Customer, Admin, atau Courier
- **Manajemen Perusahaan**: Buat atau gabung perusahaan logistik
- **Input & Manajemen Paket**: Tambah paket dengan koordinat dan detail lengkap
- **Optimasi Rute**: Algoritma genetik untuk menghitung rute pengiriman optimal
- **Interface Kurir**: Lihat paket yang ditugaskan dan rute yang direkomendasikan
- **Pelacakan Paket**: Tracking real-time untuk pelanggan
- **Dashboard Admin**: Monitoring operasional lengkap dengan visualisasi

## 🔍 Troubleshooting

### Port 5173 sudah digunakan
Jika port 5173 sudah digunakan oleh aplikasi lain:
```bash
npm run kill
npm run dev
```

### Error saat npm install
Coba hapus folder `node_modules` dan file `package-lock.json`, lalu install ulang:
```bash
rm -rf node_modules package-lock.json
npm install
```

### Error "Cannot find module"
Pastikan semua dependencies sudah terinstal dengan menjalankan:
```bash
npm install
```

### Browser tidak otomatis membuka
Buka browser secara manual dan kunjungi `http://localhost:5173`

## 📝 Struktur Proyek

```
sistem-optimasi-rest/
├── src/               # Source code aplikasi
│   ├── components/    # React components
│   ├── hooks/         # Custom React hooks
│   ├── lib/           # Utility libraries
│   ├── styles/        # Style files
│   ├── App.tsx        # Main App component
│   └── main.tsx       # Entry point
├── public/            # Static assets
├── .vscode/           # VS Code configurations
├── package.json       # Project dependencies
├── vite.config.ts     # Vite configuration
├── tsconfig.json      # TypeScript configuration
└── tailwind.config.js # Tailwind CSS configuration
```

## 🤝 Kontribusi

Jika Anda ingin berkontribusi pada proyek ini, silakan fork repository dan buat pull request.

## 📄 Lisensi

Lihat file [LICENSE](LICENSE) untuk informasi lebih lanjut.

---

**Catatan**: Aplikasi ini menggunakan React 19, Vite 7, TypeScript, dan Tailwind CSS untuk development yang cepat dan modern.
