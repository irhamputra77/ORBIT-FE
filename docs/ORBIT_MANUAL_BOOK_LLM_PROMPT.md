# Prompt untuk Membuat Manual Book Aplikasi ORBIT

> Salin seluruh isi dokumen ini ke LLM yang akan digunakan untuk membuat manual book. Lampirkan screenshot aplikasi, logo, SOP internal, atau dokumentasi API bila tersedia. Informasi di bawah merupakan konteks dasar sistem dan harus diperlakukan sebagai sumber fakta utama.

---

## MAIN PROMPT

Anda adalah **Senior Technical Writer dan Business Analyst untuk sistem aviation engineering/MRO**. Tugas Anda adalah menyusun **Manual Book / Buku Panduan Pengguna aplikasi ORBIT** yang profesional, terstruktur, mudah dipahami, dan dapat digunakan untuk onboarding, pelatihan, operasional harian, serta audit internal.

Nama sistem:

```text
ORBIT — Aero Compliance / Engineering Evaluation System
```

Bahasa dokumen:

```text
Bahasa Indonesia formal dan mudah dipahami.
Istilah teknis aviation, nama field, nama menu, status, dan tombol UI tetap menggunakan istilah asli berbahasa Inggris jika memang tampil demikian di aplikasi.
```

Target pembaca:

- Engineer/First Engineer.
- Second Engineer/reviewer.
- Manager.
- Administrator.
- Technician bila memperoleh akses yang sesuai.
- Tim Quality, Compliance, dan auditor internal sebagai pembaca referensi.

Tujuan dokumen:

1. Menjelaskan fungsi dan ruang lingkup ORBIT.
2. Menjelaskan hak akses setiap role.
3. Memberikan instruksi langkah demi langkah untuk setiap fitur aktif.
4. Menjelaskan alur pembuatan, review, revisi, approval, dan pelacakan EES.
5. Menjelaskan pengelolaan Service Bulletin, SVR, dan EDS.
6. Menjelaskan status, validasi, notifikasi, error handling, serta tindakan pemulihan.
7. Menyediakan revision log, glosarium, FAQ, dan troubleshooting.

---

## 1. Aturan Kebenaran dan Batasan Penulisan

Ikuti seluruh aturan berikut:

1. **Jangan mengarang fitur, field, tombol, endpoint, role, atau proses bisnis.**
2. Informasi pada prompt ini adalah baseline. Jika terdapat screenshot atau dokumen tambahan, cocokkan dengan baseline dan prioritaskan bukti UI terbaru.
3. Jika data tidak cukup, tulis:

   ```text
   [PERLU KONFIRMASI PRODUCT OWNER]
   ```

   Jangan mengisi kekosongan dengan asumsi.

4. Bedakan dengan tegas:
   - fitur aktif dan sudah terintegrasi backend;
   - fitur terlihat tetapi disabled;
   - fitur yang menunggu endpoint backend;
   - variasi akses berdasarkan role.
5. Jangan menuliskan kredensial, token, cookie, secret, URL internal, atau data pribadi pengguna.
6. Jangan menjadikan endpoint API sebagai instruksi utama pengguna. Manual book berorientasi pada langkah di UI. Endpoint hanya boleh ditulis pada lampiran teknis jika secara eksplisit diminta.
7. Gunakan terminologi yang konsisten:
   - Service Bulletin disingkat **SB**.
   - Engineering Evaluation Sheet disingkat **EES**.
   - Shop Visit Report disingkat **SVR**.
   - Engine Data Sheet/Submittal disingkat **EDS**.
   - Airworthiness Directive disingkat **AD**.
   - Engine Serial Number disingkat **ESN**.
8. Jangan menyebut data dummy sebagai data produksi. Pada implementasi saat ini, dokumentasikan hanya data backend dan state kosong yang benar-benar terlihat.
9. Setiap prosedur wajib menjelaskan:
   - tujuan;
   - role/prasyarat;
   - langkah penggunaan;
   - hasil yang diharapkan;
   - validasi atau error yang mungkin muncul;
   - tindakan pengguna setelah berhasil/gagal.
