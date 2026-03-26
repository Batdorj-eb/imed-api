# iMED — сервер дээр deploy (API + вэб + админ)

Энэ баримт нь **imed-api** (Express + PostgreSQL), **imed-tech-final** (Vite static), **imed-admin** (Next.js)-ийг нэг VPS дээр ажиллуулах ерөнхий дарааллыг өгнө.

## 1. Урьдчилсан нөхцөл

- Ubuntu 22.04+ (эсвэл төстэй Linux)
- Node.js **20 LTS** (`node -v`)
- PostgreSQL **14+**
- Nginx (reverse proxy)
- PM2 (`npm i -g pm2`) — процесс амьд байлгах

## 2. Сервер дээр сангууд

Жишээ замууд (өөрийн серверт тохируулна):

| Агуулга | Зам (жишээ) |
|--------|----------------|
| API код | `/var/www/imed-api` |
| Вэб `dist` | `/var/www/imed-tech` |
| Админ код | `/var/www/imed-admin` |

Код оруулах: `git pull` эсвэл `scp` / `rsync`.

## 3. PostgreSQL ба API `.env`

```env
PORT=4000
DB_HOST=localhost
DB_PORT=5432
DB_USER=imed
DB_PASSWORD=...
DB_NAME=imed_tech
JWT_SECRET=...
JWT_EXPIRES_IN=8h
MAIL_ENABLED=false
```

**Шинэчлэлт бүрт** (contact төрөл зэрэг): `npm run migrate` заавал ажиллуулна.

```bash
cd /var/www/imed-api
npm ci
npm run build
npm run migrate
pm2 restart imed-api
```

## 4. Вэб (imed-tech-final)

```bash
echo 'VITE_API_URL=https://api.jin-domain.mn/api' > .env.production
npm ci
npm run build
```

`dist/`-ийг Nginx `root` руу хуулна.

## 5. Админ (imed-admin)

```bash
export NEXT_PUBLIC_API_URL=https://api.jin-domain.mn/api
npm ci
npm run build
pm2 start npm --name imed-admin -- start
```

## 6. Шалгах

- `curl -s https://api.../api/health`
- Вэбийн холбоо барих маягт → админ **Санал хүсэлт** → **Холбоо барих**
