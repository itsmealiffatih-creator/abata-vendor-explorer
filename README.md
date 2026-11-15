# Abata Vendor Explorer

Katalog vendor pernikahan **Abata Wedding Organizer** (Solo) dalam satu halaman
statis: 509 vendor, 4.291 paket, 508 foto.

Data diambil dari katalog publik [abatawo.com](https://abatawo.com) untuk
keperluan referensi pribadi. Harga dapat berubah dan bergantung pada tanggal
serta sesi acara — selalu konfirmasi langsung ke vendor.

## Isi

- `index.html` — halaman tunggal, dua tab (Vendor / Daftar Harga)
- `app.js` — pencarian, filter kategori, sortir, panel detail, tabel harga
- `styles.css` — tema krem/hijau/gold, responsif, tanpa dependensi
- `data.js` — data hasil scraping (vendor, paket, harga, kontak, foto)
- `img/` — foto vendor (diunduh & diperkecil ke maks. 720 px, JPEG)

Tidak ada build step, tidak ada request ke situs asal. Buka `index.html`
langsung di browser atau host sebagai situs statis.

## Daftar paket & harga

Tab **Daftar Harga** memuat seluruh 4.291 baris paket, bisa dicari, difilter
per kategori, dan diurutkan berdasarkan harga. Klik baris untuk detail vendor.

## Catatan

Situs ini bukan situs resmi Abata. Semua konten dan foto milik pemiliknya
masing-masing; dipakai sebagai referensi pribadi, tidak untuk dipublikasikan
ulang secara komersial.

## Deploy

- **Vercel (utama):** <https://abata-vendor-explorer.vercel.app>
  Project `abata-vendor-explorer`, deploy production dari folder ini.
  Vercel Authentication dimatikan → URL bisa dibuka siapa pun yang punya link
  (unlisted), tetapi `noindex` lewat header `X-Robots-Tag` di `vercel.json`.
  Password protection butuh plan Pro.
- **GitHub Pages (cadangan):** <https://itsmealiffatih-creator.github.io/abata-vendor-explorer/>

Update: ganti isi folder, lalu

```powershell
npx.cmd -y vercel@latest deploy --prod --yes
git add -A; git commit -m "Update"; git push
```

