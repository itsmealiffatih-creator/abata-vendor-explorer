# Scrape abatawo.com — katalog vendor & harga

Hasil scraping penuh situs **https://abatawo.com** (vendor / paket / harga),
dikemas menjadi satu workbook Excel.

## Isi folder

| File | Keterangan |
|---|---|
| `Abatawo_Vendor_Catalogue.xlsx` | **Deliverable** — 8 sheet, siap pakai |
| `site/` | **Demo website** statis (HTML/CSS/JS) dari data scraping |
| `abatawo_data.json` | Data mentah hasil scraping (12,5 MB, UTF-8) |
| `scrape_full.py` | Crawler (requests + BeautifulSoup) |
| `build_excel.py` | Pembuat workbook (openpyxl) |
| `build_site_data.py` | Mengubah JSON → `site/data.js` (2 MB) |
| `smoke_site.py` | Uji otomatis UI demo di Edge headless |

## Demo website (`site/`)

Buka **`site/index.html`** langsung di browser (tanpa server, tanpa build step).

- Tab **Vendor**: 509 kartu, pencarian, chip 25 kategori, urutkan nama/harga/jumlah paket,
  "tampilkan lebih banyak" 48 per batch.
- Tab **Daftar Harga**: tabel 4.291 paket (sticky header), filter kategori, urutkan harga,
  deskripsi per baris, 100 baris per batch.
- Klik kartu/baris → panel detail: kontak (WA/IG/email/website), deskripsi, daftar paket
  dengan harga, harga normal (coret), dan deskripsi paket yang bisa dibuka satu per satu.
- Mobile responsive, keyboard-friendly (Enter/Space buka kartu, Esc tutup panel),
  format Rupiah `id-ID`. Semua data lokal — tidak ada request ke abatawo.com.

Regenerate setelah scraping ulang:

```powershell
python build_site_data.py
```

## Foto vendor

`fetch_images.py` mengunduh foto utama tiap vendor (508 dari 509 berhasil, 1 URL
rusak), diperkecil ke maks. 720 px, disimpan di `site/img/` sebagai JPEG.

`fetch_photos.py` menambah **455 foto galeri** untuk **248 vendor** (maks. 2 foto
tambahan per vendor) dari foto paket di halaman vendor. Foto ini muncul sebagai
strip thumbnail di panel detail — klik thumbnail untuk mengganti foto besar.

Total: 963 foto, ~28 MB. Manifest: `image_manifest.json` (foto utama) dan
`photos_manifest.json` (galeri).

### Instagram: tidak bisa diakses otomatis

Semua rute tanpa login gagal dari server (bukan karena salah cara, tapi karena
Instagram memblokir akses anonim):

| Rute | Hasil |
|---|---|
| `instagram.com/<user>/` | 200 tapi halaman login, tanpa `og:image` |
| `api/v1/users/web_profile_info` | 429 (rate-limited per IP) |
| `instagram.com/<user>/embed/` | halaman login, 0 foto |
| unavatar.io | 403 |
| imginn / picnob / picuki / imgsed / instalker | 403 (Cloudflare) |
| greatfon / dumpor | shell HTML, gambar dimuat via JS, 0 hasil |
| pixwox / iganony / storiesig | 404 / koneksi gagal |

Pengunjung bisa membuka viewer semacam itu di browser (ada sesi + JS challenge),
tapi dari skrip tidak. Jadi foto sosial tidak ditambahkan; sebagai gantinya
dipakai 455 foto paket dari katalog Abata sendiri.


## Deployment

- **Vercel:** <https://abata-vendor-explorer.vercel.app> — project
  `abata-vendor-explorer`, deploy production (`vercel.json` menambahkan header
  `X-Robots-Tag: noindex` + cache `img/*`). Vercel Authentication dimatikan,
  jadi situs **unlisted** (bukan login-protected; password butuh Pro).
- **GitHub Pages:** <https://itsmealiffatih-creator.github.io/abata-vendor-explorer/>
- Repo: <https://github.com/itsmealiffatih-creator/abata-vendor-explorer> (public)

