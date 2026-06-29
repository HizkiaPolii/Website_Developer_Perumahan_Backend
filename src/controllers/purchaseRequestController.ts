import { Request, Response } from "express";
import prisma from "../utils/database";

// Helper to generate PR Code: PR-YYYY-XXX
const generatePRCode = async (companyId: number): Promise<string> => {
  const year = new Date().getFullYear();
  
  // Count existing PRs for this year
  const count = await prisma.purchaseRequest.count({
    where: {
      companyId,
      createdAt: {
        gte: new Date(year, 0, 1),
        lt: new Date(year + 1, 0, 1),
      },
    },
  });
  
  const seq = String(count + 1).padStart(3, "0");
  return `PR-${year}-${seq}`;
};

// Helper to generate Nota Number: NTA-XXXX
const generateNotaNumber = (): string => {
  return `NTA-${Math.floor(1000 + Math.random() * 9000)}`;
};

// Get all purchase requests with filters
export const getAllPurchaseRequests = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    // Get user's company
    const dbUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { companyId: true, role: true }
    });

    const companyId = dbUser?.companyId || 1;

    const { status, department, searchTerm } = req.query;

    const filters: any = {
      companyId,
    };

    if (status && status !== "All") {
      filters.status = status as string;
    }

    if (department && department !== "All") {
      filters.department = department as string;
    }

    if (searchTerm) {
      const s = String(searchTerm).toLowerCase();
      filters.OR = [
        { item: { contains: s, mode: 'insensitive' } },
        { description: { contains: s, mode: 'insensitive' } },
        { prCode: { contains: s, mode: 'insensitive' } },
        { notaNumber: { contains: s, mode: 'insensitive' } }
      ];
    }

    const requests = await prisma.purchaseRequest.findMany({
      where: filters,
      include: {
        requester: {
          select: {
            id: true,
            name: true,
            role: true,
          }
        }
      },
      orderBy: { createdAt: "desc" },
    });

    // Format requests to match frontend's expected PurchaseRequest format
    const formattedRequests = requests.map(r => ({
      id: r.prCode, // Frontend expects ID to be string representation like "PR-2026-001"
      dbId: r.id,   // DB numerical ID
      item: r.item,
      quantity: r.quantity,
      amount: parseFloat(r.amount.toString()),
      requester: `${r.requester.name} (${r.requester.role})`,
      requesterId: r.requesterId.toString(),
      department: r.department || "-",
      date: new Date(r.createdAt).toLocaleDateString("id-ID", { year: "numeric", month: "2-digit", day: "2-digit" }),
      status: r.status,
      description: r.description,
      notaNumber: r.notaNumber || undefined,
      createdAt: r.createdAt.toISOString(),
      approvedByManager: r.approvedByManager || undefined,
      approvedByManagerAt: r.approvedByManagerAt ? r.approvedByManagerAt.toISOString() : undefined,
      approvedByOwner: r.approvedByOwner || undefined,
      approvedByOwnerAt: r.approvedByOwnerAt ? r.approvedByOwnerAt.toISOString() : undefined,
      rejectedBy: r.rejectedBy || undefined,
      rejectedAt: r.rejectedAt ? r.rejectedAt.toISOString() : undefined,
      rejectionReason: r.rejectionReason || undefined,
    }));

    res.json({
      success: true,
      data: formattedRequests,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Gagal mengambil data pengajuan pengadaan",
      error: error.message,
    });
  }
};

