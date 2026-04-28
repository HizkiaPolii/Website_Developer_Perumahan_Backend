import prisma from "./database";

interface ActivityLogData {
  userId: number;
  action: string;
  details?: string;
}

/**
 * Log activity to database
 * @param userId ID of user performing the action
 * @param action Action type (e.g., "LOGIN", "CREATE_USER", "APPROVE_BOOKING")
 * @param details Additional details about the action (optional)
 */
export const logActivity = async (
  userId: number,
  action: string,
  details?: string
) => {
  try {
    await prisma.activityLog.create({
      data: {
        userId,
        action,
        details: details || null,
      },
    });
  } catch (error) {
    // Log error but don't fail the main operation
    console.error("❌ Error logging activity:", error);
  }
};

/**
 * Get user info from request (from JWT token in middleware)
 * Extract userId and role from request object
 */
export const getUserIdFromRequest = (req: any): number => {
  return req.user?.id || 0;
};

/**
 * Create detailed activity details string
 */
export const createActivityDetails = (action: string, data: any): string => {
  const details: string[] = [];

  switch (action) {
    case "LOGIN":
      details.push(`Email: ${data?.email}`);
      break;
    case "REGISTER":
      details.push(`Email: ${data?.email}`);
      details.push(`Name: ${data?.name}`);
      break;
    case "CREATE_USER":
      details.push(`Email: ${data?.email}`);
      details.push(`Name: ${data?.name}`);
      details.push(`Role: ${data?.role}`);
      break;
    case "UPDATE_USER":
      details.push(`Updated User ID: ${data?.userId}`);
      if (data?.name) details.push(`Name: ${data?.name}`);
      if (data?.email) details.push(`Email: ${data?.email}`);
      if (data?.role) details.push(`Role: ${data?.role}`);
      break;
    case "DELETE_USER":
      details.push(`Deleted User ID: ${data?.userId}`);
      break;
    case "CREATE_BOOKING":
      details.push(`Unit ID: ${data?.unitId}`);
      details.push(`User ID: ${data?.userId}`);
      break;
    case "APPROVE_BOOKING":
      details.push(`Booking ID: ${data?.bookingId}`);
      break;
    case "REJECT_BOOKING":
      details.push(`Booking ID: ${data?.bookingId}`);
      break;
    case "CANCEL_BOOKING":
      details.push(`Booking ID: ${data?.bookingId}`);
      break;
    case "CREATE_UNIT":
      details.push(`Unit Name: ${data?.name}`);
      details.push(`Location: ${data?.location}`);
      details.push(`Price: ${data?.price}`);
      break;
    case "UPDATE_UNIT":
      details.push(`Unit ID: ${data?.unitId}`);
      if (data?.name) details.push(`Name: ${data?.name}`);
      if (data?.status) details.push(`Status: ${data?.status}`);
      break;
    case "DELETE_UNIT":
      details.push(`Unit ID: ${data?.unitId}`);
      break;
    default:
      details.push(`Additional Info: ${JSON.stringify(data)}`);
  }

  return details.join(" | ");
};
