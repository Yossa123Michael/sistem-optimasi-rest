# Panduan Upload Code ke GitHub

## Cara 1: Menggunakan Terminal di GitHub Codespace



git config --global 


### 2. Konfigurasi Git (jika belum)
### 4. 
git add .

```

### 6. Push ke GitHub
git pus

```

---
## Cara
Jika Anda
###

- **JANGAN** centang "I

```bash
git


git rem
# Tambahkan semua fi


# Push ke GitHub
git pus





2. Login dengan akun GitHub Anda

6. Klik "Commit to main"



```bash
git remote add origin https

Anda mungkin perlu menggun

4. Saat push, gunakan token sebagai pas
### Ata
git remote set-url origin git



- `node_modules/` (dependencies tidak perlu di-upload)




# Tambahkan semua file
git add .

# Commit
git commit -m "Initial commit: RouteOptima delivery management"

# Push ke GitHub
git branch -M main
git push -u origin main
## 

Ganti `USERNAME` dengan username GitHub Anda dan `NAMA-REPO` dengan nama repository yang Anda buat.

│  

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

│   ├── components/      # Semua React components
































