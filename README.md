# 🤖 WhatsApp Bot ANTC STORE - Professional Service & Management

Bot ini dirancang khusus untuk layanan **Joki Game** dan **Manajemen Grup** profesional. Dibuat dengan dedikasi penuh untuk membantu operasional **ANTC STORE** agar dapat melayani pelanggan 24/7 secara otomatis, aman, dan terpercaya.

---

## 🇮🇩 INDONESIA (PANDUAN LENGKAP)

### ⚠️ PERINGATAN KERAS: JANGAN DIJUAL BELI!
Bot ini dibagikan secara GRATIS sebagai bentuk kontribusi untuk saling berbagi ilmu di dunia pemrograman dan komunitas joki. Silahkan gunakan untuk keperluan pribadi atau toko Anda sendiri. Ingat, berbagi itu indah dan membawa berkah! ✨

### 🚀 Fitur Utama & Keunggulan
1. **Auto-Reply Private Chat (Pesan Otomatis)**: 
   - Membalas chat pelanggan secara otomatis saat admin sedang tidak di tempat (offline).
   - Menyertakan link Saluran Informasi Resmi ANTC STORE agar pelanggan tetap terupdate.
   - Sistem Anti-Spam: Bot tidak akan membombardir pelanggan dengan pesan yang sama berulang kali.
2. **Sistem Joki Terintegrasi (Automated Joki System)**: 
   - **.joki [nama] [jumlah]**: Mencatat pesanan pelanggan secara otomatis ke database bot.
   - **.qris**: Mengirimkan gambar QRIS pembayaran toko Anda secara instan.
   - **Deteksi Screenshot (SS)**: Bot mendeteksi secara otomatis saat pelanggan mengirimkan bukti transfer.
   - **.accepted**: Konfirmasi pembayaran oleh admin yang secara otomatis mengirimkan detail perhatian joki (.acc) kepada pelanggan.
   - **.jokidone**: Mengirimkan pesan perayaan profesional saat joki telah selesai.
3. **Monitoring & Keamanan Grup (Group Guard)**: 
   - **Anti-Link**: Menghapus otomatis link yang dikirim anggota untuk mencegah promosi liar.
   - **Anti-Toxic**: Sensor kata-kata kasar yang bisa dikustomisasi oleh admin.
   - **Anti-Media**: Filter foto dan video untuk menjaga ketertiban grup.
   - **Hidetag & News**: Memberikan pengumuman ke seluruh anggota grup dengan satu perintah.
4. **Sistem Keamanan Admin**: 
   - **.emergencystop**: Perintah darurat untuk mematikan seluruh fungsi bot seketika jika terjadi gangguan atau spam parah.
   - **.pmacc & .jg**: Fitur privasi agar bot tidak membalas chat pribadi pada nomor-nomor tertentu.

### 🛠️ Panduan Pemasangan (Setup Step-by-Step)
1. **Persiapan Lingkungan**: Pastikan Anda telah menginstal **Node.js** (Versi 16 atau lebih tinggi) di komputer atau server Anda.
2. **Persiapan File**: Download atau Clone repository ini ke folder lokal Anda.
3. **Instalasi Dependency**: Buka terminal atau command prompt di folder bot tersebut, lalu jalankan:
   ```bash
   npm install
   ```
   Ini akan mengunduh semua library yang dibutuhkan seperti Baileys, Pino, dan Boom.
4. **Menjalankan Bot**: Masih di terminal, jalankan perintah:
   ```bash
   node index.js
   ```
5. **Proses Pairing (Tautan)**: 
   - Bot akan meminta nomor WhatsApp yang ingin dijadikan bot.
   - Masukkan nomor dengan format internasional (Contoh: 628123456789).
   - Bot akan memberikan **KODE PAIRING** (8 Digit).
   - Di HP Anda, buka WhatsApp > Perangkat Tertaut > Tautkan Perangkat > Tautkan dengan nomor telepon saja.
   - Masukkan kode yang muncul di terminal ke HP Anda.

