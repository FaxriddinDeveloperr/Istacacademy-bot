# 📚 Ta'lim Telegram Boti (PostgreSQL)

O'quvchilar uchun darslar, vazifalar va DTM testlarini boshqaruvchi Telegram bot. Admin panel xuddi shu botning ichida `/admin` buyrug'i orqali ishlaydi (alohida web kerakmas). Ma'lumotlar **PostgreSQL** bazasida saqlanadi.

## 🚀 Imkoniyatlar

### Foydalanuvchi qismi
- ✅ Ro'yxatdan o'tish (Ism, Familiya, Telefon)
- 📚 **Vazifalar** — darslarga bo'lingan PDF vazifalar, javoblar testi, batafsil natija
- 📝 **DTM** — DTM variantlari, javoblar testi, natija tahlili
- 🎓 **Sertifikat** — hozircha placeholder ("Hali sertifikat yo'q")

### Admin panel (`/admin`)
- 📚 Darslar (qo'shish/tahrirlash/o'chirish/faollashtirish)
- 📋 Vazifalar (har bir darsda)
- 📝 DTM variantlar
- 👥 Foydalanuvchilar (ro'yxat, paginatsiya)
- 📊 Statistika
- 📢 Broadcast — barcha foydalanuvchilarga xabar yuborish

---

## 🛠 Stack

- [Node.js](https://nodejs.org) (≥18)
- [Telegraf](https://telegraf.js.org) — Telegram bot framework
- [pg](https://node-postgres.com) — PostgreSQL client (connection pool)
- [dotenv](https://github.com/motdotla/dotenv) — environment variables
- [uuid](https://github.com/uuidjs/uuid) — fayl nomlari uchun

---

## 📦 O'rnatish

### 1. Loyihani klon qiling va papkaga kiring
```bash
cd matemBot
```

### 2. Dependency'larni o'rnating
```bash
npm install
```

### 3. PostgreSQL bazani tayyorlang

**Mahalliy (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo -u postgres psql
```

Psql ichida:
```sql
CREATE DATABASE matem_bot;
CREATE USER matem_user WITH PASSWORD 'kuchli_parol';
GRANT ALL PRIVILEGES ON DATABASE matem_bot TO matem_user;
\c matem_bot
GRANT ALL ON SCHEMA public TO matem_user;
\q
```

**Cloud (Render / Supabase / Neon / Railway):**
Provayder dashboardidan PostgreSQL instance yarating va `DATABASE_URL`'ni nusxa oling. Ko'p cloud providerlar `?sslmode=require` parametri talab qiladi.

### 4. `.env` faylini sozlang
`.env.example` faylidan nusxa oling:
```bash
cp .env.example .env
```

Va o'z qiymatlaringizni kiriting:
```env
BOT_TOKEN=123456:ABC-DEF...
ADMIN_IDS=123456789,987654321
DATABASE_URL=postgresql://matem_user:kuchli_parol@localhost:5432/matem_bot
PGSSL=false
```

> Cloud uchun: `DATABASE_URL=postgresql://user:pass@host:5432/db?sslmode=require`
> Agar provayder self-signed sertifikat ishlatsa — `PGSSL=true` qilib qo'ying.

### 5. Database migratsiyasini bajaring (jadval yaratish)
```bash
npm run migrate
```

> Bu qadam ixtiyoriy — bot birinchi marta ishga tushganda ham migration avtomatik bajariladi.

### 6. Botni ishga tushiring
**Production:**
```bash
npm start
```

**Development (avto-restart bilan):**
```bash
npm run dev
```

---

## 🌐 Serverga deploy qilish

### systemd service namunasi (`/etc/systemd/system/matem-bot.service`)
```ini
[Unit]
Description=Matem Telegram Bot
After=network.target postgresql.service

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/matemBot
ExecStart=/usr/bin/node /home/ubuntu/matemBot/src/index.js
Restart=always
RestartSec=5
EnvironmentFile=/home/ubuntu/matemBot/.env

[Install]
WantedBy=multi-user.target
```

So'ng:
```bash
sudo systemctl daemon-reload
sudo systemctl enable matem-bot
sudo systemctl start matem-bot
sudo systemctl status matem-bot
sudo journalctl -u matem-bot -f   # loglarni kuzatish
```

### PM2 bilan
```bash
npm install -g pm2
pm2 start src/index.js --name matem-bot
pm2 save
pm2 startup
```

---

## 🔑 Telegram Bot tokenni qanday olish

1. Telegram'da [@BotFather](https://t.me/BotFather) bilan suhbat boshlang
2. `/newbot` buyrug'ini yuboring
3. Bot uchun nom va username tanlang
4. BotFather sizga token beradi (masalan: `123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11`)
5. Bu tokenni `.env` fayldagi `BOT_TOKEN`'ga yozing

---

## 🆔 Admin ID'ni qanday olish

1. Telegram'da [@userinfobot](https://t.me/userinfobot) ga `/start` yuboring
2. Bot sizga ID raqamini beradi (masalan: `123456789`)
3. Bu ID'ni `.env` fayldagi `ADMIN_IDS`'ga yozing
4. Bir nechta admin kerak bo'lsa, vergul bilan ajrating: `ADMIN_IDS=123,456,789`

> ⚠️ **Xavfsizlik:** Faqat bu ro'yxatdagi foydalanuvchilar `/admin` orqali kira oladi. Boshqa hech kim `/admin` yozsa, bot **umuman javob bermaydi** — go'yo bunday buyruq yo'q.

---

## 📁 Loyiha tuzilishi

```
matemBot/
├── src/
│   ├── index.js              # Entry point + pool healthcheck + graceful shutdown
│   ├── bot.js                # Telegraf bot va barcha handler'lar
│   ├── constants/
│   │   └── index.js          # Konstantalar
│   ├── database/
│   │   ├── db.js             # pg Pool (PostgreSQL ulanish)
│   │   ├── migrations.js     # PostgreSQL DDL
│   │   └── queries.js        # Async query'lar
│   ├── handlers/
│   │   ├── start.js          # /start
│   │   ├── menu.js
│   │   ├── tasks.js          # Vazifalar bo'limi
│   │   ├── dtm.js            # DTM bo'limi
│   │   ├── certificate.js
│   │   └── admin/
│   │       ├── index.js
│   │       ├── lessons.js
│   │       ├── tasks.js
│   │       ├── dtm.js
│   │       ├── users.js
│   │       └── stats.js
│   ├── scenes/
│   │   ├── registration.js
│   │   ├── taskAnswer.js
│   │   ├── dtmAnswer.js
│   │   └── admin/
│   │       ├── addLesson.js
│   │       ├── editLesson.js
│   │       ├── addTask.js
│   │       ├── editTask.js
│   │       ├── addDtm.js
│   │       ├── editDtm.js
│   │       └── broadcast.js
│   ├── keyboards/
│   │   └── index.js
│   ├── middlewares/
│   │   ├── auth.js
│   │   └── adminOnly.js
│   └── utils/
│       ├── checkAnswers.js
│       ├── validators.js
│       ├── downloadPdf.js
│       └── logger.js
├── uploads/                  # PDF zaxira nusxalari
├── .env.example
├── .env                      # (siz yaratasiz)
├── .gitignore
├── package.json
└── README.md
```

---

## 🤖 Buyruqlar

| Buyruq | Kim uchun | Tavsifi |
|--------|-----------|---------|
| `/start` | Hamma | Botni ishga tushirish, ro'yxatdan o'tish |
| `/admin` | Faqat ADMIN_IDS | Admin panelni ochish |

---

## 📊 Database schema

PostgreSQL'da quyidagi jadvallar yaratiladi:

- `users` — foydalanuvchilar (BIGSERIAL id, telegram_id UNIQUE)
- `lessons` — darslar (is_active SMALLINT 0/1)
- `tasks` — vazifalar (lessons'ga FK, ON DELETE CASCADE)
- `dtm_variants` — DTM variantlari
- `results` — har bir urinish natijasi (users'ga FK)

Vaqt maydonlari `TIMESTAMPTZ` formatida — vaqt zonasi bilan saqlanadi.

Indekslar: `users(telegram_id)`, `lessons(order_num)`, `tasks(lesson_id)`, `tasks(lesson_id, order_num)`, `dtm_variants(order_num)`, `results(user_id)`, `results(type, reference_id)`.

---

## 🧪 Javoblarni qabul qilish formati

Foydalanuvchi javoblarni quyidagi formatlarda yuborishi mumkin:
- `abcda` (qisqa format)
- `1a2b3c4d5a` (raqamlar bilan)
- `a b c d a` (bo'sh joy bilan)

Bot avtomatik tozalab, faqat `a/b/c/d` harflarini oladi.

---

## 🔒 Xavfsizlik

- Admin paneliga **faqat `.env`dagi `ADMIN_IDS`** kira oladi
- Noma'lum foydalanuvchi `/admin` yozsa — bot **hech qanday javob bermaydi**
- `.env` fayl `.gitignore`ga qo'shilgan
- PDF fayllar `file_id` orqali yuboriladi (qayta yuklash shart emas)
- DB connection pool (10 ta connection, idle timeout 30s)

---

## 🐛 Muammolarni hal qilish

### "❌ PostgreSQL ulanib bo'lmadi"
- `DATABASE_URL` to'g'ri ekanligini tekshiring
- PostgreSQL server ishga tushganligini tekshiring (`sudo systemctl status postgresql`)
- Foydalanuvchi va parol mos kelishini tekshiring (`psql -U user -d db -h host`)

### "SSL required" yoki "no pg_hba.conf entry"
- Cloud DB ishlatayotgan bo'lsangiz `?sslmode=require` qo'shing
- Yoki `.env`'da `PGSSL=true` qilib qo'ying

### "BOT_TOKEN .env faylida ko'rsatilmagan!"
- `.env` fayl mavjud va `BOT_TOKEN=...` to'g'ri yozilganligini tekshiring

### Bot javob bermayapti
- Token to'g'ri ekanligini tekshiring
- DB ulanishi ishlayotganini tekshiring
- `console`'da xato yo'qligini tekshiring

---

## 📝 License

ISC
