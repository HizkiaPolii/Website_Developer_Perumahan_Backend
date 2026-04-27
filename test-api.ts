import http from "http";

async function testAPI() {
  const loginData = JSON.stringify({
    email: "admin@perumahan.com",
    password: "admin123"
  });

  const loginOptions = {
    hostname: "localhost",
    port: 5000,
    path: "/api/auth/login",
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Content-Length": loginData.length
    }
  };

  console.log("🧪 Testing /api/auth/login...");
  
  return new Promise((resolve) => {
    const req = http.request(loginOptions, (res) => {
      let data = "";
      res.on("data", chunk => data += chunk);
      res.on("end", () => {
        console.log("Status:", res.statusCode);
        console.log("Response:", data);
        const response = JSON.parse(data);
        if (response.token) {
          testGetUsers(response.token);
        }
        resolve(null);
      });
    });

    req.on("error", (e) => console.error("❌ Error:", e));
    req.write(loginData);
    req.end();
  });
}

function testGetUsers(token: string) {
  console.log("\n🧪 Testing /api/users with token...");
  
  const getUsersOptions = {
    hostname: "localhost",
    port: 5000,
    path: "/api/users",
    method: "GET",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json"
    }
  };

  const req = http.request(getUsersOptions, (res) => {
    let data = "";
    res.on("data", chunk => data += chunk);
    res.on("end", () => {
      console.log("Status:", res.statusCode);
      console.log("Response:", data);
      process.exit(0);
    });
  });

  req.on("error", (e) => console.error("❌ Error:", e));
  req.end();
}

testAPI();
