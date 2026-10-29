(function () {
  const dataAwal = window.dataBahanAjar;

  function formKosong() {
    return { kode: "", judul: "", kategori: "", upbjj: "", lokasiRak: "", harga: 0, qty: 0, safety: 0, catatan: "" };
  }

  new Vue({
    el: "#app",
    data: {
      upbjjList: dataAwal.upbjjList,
      kategoriList: dataAwal.kategoriList,
      stok: dataAwal.stok.map(item => Object.assign({}, item)),
      filterUpbjj: "",
      filterKategori: "",
      filterStok: "semua",
      sortBy: "judul",
      kataKunci: "",
      formTerbuka: false,
      modeEdit: false,
      kodeEdit: "",
      form: formKosong(),
      pesanError: ""
    },
    computed: {
      // Pilihan kategori mengikuti UT-Daerah yang dipilih.
      kategoriTersedia: function () {
        if (!this.filterUpbjj) return [];
        return this.kategoriList.filter(kategori =>
          this.stok.some(item => item.upbjj === this.filterUpbjj && item.kategori === kategori)
        );
      },
      // Filter dan sort dikerjakan di computed agar tidak perlu dihitung manual.
      stokTersaring: function () {
        let hasil = this.stok.filter(item => {
          const cocokDaerah = !this.filterUpbjj || item.upbjj === this.filterUpbjj;
          const cocokKategori = !this.filterKategori || item.kategori === this.filterKategori;
          const cocokKata = !this.kataKunci ||
            item.kode.toLowerCase().includes(this.kataKunci.toLowerCase()) ||
            item.judul.toLowerCase().includes(this.kataKunci.toLowerCase());
          let cocokStok = true;
          if (this.filterStok === "menipis") cocokStok = item.qty > 0 && item.qty < item.safety;
          if (this.filterStok === "kosong") cocokStok = item.qty === 0;
          return cocokDaerah && cocokKategori && cocokKata && cocokStok;
        });
        hasil = hasil.slice();
        if (this.sortBy === "judul") hasil.sort((a, b) => a.judul.localeCompare(b.judul));
        if (this.sortBy === "qty") hasil.sort((a, b) => a.qty - b.qty);
        if (this.sortBy === "harga") hasil.sort((a, b) => a.harga - b.harga);
        return hasil;
      },
      jumlahMenipis: function () {
        return this.stok.filter(item => item.qty > 0 && item.qty < item.safety).length;
      },
      jumlahKosong: function () {
        return this.stok.filter(item => item.qty === 0).length;
      }
    },
    watch: {
      filterUpbjj: function () {
        // Watcher 1: kosongkan kategori saat UT-Daerah berubah.
        this.filterKategori = "";
      },
      filterStok: function (nilai) {
        // Watcher 2: jika memilih stok prioritas, urutkan jumlah stok dari yang kecil.
        if (nilai === "menipis" || nilai === "kosong") this.sortBy = "qty";
      }
    },
    methods: {
      // Methods: menentukan status stok, mereset filter, membuka formulir tambah dan edit, menyimpan data setelah validasi.
      statusStok: function (item) {
        if (item.qty === 0) return "Kosong";
        if (item.qty < item.safety) return "Menipis";
        return "Aman";
      },
      kelasStatus: function (item) {
        if (item.qty === 0) return "red";
        if (item.qty < item.safety) return "orange";
        return "green";
      },
      resetFilter: function () {
        this.filterUpbjj = "";
        this.filterKategori = "";
        this.filterStok = "semua";
        this.sortBy = "judul";
        this.kataKunci = "";
      },
      bukaTambah: function () {
        this.modeEdit = false;
        this.kodeEdit = "";
        this.form = formKosong();
        this.pesanError = "";
        this.formTerbuka = true;
      },
      bukaEdit: function (item) {
        this.modeEdit = true;
        this.kodeEdit = item.kode;
        this.form = {
          kode: item.kode, judul: item.judul, kategori: item.kategori,
          upbjj: item.upbjj, lokasiRak: item.lokasiRak, harga: item.harga,
          qty: item.qty, safety: item.safety,
          catatan: (item.catatanHTML || "").replace(/<[^>]*>/g, "")
        };
        this.pesanError = "";
        this.formTerbuka = true;
      },
      tutupForm: function () {
        this.formTerbuka = false;
        this.pesanError = "";
      },
      simpanBahanAjar: function () {
        const f = this.form;
        if (!f.kode || !f.judul || !f.kategori || !f.upbjj || !f.lokasiRak) {
          this.pesanError = "Mohon lengkapi semua kolom wajib.";
          return;
        }
        if (Number(f.harga) < 0 || Number(f.qty) < 0 || Number(f.safety) < 0 ||
            !Number.isInteger(Number(f.qty)) || !Number.isInteger(Number(f.safety))) {
          this.pesanError = "Harga tidak boleh negatif. Stok dan safety stock harus bilangan bulat nol atau lebih.";
          return;
        }
        const kode = f.kode.trim().toUpperCase();
        if (!this.modeEdit && this.stok.some(item => item.kode.toUpperCase() === kode)) {
          this.pesanError = "Kode mata kuliah sudah ada. Gunakan kode lain.";
          return;
        }
        const dataBaru = {
          kode: kode, judul: f.judul.trim(), kategori: f.kategori, upbjj: f.upbjj,
          lokasiRak: f.lokasiRak.trim(), harga: Number(f.harga), qty: Number(f.qty),
          safety: Number(f.safety), catatanHTML: this.escapeHTML(f.catatan)
        };
        if (this.modeEdit) {
          const index = this.stok.findIndex(item => item.kode === this.kodeEdit);
          if (index >= 0) this.$set(this.stok, index, dataBaru);
        } else {
          this.stok.push(dataBaru);
        }
        this.formTerbuka = false;
      },
      escapeHTML: function (teks) {
        return String(teks).replace(/&/g, "&amp;").replace(/</g, "&lt;")
          .replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
      }
    }
  });
})();
