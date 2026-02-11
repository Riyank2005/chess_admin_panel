import mongoose from 'mongoose';
console.log("Connecting...");
mongoose.connect('mongodb://localhost:27017/chess-dev').then(async () => {
    console.log("Connected to DB!");
    // Import Player dynamically to avoid top-level issues
    const { default: Player } = await import('./models/Player.js');
    console.log("Player model loaded");
    const count = await Player.countDocuments();
    console.log("Player count:", count);

    if (count === 0) {
        console.log("Seeding...");
        await Player.create({
            username: 'TestPlayer',
            email: 'test@example.com',
            password: 'password123',
            elo: 1200,
            role: 'user',
            status: 'active'
        });
        console.log("Seeded 1 player.");
    }
    process.exit(0);
}).catch(err => {
    console.error("Error:", err);
    process.exit(1);
});
