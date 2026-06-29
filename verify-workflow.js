const API_URL = "http://localhost:5000/api";

async function runTests() {
  console.log("🚀 Starting End-to-End Workflow Verification Tests...\n");

  try {
    // 1. Login as Admin
    console.log("🔑 [1/9] Logging in as Admin...");
    const adminLoginRes = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "admin@perumahan.com", password: "admin123" }),
    });
    
    if (!adminLoginRes.ok) {
      throw new Error(`Admin login failed: ${adminLoginRes.statusText}`);
    }
    
    const adminLogin = await adminLoginRes.json();
    const adminToken = adminLogin.token;
    console.log("   ✓ Logged in as Admin. Token obtained.");

    // 2. Fetch current users to see if our test accounts exist, else create them
    console.log("\n👥 [2/9] Checking and seeding test users (Teller, Manager, Owner)...");
    const usersRes = await fetch(`${API_URL}/users`, {
      headers: { "Authorization": `Bearer ${adminToken}` },
    });
    const usersData = await usersRes.json();
    const usersList = usersData.data || [];

    const getOrCreateUser = async (email, name, role) => {
      const existing = usersList.find(u => u.email === email);
      if (existing) {
        console.log(`   - User ${email} already exists (ID: ${existing.id}, Role: ${existing.role}). Resetting password...`);
        const updateRes = await fetch(`${API_URL}/users/${existing.id}`, {
          method: "PUT",
          headers: {
            "Authorization": `Bearer ${adminToken}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            name,
            password: "password123"
          })
        });
        if (!updateRes.ok) {
          const updateData = await updateRes.json();
          throw new Error(`Failed to reset password for ${email}: ${JSON.stringify(updateData)}`);
        }
        return existing;
      }
      console.log(`   - Creating user ${email} (${role})...`);
      const createRes = await fetch(`${API_URL}/users`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${adminToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email,
          password: "password123",
          name,
          phone: "08123456789",
          role,
          companyId: 1
        })
      });
      const createData = await createRes.json();
      if (!createRes.ok) {
        throw new Error(`Failed to create user ${email}: ${JSON.stringify(createData)}`);
      }
      console.log(`   ✓ Created user ${email} successfully.`);
      return createData.data;
    };

    const tellerUser = await getOrCreateUser("teller@perumahan.com", "Budi Teller", "teller");
    const managerUser = await getOrCreateUser("manager@perumahan.com", "Siti Manager", "manager");
    const ownerUser = await getOrCreateUser("owner@perumahan.com", "Heri Owner", "owner");

    // 3. Login as Teller
    console.log("\n🔑 [3/9] Logging in as Teller...");
    const tellerLoginRes = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "teller@perumahan.com", password: "password123" }),
    });
    const tellerLogin = await tellerLoginRes.json();
    if (!tellerLoginRes.ok) {
      throw new Error(`Teller login failed: ${JSON.stringify(tellerLogin)}`);
    }
    const tellerToken = tellerLogin.token;
    console.log("   ✓ Logged in as Teller. Token obtained.");

    // 4. Fetch Chart of Accounts as Teller
    console.log("\n📊 [4/9] Fetching Chart of Accounts to find valid Accounts...");
    let coaRes = await fetch(`${API_URL}/chart-of-accounts`, {
      headers: { "Authorization": `Bearer ${tellerToken}` },
    });
    let coaData = await coaRes.json();
    let accounts = coaData.data || coaData || [];
    
    if (accounts.length < 2) {
      console.log("   - Less than 2 accounts found in Chart of Accounts. Seeding test accounts...");
      
      const seedAccount = async (code, name) => {
        const res = await fetch(`${API_URL}/chart-of-accounts`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${tellerToken}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            companyId: 1,
            accountCode: code,
            accountName: name,
            accountType: "ASSET",
            level: 3,
            description: `Seeded test account ${name}`
          })
        });
        if (!res.ok) {
          throw new Error(`Failed to seed account ${code}: ${res.statusText}`);
        }
        const data = await res.json();
        return data.data;
      };

      if (!accounts.some(a => a.accountCode === "1.1.01")) {
        await seedAccount("1.1.01", "Kas Utama");
      }
      if (!accounts.some(a => a.accountCode === "1.1.02")) {
        await seedAccount("1.1.02", "Bank Mandiri");
      }

      // Re-fetch
      coaRes = await fetch(`${API_URL}/chart-of-accounts`, {
        headers: { "Authorization": `Bearer ${tellerToken}` },
      });
      coaData = await coaRes.json();
      accounts = coaData.data || coaData || [];
    }
    
    // Select first two accounts for transaction
    const debitAcc = accounts[0];
    const creditAcc = accounts[1];
    console.log(`   - Selected Debit Account: ${debitAcc.accountCode} - ${debitAcc.accountName} (ID: ${debitAcc.id})`);
    console.log(`   - Selected Credit Account: ${creditAcc.accountCode} - ${creditAcc.accountName} (ID: ${creditAcc.id})`);

    // 4.5. Test Teller COA CRUD (Create & Delete)
    console.log("\n📁 [4.5] Verifying Teller's ability to Create and Delete accounts in Chart of Accounts...");
    
    // Check if the temporary account already exists from a previous run and clean it up
    const existingTemp = accounts.find(a => a.accountCode === "1.1.99");
    if (existingTemp) {
      console.log(`   - Found leftover temporary account (ID: ${existingTemp.id}), cleaning it up first...`);
      const cleanupRes = await fetch(`${API_URL}/chart-of-accounts/${existingTemp.id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${tellerToken}` }
      });
      if (cleanupRes.ok) {
        console.log("   ✓ Leftover account cleaned up.");
      } else {
        console.log("   ✗ Failed to clean up leftover account.");
      }
    }

    const tempAccountCode = "1.1.99";
    const tempAccountPayload = {
      companyId: 1,
      accountCode: tempAccountCode,
      accountName: "Akun Sementara E2E",
      accountType: "ASSET",
      level: 3,
      description: "Akun Sementara untuk E2E Test"
    };

    console.log(`   - Creating temporary account ${tempAccountCode} as Teller...`);
    const createCoaRes = await fetch(`${API_URL}/chart-of-accounts`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${tellerToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(tempAccountPayload)
    });
    
    const createCoaData = await createCoaRes.json();
    if (!createCoaRes.ok) {
      throw new Error(`Teller failed to create account: ${JSON.stringify(createCoaData)}`);
    }
    const tempAccountId = createCoaData.data.id;
    console.log(`   ✓ Temporary account created successfully (ID: ${tempAccountId}).`);

    console.log(`   - Deleting temporary account (ID: ${tempAccountId}) as Teller...`);
    const deleteCoaRes = await fetch(`${API_URL}/chart-of-accounts/${tempAccountId}`, {
      method: "DELETE",
      headers: { "Authorization": `Bearer ${tellerToken}` }
    });

    const deleteCoaData = await deleteCoaRes.json();
    if (!deleteCoaRes.ok) {
      throw new Error(`Teller failed to delete account: ${JSON.stringify(deleteCoaData)}`);
    }
    console.log(`   ✓ Temporary account deleted successfully.`);

    // 5. Create Transaction as Teller (should default to PENDING)
    console.log("\n📝 [5/9] Creating Transaction 1 (Rp 15.000.000) as Teller...");
    const txPayload = {
      companyId: 1,
      userId: tellerUser.id,
      transactionDate: new Date().toISOString().split("T")[0],
      transactionType: "TRANSFER",
      description: "Setoran Modal Kas via E2E Test Script",
      debitAccountId: debitAcc.id,
      creditAccountId: creditAcc.id,
      amount: 15000000
    };

    const createTxRes = await fetch(`${API_URL}/transactions`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${tellerToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(txPayload)
    });
    const createTxData = await createTxRes.json();
    if (!createTxRes.ok) {
      throw new Error(`Failed to create transaction: ${JSON.stringify(createTxData)}`);
    }
    const tx1 = createTxData.data;
    console.log(`   ✓ Transaction created (ID: ${tx1.id}, Code: ${tx1.transactionCode})`);
    console.log(`   ✓ Verification: Transaction status is: "${tx1.status}" (Expected: "PENDING")`);
    if (tx1.status !== "PENDING") {
      throw new Error(`Expected PENDING status, but got ${tx1.status}`);
    }

    // 6. Login as Manager
    console.log("\n🔑 [6/9] Logging in as Manager...");
    const managerLoginRes = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "manager@perumahan.com", password: "password123" }),
    });
    const managerLogin = await managerLoginRes.json();
    if (!managerLoginRes.ok) {
      throw new Error(`Manager login failed: ${JSON.stringify(managerLogin)}`);
    }
    const managerToken = managerLogin.token;
    console.log("   ✓ Logged in as Manager. Token obtained.");

    // 7. Approve Transaction 1 as Manager
    console.log(`\n✅ [7/9] Approving Transaction 1 (ID: ${tx1.id}) as Manager...`);
    const approveRes = await fetch(`${API_URL}/transactions/${tx1.id}/approve`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${managerToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({})
    });
    const approveData = await approveRes.json();
    if (!approveRes.ok) {
      throw new Error(`Failed to approve transaction: ${JSON.stringify(approveData)}`);
    }
    const tx1Approved = approveData.data;
    console.log(`   ✓ Transaction approved successfully.`);
    console.log(`   ✓ Verification: Transaction status is now: "${tx1Approved.status}" (Expected: "POSTED")`);
    if (tx1Approved.status !== "POSTED") {
      throw new Error(`Expected POSTED status, but got ${tx1Approved.status}`);
    }

    // Check if journal entries were created
    const getTxRes = await fetch(`${API_URL}/transactions/${tx1.id}`, {
      headers: { "Authorization": `Bearer ${managerToken}` }
    });
    const getTxData = await getTxRes.json();
    const tx1Details = getTxData.data;
    console.log(`   ✓ Verification: Journal Entry created: ${tx1Details.journalEntry ? "YES ✓" : "NO ✗"}`);
    if (!tx1Details.journalEntry) {
      throw new Error("Journal entry was not generated during approval!");
    }
    console.log(`     - Journal Number: ${tx1Details.journalEntry.journalNo}`);
    console.log(`     - Debit Line: Account ID ${tx1Details.journalEntry.lines[0].accountId}, Debit: ${tx1Details.journalEntry.lines[0].debit}`);
    console.log(`     - Credit Line: Account ID ${tx1Details.journalEntry.lines[1].accountId}, Credit: ${tx1Details.journalEntry.lines[1].credit}`);

    // 8. Create Transaction 2 as Teller and Reject as Manager
    console.log("\n❌ [8/9] Testing Rejection Workflow...");
    console.log("   - Creating Transaction 2 (Rp 5.000.000) as Teller...");
    const tx2Payload = { ...txPayload, description: "Transaksi Salah Input E2E", amount: 5000000 };
    const createTx2Res = await fetch(`${API_URL}/transactions`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${tellerToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(tx2Payload)
    });
    const createTx2Data = await createTx2Res.json();
    const tx2 = createTx2Data.data;
    console.log(`   - Transaction 2 created (ID: ${tx2.id}, Status: "${tx2.status}")`);

    console.log(`   - Rejecting Transaction 2 (ID: ${tx2.id}) as Manager...`);
    const rejectRes = await fetch(`${API_URL}/transactions/${tx2.id}/reject`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${managerToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ rejectionReason: "Akun kredit tidak sesuai dengan deskripsi" })
    });
    const rejectData = await rejectRes.json();
    if (!rejectRes.ok) {
      throw new Error(`Failed to reject transaction: ${JSON.stringify(rejectData)}`);
    }
    const tx2Rejected = rejectData.data;
    console.log(`   ✓ Transaction 2 rejected successfully.`);
    console.log(`   ✓ Verification: Transaction 2 status is now: "${tx2Rejected.status}" (Expected: "REJECTED")`);
    console.log(`   ✓ Verification: Rejection Reason: "${tx2Rejected.rejectionReason}"`);
    if (tx2Rejected.status !== "REJECTED" || tx2Rejected.rejectionReason !== "Akun kredit tidak sesuai dengan deskripsi") {
      throw new Error("Rejection status or reason mismatch!");
    }

    // 9. Login as Owner & Role restriction verification
    console.log("\n🚫 [9/9] Verifying Role-Based Access Restrictions...");
    console.log("   - Logging in as Owner...");
    const ownerLoginRes = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "owner@perumahan.com", password: "password123" }),
    });
    const ownerLogin = await ownerLoginRes.json();
    const ownerToken = ownerLogin.token;
    console.log("   ✓ Logged in as Owner.");

    console.log("   - Attempting to Approve Transaction 2 as Owner (Should FAIL)...");
    const ownerApproveRes = await fetch(`${API_URL}/transactions/${tx2.id}/approve`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${ownerToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({})
    });
    console.log(`   ✓ Verification: Owner approve request returned status: ${ownerApproveRes.status} (Expected: 403 Forbidden)`);
    if (ownerApproveRes.status !== 403) {
      throw new Error(`Expected 403 Forbidden for Owner approving transaction, got ${ownerApproveRes.status}`);
    }

    console.log("   - Attempting to Create Transaction as Owner (Should FAIL)...");
    const ownerCreateRes = await fetch(`${API_URL}/transactions`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${ownerToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(txPayload)
    });
    console.log(`   ✓ Verification: Owner create request returned status: ${ownerCreateRes.status} (Expected: 403 Forbidden)`);
    if (ownerCreateRes.status !== 403) {
      throw new Error(`Expected 403 Forbidden for Owner creating transaction, got ${ownerCreateRes.status}`);
    }

    console.log("   - Attempting to Create Transaction as Manager (Should FAIL)...");
    const managerCreateRes = await fetch(`${API_URL}/transactions`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${managerToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(txPayload)
    });
    console.log(`   ✓ Verification: Manager create request returned status: ${managerCreateRes.status} (Expected: 403 Forbidden)`);
    if (managerCreateRes.status !== 403) {
      throw new Error(`Expected 403 Forbidden for Manager creating transaction, got ${managerCreateRes.status}`);
    }

    console.log("\n🎉 ALL TESTS PASSED SUCCESSFULLY! The transaction approval workflow and role access controls are fully operational.");

  } catch (error) {
    console.error("\n❌ E2E Workflow Verification Test Failed:", error.message);
    process.exit(1);
  }
}

runTests();
