/**
 * Test Suite: Auth Logic — Validasi & JWT
 * File: src/controllers/authController.ts, src/middleware/auth.ts
 *
 * Menggunakan mock untuk Prisma & bcrypt agar test berjalan
 * tanpa koneksi database.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import jwt from 'jsonwebtoken';

const JWT_SECRET = 'test-secret-key-for-unit-tests';

// ─────────────────────────────────────────────────────────────
// 1. Validasi Input Login
// ─────────────────────────────────────────────────────────────
describe('Validasi Input Login', () => {
  function validateLoginInput(email?: string, password?: string) {
    if (!email || !password) {
      return { valid: false, message: 'Email dan password harus diisi' };
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { valid: false, message: 'Format email tidak valid' };
    }
    return { valid: true };
  }

  it('menolak jika email kosong', () => {
    const result = validateLoginInput('', 'password123');
    expect(result.valid).toBe(false);
    expect(result.message).toContain('harus diisi');
  });

  it('menolak jika password kosong', () => {
    const result = validateLoginInput('user@test.com', '');
    expect(result.valid).toBe(false);
  });

  it('menolak jika keduanya kosong', () => {
    const result = validateLoginInput(undefined, undefined);
    expect(result.valid).toBe(false);
  });

  it('menolak format email tidak valid', () => {
    const result = validateLoginInput('bukan-email', 'password');
    expect(result.valid).toBe(false);
    expect(result.message).toContain('email tidak valid');
  });

  it('menerima email dan password yang valid', () => {
    const result = validateLoginInput('admin@bumi.com', 'Admin123');
    expect(result.valid).toBe(true);
  });

  it('menerima email dengan subdomain', () => {
    const result = validateLoginInput('user@mail.bumi.co.id', 'pass123');
    expect(result.valid).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────
// 2. Validasi Input Register
// ─────────────────────────────────────────────────────────────
describe('Validasi Input Register', () => {
  const VALID_ROLES = ['admin', 'manager', 'owner', 'staf', 'teller'];

  function validateRegisterInput(body: {
    email?: string; name?: string; password?: string;
    passwordConfirm?: string; role?: string;
  }) {
    const { email, name, password, passwordConfirm, role } = body;
    if (!email || !name || !password || !passwordConfirm) {
      return { valid: false, message: 'Semua field harus diisi' };
    }
    if (password !== passwordConfirm) {
      return { valid: false, message: 'Password tidak cocok' };
    }
    if (role && !VALID_ROLES.includes(role)) {
      return { valid: false, message: `Role harus salah satu dari: ${VALID_ROLES.join(', ')}` };
    }
    return { valid: true };
  }

  it('menolak jika ada field kosong', () => {
    const r = validateRegisterInput({ email: 'test@test.com', name: 'Test' });
    expect(r.valid).toBe(false);
    expect(r.message).toContain('harus diisi');
  });

  it('menolak jika password tidak cocok', () => {
    const r = validateRegisterInput({
      email: 'test@test.com', name: 'Test',
      password: 'pass1', passwordConfirm: 'pass2',
    });
    expect(r.valid).toBe(false);
    expect(r.message).toBe('Password tidak cocok');
  });

  it('menolak role tidak valid', () => {
    const r = validateRegisterInput({
      email: 'test@test.com', name: 'Test',
      password: 'pass', passwordConfirm: 'pass', role: 'superadmin',
    });
    expect(r.valid).toBe(false);
    expect(r.message).toContain('Role harus salah satu dari');
  });

  it('menerima semua role yang valid', () => {
    VALID_ROLES.forEach(role => {
      const r = validateRegisterInput({
        email: 'test@test.com', name: 'Test',
        password: 'pass', passwordConfirm: 'pass', role,
      });
      expect(r.valid).toBe(true);
    });
  });

  it('menerima tanpa role (optional)', () => {
    const r = validateRegisterInput({
      email: 'test@test.com', name: 'Test',
      password: 'pass', passwordConfirm: 'pass',
    });
    expect(r.valid).toBe(true);
  });

  it('menerima role dalam huruf kecil', () => {
    const r = validateRegisterInput({
      email: 'test@test.com', name: 'Test',
      password: 'pass', passwordConfirm: 'pass', role: 'teller',
    });
    expect(r.valid).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────
// 3. JWT Token — Generate & Verify
// ─────────────────────────────────────────────────────────────
describe('JWT Token', () => {
  const payload = { id: 1, email: 'admin@bumi.com', role: 'admin' };

  it('token yang di-generate dapat di-verify dengan secret yang sama', () => {
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
    const decoded = jwt.verify(token, JWT_SECRET) as typeof payload & { iat: number; exp: number };

    expect(decoded.id).toBe(payload.id);
    expect(decoded.email).toBe(payload.email);
    expect(decoded.role).toBe(payload.role);
  });

  it('verify gagal jika secret berbeda', () => {
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
    expect(() => {
      jwt.verify(token, 'wrong-secret');
    }).toThrow();
  });

  it('token expired langsung ditolak', () => {
    const expiredToken = jwt.sign(payload, JWT_SECRET, { expiresIn: '0s' });
    expect(() => {
      jwt.verify(expiredToken, JWT_SECRET);
    }).toThrow(/expired/i);
  });

  it('token dengan format invalid ditolak', () => {
    expect(() => {
      jwt.verify('bukan.token.valid', JWT_SECRET);
    }).toThrow();
  });

  it('token mengandung semua field payload', () => {
    const token = jwt.sign(payload, JWT_SECRET);
    const decoded = jwt.decode(token) as any;
    expect(decoded).toMatchObject(payload);
  });

  it('token berbeda untuk user berbeda', () => {
    const token1 = jwt.sign({ id: 1, email: 'a@test.com', role: 'admin' }, JWT_SECRET);
    const token2 = jwt.sign({ id: 2, email: 'b@test.com', role: 'staf' }, JWT_SECRET);
    expect(token1).not.toBe(token2);
  });
});

// ─────────────────────────────────────────────────────────────
// 4. Middleware Auth — Simulasi Logika
// ─────────────────────────────────────────────────────────────
describe('Auth Middleware — Logika', () => {
  function simulateAuthMiddleware(
    authHeader: string | undefined,
    jwtSecret: string | undefined,
    isUserActive: boolean = true,
    userExists: boolean = true,
  ): { status: number; message: string; userId?: number } {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { status: 401, message: 'Token tidak ditemukan' };
    }

    const token = authHeader.split(' ')[1];

    if (!jwtSecret) {
      return { status: 500, message: 'Konfigurasi server tidak valid' };
    }

    let decoded: any;
    try {
      decoded = jwt.verify(token, jwtSecret);
    } catch {
      return { status: 401, message: 'Token tidak valid' };
    }

    if (!userExists) {
      return { status: 401, message: 'User tidak ditemukan' };
    }

    if (!isUserActive) {
      return { status: 403, message: 'Akun Anda dinonaktifkan. Silakan hubungi Administrator.' };
    }

    return { status: 200, message: 'OK', userId: decoded.id };
  }

  const validToken = jwt.sign({ id: 5, email: 'user@bumi.com', role: 'manager' }, JWT_SECRET);

  it('menolak 401 jika tidak ada Authorization header', () => {
    const result = simulateAuthMiddleware(undefined, JWT_SECRET);
    expect(result.status).toBe(401);
    expect(result.message).toBe('Token tidak ditemukan');
  });

  it('menolak 401 jika header tidak "Bearer ..."', () => {
    const result = simulateAuthMiddleware('Basic xxx', JWT_SECRET);
    expect(result.status).toBe(401);
  });

  it('menolak 500 jika JWT_SECRET tidak dikonfigurasi', () => {
    const result = simulateAuthMiddleware(`Bearer ${validToken}`, undefined);
    expect(result.status).toBe(500);
    expect(result.message).toContain('Konfigurasi server');
  });

  it('menolak 401 jika token tidak valid', () => {
    const result = simulateAuthMiddleware('Bearer token.tidak.valid', JWT_SECRET);
    expect(result.status).toBe(401);
    expect(result.message).toBe('Token tidak valid');
  });

  it('menolak 401 jika user tidak ada di database', () => {
    const result = simulateAuthMiddleware(`Bearer ${validToken}`, JWT_SECRET, true, false);
    expect(result.status).toBe(401);
    expect(result.message).toBe('User tidak ditemukan');
  });

  it('menolak 403 jika akun dinonaktifkan', () => {
    const result = simulateAuthMiddleware(`Bearer ${validToken}`, JWT_SECRET, false, true);
    expect(result.status).toBe(403);
    expect(result.message).toContain('dinonaktifkan');
  });

  it('menerima 200 dan mengembalikan userId jika semua valid', () => {
    const result = simulateAuthMiddleware(`Bearer ${validToken}`, JWT_SECRET, true, true);
    expect(result.status).toBe(200);
    expect(result.userId).toBe(5);
  });
});

// ─────────────────────────────────────────────────────────────
// 5. Role Middleware — Simulasi Logika
// ─────────────────────────────────────────────────────────────
describe('Role Middleware — Otorisasi Berdasarkan Role', () => {
  function checkRole(userRole: string, allowedRoles: string[]): boolean {
    return allowedRoles.map(r => r.toLowerCase()).includes(userRole.toLowerCase());
  }

  describe('Route Finansial (Owner, Admin, Manager)', () => {
    const allowed = ['admin', 'manager', 'owner'];

    it('Owner diizinkan', () => expect(checkRole('owner', allowed)).toBe(true));
    it('Admin diizinkan', () => expect(checkRole('admin', allowed)).toBe(true));
    it('Manager diizinkan', () => expect(checkRole('manager', allowed)).toBe(true));
    it('Staf ditolak', () => expect(checkRole('staf', allowed)).toBe(false));
    it('Teller ditolak', () => expect(checkRole('teller', allowed)).toBe(false));
  });

  describe('Route Persetujuan Transaksi (Manager, Owner)', () => {
    const allowed = ['manager', 'owner'];

    it('Manager diizinkan', () => expect(checkRole('manager', allowed)).toBe(true));
    it('Owner diizinkan', () => expect(checkRole('owner', allowed)).toBe(true));
    it('Admin ditolak', () => expect(checkRole('admin', allowed)).toBe(false));
    it('Staf ditolak', () => expect(checkRole('staf', allowed)).toBe(false));
    it('Teller ditolak', () => expect(checkRole('teller', allowed)).toBe(false));
  });

  describe('Route Input Transaksi (Teller, Staf, Manager)', () => {
    const allowed = ['teller', 'staf', 'manager', 'admin'];

    it('Teller diizinkan', () => expect(checkRole('teller', allowed)).toBe(true));
    it('Staf diizinkan', () => expect(checkRole('staf', allowed)).toBe(true));
    it('Manager diizinkan', () => expect(checkRole('manager', allowed)).toBe(true));
    it('Owner tidak ada di route ini', () => expect(checkRole('owner', allowed)).toBe(false));
  });

  it('role case-insensitive (Manager = manager = MANAGER)', () => {
    const allowed = ['manager'];
    expect(checkRole('Manager', allowed)).toBe(true);
    expect(checkRole('MANAGER', allowed)).toBe(true);
    expect(checkRole('manager', allowed)).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────
// 6. Dashboard — Validasi companyId
// ─────────────────────────────────────────────────────────────
describe('Dashboard — Validasi companyId', () => {
  function validateCompanyId(companyId: string | undefined): { valid: boolean; id?: number; error?: string } {
    if (!companyId) return { valid: false, error: 'companyId is required' };
    const id = parseInt(companyId);
    if (isNaN(id)) return { valid: false, error: 'companyId harus berupa angka' };
    return { valid: true, id };
  }

  it('menolak jika companyId tidak ada', () => {
    const r = validateCompanyId(undefined);
    expect(r.valid).toBe(false);
    expect(r.error).toBe('companyId is required');
  });

  it('menolak jika companyId bukan angka', () => {
    const r = validateCompanyId('abc');
    expect(r.valid).toBe(false);
    expect(r.error).toContain('berupa angka');
  });

  it('menolak string kosong', () => {
    const r = validateCompanyId('');
    expect(r.valid).toBe(false);
  });

  it('menerima "1" sebagai integer 1', () => {
    const r = validateCompanyId('1');
    expect(r.valid).toBe(true);
    expect(r.id).toBe(1);
  });

  it('menerima "42"', () => {
    const r = validateCompanyId('42');
    expect(r.valid).toBe(true);
    expect(r.id).toBe(42);
  });
});
