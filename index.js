import { 
    makeWASocket, 
    useMultiFileAuthState, 
    DisconnectReason, 
    fetchLatestBaileysVersion,
    makeCacheableSignalKeyStore
} from '@whiskeysockets/baileys';
import pino from 'pino';
import { Boom } from '@hapi/boom';
import readline from 'readline';

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const question = (text) => new Promise((resolve) => rl.question(text, resolve));

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info');
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
        version,
        logger: pino({ level: 'silent' }),
        printQRInTerminal: false,
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'silent' })),
        },
    });

    if (!sock.authState.creds.registered) {
        const phoneNumber = '6281330032894';
        console.log(`Menghubungkan nomor: ${phoneNumber}`);
        setTimeout(async () => {
            try {
                const code = await sock.requestPairingCode(phoneNumber);
                console.log(`\n========================`);
                console.log(`KODE PAIRING BARU: ${code}`);
                console.log(`========================\n`);
            } catch (err) {
                console.error('Gagal meminta kode pairing:', err);
            }
        }, 3000);
    }

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect.error instanceof Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
            if (shouldReconnect) startBot();
        } else if (connection === 'open') {
            console.log('Bot Berhasil Terhubung!');
            // Auto update admins with the connected number
            const botNumber = sock.user.id.split(':')[0] + '@s.whatsapp.net';
            admins.add(botNumber);
        }
    });

    // Configuration and States
    const activeJoki = new Map();
    const blacklist = new Set();
    const jgNumbers = new Set();
    const admins = new Set(['6281330032894@s.whatsapp.net']);
    const monitoredGroups = new Map();
    const mutedUsers = new Map();
    const warnings = new Map();
    let botStatus = true;

    sock.ev.on('messages.upsert', async (m) => {
        const msg = m.messages[0];
        if (!msg.message) return;

        const from = msg.key.remoteJid;
        const isGroup = from.endsWith('@g.us');
        const sender = (msg.key.participant || from).split('@')[0].split(':')[0] + '@s.whatsapp.net';
        
        if (jgNumbers.has(from) || jgNumbers.has(sender)) return;
        if (blacklist.has(sender)) return;

        if (mutedUsers.has(sender)) {
            if (Date.now() < mutedUsers.get(sender)) {
                if (!msg.key.fromMe) await sock.sendMessage(from, { delete: msg.key });
                return;
            } else mutedUsers.delete(sender);
        }

        const text = msg.message.conversation || msg.message.extendedTextMessage?.text || msg.message.imageMessage?.caption || msg.message.videoMessage?.caption || '';
        const isCmd = text.startsWith('.') || text.startsWith('/');
        const args = text.trim().split(/ +/);
        const command = args[0].toLowerCase();
        const q = args.slice(1).join(' ');
        const isAdmin = admins.has(sender);
        const botNumber = sock.user.id.split(':')[0] + '@s.whatsapp.net';

        // Check bot status - stop processing if off
        if (!botStatus && !isAdmin) return;

        console.log(`Pesan masuk: ${text} | Perintah: ${command} | Admin: ${isAdmin}`);

        // Morning Detection
        const morningRegex = /\bmorning\b/i;
        if (morningRegex.test(text)) {
            const lastMorningReply = warnings.get(`morning_${from}`) || 0;
            const now = Date.now();
            
            // Limit to once every 5 hours to avoid spamming
            if (now - lastMorningReply > 5 * 60 * 60 * 1000) {
                const morningReply = `Good morning juga Naila! 👋✨\n\nApis kayaknya masih tidur, chat ini dikirim oleh bot. Apis membuat agar jika kamu bilang morning bot akan menjawabnya 😄`;
                await sock.sendMessage(from, { text: morningReply });
                warnings.set(`morning_${from}`, now);
            }
            return;
        }

        // Apin Detection
        const apinRegex = /apin/i;
        if (apinRegex.test(text)) {
            const lastApinReply = warnings.get(`apin_${from}`) || 0;
            const now = Date.now();
            
            if (now - lastApinReply > 60000) { // 1 minute cooldown
                const apinReply = `Iyaaa kenapa? Kayaknya Apis lagi sekolah atau lagi tidur. Pesan ini otomatis dikirim oleh bot asisten. Ketik /help jika butuh bantuan selanjutnya okeee. Terimakasih! 👋✨`;
                await sock.sendMessage(from, { text: apinReply });
                warnings.set(`apin_${from}`, now);
            }
            return;
        }

        // QRIS Detection for payment confirmation
        const isImage = !!msg.message.imageMessage;
        if (isImage && !msg.key.fromMe) {
            const hasOrder = activeJoki.has(from);
            if (hasOrder) {
                const data = activeJoki.get(from);
                if (!data.paid) {
                    await sock.sendMessage(from, { text: `📸 *SAMPEL PEMBAYARAN TERDETEKSI*\n\nTerima kasih Kak! Bot mendeteksi Anda mengirimkan bukti transfer/SS QRIS.\n\nSilahkan tunggu sebentar, Admin akan melakukan pengecekan. Ketik *.accepted* jika pembayaran sudah dikonfirmasi untuk memulai proses joki. ⏳` });
                }
            }
        }

        // Auto-reply for Private Chat
        if (!isGroup && !isCmd && !msg.key.fromMe && !jgNumbers.has(from) && !jgNumbers.has(sender)) {
            const lastReplyTime = warnings.get(`reply_${from}`) || 0;
            const now = Date.now();
            
            // Limit reply to once every 1 minute to avoid spamming
            if (now - lastReplyTime > 60000) { 
                const welcomeText = `✨ *ANTC STORE AUTOMATED ASSISTANT* ✨\n\n` +
                                    `Halo Kak! 👋 Terima kasih telah menghubungi *ANTC STORE*.\n\n` +
                                    `📢 *Pemberitahuan:* Saat ini Admin sedang beristirahat atau sedang melayani pelanggan lain. Mohon kesediaannya untuk menunggu sebentar ya Kak, Admin akan segera membalas chat Anda. 📩\n\n` +
                                    `Silahkan ketik */help* untuk melihat cara order joki jika admin kami sedang tidur atau tutup.\n\n` +
                                    `📢 *Jangan lupa join saluran informasi kami:* \n` +
                                    `Ikuti saluran ANTC INFO di WhatsApp: https://whatsapp.com/channel/0029VbBZeRr7DAWzkqRdDB3S\n\n` +
                                    `⏳ *Jam Operasional:* 09:00 - 22:00 WIB\n\n` +
                                    `Terima kasih atas pengertiannya! 🙏`;
                await sock.sendMessage(from, { text: welcomeText });
                warnings.set(`reply_${from}`, now);
            }
        }

        // Group Monitor & Anti Toxic
        if (isGroup && monitoredGroups.has(from)) {
            const config = monitoredGroups.get(from);
            const isVideo = !!msg.message.videoMessage;
            const isPhoto = !!msg.message.imageMessage;
            const isLink = text.includes('http://') || text.includes('https://') || !!msg.message.extendedTextMessage?.matchedText;

            if (config.antiToxic && config.badWords?.length > 0) {
                const isToxic = config.badWords.some(word => text.toLowerCase().includes(word.toLowerCase().trim()));
                if (isToxic) {
                    await sock.sendMessage(from, { delete: msg.key });
                    return;
                }
            }

            if ((config.video && isVideo) || (config.photo && isPhoto) || (config.link && isLink)) {
                await sock.sendMessage(from, { delete: msg.key });
                return;
            }
        }

        // --- Commands ---

        if (command === '/help') {
            const helpText = `✨ *ANTC STORE - CARA ORDER JOKI* ✨\n\n` +
                           `Halo Kak! Mau order joki? Caranya gampang banget: 🚀\n\n` +
                           `1️⃣ *Cek Harga:* Ketik \`.spek\`\n` +
                           `2️⃣ *Pesan:* Ketik \`.joki [nama] [jumlah]\` (Contoh: .joki Budi 50)\n` +
                           `3️⃣ *Bayar:* Ketik \`.qris\` dan kirim bukti transfer (SS)\n` +
                           `4️⃣ *Proses:* Tunggu konfirmasi admin dan akun akan diproses 🛠️\n\n` +
                           `💎 *COMMANDS JOKI*\n` +
                           `• \`.joki\` - Mulai pesanan\n` +
                           `• \`.qris\` - Menu pembayaran\n` +
                           `• \`.ping\` - Cek respon bot\n` +
                           `• \`.spek\` - Info sistem & harga\n\n` +
                           `Terima kasih telah mempercayakan *ANTC STORE*! 🔥`;
            
            try {
                await sock.sendMessage(from, { 
                    image: { url: './antc.png' }, 
                    caption: helpText 
                });
            } catch (e) {
                await sock.sendMessage(from, { text: helpText });
            }
            return;
        }

        if (command === '/dasbord') {
            const dasbordText = `📊 *ANTC STORE - DASHBOARD SYSTEM* 📊\n\n` +
                           `Berikut adalah fitur monitoring dan aktivitas admin: 🛡️\n\n` +
                           `💎 *AKTIVITAS JOKI*\n` +
                           `• \`.acc\` - Detail pesanan (Perhatian)\n` +
                           `• \`.accepted\` - Konfirmasi pembayaran (Admin)\n` +
                           `• \`.jokidone\` - Tandai pesanan selesai ✨\n\n` +
                           `🛡️ *GRUP MONITOR*\n` +
                           `• \`.grupmonitor\` - Status keamanan grup\n` +
                           `• \`.videoat [on/off]\` - Filter video\n` +
                           `• \`.fotoat [on/off]\` - Filter foto\n` +
                           `• \`.linkat [on/off]\` - Filter link\n` +
                           `• \`.antx [kata]\` - Filter kata kasar\n\n` +
                           `👑 *ADMIN MENU*\n` +
                           `• Ketik */admin* untuk melihat perintah khusus pengelola.\n\n` +
                           `💡 *Pesan:* Gunakan fitur dengan bijak untuk kenyamanan grup.`;
            
            try {
                await sock.sendMessage(from, { 
                    image: { url: './antc.png' }, 
                    caption: dasbordText 
                });
            } catch (e) {
                await sock.sendMessage(from, { text: dasbordText });
            }
            return;
        }

        if (command === '.qris') {
            try {
                await sock.sendMessage(from, { 
                    image: { url: './qris.png' }, 
                    caption: `🏦 *ANTC STORE - QRIS PEMBAYARAN* 🏦\n\nSilahkan scan kode QR di atas untuk melakukan pembayaran joki Anda.\n\n📌 *Langkah:* \n1. Scan & Bayar sesuai nominal\n2. Kirim bukti transfer (SS) ke sini\n3. Tunggu konfirmasi admin\n\nTerima kasih! 🙏` 
                });
            } catch (e) {
                await sock.sendMessage(from, { text: '❌ Gagal mengirim gambar QRIS. Silahkan hubungi admin.' });
            }
            return;
        }

        if (command === '.spek') {
            const spekText = `🖥️ *SPESIFIKASI SISTEM BOT ANTC* 🖥️\n\n` +
                             `🚀 *Processor:* AMD Radeon Vega Graphics (High Performance)\n` +
                             `🧠 *Memory:* Optimized RAM Management\n` +
                             `⚡ *Speed:* Ultra Fast Response Time\n` +
                             `🌐 *Uptime:* 24/7 Dedicated Server\n\n` +
                           `📝 *LISENSI BOT:* \n` +
                           `💰 *Biaya:* Rp 399.000 / Bulan\n\n` +
                           `⚠️ *Catatan:* Mohon gunakan bot dengan baik dan benar.\n\n` +
                           `Terima kasih! 🙏`;
            await sock.sendMessage(from, { text: spekText });
            return;
        }

        if (command === '/admin') {
            let adminText = `👑 *ADMIN DASHBOARD*\n\n` +
                            `• .kick [nomor]\n` +
                            `• .blacklist [nomor]\n` +
                            `• .banned [nomor]\n` +
                            `• .warning [nomor]\n` +
                            `• .jg [nomor]\n` +
                            `• .akses admin [nomor]\n` +
                            `• .setatus [on/off]`;
            await sock.sendMessage(from, { text: adminText });
            return;
        }

        if (command === '/jasabot') {
            await sock.sendMessage(from, { text: `🤖 *LAYANAN JASA BOT*\n\n.beli\n.buat\n.paket jadi\n.list harga\n\n*DALAM TAHAP PEMBUATAN*` });
            return;
        }

        if (command === '.news' && isGroup) {
            if (!isAdmin) return await sock.sendMessage(from, { text: 'Perintah ini hanya untuk admin!' });
            const meta = await sock.groupMetadata(from);
            await sock.sendMessage(from, { text: q ? q : '📢 PENGUMUMAN UNTUK SEMUA ANGGOTA!', mentions: meta.participants.map(p => p.id) });
            try {
                await sock.sendMessage(from, { delete: msg.key });
            } catch (err) {
                console.error('Gagal menghapus pesan .news:', err);
            }
            return;
        }

        if (command === '.hidetag' && isGroup) {
            if (!isAdmin) return await sock.sendMessage(from, { text: 'Perintah ini hanya untuk admin!' });
            const meta = await sock.groupMetadata(from);
            const msgTag = q ? q : '📢 Panggilan untuk semua anggota!';
            await sock.sendMessage(from, { text: msgTag, mentions: meta.participants.map(p => p.id) });
            try {
                await sock.sendMessage(from, { delete: msg.key });
            } catch (err) {
                console.error('Gagal menghapus pesan .hidetag:', err);
            }
            return;
        }

        if (command === '.warning' && isAdmin) {
            const target = (args[1] || '').replace(/[^0-9]/g, '') + '@s.whatsapp.net';
            if (!args[1]) return await sock.sendMessage(from, { text: 'Tag atau masukkan nomor!' });
            let warnCount = (warnings.get(target) || 0) + 1;
            warnings.set(target, warnCount);
            if (warnCount >= 3) {
                await sock.sendMessage(from, { text: `⚠️ @${target.split('@')[0]} MAX WARNING!`, mentions: [target] });
                if (isGroup) await sock.groupParticipantsUpdate(from, [target], 'remove');
                warnings.delete(target);
            } else {
                await sock.sendMessage(from, { text: `⚠️ WARNING [${warnCount}/3] @${target.split('@')[0]}`, mentions: [target] });
            }
            return;
        }

        if (command === '.kick' && isAdmin && isGroup) {
            const target = (args[1] || '').replace(/[^0-9]/g, '') + '@s.whatsapp.net';
            const mentioned = msg.message.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
            const finalTarget = mentioned || target;
            
            if (!finalTarget || finalTarget === '@s.whatsapp.net') {
                return await sock.sendMessage(from, { text: 'Tag atau masukkan nomor!' });
            }
            
            await sock.groupParticipantsUpdate(from, [finalTarget], 'remove');
            await sock.sendMessage(from, { text: `✅ Berhasil kick @${finalTarget.split('@')[0]}`, mentions: [finalTarget] });
            return;
        }

        if (command === '.blacklist' && isAdmin) {
            const target = (args[1] || '').replace(/[^0-9]/g, '') + '@s.whatsapp.net';
            if (!args[1]) return await sock.sendMessage(from, { text: 'Tag atau masukkan nomor!' });
            blacklist.add(target);
            await sock.sendMessage(from, { text: `🚫 @${target.split('@')[0]} telah di blacklist.`, mentions: [target] });
            return;
        }

        if (command === '.joki') {
            if (args.length >= 3) {
                const name = args[1];
                const amount = parseInt(args[2]);
                if (!isNaN(amount)) {
                    const estHours = Math.ceil(amount / 5);
                    activeJoki.set(from, { name, target: args[2], est: estHours, paid: false });
                    const jokiMsg = `✅ *PESANAN DITERIMA*\n\n` +
                                    `👤 *Customer:* ${name}\n` +
                                    `💰 *Total Joki:* ${amount}K\n\n` +
                                    `Hallo Customer *ANTC STORE* mohon tunggu ya admin sedang membalas chat yang lain.\n\n` +
                                    `👇 *Langkah Pembayaran:* \n` +
                                    `Silahkan ketik *.qris* dan bayar sesuai nominal joki anda.\n` +
                                    `Jika sudah, kirimkan bukti transfer (SS) ke sini. ✨`;
                    
                    try {
                        await sock.sendMessage(from, { 
                            image: { url: './antc.png' }, 
                            caption: jokiMsg 
                        });
                    } catch (e) {
                        await sock.sendMessage(from, { text: jokiMsg });
                    }
                }
            } else {
                await sock.sendMessage(from, { text: 'Format: .joki [nama] [jumlah]' });
            }
            return;
        }

        if (command === '.accepted' && isAdmin) {
            const data = activeJoki.get(from);
            if (data) {
                data.paid = true;
                activeJoki.set(from, data);
                await sock.sendMessage(from, { text: `✅ *PAYMENT BERHASIL*\n\nSilahkan tunggu konfirmasi staf. Pembayaran telah diterima dan pesanan sedang diteruskan ke tim joki. 🚀` });
                // Automatically show .acc details
                const accResponse = `📌 *PERHATIAN SELAMA PROSES JOKI*\n━━━━━━━━━━━━━━\n⚠️ Selama pengerjaan, mohon jangan login atau memainkan akun.\n🚫 Apabila terjadi login/tabrakan akun sebanyak 5 kali, maka jasa joki kami anggap selesai tanpa komplain lebih lanjut.\n━━━━━━━━━━━━━━\n🧾 *DETAIL AKUN*\n👤 Atas Nama Akun: ${data.name}\n🔐 Username: (Isi Sendiri)\n💰 Progress Target: ${data.target}\n📊 Status: 🔄 Sedang Diproses\n🎯 Mode: 🛠️ Tergantung Admin\n⏱️ Estimasi: ⏳ ${data.est} Jam Selesai\n━━━━━━━━━━━━━━\n🏪 *ANTC STORE*\nTerima kasih sudah mempercayakan akun Anda kepada kami 💙\nKeamanan & kepuasan customer adalah prioritas utama kami 🔥`;
                try {
                    await sock.sendMessage(from, { 
                        image: { url: './antc.png' }, 
                        caption: accResponse 
                    });
                } catch (e) {
                    await sock.sendMessage(from, { text: accResponse });
                }
                // Keep data active until .jokidone
            } else {
                await sock.sendMessage(from, { text: 'Tidak ada data joki aktif untuk dikonfirmasi.' });
            }
            return;
        }

        if (command === '.acc') {
            const data = activeJoki.get(from);
            if (data) {
                const response = `📌 *PERHATIAN SELAMA PROSES JOKI*\n━━━━━━━━━━━━━━\n⚠️ Selama pengerjaan, mohon jangan login atau memainkan akun.\n🚫 Apabila terjadi login/tabrakan akun sebanyak 5 kali, maka jasa joki kami anggap selesai tanpa komplain lebih lanjut.\n━━━━━━━━━━━━━━\n🧾 *DETAIL AKUN*\n👤 Atas Nama Akun: ${data.name}\n🔐 Username: (Isi Sendiri)\n💰 Progress Target: ${data.target}\n📊 Status: 🔄 Sedang Diproses\n🎯 Mode: 🛠️ Tergantung Admin\n⏱️ Estimasi: ⏳ ${data.est} Jam Selesai\n━━━━━━━━━━━━━━\n🏪 *ANTC STORE*\nTerima kasih sudah mempercayakan akun Anda kepada kami 💙\nKeamanan & kepuasan customer adalah prioritas utama kami 🔥`;
                try {
                    await sock.sendMessage(from, { 
                        image: { url: './antc.png' }, 
                        caption: response 
                    });
                } catch (e) {
                    await sock.sendMessage(from, { text: response });
                }
                activeJoki.delete(from);
            } else {
                await sock.sendMessage(from, { text: 'Tidak ada data joki di grup ini.' });
            }
            return;
        }

        if (command === '.jokidone' && isAdmin) {
            const data = activeJoki.get(from);
            const name = data?.name || args[1] || 'Pelanggan';
            const amount = data?.target || args[2] || '0';
            
            const doneText = `🎊 *JOKI SELESAI - ANTC STORE* 🎊\n\n` +
                           `Alhamdulillah! Pesanan joki Anda telah berhasil diselesaikan dengan sukses oleh tim kami. 🚀\n\n` +
                           `🧾 *DETAIL PESANAN:*\n` +
                           `👤 *Atas Nama:* ${name}\n` +
                           `💰 *Total Nominal:* ${amount}K\n` +
                           `📊 *Status:* ✅ *COMPLETED*\n\n` +
                           `Terima kasih banyak telah mempercayakan akun Anda kepada *ANTC STORE*. Kepuasan Anda adalah prioritas kami! ✨\n\n` +
                           `Jangan lupa order lagi ya Kak, dan berikan testimoni terbaik Anda! 🔥🦾\n\n` +
                           `🏪 *ANTC STORE - Professional Service*`;
            
            try {
                await sock.sendMessage(from, { 
                    image: { url: './antc.png' }, 
                    caption: doneText 
                });
            } catch (e) {
                await sock.sendMessage(from, { text: doneText });
            }
            activeJoki.delete(from);
            return;
        }

        if (command === '.emergencystop' && isAdmin) {
            botStatus = false;
            activeJoki.clear();
            warnings.clear();
            await sock.sendMessage(from, { text: `🚨 *EMERGENCY STOP DIAKTIFKAN* 🚨\n\n⚠️ *Bot telah dinonaktifkan secara total!*\n🔄 Semua antrian joki, cooldown spam, dan database sementara telah dihapus.\n\nKetik *.setatus on* untuk menghidupkan kembali bot.` });
            return;
        }

        if (command === '.jg' && isAdmin) {
            const target = (args[1] || '').replace(/[^0-9]/g, '') + '@s.whatsapp.net';
            if (!args[1]) return await sock.sendMessage(from, { text: 'Tag atau masukkan nomor!' });
            jgNumbers.add(target);
            await sock.sendMessage(from, { text: `🛡️ *JG SYSTEM UPDATED*\n✅ Nomor @${target.split('@')[0]} telah masuk daftar Jangan Ganggu.`, mentions: [target] });
            return;
        }

        if (command === '.resetpmacc' && isAdmin) {
            jgNumbers.clear();
            await sock.sendMessage(from, { text: `🔄 *DATABASE PRIVASI DIRESET* 🔄\n\n✅ *Berhasil!* Semua nomor dalam daftar Jangan Ganggu (JG) telah dihapus.\n\nBot akan kembali memberikan auto-reply ke semua chat pribadi Admin. 🛡️` });
            return;
        }

        if (command === '.pmacc' && isAdmin) {
            jgNumbers.add(from);
            jgNumbers.add(sender);
            const pmAccText = `🛡️ *SISTEM PRIVASI DIAKTIFKAN* 🛡️\n\n` +
                               `✅ *Berhasil!* Bot telah menerima perintah dan menambahkan nomor ini ke database.\n\n` +
                               `Sekarang, bot *TIDAK AKAN* mengganggu atau membalas chat pribadi di nomor ini secara otomatis. Selamat beraktivitas Admin/Owner! 👑\n\n` +
                               `*ANTC STORE - Professional Service* ⚡`;
            await sock.sendMessage(from, { text: pmAccText });
            return;
        }

        if (command === '.akses' && args[1] === 'admin' && isAdmin) {
            const target = (args[2] || '').replace(/[^0-9]/g, '') + '@s.whatsapp.net';
            if (!args[2]) return await sock.sendMessage(from, { text: 'Tag atau masukkan nomor!' });
            admins.add(target);
            await sock.sendMessage(from, { text: `Hallo @${target.split('@')[0]}\nAnda telah ditambahkan ke Admin akses 👑\nSilahkan /help buat melihat cmd yang bisa anda akses jangan di salahgunakan.\n\nSelamat menikmati fitur bot ANTC STORE`, mentions: [target] });
            return;
        }

        if (command === '.antx' && isAdmin && isGroup) {
            const words = q.split(',').map(w => w.trim());
            const cfg = monitoredGroups.get(from) || { antiToxic: false, badWords: [] };
            cfg.antiToxic = true;
            cfg.badWords = words;
            monitoredGroups.set(from, cfg);
            await sock.sendMessage(from, { text: `🛡️ *ANTI TOXIC AKTIF*\n🚫 Kata Dilarang: ${words.join(', ')}` });
            return;
        }

        if (command === '.videoat' && isAdmin && isGroup) {
            const cfg = monitoredGroups.get(from) || { video: false };
            cfg.video = args[1]?.toLowerCase() === 'on';
            monitoredGroups.set(from, cfg);
            await sock.sendMessage(from, { text: `🛡️ *ANTI VIDEO:* ${cfg.video ? 'ON' : 'OFF'}` });
            return;
        }

        if (command === '.fotoat' && isAdmin && isGroup) {
            const cfg = monitoredGroups.get(from) || { photo: false };
            cfg.photo = args[1]?.toLowerCase() === 'on';
            monitoredGroups.set(from, cfg);
            await sock.sendMessage(from, { text: `🛡️ *ANTI FOTO:* ${cfg.photo ? 'ON' : 'OFF'}` });
            return;
        }

        if (command === '.linkat' && isAdmin && isGroup) {
            const cfg = monitoredGroups.get(from) || { link: false };
            cfg.link = args[1]?.toLowerCase() === 'on';
            monitoredGroups.set(from, cfg);
            await sock.sendMessage(from, { text: `🛡️ *ANTI LINK:* ${cfg.link ? 'ON' : 'OFF'}` });
            return;
        }

        if (command === '.grupmonitor' && isAdmin && isGroup) {
            const cfg = monitoredGroups.get(from) || {};
            await sock.sendMessage(from, { text: `📊 *STATUS MONITOR GRUP*\n\n📹 Anti Video: ${cfg.video ? '✅' : '❌'}\n📷 Anti Foto: ${cfg.photo ? '✅' : '❌'}\n🔗 Anti Link: ${cfg.link ? '✅' : '❌'}\n☣️ Anti Toxic: ${cfg.antiToxic ? '✅' : '❌'}\n📝 Kata: ${cfg.badWords?.join(', ') || '-'}` });
            return;
        }

        if (command === '.banned' && isAdmin) {
            const target = (args[1] || '').replace(/[^0-9]/g, '') + '@s.whatsapp.net';
            if (!args[1]) return await sock.sendMessage(from, { text: 'Tag atau masukkan nomor!' });
            blacklist.add(target);
            await sock.sendMessage(from, { text: `🚫 @${target.split('@')[0]} telah di banned.`, mentions: [target] });
            return;
        }

        if (command === '.mute' && isAdmin && isGroup) {
            const target = (args[1] || '').replace(/[^0-9]/g, '') + '@s.whatsapp.net';
            if (!args[1]) return await sock.sendMessage(from, { text: 'Tag atau masukkan nomor!' });
            const duration = parseInt(args[2]) || 60; // default 60 mins
            mutedUsers.set(target, Date.now() + (duration * 60 * 1000));
            await sock.sendMessage(from, { text: `🔇 @${target.split('@')[0]} di mute selama ${duration} menit.`, mentions: [target] });
            return;
        }

        if (command === '.beli' || command === '.buat') {
            await sock.sendMessage(from, { text: `🤖 *LAYANAN JASA BOT*\n\nSilahkan hubungi owner untuk pembelian atau pembuatan bot.\nWA: wa.me/6281330032894` });
            return;
        }

        if (isCmd && !msg.key.fromMe) {
            const handledCmds = ['.help', '/help', '/dasbord', '/admin', '/jasabot', '.setatus', '.news', '.warning', '.akses', '.pmacc', '.joki', '.acc', '.ping', '.jg', '.kick', '.blacklist', '.banned', '.mute', '.grupmonitor', '.videoat', '.fotoat', '.linkat', '.antx', '.jokidone', '.accepted', '.emergencystop'];
            if (!handledCmds.some(c => command.startsWith(c))) {
                await sock.sendMessage(from, { text: `❌ *CMD ANDA SALAH*\nKetik */help* untuk cara order atau */Dasbord* untuk fitur lain.` });
            }
        }
    });
}

startBot();