### ⚙️ Konfigurasi Lanjutan (Ganti Nomor Admin)
Sangat penting untuk mengatur siapa yang memiliki kendali penuh (Admin/Owner):
1. Buka file `index.js` menggunakan editor teks (Notepad++, VS Code, dll).
2. Cari baris di bawah tulisan `// Configuration and States`.
3. Temukan kode: `const admins = new Set(['628xxxxxxx@s.whatsapp.net']);`
4. Ganti `628xxxxxxx` dengan nomor WhatsApp Anda sendiri.
5. Simpan file dan jalankan ulang botnya.

---

## 🇬🇧 ENGLISH (EXTENDED GUIDE)

### ⚠️ IMPORTANT NOTICE
DO NOT SELL OR BUY THIS SCRIPT! This bot is provided FREE for educational purposes and community sharing. Use it for your own business or personal growth. ✨

### 🚀 Key Features
- **Smart Auto-Reply**: Handles private inquiries with anti-spam technology and channel links.
- **Order Management**: Streamlined .joki, .qris, and .accepted workflow for game boosting services.
- **Group Moderation**: Advanced filters for links, toxic words, photos, and videos to keep your community clean.
- **Emergency Protocols**: Quick .emergencystop command to halt all operations instantly.

### 🛠️ Quick Installation
1. Install Node.js (v16+).
2. Run `npm install` in the project directory.
3. Run `node index.js` to start.
4. Link your account using the Pairing Code provided in the terminal.

---

## 🇷🇺 RUSSIAN (ПОДРОБНОЕ РУКОВОДСТВО)

### ⚠️ ВНИМАНИЕ
НЕ ПРОДАВАЙТЕ И НЕ ПОКУПАЙТЕ ЭТОТ СКРИПТ! Бот предоставляется БЕСПЛАТНО для обмена знаниями. ✨

### 🚀 Основные возможности
- **Автоответчик**: Автоматические ответы с защитой от спама и ссылками на информационные каналы.
- **Система Буста**: Полный цикл обработки заказов: от оформления до подтверждения оплаты.
- **Модерация Групп**: Эффективные фильтры против ссылок, мата и нежелательного контента.
- **Аварийная остановка**: Мгновенное отключение бота командой .emergencystop.

---

## 🇨🇳 CHINESE (详细指南)

### ⚠️ 重要说明
请勿买卖此脚本！此机器人免费提供，仅供学习和分享之用。 ✨

### 🚀 主要功能
- **智能自动回复**: 在管理员离线时处理私聊，具备防垃圾邮件技术。
- **代练管理系统**: 简化订单流程，支持 .joki、.qris 和 .accepted 等指令。
- **群组管理**: 先进的链接、脏话、图片和视频过滤器。
- **紧急停止**: 使用 .emergencystop 指令立即停止所有操作。

---

## 🇹🇭 THAILAND (คู่มือฉบับเต็ม)

### ⚠️ คำเตือนสำคัญ
ห้ามซื้อขายสคริปต์นี้! บอทนี้แจกฟรีเพื่อการศึกษาและแบ่งปันความรู้ในชุมชน ✨

### 🚀 คุณสมบัติที่สำคัญ
- **ระบบตอบกลับอัตโนมัติ**: จัดการแชทส่วนตัวพร้อมเทคโนโลยีป้องกันสแปมและลิงก์ช่องข้อมูล
- **การจัดการคำสั่งซื้อ**: ระบบ Joki ที่ครบวงจร ตั้งแต่การสั่งซื้อไปจนถึงการยืนยันการชำระเงิน
- **การดูแลกลุ่ม**: ตัวกรองขั้นสูงสำหรับลิงก์ คำหยาบคาย รูปภาพ และวิดีโอ
- **ระบบหยุดฉุกเฉิน**: คำสั่ง .emergencystop เพื่อหยุดการทำงานทั้งหมดทันที

---
Dibuat dengan ❤️ oleh **Apis (ANTC STORE)** - Teruslah Berbagi Ilmu!