GitHub Pages tidak bisa publish dari repo privat di plan saat ini, jadi repo
dibuat public dengan situs **unlisted**: `noindex, nofollow` di meta + `robots.txt`
`Disallow: /`. Artinya tidak muncul di mesin pencari, tetapi siapa pun yang punya
link bisa membukanya (bukan login-protected).

Update situs:

```powershell
python build_site_data.py
Copy-Item site\* C:\Users\aliff\dev\abata-vendor-explorer -Recurse -Force
cd C:\Users\aliff\dev\abata-vendor-explorer
npx.cmd -y vercel@latest deploy --prod --yes
git add -A; git commit -m "Update data"; git push
```


## Angka kunci

- 25 kategori layanan
- 517 kartu vendor (509 vendor unik — 8 URL duplikat antar kategori)
- 4.309 paket terbaca, 4.291 baris unik di sheet Paket
- 4.121 paket punya harga (Rp 550 – Rp 350.000.000)
- 70 paket punya harga normal (coret) di samping harga promo
- 138 vendor dengan Instagram, 51 dengan nomor telepon, 294 dengan deskripsi

Kategori terbesar: venue (197 vendor), mua (82), foto (70), katering (29),
dekorasi (26), mc (25), abata wo packages (19).

## Struktur workbook

| Sheet | Isi |
|---|---|
| `Ringkasan` | Statistik total, rekap per kategori, grafik batang vendor/kategori |
| `Vendor` | 509 baris: kategori, nama, jumlah paket, harga min/max, telepon, email, IG/FB/TikTok/web, deskripsi, URL |
| `Paket & Harga` | 4.291 baris: kategori, vendor, nama paket, harga (angka Rp), harga normal, teks harga asli, deskripsi lengkap, URL |
| `Kategori` | 25 baris: jumlah vendor/paket, harga min/max/rata-rata, URL kategori |
| `Kontak Resmi` | Alamat, telepon, email, 2 marketing executive, pendiri, statistik klaim situs |
| `Gambar Vendor` | URL foto tiap vendor + alt text |
| `Halaman Website` | Teks halaman statis (Home, Tentang Kami, Sejarah, Visi & Misi, Nilai Dasar, Galeri, S&K, Karir) |
| `Metodologi` | Cara scraping, catatan batasan data |

Semua sheet: header berwarna, freeze pane, filter tabel, format `Rp #,##0`,
lebar kolom & wrap text diatur, siap dicetak landscape.

## Cara data diambil

1. Situs memblokir akses langsung ke `/vendor/` (HTTP 403 untuk non-browser).
   Crawler meniru alur pengunjung: `POST /index` dengan email/tanggal/sesi
   ("Rencanakan Pernikahan") untuk membuka sesi, lalu halaman vendor terbuka normal.
2. Kategori diambil dari tautan `/pilihpaket/<kategori>` pada halaman
   `/rencanakan-pernikahan`; tiap kategori berisi kartu vendor.
3. Setiap halaman vendor di-scrape: harga badge, nama + deskripsi paket
   (di-decode dari payload base64 tombol "DETAIL Paket"), gambar, tab paket.
4. Kontak vendor diambil dari kartu kategori (satu-satunya tempat situs
   mencantumkannya); nomor/email resmi Abata difilter dari kolom vendor.

## Menjalankan ulang

```powershell
python -m pip install requests beautifulsoup4 lxml openpyxl
python scrape_full.py     # ± 3,5 menit, 25 kategori + 517 vendor
python build_excel.py     # ± 20 detik
```

## Batasan yang perlu diketahui

- Harga bergantung pada tanggal & sesi acara yang dipilih saat membuka sesi
  (scrape memakai contoh 12-12-2026 sesi pagi); struktur harga per paket stabil.
- 167 paket bertanda `Rp 0` di situs (harga "menyesuaikan") — dibiarkan kosong
  di kolom angka agar tidak menggeser rata-rata, teks aslinya tetap disimpan.
- Sebagian vendor tidak mencantumkan kontak/harga di situs; sel dibiarkan kosong
  alih-alih diisi tebakan.
- Halaman review (`/review`, `/review-voice`) kosong saat diakses tanpa login.
