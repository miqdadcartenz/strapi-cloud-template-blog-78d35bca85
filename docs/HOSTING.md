# Hosting Strapi CMS Sendiri (Self-Hosted)

Dokumen ini untuk tim yang akan me-deploy CMS Strapi ke server/VPS sendiri (bukan Strapi Cloud). Ringkasannya: ganti database ke PostgreSQL atau MySQL, set variabel environment, build admin, jalankan dengan process manager, dan (opsional) pasang reverse proxy serta atur media/backup.

---

## 1. Database di Production: Jangan Pakai SQLite

**Untuk production, jangan tetap pakai SQLite.** Strapi mendukung SQLite untuk development; untuk hosting sendiri disarankan pakai **PostgreSQL** atau **MySQL** karena:

- **SQLite**: satu file, concurrent write terbatas, backup/restore dan replikasi lebih rumit, tidak ideal untuk multi-worker atau scale.
- **PostgreSQL / MySQL**: didukung resmi Strapi untuk production, concurrent access baik, backup dan layanan managed (RDS, Cloud SQL, Supabase, Neon, dll.) lebih mudah.

Proyek ini sudah siap ganti DB: `config/database.js` memakai `DATABASE_CLIENT` (default `sqlite`) dan sudah ada konfigurasi untuk `mysql` dan `postgres`. Cukup set variabel environment di server production.

---

## 2. Persyaratan Server

- **Node.js**: sesuai `package.json` engines (>=18.0.0 <=22.x.x).
- **Database**: PostgreSQL 14+ atau MySQL 8+ (bisa layanan managed: Supabase, Neon, AWS RDS, Google Cloud SQL, dll.).
- **RAM/CPU**: minimal 512MB RAM untuk uji coba; production disarankan 1GB+ dan CPU yang memadai.

---

## 3. Database Production (PostgreSQL atau MySQL)

### PostgreSQL

1. Buat database dan user di PostgreSQL (langsung di server atau lewat layanan managed).
2. Pasang driver jika belum ada: `npm install pg`
3. Set variabel environment:

```env
DATABASE_CLIENT=postgres
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=strapi
DATABASE_USERNAME=strapi
DATABASE_PASSWORD=your_secure_password
```

Atau gunakan connection string:

```env
DATABASE_CLIENT=postgres
DATABASE_URL=postgresql://user:password@host:5432/strapi
```

### MySQL

1. Buat database dan user di MySQL.
2. Pasang driver jika belum ada: `npm install mysql2`
3. Set variabel environment:

```env
DATABASE_CLIENT=mysql
DATABASE_HOST=localhost
DATABASE_PORT=3306
DATABASE_NAME=strapi
DATABASE_USERNAME=strapi
DATABASE_PASSWORD=your_secure_password
```

Schema/tabel akan dibuat otomatis saat Strapi dijalankan pertama kali (migrasi otomatis).

---

## 4. Variabel Environment Production

Buat file `.env` di **root proyek Strapi** (jangan di-commit). Variabel yang wajib atau sangat disarankan:

### Aplikasi

| Variabel | Contoh | Keterangan |
|----------|--------|------------|
| `NODE_ENV` | `production` | Wajib production |
| `HOST` | `0.0.0.0` | Bind ke semua interface |
| `PORT` | `1337` | Port aplikasi Strapi |

### Keamanan (wajib diganti, jangan pakai nilai default)

| Variabel | Keterangan |
|----------|------------|
| `APP_KEYS` | Comma-separated, minimal satu key (untuk encrypt session) |
| `API_TOKEN_SALT` | Salt untuk API token |
| `ADMIN_JWT_SECRET` | Secret JWT admin panel |
| `TRANSFER_TOKEN_SALT` | Salt transfer token |
| `JWT_SECRET` | Secret JWT Users & Permissions |
| `ADMIN_ENCRYPTION_KEY` | Key enkripsi admin (32 karakter) |

Generate nilai acak yang aman, misalnya:

```bash
openssl rand -base64 32
```

Jalankan per command untuk tiap variabel dan paste ke `.env`. Untuk `APP_KEYS` bisa beberapa key dipisah koma.

### Database

Lihat bagian 3 (PostgreSQL atau MySQL). Set `DATABASE_CLIENT` dan variabel terkait.

