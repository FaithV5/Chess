// Chess Game Logic
class ChessGame {
    constructor() {
        this.board = [];
        this.currentPlayer = 'white';
        this.selectedSquare = null;
        this.validMoves = [];
        this.capturedPieces = { white: [], black: [] };
        this.gameOver = false;
        this.gameMode = null; // 'robot' or 'human'
        this.difficulty = null; // 'easy', 'medium', 'hard'
        this.setupNavigation();
    }

    setupNavigation() {
        // Play button on home screen
        document.getElementById('play-btn').addEventListener('click', () => {
            this.showScreen('mode-screen');
        });

        // Mode selection
        document.getElementById('mode-robot').addEventListener('click', () => {
            this.gameMode = 'robot';
            this.showScreen('difficulty-screen');
        });

        document.getElementById('mode-human').addEventListener('click', () => {
            this.gameMode = 'human';
            this.difficulty = null;
            this.startGame();
        });

        // Difficulty selection
        document.querySelectorAll('.difficulty-card').forEach(card => {
            card.addEventListener('click', () => {
                this.difficulty = card.dataset.difficulty;
                this.startGame();
            });
        });

        // Back buttons
        document.getElementById('back-from-mode').addEventListener('click', () => {
            this.showScreen('home-screen');
        });

        document.getElementById('back-from-difficulty').addEventListener('click', () => {
            this.showScreen('mode-screen');
        });

        document.getElementById('back-to-home').addEventListener('click', () => {
            this.showScreen('home-screen');
            this.resetGame();
        });
    }

    showScreen(screenId) {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        document.getElementById(screenId).classList.add('active');
    }

    startGame() {
        this.initializeBoard();
        this.renderBoard();
        this.setupEventListeners();
        this.showScreen('game-screen');
        this.updateModeDisplay();
    }

    updateModeDisplay() {
        const modeDisplay = document.getElementById('mode-display');
        if (this.gameMode === 'robot') {
            const difficultyText = this.difficulty.charAt(0).toUpperCase() + this.difficulty.slice(1);
            modeDisplay.textContent = `🤖 Playing against Robot (${difficultyText})`;
        } else {
            modeDisplay.textContent = `👥 Playing with Human (Local)`;
        }
    }

    initializeBoard() {
        // Initialize 8x8 board
        this.board = Array(8).fill(null).map(() => Array(8).fill(null));

        // Place pawns
        for (let i = 0; i < 8; i++) {
            this.board[1][i] = { type: 'pawn', color: 'black', symbol: '♟' };
            this.board[6][i] = { type: 'pawn', color: 'white', symbol: '♙' };
        }

        // Place black pieces
        this.board[0][0] = { type: 'rook', color: 'black', symbol: '♜' };
        this.board[0][1] = { type: 'knight', color: 'black', symbol: '♞' };
        this.board[0][2] = { type: 'bishop', color: 'black', symbol: '♝' };
        this.board[0][3] = { type: 'queen', color: 'black', symbol: '♛' };
        this.board[0][4] = { type: 'king', color: 'black', symbol: '♚' };
        this.board[0][5] = { type: 'bishop', color: 'black', symbol: '♝' };
        this.board[0][6] = { type: 'knight', color: 'black', symbol: '♞' };
        this.board[0][7] = { type: 'rook', color: 'black', symbol: '♜' };

        // Place white pieces
        this.board[7][0] = { type: 'rook', color: 'white', symbol: '♖' };
        this.board[7][1] = { type: 'knight', color: 'white', symbol: '♘' };
        this.board[7][2] = { type: 'bishop', color: 'white', symbol: '♗' };
        this.board[7][3] = { type: 'queen', color: 'white', symbol: '♕' };
        this.board[7][4] = { type: 'king', color: 'white', symbol: '♔' };
        this.board[7][5] = { type: 'bishop', color: 'white', symbol: '♗' };
        this.board[7][6] = { type: 'knight', color: 'white', symbol: '♘' };
        this.board[7][7] = { type: 'rook', color: 'white', symbol: '♖' };
    }

