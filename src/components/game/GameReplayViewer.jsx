import { useState, useEffect } from 'react';
import { Chessboard } from 'react-chessboard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  RotateCcw,
  Download,
  Eye,
  AlertTriangle,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { Chess } from 'chess.js';

export function GameReplayViewer({ gameData, onClose }) {
  const [chess] = useState(new Chess());
  const [currentMove, setCurrentMove] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [moveDelay, setMoveDelay] = useState(1000);
  const [boardOrientation, setBoardOrientation] = useState('white');

  const moves = gameData.moves || [];
  const totalMoves = moves.length;

  useEffect(() => {
    if (moves.length > 0) {
      chess.load(gameData.fen || 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
      updateBoardToMove(currentMove);
    }
  }, [gameData, currentMove]);

  const updateBoardToMove = (moveIndex) => {
    chess.reset();
    if (gameData.fen) {
      chess.load(gameData.fen);
    }

    for (let i = 0; i < moveIndex; i++) {
      try {
        chess.move(moves[i]);
      } catch (error) {
        console.error('Invalid move:', moves[i], error);
      }
    }
  };

  const goToMove = (moveIndex) => {
    setCurrentMove(Math.max(0, Math.min(moveIndex, totalMoves)));
  };

  const playMoves = () => {
    if (isPlaying) {
      setIsPlaying(false);
      return;
    }

    setIsPlaying(true);
    const playNextMove = () => {
      if (!isPlaying || currentMove >= totalMoves) {
        setIsPlaying(false);
        return;
      }

      goToMove(currentMove + 1);
      setTimeout(playNextMove, moveDelay);
    };

    playNextMove();
  };

  const exportPGN = () => {
    const pgn = `[Event "${gameData.event || 'Chess Game'}"]
[Site "${gameData.site || 'Online'}"]
[Date "${new Date(gameData.createdAt).toISOString().split('T')[0]}"]
[Round "${gameData.round || '-'}"]
[White "${gameData.whitePlayer}"]
[Black "${gameData.blackPlayer}"]
[Result "${gameData.result || '*'}"]
[ECO "${gameData.eco || '?'}"]
[Opening "${gameData.opening || '?'}"]

${moves.join(' ')} ${gameData.result || '*'}`;

    const blob = new Blob([pgn], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `game-${gameData._id}.pgn`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getCheatDetectionIndicators = () => {
    // Mock cheat detection analysis
    const analysis = {
      suspiciousMoves: Math.floor(Math.random() * 5),
      timeAnomalies: Math.random() > 0.7,
      engineSimilarity: Math.floor(Math.random() * 100),
      moveSpeed: Math.random() * 2 + 0.5
    };

    return analysis;
  };

  const analysis = getCheatDetectionIndicators();

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white">Game Replay</h2>
              <p className="text-gray-400">
                {gameData.whitePlayer} vs {gameData.blackPlayer}
              </p>
            </div>
            <Button variant="ghost" onClick={onClose}>
              <XCircle className="w-6 h-6" />
            </Button>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Chess Board */}
            <div className="lg:col-span-2">
              <Card className="bg-gray-800 border-gray-700">
                <CardContent className="p-6">
                  <div className="flex justify-center mb-4">
                    <Chessboard
                      position={chess.fen()}
                      boardOrientation={boardOrientation}
                      arePiecesDraggable={false}
                      boardWidth={400}
                    />
                  </div>

                  {/* Move Controls */}
                  <div className="flex items-center justify-center gap-2 mb-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => goToMove(0)}
                      disabled={currentMove === 0}
                    >
                      <SkipBack className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => goToMove(currentMove - 1)}
                      disabled={currentMove === 0}
                    >
                      <RotateCcw className="w-4 h-4" />
                    </Button>
                    <Button
                      variant={isPlaying ? "destructive" : "default"}
                      size="sm"
                      onClick={playMoves}
                    >
                      {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => goToMove(currentMove + 1)}
                      disabled={currentMove >= totalMoves}
                    >
                      <SkipForward className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => goToMove(totalMoves)}
                      disabled={currentMove >= totalMoves}
                    >
                      <SkipForward className="w-4 h-4" />
                      <SkipForward className="w-4 h-4 -ml-2" />
                    </Button>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-4">
                    <Progress value={(currentMove / totalMoves) * 100} className="h-2" />
                    <div className="flex justify-between text-sm text-gray-400 mt-1">
                      <span>Move {currentMove} of {totalMoves}</span>
                      <span>{Math.round((currentMove / totalMoves) * 100)}%</span>
                    </div>
                  </div>

                  {/* Move List */}
                  <div className="bg-gray-900 rounded p-4 max-h-32 overflow-y-auto">
                    <div className="grid grid-cols-10 gap-2 text-sm">
                      {moves.map((move, index) => (
                        <button
                          key={index}
                          onClick={() => goToMove(index + 1)}
                          className={`p-1 rounded text-center ${
                            index + 1 === currentMove
                              ? 'bg-blue-600 text-white'
                              : 'text-gray-300 hover:bg-gray-700'
                          }`}
                        >
                          {index % 2 === 0 ? `${Math.floor(index / 2) + 1}.` : ''}
                          {move}
                        </button>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Game Info & Analysis */}
            <div className="space-y-4">
              {/* Game Info */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Eye className="w-4 h-4" />
                    Game Info
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-400">White:</span>
                    <span className="text-white font-medium">{gameData.whitePlayer}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Black:</span>
                    <span className="text-white font-medium">{gameData.blackPlayer}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Result:</span>
                    <Badge variant={gameData.result === '1-0' ? 'default' : gameData.result === '0-1' ? 'destructive' : 'secondary'}>
                      {gameData.result || 'Ongoing'}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Date:</span>
                    <span className="text-white">{new Date(gameData.createdAt).toLocaleDateString()}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Cheat Detection */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    Cheat Detection
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Suspicious Moves:</span>
                    <Badge variant={analysis.suspiciousMoves > 2 ? 'destructive' : 'secondary'}>
                      {analysis.suspiciousMoves}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Time Anomalies:</span>
                    <Badge variant={analysis.timeAnomalies ? 'destructive' : 'default'}>
                      {analysis.timeAnomalies ? 'Yes' : 'No'}
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Engine Similarity:</span>
                      <span className="text-white">{analysis.engineSimilarity}%</span>
                    </div>
                    <Progress value={analysis.engineSimilarity} className="h-1" />
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Status:</span>
                    <Badge variant={analysis.suspiciousMoves > 2 || analysis.timeAnomalies ? 'destructive' : 'default'}>
                      {analysis.suspiciousMoves > 2 || analysis.timeAnomalies ? 'Flagged' : 'Clean'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Actions */}
              <div className="space-y-2">
                <Button
                  onClick={() => setBoardOrientation(boardOrientation === 'white' ? 'black' : 'white')}
                  variant="outline"
                  className="w-full"
                >
                  Flip Board
                </Button>
                <Button
                  onClick={exportPGN}
                  variant="outline"
                  className="w-full"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export PGN
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