10. Gunakan format tanggal yang tampil pada aplikasi. Jika format tidak terlihat, gunakan `DD-MM-YYYY` dan tandai bila perlu konfirmasi.

---

## 2. Gambaran Sistem yang Harus Digunakan

ORBIT adalah aplikasi berbasis web untuk mendukung proses engineering review dan compliance, terutama:

- menerima dan menelusuri Service Bulletin;
- membuat Engineering Evaluation Sheet;
- melakukan AI-assisted review atau input manual;
- menentukan applicability terhadap engine/aircraft;
- melakukan manual review sebelum submission;
- menjalankan approval dan revision workflow;
- memantau status kepatuhan SB;
- menyimpan serta membaca data SVR dan EDS;
- menampilkan notifikasi aktivitas;
- mengelola akun pengguna melalui admin.

Teknologi UI tidak perlu dibahas panjang di buku pengguna. Bila dibutuhkan untuk lampiran teknis, sistem frontend menggunakan Next.js dan berkomunikasi dengan backend melalui API.

### Entitas utama

- User.
- Operator.
- Aircraft/fleet.
- Engine/APU dan ESN.
- Service Bulletin.
- EES Document.
- Approval Request dan Approval History.
- SVR.
- EDS.
- SB/AD Compliance Record.
- Notification.

---

## 3. Role dan Hak Akses

Susun matriks role berdasarkan informasi berikut.

### ENGINEER

Menu kerja utama:

- Dashboard.
- My Assignment.
- Engineering Review:
  - EES Generator.
  - 2nd Engineer Review sesuai assignment/otorisasi.
  - SB Status.
- Database.
- User Profile.
- Notifications.

Aktivitas utama:

- memilih dan membaca SB;
- membuat atau melanjutkan EES;
- memilih template Garuda atau Citilink;
- mengisi/edit data EES;
- memeriksa applicability;
- menyimpan draft;
- mengirim EES untuk approval;
- melakukan revisi dan resubmit jika EES ditolak/dikembalikan;
- meninjau assignment yang diterima.

### MANAGER

Manager harus login menggunakan akun dengan role `MANAGER`. Engineer tidak dapat mengganti role melalui UI.

Menu kerja utama:

- Dashboard.
- Manager Workspace.
- User Profile.
- Notifications.

Fitur aktif pada Manager Workspace:

- EES Approval lintas operator sesuai data dan izin backend.
- Preview EES PDF.
- Approve atau reject EES.
- Memberikan komentar review.
- Melihat approval history.

Fitur berikut terlihat sebagai rencana tetapi **belum aktif karena endpoint backend belum tersedia**:

- SB Assignments.
- Excel Assignment.
- Review Matrix.

Jangan menulis ketiga fitur tersebut sebagai prosedur operasional aktif. Masukkan ke bagian “Fitur Belum Tersedia / Future Scope”.

### ADMIN

Menu kerja utama:

- Admin Dashboard.
- User Management.
- Engineering Dashboard.
- Database.
- SB Status.
- User Profile.
- Notifications.

Aktivitas User Management:

- melihat daftar user;
- mencari dan memfilter user berdasarkan role/operator;
- menambah user;
- melihat detail dan mengedit user;
- mengaktifkan atau menonaktifkan user;
- reset password user;
- menghapus user dengan konfirmasi;
- tidak menonaktifkan atau menghapus akun sendiri yang sedang digunakan.

### TECHNICIAN

Role tersedia pada data user. Dokumentasikan akses technician hanya berdasarkan screenshot atau bukti aplikasi yang dilampirkan. Jika cakupan operasionalnya tidak jelas, tandai `[PERLU KONFIRMASI PRODUCT OWNER]`.

### Route protection

- Halaman manager hanya dapat diakses role `MANAGER`.
- Halaman administration dan user management hanya dapat diakses role `ADMIN`.
- Pengguna yang tidak terautentikasi diarahkan ke login.
- Pengguna dengan role yang tidak sesuai tidak boleh memperoleh akses hanya dengan mengetik URL secara manual.

---

## 4. Login, Session, dan Logout