// Get purchase request by prCode or id
export const getPurchaseRequestById = async (req: Request, res: Response) => {
  try {
    const idParam = String(req.params.id); // Can be numerical ID or prCode
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const isNumeric = /^\d+$/.test(idParam);
    const request = isNumeric
      ? await prisma.purchaseRequest.findFirst({
          where: { id: parseInt(idParam) },
          include: {
            requester: {
              select: {
                id: true,
                name: true,
                role: true,
              }
            }
          }
        })
      : await prisma.purchaseRequest.findFirst({
          where: { prCode: idParam },
          include: {
            requester: {
              select: {
                id: true,
                name: true,
                role: true,
              }
            }
          }
        });

    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Pengajuan tidak ditemukan",
      });
    }

    const formatted = {
      id: request.prCode,
      dbId: request.id,
      item: request.item,
      quantity: request.quantity,
      amount: parseFloat(request.amount.toString()),
      requester: `${request.requester.name} (${request.requester.role})`,
      requesterId: request.requesterId.toString(),
      department: request.department || "-",
      date: new Date(request.createdAt).toLocaleDateString("id-ID", { year: "numeric", month: "2-digit", day: "2-digit" }),
      status: request.status,
      description: request.description,
      notaNumber: request.notaNumber || undefined,
      createdAt: request.createdAt.toISOString(),
      approvedByManager: request.approvedByManager || undefined,
      approvedByManagerAt: request.approvedByManagerAt ? request.approvedByManagerAt.toISOString() : undefined,
      approvedByOwner: request.approvedByOwner || undefined,
      approvedByOwnerAt: request.approvedByOwnerAt ? request.approvedByOwnerAt.toISOString() : undefined,
      rejectedBy: request.rejectedBy || undefined,
      rejectedAt: request.rejectedAt ? request.rejectedAt.toISOString() : undefined,
      rejectionReason: request.rejectionReason || undefined,
    };

    res.json({
      success: true,
      data: formatted,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Gagal mengambil detail pengajuan",
      error: error.message,
    });
  }
};

// Create new purchase request
export const createPurchaseRequest = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { item, quantity, amount, department, description } = req.body;

    if (!item || !quantity || !amount || !description) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { companyId: true, name: true, role: true }
    });

    if (!dbUser) {
      return res.status(404).json({ success: false, message: "User tidak ditemukan" });
    }

    const companyId = dbUser.companyId || 1;
    const prCode = await generatePRCode(companyId);

    const request = await prisma.purchaseRequest.create({
      data: {
        prCode,
        item,
        quantity,
        amount: parseFloat(amount.toString()),
        department: department || null,
        description,
        status: "Pending",
        companyId,
        requesterId: userId,
      },
      include: {
        requester: {
          select: {
            id: true,
            name: true,
            role: true,
          }
        }
      }
    });

    const formatted = {
      id: request.prCode,
      dbId: request.id,
      item: request.item,
      quantity: request.quantity,
      amount: parseFloat(request.amount.toString()),
      requester: `${request.requester.name} (${request.requester.role})`,
      requesterId: request.requesterId.toString(),
      department: request.department || "-",
      date: new Date(request.createdAt).toLocaleDateString("id-ID", { year: "numeric", month: "2-digit", day: "2-digit" }),
      status: request.status,
      description: request.description,
      createdAt: request.createdAt.toISOString(),
    };

    res.status(201).json({
      success: true,
      message: "Pengajuan pengadaan berhasil dibuat",
      data: formatted,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Gagal membuat pengajuan pengadaan",
      error: error.message,
    });
  }
};

