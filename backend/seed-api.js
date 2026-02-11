console.log("Attempting to seed database via API...");

fetch('http://localhost:5001/api/system/seed', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        // Authorization might be needed if protect middleware is active
        // But in dev mode, it accepts no token as DEBUG_ADMIN
    }
})
    .then(async res => {
        console.log("Status:", res.status);
        const data = await res.json();
        console.log("Response:", JSON.stringify(data, null, 2));
    })
    .catch(err => {
        console.error("Fetch failed:", err);
    });