Dokumentasikan prosedur berikut:

### Login

1. Buka halaman Login.
2. Masukkan email dan password.
3. Pilih `Remember Me` bila sesi perlu dipertahankan.
4. Tekan tombol Login/Sign In.
5. Sistem mengarahkan pengguna ke area sesuai role.

### Perilaku Remember Me

- Jika `Remember Me` dicentang, sesi pengguna dapat tetap tersedia setelah browser/tab ditutup sesuai masa berlaku autentikasi.
- Jika `Remember Me` tidak dicentang, sesi berlaku untuk tab saat ini. Menutup tab mengakhiri sesi non-persisten tersebut; membuka aplikasi pada tab baru meminta login kembali.

### Logout

- Gunakan tombol Logout pada sidebar/header.
- Logout menghapus session pengguna dan mengarahkan ke halaman login.

Tambahkan warning keamanan: jangan menggunakan Remember Me pada perangkat bersama.

---

## 5. Navigasi Global

Jelaskan elemen berikut berdasarkan screenshot yang tersedia:

- Sidebar dapat diperluas/diciutkan.
- Header/top bar.
- Global search bila tersedia.
- Theme toggle bila tersedia.
- User profile menu.
- Notification bell.
- Upload progress indicator/card pada navbar ketika proses upload berjalan.
- Loading state, toast sukses/error, dan dialog konfirmasi.

Menu berstatus disabled dan tidak boleh dijelaskan sebagai fitur aktif:

- Engineering Mapping beserta submenu.
- Engineering Intelligence beserta submenu.
- Engineering Reports beserta submenu.
- Workscope beserta submenu.
- Team Chat.
- Administration pada menu engineer bila berstatus disabled.

---

## 6. Dashboard

Jelaskan dashboard sebagai ringkasan engineering review. Gunakan screenshot untuk memastikan metric yang benar. Metric yang mungkin tersedia meliputi:

- New Service Bulletins.
- Unread Service Bulletins.
- Pending EES Approval/2nd Engineer.
- Reviewed atau Approved This Month.
- Recent Service Bulletins.
- Recent Approval Activity.
- Monthly Review Summary dan distribusi kategori.

Untuk setiap metric, jelaskan arti, sumber periode, dan tindakan ketika card/detail ditekan. Jangan membuat formula bila tidak tersedia.

Admin memiliki dashboard khusus dengan ringkasan yang relevan untuk administrasi dan engineering.

---

## 7. My Assignment

Manual harus menjelaskan:

- membuka daftar EES/SB yang ditugaskan;
- membaca status assignment;
- membuka detail EES;
- melanjutkan workflow berdasarkan step terakhir yang tersimpan;
- membedakan status Draft, Pending, Approved, Rejected, Returned, atau status lain yang dikirim backend;
- melakukan revisi jika status membutuhkan perbaikan;
- membuka source SB dan preview/download EES bila tersedia.

Jika workflow belum selesai, pengguna diarahkan ke step terakhir yang tersimpan, bukan dianggap selesai.

---

## 8. EES Generator — Alur Utama

EES Generator terdiri dari lima tahap:

| Tahap | Nama | Tujuan |
|---|---|---|
| 1 | Select SB | Memilih Service Bulletin dan menyiapkan identitas EES. |
| 2 | AI Review | Meninjau hasil klasifikasi/ekstraksi serta memilih template EES. |
| 3 | Applicability | Memeriksa kecocokan engine/aircraft dengan data SB. |
| 4 | Manual Review | Mengedit data, memeriksa PDF hasil backend, menyimpan draft, dan menyiapkan submission. |
| 5 | Done | Menampilkan hasil akhir/status submission dan opsi export yang tersedia. |

### 8.1 Step 1 — Select SB

Jelaskan:

- daftar seluruh SB yang dikirim backend;
- pagination daftar SB;
- search dan filter fleet/engine/status jika tersedia;
- memilih satu SB;
- melihat metadata dan source PDF;
- melihat relasi SB untuk traceability;
- menekan `Continue to Category Review`;
- dialog kebutuhan data yang muncul setelah Continue;
- mengisi EES Number yang diwajibkan;
- memilih Fleet/Aircraft Type jika SB tidak memiliki data tersebut;
- tombol Cancel dan Continue pada dialog;
- validasi field kosong dan pesan error.