// Approve manager (Pending -> ACC Manager)
export const approvePurchaseRequestManager = async (req: Request, res: Response) => {
  try {
    const idParam = String(req.params.id); // Can be prCode
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, role: true }
    });

    if (!dbUser) {
      return res.status(404).json({ success: false, message: "User tidak ditemukan" });
    }

    // Accept both uppercase and lowercase roles for flexibility
    const role = dbUser.role.toLowerCase();
    if (role !== "manager" && role !== "owner" && role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Hanya Manager atau Owner/Direktur yang dapat melakukan validasi pengajuan",
      });
    }

    const isNumeric = /^\d+$/.test(idParam);
    const request = isNumeric
      ? await prisma.purchaseRequest.findFirst({ where: { id: parseInt(idParam) } })
      : await prisma.purchaseRequest.findFirst({ where: { prCode: idParam } });

    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Pengajuan tidak ditemukan",
      });
    }

    if (request.status !== "Pending") {
      return res.status(400).json({
        success: false,
        message: "Pengajuan sudah diproses ke tahap selanjutnya atau telah ditolak",
      });
    }

    const notaNumber = generateNotaNumber();

    const updated = await prisma.purchaseRequest.update({
      where: { id: request.id },
      data: {
        status: "ACC Manager",
        notaNumber,
        approvedByManager: dbUser.name,
        approvedByManagerAt: new Date(),
      },
      include: {
        requester: {
          select: {
            id: true,
            name: true,
            role: true,
          }
        }
      }
    });

    const formatted = {
      id: updated.prCode,
      dbId: updated.id,
      item: updated.item,
      quantity: updated.quantity,
      amount: parseFloat(updated.amount.toString()),
      requester: `${updated.requester.name} (${updated.requester.role})`,
      requesterId: updated.requesterId.toString(),
      department: updated.department || "-",
      date: new Date(updated.createdAt).toLocaleDateString("id-ID", { year: "numeric", month: "2-digit", day: "2-digit" }),
      status: updated.status,
      description: updated.description,
      notaNumber: updated.notaNumber || undefined,
      createdAt: updated.createdAt.toISOString(),
      approvedByManager: updated.approvedByManager || undefined,
      approvedByManagerAt: updated.approvedByManagerAt ? updated.approvedByManagerAt.toISOString() : undefined,
    };

    res.json({
      success: true,
      message: "Pengajuan disetujui Manager dan nomor nota diterbitkan",
      data: formatted,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Gagal memproses persetujuan Manager",
      error: error.message,
    });
  }
};

// Approve owner (ACC Manager -> ACC Final)
export const approvePurchaseRequestOwner = async (req: Request, res: Response) => {
  try {
    const idParam = String(req.params.id); // Can be prCode
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, role: true }
    });

    if (!dbUser) {
      return res.status(404).json({ success: false, message: "User tidak ditemukan" });
    }

    const role = dbUser.role.toLowerCase();
    if (role !== "owner" && role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Hanya Owner/Direktur yang dapat memberikan persetujuan akhir",
      });
    }

    const isNumeric = /^\d+$/.test(idParam);
    const request = isNumeric
      ? await prisma.purchaseRequest.findFirst({ where: { id: parseInt(idParam) } })
      : await prisma.purchaseRequest.findFirst({ where: { prCode: idParam } });

    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Pengajuan tidak ditemukan",
      });
    }

    if (request.status !== "ACC Manager") {
      return res.status(400).json({
        success: false,
        message: "Pengajuan harus berstatus ACC Manager sebelum disetujui akhir",
      });
    }

    const updated = await prisma.purchaseRequest.update({
      where: { id: request.id },
      data: {
        status: "ACC Final",
        approvedByOwner: dbUser.name,
        approvedByOwnerAt: new Date(),
      },
      include: {
        requester: {
          select: {
            id: true,
            name: true,
            role: true,
          }
        }
      }
    });

    const formatted = {
      id: updated.prCode,
      dbId: updated.id,
      item: updated.item,
      quantity: updated.quantity,
      amount: parseFloat(updated.amount.toString()),
      requester: `${updated.requester.name} (${updated.requester.role})`,
      requesterId: updated.requesterId.toString(),
      department: updated.department || "-",
      date: new Date(updated.createdAt).toLocaleDateString("id-ID", { year: "numeric", month: "2-digit", day: "2-digit" }),
      status: updated.status,
      description: updated.description,
      notaNumber: updated.notaNumber || undefined,
      createdAt: updated.createdAt.toISOString(),
      approvedByManager: updated.approvedByManager || undefined,
      approvedByManagerAt: updated.approvedByManagerAt ? updated.approvedByManagerAt.toISOString() : undefined,
      approvedByOwner: updated.approvedByOwner || undefined,
      approvedByOwnerAt: updated.approvedByOwnerAt ? updated.approvedByOwnerAt.toISOString() : undefined,
    };

    res.json({
      success: true,
      message: "Persetujuan akhir Direktur berhasil diberikan",
      data: formatted,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Gagal memproses persetujuan Owner",
      error: error.message,
    });
  }
};

