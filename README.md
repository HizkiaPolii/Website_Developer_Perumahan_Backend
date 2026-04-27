# Backend Developer Perumahan

Backend untuk aplikasi manajemen perumahan menggunakan Express.js, TypeScript, dan PostgreSQL dengan Prisma ORM.

## 🚀 Teknologi yang Digunakan

- **Express.js** - Web framework
- **TypeScript** - Type safety
- **PostgreSQL** - Database
- **Prisma** - ORM
- **CORS** - Cross-origin resource sharing
- **dotenv** - Environment variables

## 📋 Prasyarat

- Node.js (v16 atau lebih tinggi)
- PostgreSQL (v12 atau lebih tinggi)
- npm atau yarn

## 🔧 Setup

### 1. Clone repository dan install dependencies

```bash
cd backend-developer-perumahan
npm install
```

### 2. Setup Environment Variables

Copy file `.env.example` ke `.env` dan sesuaikan konfigurasi:

```bash
cp .env.example .env
```

Edit `.env` dan isi:

```
DATABASE_URL="postgresql://user:password@localhost:5432/perumahan_db"
PORT=5000
NODE_ENV="development"
FRONTEND_URL="http://localhost:3000"
```

### 3. Setup Database dengan Prisma

```bash
# Generate Prisma Client
npm run prisma:generate

# Jalankan migration
npm run prisma:migrate
```

### 4. Jalankan Development Server

```bash
npm run dev
```

Server akan berjalan di `http://localhost:5000`

## 📁 Struktur Folder

```
src/
├── index.ts              # Main application file
├── controllers/          # Controller logic
├── middleware/           # Custom middleware
├── routes/              # API routes
└── utils/               # Utility functions
prisma/
├── schema.prisma        # Database schema
└── migrations/          # Database migrations
```

## 📝 Scripts Tersedia

- `npm run dev` - Jalankan development server
- `npm run build` - Build untuk production
- `npm start` - Jalankan production server
- `npm run prisma:generate` - Generate Prisma Client
- `npm run prisma:migrate` - Create dan run migrations
- `npm run prisma:studio` - Buka Prisma Studio (GUI)

## 🔌 API Endpoints

### Health Check

```
GET /api/health
```

## 📚 Dokumentasi Lebih Lanjut

- [Prisma Documentation](https://www.prisma.io/docs/)
- [Express.js Documentation](https://expressjs.com/)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)

## 👤 Author

Developer Perumahan

## 📄 License

ISC
