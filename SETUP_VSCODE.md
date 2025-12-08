# 📘 Panduan Setup Visual Studio Code

Dokumen ini menjelaskan cara setup dan menggunakan Visual Studio Code untuk proyek Sistem Optimasi Rute Pengiriman.

## 🎯 Langkah Cepat

1. **Install Node.js** dari [nodejs.org](https://nodejs.org/)
2. **Install Visual Studio Code** dari [code.visualstudio.com](https://code.visualstudio.com/)
3. **Clone repository** dan buka di VS Code
4. **Install dependencies**: `npm install`
5. **Jalankan server**: `npm run dev`
6. **Buka browser**: http://localhost:5000

## 🔧 Konfigurasi VS Code

Proyek ini sudah dilengkapi dengan konfigurasi VS Code di folder `.vscode/`:

### 📦 Ekstensi yang Direkomendasikan (`.vscode/extensions.json`)

Saat pertama kali membuka proyek, VS Code akan menampilkan notifikasi untuk menginstal ekstensi yang direkomendasikan. Klik **Install All** untuk menginstal:

- **ESLint** - Linting untuk JavaScript/TypeScript
- **Prettier** - Code formatter otomatis
- **Tailwind CSS IntelliSense** - Autocomplete untuk Tailwind
- **ES7+ React/Redux snippets** - Snippets untuk React
- **Error Lens** - Tampilkan error langsung di editor
- **Auto Rename Tag** - Rename tag HTML/JSX otomatis
- **Path Intellisense** - Autocomplete untuk path file

### ⚙️ Pengaturan Editor (`.vscode/settings.json`)

Konfigurasi otomatis sudah diatur untuk:
- Format otomatis saat save file
- ESLint fix otomatis saat save
- Tailwind CSS autocomplete
- TypeScript workspace version

### 🐛 Debugging (`.vscode/launch.json`)

Tersedia 3 konfigurasi debugging:
1. **Launch Chrome** - Debug dengan Google Chrome
2. **Launch Edge** - Debug dengan Microsoft Edge
3. **Launch Firefox** - Debug dengan Firefox

**Cara menggunakan:**
1. Pastikan dev server sudah berjalan (`npm run dev`)
2. Tekan `F5` atau buka **Run and Debug** panel
3. Pilih browser yang ingin digunakan
4. Set breakpoints dengan klik di sebelah kiri nomor baris

### 📋 Tasks (`.vscode/tasks.json`)

Task yang tersedia (jalankan dengan `Ctrl+Shift+B` atau **Terminal > Run Task**):
- **npm: dev** - Start development server (default)
- **npm: build** - Build untuk production
- **npm: lint** - Jalankan ESLint
- **npm: preview** - Preview production build

## ⌨️ Keyboard Shortcuts yang Berguna

### General
- `Ctrl+P` - Quick open file
- `Ctrl+Shift+P` - Command palette
- `Ctrl+` ` - Toggle terminal
- `Ctrl+B` - Toggle sidebar
- `Ctrl+\` - Split editor

### Coding
- `Ctrl+Space` - Trigger autocomplete
- `Alt+Shift+F` - Format document
- `F2` - Rename symbol
- `Ctrl+.` - Quick fix
- `Ctrl+/` - Toggle comment

### Debugging
- `F5` - Start debugging
- `F9` - Toggle breakpoint
- `F10` - Step over
- `F11` - Step into
- `Shift+F11` - Step out

### Navigation
- `Ctrl+Click` - Go to definition
- `Alt+Left/Right` - Navigate back/forward
- `Ctrl+G` - Go to line
- `Ctrl+Shift+O` - Go to symbol

## 🚀 Workflow Development

### 1. Memulai Development

```bash
# Terminal di VS Code (Ctrl+`)
npm run dev
```

Server akan berjalan di http://localhost:5000 (perhatikan output terminal untuk URL yang tepat)

### 2. Membuat Component Baru

1. Buat file baru di `src/components/`
2. Gunakan snippet React (ketik `rafce` untuk functional component)
3. Import di file yang membutuhkan

### 3. Styling dengan Tailwind

- Autocomplete akan muncul saat mengetik className
- Hover di class untuk melihat CSS yang dihasilkan
- Gunakan `@apply` di file CSS untuk reusable styles

### 4. TypeScript

- Error akan muncul langsung di editor (Error Lens)
- Hover di variable untuk melihat tipe data
- `Ctrl+Space` untuk autocomplete berdasarkan tipe

### 5. Debugging

1. Jalankan `npm run dev` di terminal
2. Set breakpoints di kode
3. Tekan `F5` untuk mulai debugging
4. Gunakan Debug Console untuk evaluasi expressions

## 🔍 Tips & Tricks

### Multi-Cursor Editing
- `Alt+Click` - Add cursor
- `Ctrl+Alt+Down/Up` - Add cursor below/above
- `Ctrl+D` - Select next occurrence
- `Ctrl+Shift+L` - Select all occurrences

### Refactoring
- Highlight kode → `Ctrl+Shift+R` - Refactor options
- `F2` - Rename all occurrences
- `Ctrl+.` - Quick fix suggestions

### Git Integration
- `Ctrl+Shift+G` - Open source control panel
- Lihat changes di sidebar
- Stage, commit, dan push langsung dari VS Code

### Terminal Split
- `Ctrl+Shift+` ` - New terminal
- Drag terminal tab untuk split
- Jalankan multiple commands bersamaan (dev server + test + lint)

## 🧩 Snippets Custom

Buat file `.vscode/react.code-snippets` untuk custom snippets:

```json
{
  "React Component": {
    "prefix": "rfc",
    "body": [
      "import React from 'react'",
      "",
      "export default function ${1:ComponentName}() {",
      "  return (",
      "    <div>",
      "      $0",
      "    </div>",
      "  )",
      "}"
    ]
  }
}
```

## 🆘 Troubleshooting VS Code

### Tailwind IntelliSense tidak bekerja
1. Reload VS Code (`Ctrl+Shift+P` → "Reload Window")
2. Pastikan ekstensi Tailwind CSS IntelliSense terinstal
3. Check `.vscode/settings.json` sudah ada

### ESLint tidak mendeteksi error
1. Pastikan ekstensi ESLint terinstal
2. Reload VS Code
3. Check output panel (`Ctrl+Shift+U` → pilih "ESLint")

### Format tidak otomatis saat save
1. Pastikan Prettier terinstal
2. Check setting `editor.formatOnSave` di `.vscode/settings.json`
3. Set Prettier sebagai default formatter

### TypeScript error tapi kode berjalan
1. Restart TS server: `Ctrl+Shift+P` → "TypeScript: Restart TS Server"
2. Delete `node_modules` dan reinstall: `npm install`

## 📚 Resources Tambahan

- [VS Code Documentation](https://code.visualstudio.com/docs)
- [React DevTools](https://react.dev/learn/react-developer-tools)
- [Vite Documentation](https://vitejs.dev/)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)

---

**Selamat coding! 🎉**