Jika SB belum memiliki generated EES, sistem menyiapkan/generate record EES. Jika sudah ada, sistem mengambil data EES yang tersedia dan melanjutkan workflow sesuai progres.

### 8.2 Step 2 — AI Review dan Pemilihan Template

Template EES tidak ditampilkan sebelum pengguna memilih salah satu template:

- Garuda Template.
- Citilink Template.

Jelaskan bahwa pemilihan template menentukan:

- bentuk form;
- field yang wajib;
- renderer PDF preview;
- endpoint export/download yang dipakai sistem;
- approval requirement yang sesuai operator/template.

AI Review dapat menampilkan:

- assigned category/compliance category;
- AI confidence dari detail hasil OCR bila tersedia;
- impact/route information bila tersedia;
- data draft yang diekstrak dari SB.

Jika SB tidak memiliki category **dan** AI confidence, tampilkan kondisi sebagai `SB not generated by AI` dan arahkan ke input manual. Jangan menyebut data tersebut sebagai AI Generated.

#### Garuda Template

Form dapat mencakup:

- EES number.
- category.
- bulletin number dan revision.
- PAR/evaluation items.
- paragraph.
- requirement description.
- remarks.
- references.
- applicability.
- AD related.
- warranty.
- affected A/C or engine/ESN.
- repetitive/Rep.
- Due At.
- task type.
- affected model.
- part number.

#### Citilink Template

Form dapat mencakup:

- EES issued date.
- unit concern.
- build type.
- subject.
- aircraft/component type.
- reason of evaluation.
- maintenance level/compliance time type.
- consequence.
- accomplishment method/task type.
- inspection type/repetitive.
- evaluation result.
- engineering action/recommended action.
- further implementation.
- management approval.
- notes dan references.

Jelaskan field wajib berdasarkan highlight/error yang benar-benar tampil. Jangan menyamakan struktur Citilink dengan Garuda.

### 8.3 Step 3 — Applicability

Tujuan tahap ini adalah membandingkan engine/ESN yang tercantum pada SB dengan data engine yang tersedia pada backend.

Tabel utama dapat memuat:

- ESN from SB.
- Engine/Aircraft.
- Position.
- Data Source.
- Applicability.
- Matching Detail.

Status utama:

- Applicable: engine pada SB ditemukan/cocok pada data yang tersedia.
- Not Applicable: engine pada SB tidak ditemukan atau tidak cocok.

Sumber evidence dapat berasal dari data backend seperti SVR, EDS, atau sumber lain yang benar-benar dikirim API. Tampilkan sumber sebagai satu kolom, bukan tiga blok terpisah.

Jelaskan loading, empty state, error state, retry, dan tombol untuk melanjutkan ke preview EES.

### 8.4 Step 4 — Manual Review

Jelaskan dengan rinci:

- preview PDF EES dihasilkan backend berdasarkan template terpilih;
- Garuda menggunakan preview Garuda;
- Citilink menggunakan preview Citilink;
- pengguna dapat membuka/minimize PDF viewer;
- `Edit EES` membuka form sesuai template;
- field array seperti ESN, affected model, dan part number dapat ditambah/dihapus per item lalu dinormalisasi menjadi data yang diterima backend;
- error form bersifat sticky dan field bermasalah diberi highlight/auto-scroll;
- Save Draft menyimpan perubahan melalui backend, bukan sekadar local state;
- pemilihan reviewer/forward EES;
- upload signature bila diwajibkan;
- submit untuk approval;
- tombol Previous dan View SB PDF.

Tekankan perbedaan:

- Save Draft menyimpan pekerjaan tetapi belum tentu mengirim approval.
- Submit/Continue mengirim dokumen ke approval flow jika seluruh prasyarat terpenuhi.

### 8.5 Step 5 — Done

Jelaskan:

- status akhir workflow;
- EES number dan metadata submission;
- reviewer/tujuan approval;
- preview/download PDF;
- export PDF menggunakan template terpilih;
- export Excel bila tersedia;
- langkah selanjutnya setelah status Pending, Approved, Rejected, atau Returned.

### 8.6 EES Review History

Daftar history memuat informasi seperti:

- EES Number.
- Bulletin Number.
- Fleet/Engine.
- Category.
- Refers To.
- Created.
- Prepared By.
- Status/step workflow.

Jelaskan bahwa record yang belum selesai membuka kembali step terakhir. Status workflow tidak boleh otomatis menjadi Done hanya karena pengguna kembali ke Step 1.

---

## 9. Detail EES, Revision, dan Resubmit

Detail EES dapat memuat:

- header EES dan SB;
- workflow status;
- PDF preview berdasarkan template/operator EES;
- EES Information;
- Approval Status;
- Related Documents;
- Audit Trail;
- approval/review history;
- download PDF;
- View Source SB.

Jika EES ditolak atau dikembalikan:

1. Buka EES melalui My Assignment atau detail EES.
2. Pilih aksi Revision/Revise EES.
3. Baca komentar/perintah revisi pada header.
4. Buka source SB PDF bila diperlukan.
5. Edit seluruh field yang relevan pada form template yang benar.
6. Simpan perubahan.
7. Resubmit EES ke approval workflow.

Jelaskan bahwa preview detail harus mengikuti template EES/operator yang benar. Operator Citilink (`QG`) menggunakan Citilink; operator lain menggunakan Garuda jika tidak ada atribut template eksplisit. Jika backend menyediakan `eesTemplate`, atribut eksplisit tersebut harus diprioritaskan.

---

## 10. 2nd Engineer Review / Approval Review

Jelaskan:

- daftar Inbox approval;
- Approval History;
- pagination;
- filter All/Pending/Approved/Rejected/Returned bila tersedia;
- memilih satu request;
- membaca metadata EES dan SB;
- membaca approval history/comment;
- preview EES PDF sesuai template;
- memilih Approve atau Reject;
- mengisi komentar sesuai kebijakan;
- upload signature bila diwajibkan;
- konfirmasi keputusan;
- hasil setelah tindakan sukses/gagal.

Jangan menyarankan approval tanpa membaca dokumen dan metadata pendukung.

---

## 11. SB Status

Fitur SB Status digunakan untuk memantau applicability dan compliance SB pada engine/fleet.

Ringkasan dapat mencakup:

- Total SB.
- Open.
- Partially Complied.
- Complied.
- Overdue.
- Not Applicable.
- Unknown.

Tabel dapat memuat:

- Service Bulletin.
- Document status.
- Compliance status.
- Scope.
- Category/Task.
- Engine Coverage.
- Requirement.
- Last Updated.

Jelaskan penggunaan filter, pagination, membuka detail, membaca engine-level evaluation, dan evidence source. Jika proses memerlukan waktu karena backend mengagregasi banyak engine/record, jelaskan loading state dan jangan meminta pengguna melakukan refresh berulang tanpa kebutuhan.

---

## 12. Database

Database memiliki dua area utama:

- Search/Records.
- Upload.

### 12.1 Search/Records

Jenis dokumen aktif:

- Service Bulletin.
- SVR.
- EDS.

Jelaskan pencarian berdasarkan field yang tersedia, filter fleet untuk SB, filter ESN untuk SVR/EDS, pagination, empty state, dan membuka detail record.

### 12.2 Service Bulletin Detail

Jelaskan:

- metadata SB;
- source/original document;
- preview PDF bila tersedia;
- outgoing dan incoming relations;
- relation type, condition, sync status, dan target SB;
- status `UNREGISTERED` bila target relation belum terdapat di database;
- review history;
- source/provenance data.

### 12.3 SVR List dan Detail

SVR digunakan untuk merekam shop visit dan mendukung pelacakan perubahan engine/APU serta compliance SB/AD.

Fitur detail:

- metadata engine/APU dan shop visit;
- preview PDF;
- download PDF;
- export Excel;
- search pada records;
- pagination records;
- tab:
  - SB Compliance/Execution & Compliance;
  - Configuration;
  - LLP Status;
  - Airworthiness Directive Status;
  - Accessories;
  - tab/record compliance lain yang benar-benar tampil.

Jelaskan arti data IN/OUT pada configuration bila terlihat, received vs installed component pada accessories, serta hubungan compliance record dengan SB/AD.

### 12.4 EDS List dan Detail

Fitur detail:

- metadata EDS dan engine/aircraft/operator;
- preview PDF jika file tersedia;
- download PDF;
- export Excel;
- search pada records;
- tab Configuration, LLP Status, SB Status, Airworthiness Directives, Accessories, dan Compliance sesuai data yang tersedia.

### 12.5 Upload SVR

- Upload menggunakan multipart PDF.
- Pengguna dapat memilih 1 sampai maksimal 6 file PDF.
- Proses upload dapat diminimize tanpa membatalkan proses.
- Menutup window upload hanya meminimize.
- Cancel upload harus meminta konfirmasi.
- Card progress pada navbar dapat membuka kembali floating upload window.
- Jelaskan progress, processing, reconciliation setelah gateway timeout, sukses, gagal, dan pencegahan upload ganda.

### 12.6 Upload EDS

- File berbentuk PDF.
- Maksimal ukuran mengikuti validasi UI yang aktif (saat ini 100 MB per file).
- Proses dapat diminimize dan dibuka kembali dari progress indicator.
- Cancel harus melalui dialog konfirmasi.
- Jelaskan status upload, processing, sukses, gagal, dan retry yang aman.

Jangan mendokumentasikan fitur Database Engine/detail Engine karena fitur tersebut telah dihapus dari UI.

---

## 13. Notifications

Jelaskan:

- indikator titik/badge merah pada bell ketika ada notifikasi belum dibaca;
- animasi indikator ketika terdapat notifikasi baru;
- notification dropdown/list;
- toast saat login jika ada notifikasi yang perlu diperhatikan;
- menandai notifikasi dibaca;
- menandai semua dibaca bila tersedia;
- tombol `Lihat/View` mengarahkan ke detail EES/SB yang benar;
- langkah jika target detail tidak tersedia.

---

## 14. User Profile

Jelaskan:

- membuka profile dari header;
- informasi identitas, email, username, role, status, operator/unit, dan metadata akun yang tersedia;
- refresh profile;
- loading, error, dan retry state.

Jangan mengarang fitur edit profil atau change password jika tombol tersebut tidak terlihat.

---

## 15. Administration dan User Management

Buat prosedur khusus Admin untuk:

1. Membuka User Management.
2. Mencari user.
3. Filter role.
4. Filter operator ID.
5. Menambah user.
6. Mengedit metadata dan role user.
7. Aktivasi/deaktivasi akun.
8. Reset password.
9. Menghapus user.
10. Memahami larangan mengubah status atau menghapus akun sendiri.

Role yang tersedia pada form:

- ADMIN.
- MANAGER.
- ENGINEER.
- TECHNICIAN.

Setiap operasi destruktif harus dijelaskan memiliki dialog konfirmasi.

---

## 16. Status, Validasi, dan Error Handling

Buat tabel status dan tindakan pengguna. Gunakan minimal status berikut bila muncul pada UI/API:

- DRAFT.
- PENDING.
- APPROVED.
- REJECTED.
- RETURNED.
- ACTIVE.
- SUPERSEDED.
- TERMINATED.
- CONCURRENT.
- REVIEW_REQUIRED.
- GENERATED.
- EXTRACTED.
- UNREGISTERED.
- UNSYNCED.
- COMPLIED.
- PARTIALLY_COMPLIED.
- OVERDUE.
- NOT_APPLICABLE.
- UNKNOWN.

Untuk error, buat troubleshooting berdasarkan kategori:

