import prisma from "./src/utils/database";

async function testDB() {
  try {
    console.log("🔍 Checking users in database...");
    const users = await prisma.user.findMany();
    console.log("✅ Users found:", users.length);
    console.log(JSON.stringify(users, null, 2));
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

testDB();
