import { useState } from 'react';
import { Chessboard } from "react-chessboard";
import { Chess } from 'chess.js';

// Simple test without chess.js to verify react-chessboard works
const SimpleChessTest = () => {
    const [game, setGame] = useState(new Chess());
    const [position, setPosition] = useState(game.fen());

    const onDrop = (sourceSquare, targetSquare) => {
        try {
            const move = game.move({
                from: sourceSquare,
                to: targetSquare,
                promotion: 'q',
            });

            if (move === null) return false;

            const newFen = game.fen();
            setGame(new Chess(newFen)); // Force new instance to ensure state triggers
            setPosition(newFen);
            return true;
        } catch (e) {
            return false;
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-4xl font-bold text-white text-center mb-8">
                    SIMPLE CHESS TEST
                </h1>
                <p className="text-white/60 text-center mb-8">
                    Try to drag ANY piece. Check browser console (F12) for messages.
                </p>

                <div className="max-w-[600px] mx-auto">
                    <Chessboard
                        position={position}
                        onPieceDrop={onDrop}
                        boardOrientation="white"
                        customDarkSquareStyle={{ backgroundColor: "#779556" }}
                        customLightSquareStyle={{ backgroundColor: "#ebecd0" }}
                        animationDuration={200}
                        arePiecesDraggable={true}
                    />
                </div>

                <div className="mt-8 text-center">
                    <button
                        onClick={() => setPosition("start")}
                        className="bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-3 px-6 rounded-lg"
                    >
                        Reset Board
                    </button>
                </div>

                <div className="mt-8 bg-white/10 p-6 rounded-lg text-white">
                    <h2 className="font-bold mb-4">Debug Info:</h2>
                    <p>• If you can drag pieces, react-chessboard is working ✓</p>
                    <p>• Check browser console (F12) for "Piece dropped" messages</p>
                    <p>• If pieces don't move, there's a library issue</p>
                </div>
            </div>
        </div>
    );
};

export default SimpleChessTest;
