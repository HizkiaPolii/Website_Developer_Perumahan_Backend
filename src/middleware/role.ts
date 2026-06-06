import { Request, Response, NextFunction } from "express";

/**
 * Role-based access control middleware.
 * 
 * Usage: roleMiddleware("admin", "manager")
 * This will only allow users with role "admin" or "manager" to access the route.
 * Role comparison is case-insensitive.
 * 
 * MUST be used AFTER authMiddleware (requires req.user to be set).
 */
export const roleMiddleware = (...allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // req.user is set by authMiddleware from JWT payload: { id, email, role }
    const user = req.user;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Autentikasi diperlukan",
      });
    }

    const userRole = (user.role || "").toLowerCase();
    const allowed = allowedRoles.map((r) => r.toLowerCase());

    if (!allowed.includes(userRole)) {
      console.warn(
        `⛔ RBAC Denied: User ${user.id} (${user.email}, role=${user.role}) tried to access ${req.method} ${req.originalUrl}. Allowed roles: [${allowedRoles.join(", ")}]`
      );

      return res.status(403).json({
        success: false,
        message: `Akses ditolak. Role "${user.role}" tidak diizinkan untuk mengakses resource ini.`,
        requiredRoles: allowedRoles,
      });
    }

    next();
  };
};