- field wajib belum diisi;
- format/tipe file tidak sesuai;
- ukuran file melebihi batas;
- user/reviewer berasal dari operator berbeda;
- data tidak ditemukan;
- konflik data/HTTP 409;
- unauthorized/session habis;
- forbidden/role tidak sesuai;
- gateway timeout/HTTP 504 saat upload;
- backend tidak dapat dihubungi;
- PDF belum tersedia;
- template EES tidak sesuai;
- browser menutup tab ketika Remember Me tidak aktif.

Jangan meminta pengguna mengunggah ulang setelah timeout sebelum sistem selesai melakukan verifikasi/reconciliation, untuk mencegah record ganda.

---

## 17. Struktur Manual Book yang Wajib Dihasilkan

Hasil akhir harus memiliki struktur berikut:

1. Cover.
2. Document Control.
3. Revision History / Log Perubahan Dokumen.
4. Approval Page dokumen manual.
5. Daftar Isi.
6. Daftar Gambar.
7. Daftar Tabel.
8. Pendahuluan.
9. Tujuan dan Ruang Lingkup.
10. Definisi, Akronim, dan Glosarium.
11. Gambaran Umum ORBIT.
12. Persyaratan Akses dan Browser.
13. Role dan Access Matrix.
14. Login, Session, Logout, dan Keamanan Akun.
15. Navigasi Global.
16. Panduan Dashboard.
17. Panduan My Assignment.
18. Panduan EES Generator Step 1–5.
19. Panduan EES Review History dan Resume Workflow.
20. Panduan Detail EES, Revision, dan Resubmit.
21. Panduan 2nd Engineer Review.
22. Panduan Manager Workspace.
23. Panduan SB Status.
24. Panduan Database SB, SVR, dan EDS.
25. Panduan Upload SVR dan EDS.
26. Panduan Notifications.
27. Panduan User Profile.
28. Panduan Admin Dashboard dan User Management.
29. Status dan Business Rules.
30. Troubleshooting dan Recovery.
31. FAQ.
32. Fitur Disabled/Future Scope.
33. Lampiran Checklist Operasional.
34. Lampiran RACI atau Role Responsibility Matrix.
35. Lampiran Technical/API Reference hanya jika diminta.

---

## 18. Format Setiap Prosedur

Gunakan template konsisten berikut:

```markdown
### [Nomor] Nama Prosedur

**Tujuan**  
Menjelaskan hasil yang ingin dicapai.

**Role yang Diizinkan**  
ENGINEER / MANAGER / ADMIN / sesuai bukti.

**Prasyarat**

- Pengguna sudah login.
- Data yang diperlukan tersedia.

**Langkah-langkah**

1. ...
2. ...
3. ...

**Hasil yang Diharapkan**  
...

**Validasi dan Kemungkinan Error**

| Kondisi | Pesan/Gejala | Tindakan |
|---|---|---|
| ... | ... | ... |

**Catatan/Warning**  
...

**Screenshot**  
[SISIPKAN SCREENSHOT: nama halaman dan elemen yang perlu ditandai]
```

---

## 19. Aturan Screenshot dan Callout

Untuk setiap halaman utama:

1. Beri placeholder screenshot yang spesifik, bukan hanya “masukkan gambar”.
2. Contoh:

   ```text
   [SISIPKAN SCREENSHOT: EES Generator Step 1 — tandai area filter, daftar SB, pagination, dan tombol Continue]
   ```

3. Tambahkan nomor gambar dan caption.
4. Bila screenshot disediakan, jangan menebak teks yang tidak terbaca.
5. Sensor email, user ID, ESN, signature, token, dan data sensitif bila manual akan dibagikan luas.
6. Gunakan callout konsisten:
   - `Catatan` untuk informasi tambahan.
   - `Penting` untuk prasyarat.
   - `Peringatan` untuk risiko data/proses.
   - `Tips` untuk mempercepat penggunaan.

---

## 20. Style Guide Dokumen

- Nada profesional, instruksional, dan tidak promosi berlebihan.
- Gunakan kalimat aktif dan langkah singkat.
- Satu langkah berisi satu aksi utama.
- Nama tombol/menu ditulis tebal, contoh **Save Draft**.
- Nama field ditulis dengan format kode, contoh `EES Number`.
- Status ditulis huruf kapital sesuai sistem, contoh `PENDING`.
- Hindari paragraf panjang; gunakan tabel untuk status, role, dan troubleshooting.
- Jangan menyalin JSON payload mentah ke bab pengguna.
- Tambahkan cross-reference antarbagian, misalnya “lihat Bagian 18.4”.
- Gunakan penomoran heading yang stabil.

