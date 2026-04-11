Penetapan Kadar Tembaga dalam Terusi — Metode Gravimetri

  Flow

  1. Timbang terusi ±0,5g → kaca arloji
  2. Larutkan dalam 100mL air suling → piala gelas
  3. Teteskan H₂SO₄ 4N sampai biru jernih
  4. Didihkan (hot plate)
  5. Endapkan dengan NaOH 4N perlahan + aduk (pengaduk kaca)
  6. Uji pengendapan sempurna (kertas lakmus / tetes pereaksi)
  7. Saring (corong + kertas saring Whatman → erlenmeyer)
  8. Cuci endapan dengan air suling
  9. Uji pengotor sulfat (tabung reaksi + HCl + BaCl₂)
  10. Uji basa (kertas lakmus)
  11. Keringkan di oven → lipat kertas saring
  12. Perarang → pijarkan (furnace) → dinginkan (desikator)
  13. Timbang sisa pijar sebagai CuO
  14. Ulangi pijar-dingin-timbang sampai bobot tetap (selisih ≤0,4mg)

  Status Implementasi

  ┌───────┬────────────────────────────────────────────┬────────┐
  │ Step  │         Mekanisme yang dibutuhkan          │ Status │
  ├───────┼────────────────────────────────────────────┼────────┤
  │ 1     │ Timbangan: weigh solid → container         │ ✅     │
  ├───────┼────────────────────────────────────────────┼────────┤
  │ 2     │ Tuang/larutkan: transfer volume + dissolve │ ✅     │
  ├───────┼────────────────────────────────────────────┼────────┤
  │ 3     │ Teteskan: transfer volume kecil            │ ✅     │
  ├───────┼────────────────────────────────────────────┼────────┤
  │ 4     │ Hot plate: panaskan wadah                  │ ✅     │
  ├───────┼────────────────────────────────────────────┼────────┤
  │ 5     │ Teteskan + aduk: NaOH → endapan            │ ✅     │
  ├───────┼────────────────────────────────────────────┼────────┤
  │ 6     │ Uji: lakmus / tetes pereaksi               │ ✅     │
  ├───────┼────────────────────────────────────────────┼────────┤
  │ 7     │ Saring: corong + kertas saring             │ ✅     │
  ├───────┼────────────────────────────────────────────┼────────┤
  │ 8     │ Cuci: air suling ke endapan                │ ✅     │
  ├───────┼────────────────────────────────────────────┼────────┤
  │ 9     │ Uji: HCl + BaCl₂ → cek sulfat              │ ✅     │
  ├───────┼────────────────────────────────────────────┼────────┤
  │ 10    │ Uji: lakmus → cek basa                     │ ✅     │
  ├───────┼────────────────────────────────────────────┼────────┤
  │ 11-12 │ Oven / furnace / desikator (alat besar)    │ ✅     │
  ├───────┼────────────────────────────────────────────┼────────┤
  │ 13-14 │ Timbang sisa pijar, bobot tetap            │ ✅     │
  └───────┴────────────────────────────────────────────┴────────┘

  Yang Sudah Ada

  - Objects: Storage (alat), Meja Pereaksi (bahan), Meja Kerja (drag-drop), Timbangan, Oven, Tanur
  - Konsep setup: corong+stand bisa di-stack dengan kertas saring + piala penampung, dan tiap bagian bisa di-detach
  - Filtrasi setup: larutan induk di-drag ke setup, endapan pindah ke kertas saring, filtrat masuk ke piala penampung, beaker induk jadi kosong
  - Meja Kerja punya zona "Pembuangan" untuk mengosongkan isi wadah via drag-and-drop
  - Items: 11 alat (incl. kaca arloji) + 6 bahan dengan weight/volume
  - Hold 2 item, weigh solid ke container
  - combine_items + pour + dissolve + record_mass sudah aktif end-to-end
  - Milestone engine 1-14 + level_state broadcast + HUD progress realtime
  - State persisted ke Durable Object Storage

  Next Steps (urut prioritas)

  1. ✅ Tuang/transfer cair — pindah volume bahan cair ke wadah (step 2, 3, 5, 8)
  2. ✅ Reaksi kimia — combine items → produk baru (endapan Cu(OH)₂ → CuO)
  3. ✅ Hot plate — station object untuk panaskan
  4. ✅ Saring — corong + kertas saring sebagai station
  5. ✅ Uji — lakmus, BaSO₄ test
  6. ✅ Alat besar — oven, furnace, desikator