// Reject request
export const rejectPurchaseRequest = async (req: Request, res: Response) => {
  try {
    const idParam = String(req.params.id); // Can be prCode
    const { rejectionReason } = req.body;
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, role: true }
    });

    if (!dbUser) {
      return res.status(404).json({ success: false, message: "User tidak ditemukan" });
    }

    const role = dbUser.role.toLowerCase();
    if (role !== "manager" && role !== "owner" && role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Hanya Manager atau Owner/Direktur yang dapat menolak pengajuan",
      });
    }

    const isNumeric = /^\d+$/.test(idParam);
    const request = isNumeric
      ? await prisma.purchaseRequest.findFirst({ where: { id: parseInt(idParam) } })
      : await prisma.purchaseRequest.findFirst({ where: { prCode: idParam } });

    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Pengajuan tidak ditemukan",
      });
    }

    if (request.status === "ACC Final" || request.status === "Tolak") {
      return res.status(400).json({
        success: false,
        message: "Tidak bisa menolak pengajuan yang sudah berstatus ACC Final atau sudah ditolak",
      });
    }

    const updated = await prisma.purchaseRequest.update({
      where: { id: request.id },
      data: {
        status: "Tolak",
        rejectedBy: dbUser.name,
        rejectedAt: new Date(),
        rejectionReason: rejectionReason || "Ditolak tanpa alasan spesifik",
      },
      include: {
        requester: {
          select: {
            id: true,
            name: true,
            role: true,
          }
        }
      }
    });

    const formatted = {
      id: updated.prCode,
      dbId: updated.id,
      item: updated.item,
      quantity: updated.quantity,
      amount: parseFloat(updated.amount.toString()),
      requester: `${updated.requester.name} (${updated.requester.role})`,
      requesterId: updated.requesterId.toString(),
      department: updated.department || "-",
      date: new Date(updated.createdAt).toLocaleDateString("id-ID", { year: "numeric", month: "2-digit", day: "2-digit" }),
      status: updated.status,
      description: updated.description,
      notaNumber: updated.notaNumber || undefined,
      createdAt: updated.createdAt.toISOString(),
      approvedByManager: updated.approvedByManager || undefined,
      approvedByManagerAt: updated.approvedByManagerAt ? updated.approvedByManagerAt.toISOString() : undefined,
      rejectedBy: updated.rejectedBy || undefined,
      rejectedAt: updated.rejectedAt ? updated.rejectedAt.toISOString() : undefined,
      rejectionReason: updated.rejectionReason || undefined,
    };

    res.json({
      success: true,
      message: "Pengajuan berhasil ditolak",
      data: formatted,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Gagal menolak pengajuan",
      error: error.message,
    });
  }
};

// Delete purchase request (Pending or Tolak only, or by Admin)
export const deletePurchaseRequest = async (req: Request, res: Response) => {
  try {
    const idParam = String(req.params.id); // Can be prCode
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    });

    const isNumeric = /^\d+$/.test(idParam);
    const request = isNumeric
      ? await prisma.purchaseRequest.findFirst({ where: { id: parseInt(idParam) } })
      : await prisma.purchaseRequest.findFirst({ where: { prCode: idParam } });

    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Pengajuan tidak ditemukan",
      });
    }

    // Check permissions: only creator can delete if Pending/Tolak, or Admin can delete anything
    const isCreator = request.requesterId === userId;
    const role = dbUser?.role.toLowerCase();
    const isAdmin = role === "admin";

    if (!isCreator && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Anda tidak memiliki wewenang untuk menghapus pengajuan ini",
      });
    }

    if (request.status !== "Pending" && request.status !== "Tolak" && !isAdmin) {
      return res.status(400).json({
        success: false,
        message: "Hanya pengajuan dengan status Pending atau Tolak yang dapat dihapus",
      });
    }

    await prisma.purchaseRequest.delete({
      where: { id: request.id }
    });

    res.json({
      success: true,
      message: "Pengajuan berhasil dihapus",
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Gagal menghapus pengajuan",
      error: error.message,
    });
  }
};
