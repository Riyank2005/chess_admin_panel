import { useState, useEffect, useRef } from "react";
import { Chessboard } from "react-chessboard";
import { Chess } from "chess.js";
import { toast } from "sonner";

const InteractiveChessBoard = ({
    initialGame = null,
    onMakeMove,
    orientation = "white",
    isActive = true,
    gameMode = "computer", // 'computer' or 'online'
    onGameOver = null
}) => {
    const gameRef = useRef(initialGame || new Chess());
    const [game, setGame] = useState(gameRef.current);
    const [fen, setFen] = useState(gameRef.current.fen());
    const [moveFrom, setMoveFrom] = useState("");
    const [optionSquares, setOptionSquares] = useState({});
    const [rightClickedSquares, setRightClickedSquares] = useState({});
    const [isGameOver, setIsGameOver] = useState(false);

    // Update when external game changes
    useEffect(() => {
        if (initialGame) {
            setGame(initialGame);
            setFen(initialGame.fen());
        }
    }, [initialGame]);

    // Play move sound
    const playMoveSound = () => {
        try {
            const audio = new Audio('https://images.chesscomfiles.com/chess-themes/sounds/_common/move-self.mp3');
            audio.play().catch(() => { });
        } catch (e) {
            console.error("Sound error:", e);
        }
    };

    // Check game over conditions
    const checkGameOver = (chessGame) => {
        if (chessGame.isCheckmate()) {
            const winner = chessGame.turn() === 'w' ? 'black' : 'white';
            setIsGameOver(true);
            toast.success(`Checkmate! ${winner === orientation ? 'You win!' : 'You lose!'}`);
            if (onGameOver) onGameOver({ reason: 'checkmate', winner });
            return true;
        } else if (chessGame.isDraw()) {
            setIsGameOver(true);
            toast.info("Game drawn!");
            if (onGameOver) onGameOver({ reason: 'draw', winner: null });
            return true;
        } else if (chessGame.isStalemate()) {
            setIsGameOver(true);
            toast.info("Stalemate!");
            if (onGameOver) onGameOver({ reason: 'stalemate', winner: null });
            return true;
        } else if (chessGame.isThreefoldRepetition()) {
            setIsGameOver(true);
            toast.info("Draw by repetition!");
            if (onGameOver) onGameOver({ reason: 'repetition', winner: null });
            return true;
        } else if (chessGame.isInsufficientMaterial()) {
            setIsGameOver(true);
            toast.info("Draw by insufficient material!");
            if (onGameOver) onGameOver({ reason: 'insufficient material', winner: null });
            return true;
        }
        return false;
    };

    // Get check square highlighting
    const getCheckSquare = () => {
        if (!game.inCheck()) return {};

        const squares = {};
        const board = game.board();

        for (let i = 0; i < 8; i++) {
            for (let j = 0; j < 8; j++) {
                const piece = board[i][j];
                if (piece && piece.type === 'k' && piece.color === game.turn()) {
                    const files = 'abcdefgh';
                    const square = files[j] + (8 - i);
                    squares[square] = {
                        background: "radial-gradient(circle, rgba(255, 0, 0, 0.6) 50%, transparent 50%)",
                    };
                }
            }
        }
        return squares;
    };

    // Get legal moves for a square
    const getMoveOptions = (square) => {
        const moves = game.moves({
            square,
            verbose: true,
        });

        if (moves.length === 0) {
            setOptionSquares({});
            return false;
        }

        const newSquares = {};
        moves.forEach((move) => {
            newSquares[move.to] = {
                background:
                    game.get(move.to) && game.get(move.to).color !== game.get(square).color
                        ? "radial-gradient(circle, rgba(0,0,0,.1) 85%, transparent 85%)"
                        : "radial-gradient(circle, rgba(0,0,0,.1) 25%, transparent 25%)",
                borderRadius: "50%",
            };
        });
        newSquares[square] = {
            background: "rgba(255, 255, 0, 0.4)",
        };
        setOptionSquares(newSquares);
        return true;
    };

    // Handle square click
    const onSquareClick = (square) => {
        if (isGameOver || !isActive) return;

        // Check if it's player's turn
        if (gameMode === 'online' && gameRef.current.turn() !== orientation.charAt(0)) {
            toast.error("It's not your turn!");
            return;
        }

        if (gameMode === 'computer' && gameRef.current.turn() !== 'w') {
            return; // Computer's turn
        }

        // Reset right-clicked squares
        setRightClickedSquares({});

        // If no piece selected yet
        if (!moveFrom) {
            const piece = gameRef.current.get(square);
            if (piece && piece.color === gameRef.current.turn()) {
                setMoveFrom(square);
                getMoveOptions(square);
            }
            return;
        }

        // If clicking the same square, deselect
        if (square === moveFrom) {
            setMoveFrom('');
            setOptionSquares({});
            return;
        }

        // Try to make the move
        const moveAttempt = {
            from: moveFrom,
            to: square,
            promotion: 'q',
        };

        const success = makeMove(moveAttempt);

        if (success) {
            setMoveFrom('');
            setOptionSquares({});
        } else {
            // Check if clicked on another piece of the same color
            const piece = game.get(square);
            if (piece && piece.color === game.turn()) {
                setMoveFrom(square);
                getMoveOptions(square);
            } else {
                setMoveFrom('');
                setOptionSquares({});
            }
        }
    };

    // Handle piece drop
    const onPieceDrop = (sourceSquare, targetSquare) => {
        if (isGameOver || !isActive) return false;

        // Check if it's player's turn
        if (gameMode === 'online' && gameRef.current.turn() !== orientation.charAt(0)) {
            toast.error("It's not your turn!");
            return false;
        }

        if (gameMode === 'computer' && gameRef.current.turn() !== 'w') {
            return false;
        }

        const move = {
            from: sourceSquare,
            to: targetSquare,
            promotion: 'q',
        };

        const success = makeMove(move);

        if (success) {
            setMoveFrom('');
            setOptionSquares({});
        }

        return success;
    };

    // Make a move
    const makeMove = (move) => {
        try {
            console.log('[INTERACTIVE] Making move:', move);
            const newGame = new Chess(gameRef.current.fen());
            const result = newGame.move(move);

            if (result) {
                gameRef.current = newGame;
                setGame(newGame);
                setFen(newGame.fen());
                playMoveSound();

                // Notify parent
                if (onMakeMove) {
                    onMakeMove(result, newGame);
                }

                // Check if game is over
                if (checkGameOver(newGame)) {
                    return true;
                }

                // Computer move for local games
                if (gameMode === 'computer' && !newGame.isGameOver()) {
                    setTimeout(() => {
                        makeComputerMove(newGame);
                    }, 500);
                }

                return true;
            } else {
                console.error('[INTERACTIVE] Invalid move');
                return false;
            }
        } catch (e) {
            console.error("Move error:", e);
            return false;
        }
    };

    // Computer AI move
    const makeComputerMove = (currentGame) => {
        try {
            const computerGame = new Chess(currentGame.fen());
            const possibleMoves = computerGame.moves({ verbose: true });

            if (possibleMoves.length > 0) {
                // Simple AI: prioritize captures, then random
                const captures = possibleMoves.filter(m => m.captured);
                const moveToMake = captures.length > 0
                    ? captures[Math.floor(Math.random() * captures.length)]
                    : possibleMoves[Math.floor(Math.random() * possibleMoves.length)];

                const compResult = computerGame.move(moveToMake);

                setGame(computerGame);
                setFen(computerGame.fen());
                playMoveSound();

                // Notify parent
                if (onMakeMove) {
                    onMakeMove(compResult, computerGame);
                }

                // Check if game is over
                checkGameOver(computerGame);
            }
        } catch (err) {
            console.error("Computer AI Error:", err);
        }
    };

    // Right-click to mark squares
    const onSquareRightClick = (square) => {
        const color = "rgba(255, 0, 0, 0.5)";
        setRightClickedSquares({
            ...rightClickedSquares,
            [square]:
                rightClickedSquares[square] && rightClickedSquares[square].backgroundColor === color
                    ? undefined
                    : { backgroundColor: color },
        });
    };

    return (
        <div className="w-full max-w-[600px] aspect-square mx-auto">
            <Chessboard
                position={fen}
                onPieceDrop={onPieceDrop}
                onSquareClick={onSquareClick}
                onSquareRightClick={onSquareRightClick}
                boardOrientation={orientation}
                customDarkSquareStyle={{ backgroundColor: "rgba(99, 102, 241, 0.4)" }}
                customLightSquareStyle={{ backgroundColor: "rgba(255, 255, 255, 0.1)" }}
                customSquareStyles={{
                    ...getCheckSquare(),
                    ...optionSquares,
                    ...rightClickedSquares,
                }}
                animationDuration={200}
                arePiecesDraggable={!isGameOver && isActive}
            />
        </div>
    );
};

export default InteractiveChessBoard;