    renderBoard() {
        const boardElement = document.getElementById('chess-board');
        boardElement.innerHTML = '';

        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const square = document.createElement('div');
                square.className = `square ${(row + col) % 2 === 0 ? 'light' : 'dark'}`;
                square.dataset.row = row;
                square.dataset.col = col;

                const piece = this.board[row][col];
                if (piece) {
                    square.textContent = piece.symbol;
                    square.classList.add('has-piece');
                }

                boardElement.appendChild(square);
            }
        }

        this.highlightCheckKings();
        this.updateGameInfo();
    }

    highlightCheckKings() {
        // Clear previous highlights
        document.querySelectorAll('.square').forEach(sq => sq.classList.remove('in-check'));

        ['white', 'black'].forEach(color => {
            if (this.isInCheck(color, this.board)) {
                const kingPos = this.findKingPosition(this.board, color);
                if (kingPos) {
                    const kingSquare = document.querySelector(
                        `[data-row="${kingPos.row}"][data-col="${kingPos.col}"]`
                    );
                    if (kingSquare) {
                        kingSquare.classList.add('in-check');
                    }
                }
            }
        });
    }

    setupEventListeners() {
        const chessBoard = document.getElementById('chess-board');
        
        // Remove old event listener by cloning
        const newChessBoard = chessBoard.cloneNode(true);
        chessBoard.parentNode.replaceChild(newChessBoard, chessBoard);
        
        document.getElementById('chess-board').addEventListener('click', (e) => {
            if (this.gameOver) return;
            
            const square = e.target.closest('.square');
            if (!square) return;

            const row = parseInt(square.dataset.row);
            const col = parseInt(square.dataset.col);

            this.handleSquareClick(row, col);
        });

        // Reset button
        const resetBtn = document.getElementById('reset-btn');
        const newResetBtn = resetBtn.cloneNode(true);
        resetBtn.parentNode.replaceChild(newResetBtn, resetBtn);
        
        document.getElementById('reset-btn').addEventListener('click', () => {
            this.resetGameOnly();
        });
    }

    handleSquareClick(row, col) {
        // In robot mode, only allow human (white) to make moves
        if (this.gameMode === 'robot' && this.currentPlayer === 'black') {
            return;
        }

        // If a square is already selected
        if (this.selectedSquare) {
            // Check if clicked square is a valid move
            const isValidMove = this.validMoves.some(
                move => move.row === row && move.col === col
            );

            if (isValidMove) {
                this.movePiece(this.selectedSquare.row, this.selectedSquare.col, row, col);
                this.selectedSquare = null;
                this.validMoves = [];
                this.renderBoard();
                this.switchPlayer();
                this.evaluateGameState();
                if (this.gameOver) return;
                
                // Robot makes a move after player
                if (this.gameMode === 'robot' && this.currentPlayer === 'black' && !this.gameOver) {
                    setTimeout(() => this.makeRobotMove(), 500);
                }
            } else {
                // Select new piece if it belongs to current player
                const piece = this.board[row][col];
                if (piece && piece.color === this.currentPlayer) {
                    this.selectSquare(row, col);
                } else {
                    this.selectedSquare = null;
                    this.validMoves = [];
                    this.renderBoard();
                }
            }
        } else {
            // Select piece if it belongs to current player
            const piece = this.board[row][col];
            if (piece && piece.color === this.currentPlayer) {
                this.selectSquare(row, col);
            }
        }
    }

    makeRobotMove() {
        if (this.gameOver) return;

        // Get all possible moves for black pieces
        const allMoves = [];
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this.board[row][col];
                if (piece && piece.color === 'black') {
                    const moves = this.getValidMoves(row, col);
                    moves.forEach(move => {
                        allMoves.push({
                            from: { row, col },
                            to: move,
                            piece: piece
                        });
                    });
                }
            }
        }

        if (allMoves.length === 0) {
            this.evaluateGameState();
            return;
        }

        let selectedMove;

        if (this.difficulty === 'easy') {
            // Easy: Random move
            selectedMove = allMoves[Math.floor(Math.random() * allMoves.length)];
        } else if (this.difficulty === 'medium') {
            // Medium: Prefer captures, otherwise random
            const captureMoves = allMoves.filter(move => 
                this.board[move.to.row][move.to.col] !== null
            );
            if (captureMoves.length > 0) {
                selectedMove = captureMoves[Math.floor(Math.random() * captureMoves.length)];
            } else {
                selectedMove = allMoves[Math.floor(Math.random() * allMoves.length)];
            }
        } else {
            // Hard: Prioritize high-value captures and strategic moves
            const pieceValues = { 'pawn': 1, 'knight': 3, 'bishop': 3, 'rook': 5, 'queen': 9, 'king': 100 };
            let bestMove = allMoves[0];
            let bestScore = -1000;

            allMoves.forEach(move => {
                let score = Math.random() * 2; // Add some randomness
                
                // Prioritize captures
                const target = this.board[move.to.row][move.to.col];
                if (target) {
                    score += pieceValues[target.type] * 10;
                }
                
                // Prefer center control
                if (move.to.row >= 3 && move.to.row <= 4 && move.to.col >= 3 && move.to.col <= 4) {
                    score += 5;
                }
                
                // Advance pawns
                if (move.piece.type === 'pawn') {
                    score += (7 - move.to.row);
                }

                if (score > bestScore) {
                    bestScore = score;
                    bestMove = move;
                }
            });

            selectedMove = bestMove;
        }

        // Make the selected move
        this.movePiece(selectedMove.from.row, selectedMove.from.col, selectedMove.to.row, selectedMove.to.col);
        this.renderBoard();
        this.switchPlayer();
        this.evaluateGameState();
    }

    selectSquare(row, col) {
        this.selectedSquare = { row, col };
        this.validMoves = this.getValidMoves(row, col);
        this.highlightSquares();
    }

    highlightSquares() {
        // Remove previous highlights
        document.querySelectorAll('.square').forEach(sq => {
            sq.classList.remove('selected', 'valid-move');
        });

        // Highlight selected square
        if (this.selectedSquare) {
            const selectedElement = document.querySelector(
                `[data-row="${this.selectedSquare.row}"][data-col="${this.selectedSquare.col}"]`
            );
            if (selectedElement) {
                selectedElement.classList.add('selected');
            }
        }

        // Highlight valid moves
        this.validMoves.forEach(move => {
            const moveElement = document.querySelector(
                `[data-row="${move.row}"][data-col="${move.col}"]`
            );
            if (moveElement) {
                moveElement.classList.add('valid-move');
            }
        });
    }

    getValidMoves(row, col, board = this.board) {
        const piece = board[row][col];
        if (!piece) return [];

        let moves = [];

        switch (piece.type) {
            case 'pawn':
                moves = this.getPawnMoves(row, col, piece.color, board);
                break;
            case 'rook':
                moves = this.getRookMoves(row, col, piece.color, board);
                break;
            case 'knight':
                moves = this.getKnightMoves(row, col, piece.color, board);
                break;
            case 'bishop':
                moves = this.getBishopMoves(row, col, piece.color, board);
                break;
            case 'queen':
                moves = this.getQueenMoves(row, col, piece.color, board);
                break;
            case 'king':
                moves = this.getKingMoves(row, col, piece.color, board);
                break;
        }

        // Only keep moves that do not leave own king in check
        const safeMoves = moves.filter(move => {
            const simulated = this.simulateMove(board, row, col, move.row, move.col);
            return !this.isInCheck(piece.color, simulated);
        });

        return safeMoves;
    }

    getPawnMoves(row, col, color, board = this.board) {
        const moves = [];
        const direction = color === 'white' ? -1 : 1;
        const startRow = color === 'white' ? 6 : 1;

        // Forward move
        if (this.isValidPosition(row + direction, col) && !board[row + direction][col]) {
            moves.push({ row: row + direction, col });

            // Double move from start
            if (row === startRow && !board[row + 2 * direction][col]) {
                moves.push({ row: row + 2 * direction, col });
            }
        }

        // Capture diagonally
        [-1, 1].forEach(offset => {
            const newRow = row + direction;
            const newCol = col + offset;
            if (this.isValidPosition(newRow, newCol)) {
                const target = board[newRow][newCol];
                if (target && target.color !== color) {
                    moves.push({ row: newRow, col: newCol });
                }
            }
        });

        return moves;
    }

    getRookMoves(row, col, color, board = this.board) {
        const moves = [];
        const directions = [[0, 1], [0, -1], [1, 0], [-1, 0]];

        directions.forEach(([dx, dy]) => {
            let newRow = row + dx;
            let newCol = col + dy;

            while (this.isValidPosition(newRow, newCol)) {
                const target = board[newRow][newCol];
                if (!target) {
                    moves.push({ row: newRow, col: newCol });
                } else {
                    if (target.color !== color) {
                        moves.push({ row: newRow, col: newCol });
                    }
                    break;
                }
                newRow += dx;
                newCol += dy;
            }
        });

        return moves;
    }

    getKnightMoves(row, col, color, board = this.board) {
        const moves = [];
        const knightMoves = [
            [2, 1], [2, -1], [-2, 1], [-2, -1],
            [1, 2], [1, -2], [-1, 2], [-1, -2]
        ];

        knightMoves.forEach(([dx, dy]) => {
            const newRow = row + dx;
            const newCol = col + dy;

            if (this.isValidPosition(newRow, newCol)) {
                const target = board[newRow][newCol];
                if (!target || target.color !== color) {
                    moves.push({ row: newRow, col: newCol });
                }
            }
        });

        return moves;
    }

    getBishopMoves(row, col, color, board = this.board) {
        const moves = [];
        const directions = [[1, 1], [1, -1], [-1, 1], [-1, -1]];

        directions.forEach(([dx, dy]) => {
            let newRow = row + dx;
            let newCol = col + dy;

            while (this.isValidPosition(newRow, newCol)) {
                const target = board[newRow][newCol];
                if (!target) {
                    moves.push({ row: newRow, col: newCol });
                } else {
                    if (target.color !== color) {
                        moves.push({ row: newRow, col: newCol });
                    }
                    break;
                }
                newRow += dx;
                newCol += dy;
            }
        });

        return moves;
    }

    getQueenMoves(row, col, color, board = this.board) {
        return [...this.getRookMoves(row, col, color, board), ...this.getBishopMoves(row, col, color, board)];
    }

    getKingMoves(row, col, color, board = this.board) {
        const moves = [];
        const directions = [
            [0, 1], [0, -1], [1, 0], [-1, 0],
            [1, 1], [1, -1], [-1, 1], [-1, -1]
        ];

        directions.forEach(([dx, dy]) => {
            const newRow = row + dx;
            const newCol = col + dy;

            if (this.isValidPosition(newRow, newCol)) {
                const target = board[newRow][newCol];
                if (!target || target.color !== color) {
                    moves.push({ row: newRow, col: newCol });
                }
            }
        });

        return moves;
    }

    isValidPosition(row, col) {
        return row >= 0 && row < 8 && col >= 0 && col < 8;
    }

    cloneBoard(board) {
        return board.map(row => row.map(cell => (cell ? { ...cell } : null)));
    }

    simulateMove(board, fromRow, fromCol, toRow, toCol) {
        const newBoard = this.cloneBoard(board);
        const piece = newBoard[fromRow][fromCol];
        newBoard[toRow][toCol] = piece;
        newBoard[fromRow][fromCol] = null;

        // Handle pawn promotion for simulation consistency
        if (piece && piece.type === 'pawn') {
            if ((piece.color === 'white' && toRow === 0) || (piece.color === 'black' && toRow === 7)) {
                newBoard[toRow][toCol] = {
                    type: 'queen',
                    color: piece.color,
                    symbol: piece.color === 'white' ? '♕' : '♛'
                };
            }
        }

        return newBoard;
    }

    findKingPosition(board, color) {
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const piece = board[r][c];
                if (piece && piece.type === 'king' && piece.color === color) {
                    return { row: r, col: c };
                }
            }
        }
        return null;
    }

    isSquareAttacked(board, row, col, attackerColor) {
        // Pawn attacks
        const pawnDir = attackerColor === 'white' ? -1 : 1;
        const pawnRow = row + pawnDir;
        for (const c of [col - 1, col + 1]) {
            if (this.isValidPosition(pawnRow, c)) {
                const p = board[pawnRow][c];
                if (p && p.type === 'pawn' && p.color === attackerColor) {
                    return true;
                }
            }
        }

        // Knights
        const knightMoves = [
            [2, 1], [2, -1], [-2, 1], [-2, -1],
            [1, 2], [1, -2], [-1, 2], [-1, -2]
        ];
        for (const [dr, dc] of knightMoves) {
            const r = row + dr;
            const c = col + dc;
            if (this.isValidPosition(r, c)) {
                const p = board[r][c];
                if (p && p.type === 'knight' && p.color === attackerColor) {
                    return true;
                }
            }
        }

        // Directions for rook/queen (straight) and bishop/queen (diagonal)
        const straightDirs = [[1,0], [-1,0], [0,1], [0,-1]];
        const diagDirs = [[1,1], [1,-1], [-1,1], [-1,-1]];

        const scan = (dirs, attackers) => {
            for (const [dr, dc] of dirs) {
                let r = row + dr;
                let c = col + dc;
                while (this.isValidPosition(r, c)) {
                    const p = board[r][c];
                    if (p) {
                        if (p.color === attackerColor && attackers.includes(p.type)) return true;
                        break;
                    }
                    r += dr;
                    c += dc;
                }
            }
            return false;
        };

        if (scan(straightDirs, ['rook', 'queen'])) return true;
        if (scan(diagDirs, ['bishop', 'queen'])) return true;

        // King attacks (adjacent squares)
        const kingDirs = [...straightDirs, ...diagDirs];
        for (const [dr, dc] of kingDirs) {
            const r = row + dr;
            const c = col + dc;
            if (this.isValidPosition(r, c)) {
                const p = board[r][c];
                if (p && p.type === 'king' && p.color === attackerColor) {
                    return true;
                }
            }
        }

        return false;
    }

    isInCheck(color, board = this.board) {
        const kingPos = this.findKingPosition(board, color);
        if (!kingPos) return false;
        const opponent = color === 'white' ? 'black' : 'white';
        return this.isSquareAttacked(board, kingPos.row, kingPos.col, opponent);
    }

    hasAnyLegalMove(color, board = this.board) {
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const piece = board[r][c];
                if (piece && piece.color === color) {
                    const moves = this.getValidMoves(r, c, board);
                    if (moves.length > 0) return true;
                }
            }
        }
        return false;
    }

    evaluateGameState() {
        if (this.gameOver) return;
        const current = this.currentPlayer;
        const opponent = current === 'white' ? 'black' : 'white';
        const inCheck = this.isInCheck(current);
        const hasMoves = this.hasAnyLegalMove(current);

        const statusElement = document.getElementById('game-status');

        if (!hasMoves) {
            if (inCheck) {
                statusElement.textContent = `${opponent.charAt(0).toUpperCase() + opponent.slice(1)} wins by checkmate!`;
                this.endGame(opponent);
            } else {
                statusElement.textContent = 'Stalemate. Draw.';
                this.gameOver = true;
            }
            return;
        }

        if (inCheck) {
            statusElement.textContent = `${current.charAt(0).toUpperCase() + current.slice(1)} is in check.`;
        } else {
            statusElement.textContent = '';
        }
    }

    movePiece(fromRow, fromCol, toRow, toCol) {
        const piece = this.board[fromRow][fromCol];
        const capturedPiece = this.board[toRow][toCol];

        if (capturedPiece) {
            this.capturedPieces[capturedPiece.color].push(capturedPiece.symbol);
            this.updateCapturedPieces();
            
            // Check for king capture
            if (capturedPiece.type === 'king') {
                this.endGame(this.currentPlayer);
            }
        }

        this.board[toRow][toCol] = piece;
        this.board[fromRow][fromCol] = null;

        // Pawn promotion
        if (piece.type === 'pawn') {
            if ((piece.color === 'white' && toRow === 0) || (piece.color === 'black' && toRow === 7)) {
                this.board[toRow][toCol] = {
                    type: 'queen',
                    color: piece.color,
                    symbol: piece.color === 'white' ? '♕' : '♛'
                };
            }
        }
    }

    switchPlayer() {
        this.currentPlayer = this.currentPlayer === 'white' ? 'black' : 'white';
        this.updateGameInfo();
    }

    updateGameInfo() {
        const turnIndicator = document.getElementById('current-turn');
        turnIndicator.textContent = `${this.currentPlayer.charAt(0).toUpperCase() + this.currentPlayer.slice(1)}'s Turn`;
        turnIndicator.style.color = this.currentPlayer === 'white' ? '#667eea' : '#333';
    }

    updateCapturedPieces() {
        const capturedWhite = document.getElementById('captured-white');
        const capturedBlack = document.getElementById('captured-black');

        capturedWhite.textContent = this.capturedPieces.white.join(' ');
        capturedBlack.textContent = this.capturedPieces.black.join(' ');
    }

    endGame(winner) {
        this.gameOver = true;
        const statusElement = document.getElementById('game-status');
        statusElement.textContent = `${winner.charAt(0).toUpperCase() + winner.slice(1)} Wins!`;
        
        // Add celebration effect
        setTimeout(() => {
            alert(`Checkmate! ${winner.charAt(0).toUpperCase() + winner.slice(1)} wins the game!`);
        }, 100);
    }

    resetGameOnly() {
        this.board = [];
        this.currentPlayer = 'white';
        this.selectedSquare = null;
        this.validMoves = [];
        this.capturedPieces = { white: [], black: [] };
        this.gameOver = false;
        document.getElementById('game-status').textContent = '';
        this.initializeBoard();
        this.renderBoard();
        this.updateCapturedPieces();
    }

    resetGame() {
        this.board = [];
        this.currentPlayer = 'white';
        this.selectedSquare = null;
        this.validMoves = [];
        this.capturedPieces = { white: [], black: [] };
        this.gameOver = false;
        this.gameMode = null;
        this.difficulty = null;
        document.getElementById('game-status').textContent = '';
    }
}

// Initialize the game when page loads
document.addEventListener('DOMContentLoaded', () => {
    new ChessGame();
});
