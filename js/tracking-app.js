(function () {
  const dataAwal = window.dataBahanAjar;

  function tanggalHariIni() {
    const sekarang = new Date();
    const lokal = new Date(sekarang.getTime() - sekarang.getTimezoneOffset() * 60000);
    return lokal.toISOString().slice(0, 10);
  }

  function ambilDataTracking() {
    return Object.keys(dataAwal.tracking).map(nomor => {
      const item = dataAwal.tracking[nomor];
      return Object.assign({
        nomorDO: nomor, nim: "", nama: "", status: "Pesanan Dibuat",
        ekspedisi: "REG", tanggalKirim: tanggalHariIni(), paket: "", total: 0, perjalanan: []
      }, item, {
        nomorDO: nomor,
        perjalanan: (item.perjalanan || []).map(riwayat => Object.assign({}, riwayat))
      });
    });
  }

  function formKosong() {
    return { nim: "", nama: "", ekspedisi: "", paket: "", tanggalKirim: tanggalHariIni() };
  }

  new Vue({
    el: "#app",
    data: {
      daftarDO: ambilDataTracking(),
      pengirimanList: dataAwal.pengirimanList,
      paketList: dataAwal.paket,
      kataKunci: "",
      nomorTerpilih: "",
      formTerbuka: false,
      form: formKosong(),
      pesanError: "",
      tanggalHariIni: tanggalHariIni()
    },
    computed: {
      daftarTersaring: function () {
        const kata = this.kataKunci.toLowerCase();
        return this.daftarDO.filter(item =>
          item.nomorDO.toLowerCase().includes(kata) ||
          item.nama.toLowerCase().includes(kata) ||
          item.nim.toLowerCase().includes(kata)
        );
      },
      doTerpilih: function () {
        return this.daftarDO.find(item => item.nomorDO === this.nomorTerpilih) || null;
      },
      paketTerpilih: function () {
        return this.paketList.find(item => item.kode === this.form.paket) || null;
      },
      nomorDOBaru: function () {
        const tahun = new Date().getFullYear();
        const awalan = "DO" + tahun + "-";
        const nomorTahunIni = this.daftarDO
          .filter(item => item.nomorDO.indexOf(awalan) === 0)
          .map(item => Number(item.nomorDO.slice(awalan.length)));
        const berikutnya = (nomorTahunIni.length ? Math.max.apply(null, nomorTahunIni) : 0) + 1;
        return awalan + String(berikutnya).padStart(3, "0");
      },
      jumlahDalamPerjalanan: function () {
        return this.daftarDO.filter(item => item.status === "Dalam Perjalanan").length;
      },
      jumlahSelesai: function () {
        return this.daftarDO.filter(item => item.status === "Selesai" || item.status === "Terkirim").length;
      }
    },
    watch: {
      "form.paket": function () {
        // Watcher 1: pilihan paket berubah, harga dan isi paket ikut diperbarui oleh computed.
        this.pesanError = "";
      },
      kataKunci: function () {
        // Watcher 2: pilih hasil pertama jika DO yang dipilih tidak cocok dengan pencarian.
        const hasil = this.daftarTersaring;
        if (!hasil.some(item => item.nomorDO === this.nomorTerpilih)) {
          this.nomorTerpilih = hasil.length ? hasil[0].nomorDO : "";
        }
      }
    },
    created: function () {
      if (this.daftarDO.length) this.nomorTerpilih = this.daftarDO[0].nomorDO;
    },
    methods: {
      pilihDO: function (item) {
        this.nomorTerpilih = item.nomorDO;
      },
      bukaForm: function () {
        this.form = formKosong();
        this.pesanError = "";
        this.formTerbuka = true;
      },
      tutupForm: function () {
        this.formTerbuka = false;
        this.pesanError = "";
      },
      simpanDO: function () {
        const f = this.form;
        if (!f.nim || !f.nama || !f.ekspedisi || !f.paket || !f.tanggalKirim) {
          this.pesanError = "Mohon lengkapi semua kolom wajib.";
          return;
        }
        if (!/^[0-9]{8,20}$/.test(f.nim)) {
          this.pesanError = "NIM harus terdiri dari 8 sampai 20 digit angka.";
          return;
        }
        if (f.tanggalKirim < this.tanggalHariIni) {
          this.pesanError = "Tanggal kirim tidak boleh sebelum hari ini.";
          return;
        }
        const paket = this.paketList.find(item => item.kode === f.paket);
        if (!paket) {
          this.pesanError = "Silakan pilih paket bahan ajar.";
          return;
        }
        const nomor = this.nomorDOBaru;
        this.daftarDO.unshift({
          nomorDO: nomor, nim: f.nim, nama: f.nama, status: "Pesanan Dibuat",
          ekspedisi: f.ekspedisi, tanggalKirim: f.tanggalKirim,
          paket: paket.kode, total: paket.harga,
          perjalanan: [{ waktu: new Date().toLocaleString("sv-SE"), keterangan: "Delivery Order dibuat" }]
        });
        this.nomorTerpilih = nomor;
        this.formTerbuka = false;
        this.form = formKosong();
      },
      namaPaket: function (kode) {
        const paket = this.paketList.find(item => item.kode === kode);
        return paket ? paket.nama : kode;
      },
      namaEkspedisi: function (kode) {
        const opsi = this.pengirimanList.find(item => item.kode === kode);
        return opsi ? opsi.nama : kode;
      },
      formatRupiah: function (nilai) {
        return "Rp " + Number(nilai || 0).toLocaleString("id-ID");
      },
      kelasStatusDO: function (status) {
        if (status === "Dalam Perjalanan") return "blue";
        if (status === "Selesai" || status === "Terkirim") return "green";
        return "orange";
      }
    }
  });
})();
