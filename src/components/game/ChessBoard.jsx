import { useState, useEffect } from "react";
import { Chessboard } from "react-chessboard";
import { Chess } from "chess.js";

const ChessBoard = ({
    game,
    onMakeMove,
    orientation = "white",
    isActive = true,
    customSquareStyles = {}
}) => {
    const [chess] = useState(game || new Chess());
    const [fen, setFen] = useState(chess.fen());

    useEffect(() => {
        if (game) {
            setFen(game.fen());
        }
    }, [game]);

    function onDrop(sourceSquare, targetSquare) {
        if (!isActive) return false;

        try {
            const move = {
                from: sourceSquare,
                to: targetSquare,
                promotion: "q", // always promote to queen for simplicity
            };

            const result = onMakeMove(move);
            if (result) {
                // Determine new FEN locally for immediate feedback
                // result might be the move object or the chess instance
                if (typeof result === 'object' && result.after) {
                    setFen(result.after);
                } else if (game) {
                    setFen(game.fen());
                }
                return true;
            }
            return false;
        } catch (error) {
            console.error("Move error:", error);
            return false;
        }
    }

    return (
        <div className="w-full max-w-[600px] aspect-square mx-auto shadow-2xl rounded-lg overflow-hidden border-4 border-white/10">
            <Chessboard
                position={fen}
                onPieceDrop={onDrop}
                boardOrientation={orientation}
                customDarkSquareStyle={{ backgroundColor: "#779556" }}
                customLightSquareStyle={{ backgroundColor: "#ebecd0" }}
                customSquareStyles={customSquareStyles}
                animationDuration={200}
            />
        </div>
    );
};

export default ChessBoard;
