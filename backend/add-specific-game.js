import mongoose from 'mongoose';
import Game from './models/Game.js';

const uri = 'mongodb://localhost:27017/chess-dev';

console.log('Starting seed script...');
console.log('Connecting to MongoDB at:', uri);

mongoose.connect(uri)
    .then(() => {
        console.log('MongoDB Connected');
        seedGame();
    })
    .catch(err => {
        console.error('MongoDB Connection Error:', err);
        process.exit(1);
    });

const seedGame = async () => {
    const gameData = {
        white: "Magnus_C",
        black: "Hikaru_N",
        whiteElo: "2880",
        blackElo: "2865",
        timeControl: "5+0",
        moves: "14",
        duration: "0:45",
        status: "playing",
        gameState: "playing", // Ensure both fields used by frontend are present
        result: "*",
        pgn: "1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7 6. Re1 b5 7. Bb3 d6",
    };

    try {
        const createdGame = await Game.create(gameData);
        console.log('------------------------------------------------');
        console.log('SUCCESS: Game added to database!');
        console.log('Game ID:', createdGame._id);
        console.log('------------------------------------------------');
    } catch (error) {
        console.error('Error creating game:', error);
    } finally {
        await mongoose.connection.close();
        process.exit(0);
    }
};