### Opsional

- `ADMIN_URL`: jika admin di subpath atau domain lain.
- `DATABASE_SSL`: set `true` jika koneksi DB pakai SSL (mis. managed DB).

---

## 5. Langkah Deploy (Persiapan Hosting)

Urutan yang disarankan:

### 1. Siapkan database

Buat database dan user di PostgreSQL atau MySQL. Catat host, port, nama database, username, dan password.

### 2. Clone dan install dependency

Di server:

```bash
git clone <repo-url> .
# atau upload proyek ke server
cd strapi-cloud-template-blog-78d35bca85
npm ci
# atau: npm install --omit=dev
```

Untuk production bisa pakai `npm install --omit=dev` agar hanya dependency production.

### 3. Set environment

Buat `.env` di root proyek Strapi, isi semua variabel dari bagian 4 dan 3. Pastikan file `.env` tidak ikut ter-commit (biasanya sudah di `.gitignore`).

### 4. Build admin panel

```bash
NODE_ENV=production npm run build
```

Wajib dijalankan sebelum `npm run start` di production.

### 5. Jalankan Strapi

```bash
NODE_ENV=production npm run start
```

Jangan pakai `npm run develop` di production (mode development).

### 6. Process manager (PM2 atau systemd)

Agar proses restart saat crash dan start saat server boot:

**PM2:**

```bash
npm install -g pm2
pm2 start npm --name strapi -- run start
# Pastikan dijalankan dari folder proyek Strapi (cwd)
pm2 save
pm2 startup
```

**Systemd:** Buat unit file (contoh `/etc/systemd/system/strapi.service`) dengan `ExecStart` yang menjalankan `node node_modules/@strapi/strapi/bin/strap.js start` dari folder proyek, dan set `NODE_ENV=production` serta environment lain (env file atau `Environment=`).

### 7. Reverse proxy (disarankan)

Gunakan Nginx atau Caddy di depan Strapi untuk:

- Menyajikan HTTPS (SSL/TLS)
- Mengikat domain
- Proxy ke `http://127.0.0.1:1337`

**Contoh Nginx** (server block):

```nginx
server {
    listen 80;
    server_name cms.example.com;
    location / {
        proxy_pass http://127.0.0.1:1337;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Lalu gunakan Certbot atau cara lain untuk HTTPS.

**Contoh Caddy** (sangat singkat, HTTPS otomatis):

```
cms.example.com {
    reverse_proxy 127.0.0.1:1337
}
```

### 8. Upload dan media

Secara default Strapi menyimpan file upload di `public/uploads` di dalam proyek. Untuk production:

- Lakukan backup berkala folder `public/uploads` (dan database).
- Kelak bisa ditambah provider penyimpanan (S3, R2, dll.) lewat plugin Strapi jika diperlukan.

---

## 6. Seed data (opsional)

Jika ingin isi awal (kategori, product pages, dll.):

- Seed bootstrap hanya jalan saat "first run" (belum ada flag di store). Untuk database production baru, bisa jalankan sekali: `npm run seed:example` setelah Strapi pernah start (atau sesuaikan dengan aturan seed Anda).
- Jangan jalankan seed berulang tanpa aturan (risiko duplikat data).

---

## 7. Checklist Sebelum Go-Live

- [ ] Database production (PostgreSQL/MySQL) sudah dibuat dan variabel env database terisi.
- [ ] Semua `APP_KEYS`, `JWT_SECRET`, `ADMIN_JWT_SECRET`, dll. sudah diganti dari nilai default.
- [ ] `npm run build` dan `npm run start` berhasil; admin panel bisa dibuka dan login.
- [ ] Process manager (PM2 atau systemd) mengelola proses Strapi dan restart on crash.
- [ ] (Disarankan) Reverse proxy dan HTTPS sudah dikonfigurasi.
- [ ] Aplikasi frontend (Next.js) mengarah `NEXT_PUBLIC_STRAPI_URL` ke URL publik Strapi (tanpa trailing slash).

---

## 8. Referensi

- [Strapi – Deployment](https://docs.strapi.io/dev-docs/deployment)
- [Strapi – Database](https://docs.strapi.io/dev-docs/database)
