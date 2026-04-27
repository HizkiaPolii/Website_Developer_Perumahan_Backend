import prisma from "./src/utils/database";
import bcrypt from "bcrypt";

async function migratePasswords() {
  try {
    const users = await prisma.user.findMany();
    
    console.log(`Ditemukan ${users.length} user`);
    
    for (const user of users) {
      // Cek apakah password sudah di-hash (bcrypt hash dimulai dengan $2a, $2b, atau $2y)
      if (!user.password.startsWith("$2a") && !user.password.startsWith("$2b") && !user.password.startsWith("$2y")) {
        console.log(`🔄 Hashing password untuk user: ${user.email}`);
        const hashedPassword = await bcrypt.hash(user.password, 10);
        
        await prisma.user.update({
          where: { id: user.id },
          data: { password: hashedPassword },
        });
        
        console.log(`✅ Password di-hash untuk: ${user.email}`);
      } else {
        console.log(`⏭️  Password sudah di-hash untuk: ${user.email}`);
      }
    }
    
    console.log("\n✅ Migration selesai!");
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

migratePasswords();