---

## 21. Checklist Kualitas Sebelum Menyerahkan Manual

Pastikan hasil akhir memenuhi semuanya:

- [ ] Semua role dijelaskan dan tidak terjadi role switching Engineer ke Manager.
- [ ] Route protection dijelaskan.
- [ ] Remember Me dan session-per-tab dijelaskan.
- [ ] EES workflow memiliki tepat lima tahap.
- [ ] Perbedaan Garuda dan Citilink dijelaskan.
- [ ] Kondisi tanpa category/AI confidence diarahkan ke manual input.
- [ ] Workflow progress/resume dijelaskan.
- [ ] Revision dan resubmit dijelaskan.
- [ ] Preview PDF mengikuti template yang benar.
- [ ] Approval inbox dan history dijelaskan.
- [ ] Manager future modules tidak ditulis sebagai fitur aktif.
- [ ] Database Engine tidak dicantumkan.
- [ ] SVR dan EDS mencakup preview, download, export Excel, search, dan record tabs.
- [ ] Upload minimize, cancel confirmation, progress navbar, timeout reconciliation dijelaskan.
- [ ] Notifications, profile, dan admin user CRUD dijelaskan.
- [ ] Fitur disabled ditempatkan di Future Scope.
- [ ] Tidak ada secret, token, password, atau data personal nyata.
- [ ] Semua screenshot memiliki caption dan tujuan callout.
- [ ] Ada FAQ, troubleshooting, revision log, dan glossary.
- [ ] Semua klaim yang tidak memiliki bukti ditandai `[PERLU KONFIRMASI PRODUCT OWNER]`.

---

## 22. Bahan Tambahan yang Akan Saya Berikan ke LLM

Setelah prompt ini, saya mungkin melampirkan:

- screenshot setiap halaman;
- logo perusahaan/operator;
- contoh PDF Garuda dan Citilink;
- contoh payload yang sudah disensor;
- SOP approval internal;
- kebijakan naming EES;
- daftar role dan organisasi;
- daftar error dari testing;
- release note aplikasi.

Analisis seluruh lampiran, lalu beri daftar informasi yang masih kurang **sebelum** menulis versi final. Jika lampiran saling bertentangan, buat tabel konflik dan minta keputusan Product Owner.

---

## 23. Instruksi Output Final kepada LLM

Hasilkan dua keluaran:

### Output A — Gap Analysis

Berisi:

- daftar informasi yang sudah cukup;
- daftar screenshot yang masih diperlukan;
- daftar aturan bisnis yang perlu dikonfirmasi;
- konflik informasi jika ada;
- rekomendasi pembagian bab.

### Output B — Manual Book

Berupa Markdown lengkap yang:

- siap dikonversi ke Word/PDF;
- memakai struktur wajib pada prompt ini;
- memiliki placeholder cover, document number, version, effective date, prepared by, checked by, dan approved by;
- menyertakan daftar gambar/tabel;
- menyertakan prosedur langkah demi langkah;
- menyertakan troubleshooting dan FAQ;
- membedakan fitur aktif, disabled, dan menunggu backend;
- tidak mengandung informasi yang dibuat-buat.

Gunakan placeholder metadata berikut sampai saya menggantinya:

```text
Document Title : ORBIT User Manual
Document Number: [DOCUMENT NUMBER]
Version        : [VERSION]
Effective Date : [EFFECTIVE DATE]
Prepared By    : [NAME / UNIT]
Checked By     : [NAME / UNIT]
Approved By    : [NAME / UNIT]
Classification : [INTERNAL / CONFIDENTIAL]
```

Sebelum menulis Output B, ajukan maksimal 15 pertanyaan yang benar-benar memengaruhi isi manual. Jangan menanyakan hal yang sudah dijelaskan pada prompt ini.

