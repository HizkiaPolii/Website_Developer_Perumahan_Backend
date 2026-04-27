import prisma from "./src/utils/database";
import bcrypt from "bcrypt";

async function main() {
  try {
    // Cek apakah user admin sudah ada
    const existingAdmin = await prisma.user.findUnique({
      where: { email: "admin@perumahan.com" },
    });

    if (existingAdmin) {
      console.log("✅ User admin sudah ada");
      return;
    }

    // Hash password sebelum insert
    const hashedPassword = await bcrypt.hash("admin123", 10);

    // Insert user admin
    const adminUser = await prisma.user.create({
      data: {
        email: "admin@perumahan.com",
        name: "Administrator",
        password: hashedPassword,
        role: "admin",
        phone: "081123456789",
      },
    });

    console.log("✅ User admin berhasil dibuat:");
    console.log(adminUser);
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
