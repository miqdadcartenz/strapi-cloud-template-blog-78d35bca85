# Seed Product Pages

File `product-pages.json` berisi data contoh untuk **Content-Type Product Page** (slug: smartgov, efd, palapa, strategic-consulting).

Seed dijalankan:
- **Otomatis** saat pertama kali `npm run develop` (bootstrap), atau
- **Manual** dengan `npm run seed:example` (setelah database dikosongkan).

Setelah seed, edit/tambah data lewat **Content Manager** di admin Strapi.

- **SmartGov**: 1 kategori, 1 sub menu (Pajak Bumi dan Bangunan), 1 tab dengan deskripsi + blocks.
- **EFD**: 1 kategori flat, 1 sub menu (Pajak BJTT), 1 tab dengan blocks.
- **Palapa**: 1 kategori flat, 1 sub menu (Kendali Kinerja), 1 tab dengan blocks.
- **Strategic Consulting**: hanya hero, categories kosong.

**Jika Content Manager masih kosong setelah hapus data.db:**
1. Hapus seluruh folder `.tmp` (atau minimal file `data.db`).
2. Jalankan **salah satu**: `npm run develop` (tunggu sampai "Ready to go") ATAU `npm run seed:example`.
3. Buka admin Strapi → Content Manager; data seed akan muncul.
