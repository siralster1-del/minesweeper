class MinesweeperGame {
    constructor() {
        this.board = [];
        this.gameBoard = document.getElementById('game-board');
        this.mineCountElement = document.getElementById('mine-count');
        this.timerElement = document.getElementById('timer');
        this.gameStatusElement = document.getElementById('game-status');
        this.boardSizeSelect = document.getElementById('board-size');
        this.customSizeGroup = document.getElementById('custom-size-group');
        this.customWidthInput = document.getElementById('custom-width');
        this.customHeightInput = document.getElementById('custom-height');
        this.mineCountInput = document.getElementById('mine-count-input');
        this.newGameBtn = document.getElementById('new-game-btn');
        this.resetBtn = document.getElementById('reset-btn');
        this.hintBtn = document.getElementById('hint-btn');
        
        this.width = 16;
        this.height = 16;
        this.mineCount = 40;
        this.gameStarted = false;
        this.gameOver = false;
        this.timer = 0;
        this.timerInterval = null;
        this.flaggedCount = 0;
        this.revealedCount = 0;
        
        this.initializeEventListeners();
        this.initializeGame();
    }
    
    initializeEventListeners() {
        this.newGameBtn.addEventListener('click', () => this.startNewGame());
        this.resetBtn.addEventListener('click', () => this.startNewGame());
        this.hintBtn.addEventListener('click', () => this.giveHint());
        
        this.boardSizeSelect.addEventListener('change', () => this.handleBoardSizeChange());
        this.mineCountInput.addEventListener('change', () => this.updateMineCount());
        this.customWidthInput.addEventListener('change', () => this.updateCustomSize());
        this.customHeightInput.addEventListener('change', () => this.updateCustomSize());
    }
    
    handleBoardSizeChange() {
        const selectedSize = this.boardSizeSelect.value;
        
        if (selectedSize === 'custom') {
            this.customSizeGroup.style.display = 'flex';
            this.width = parseInt(this.customWidthInput.value);
            this.height = parseInt(this.customHeightInput.value);
        } else {
            this.customSizeGroup.style.display = 'none';
            this.width = parseInt(selectedSize);
            this.height = parseInt(selectedSize);
        }
        
        this.updateMineCount();
    }
    
    updateCustomSize() {
        this.width = parseInt(this.customWidthInput.value);
        this.height = parseInt(this.customHeightInput.value);
        this.updateMineCount();
    }
    
    updateMineCount() {
        const maxMines = Math.floor(this.width * this.height * 0.3); // Max 30% of cells
        const currentMines = parseInt(this.mineCountInput.value);
        
        if (currentMines > maxMines) {
            this.mineCountInput.value = maxMines;
            this.mineCount = maxMines;
        } else {
            this.mineCount = currentMines;
        }
        
        this.mineCountElement.textContent = this.mineCount;
    }
    
    initializeGame() {
        this.createBoard();
        this.renderBoard();
        this.updateMineCount();
    }
    
    createBoard() {
        this.board = [];
        for (let row = 0; row < this.height; row++) {
            this.board[row] = [];
            for (let col = 0; col < this.width; col++) {
                this.board[row][col] = {
                    isMine: false,
                    isRevealed: false,
                    isFlagged: false,
                    neighborMines: 0
                };
            }
        }
    }
    
    renderBoard() {
        this.gameBoard.innerHTML = '';
        this.gameBoard.style.gridTemplateColumns = `repeat(${this.width}, 1fr)`;
        
        for (let row = 0; row < this.height; row++) {
            for (let col = 0; col < this.width; col++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.row = row;
                cell.dataset.col = col;
                
                cell.addEventListener('click', (e) => this.handleCellClick(e, row, col));
                cell.addEventListener('contextmenu', (e) => this.handleRightClick(e, row, col));
                
                this.gameBoard.appendChild(cell);
            }
        }
    }
    
    startNewGame() {
        this.gameStarted = false;
        this.gameOver = false;
        this.timer = 0;
        this.flaggedCount = 0;
        this.revealedCount = 0;
        
        this.stopTimer();
        this.timerElement.textContent = '000';
        this.gameStatusElement.textContent = 'Ready';
        
        this.createBoard();
        this.renderBoard();
        this.updateMineCount();
    }
    
    placeMines(firstClickRow, firstClickCol) {
        let minesPlaced = 0;
        const maxMines = Math.min(this.mineCount, this.width * this.height - 9); // Leave space around first click
        
        while (minesPlaced < maxMines) {
            const row = Math.floor(Math.random() * this.height);
            const col = Math.floor(Math.random() * this.width);
            
            // Don't place mine on first click or adjacent cells
            if (Math.abs(row - firstClickRow) <= 1 && Math.abs(col - firstClickCol) <= 1) {
                continue;
            }
            
            if (!this.board[row][col].isMine) {
                this.board[row][col].isMine = true;
                minesPlaced++;
            }
        }
        
        this.calculateNeighborMines();
    }
    
    calculateNeighborMines() {
        for (let row = 0; row < this.height; row++) {
            for (let col = 0; col < this.width; col++) {
                if (!this.board[row][col].isMine) {
                    this.board[row][col].neighborMines = this.countNeighborMines(row, col);
                }
            }
        }
    }
    
    countNeighborMines(row, col) {
        let count = 0;
        for (let i = -1; i <= 1; i++) {
            for (let j = -1; j <= 1; j++) {
                const newRow = row + i;
                const newCol = col + j;
                if (newRow >= 0 && newRow < this.height && 
                    newCol >= 0 && newCol < this.width && 
                    this.board[newRow][newCol].isMine) {
                    count++;
                }
            }
        }
        return count;
    }
    
    handleCellClick(event, row, col) {
        if (this.gameOver || this.board[row][col].isRevealed || this.board[row][col].isFlagged) {
            return;
        }
        
        if (!this.gameStarted) {
            this.startGame(row, col);
        }
        
        this.revealCell(row, col);
    }
    
    handleRightClick(event, row, col) {
        event.preventDefault();
        
        if (this.gameOver || this.board[row][col].isRevealed) {
            return;
        }
        
        this.toggleFlag(row, col);
    }
    
    startGame(firstClickRow, firstClickCol) {
        this.gameStarted = true;
        this.placeMines(firstClickRow, firstClickCol);
        this.startTimer();
        this.gameStatusElement.textContent = 'Playing';
    }
    
    startTimer() {
        this.timerInterval = setInterval(() => {
            this.timer++;
            this.timerElement.textContent = this.timer.toString().padStart(3, '0');
        }, 1000);
    }
    
    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }
    
    revealCell(row, col) {
        if (this.board[row][col].isRevealed || this.board[row][col].isFlagged) {
            return;
        }
        
        this.board[row][col].isRevealed = true;
        this.revealedCount++;
        
        const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
        cell.classList.add('revealed');
        
        if (this.board[row][col].isMine) {
            this.gameOver = true;
            this.stopTimer();
            this.revealAllMines();
            this.gameStatusElement.textContent = 'Game Over';
            this.showGameOverModal(false);
            return;
        }
        
        if (this.board[row][col].neighborMines > 0) {
            cell.textContent = this.board[row][col].neighborMines;
            cell.classList.add(`number-${this.board[row][col].neighborMines}`);
        } else {
            // Reveal adjacent cells if no neighboring mines
            for (let i = -1; i <= 1; i++) {
                for (let j = -1; j <= 1; j++) {
                    const newRow = row + i;
                    const newCol = col + j;
                    if (newRow >= 0 && newRow < this.height && 
                        newCol >= 0 && newCol < this.width) {
                        this.revealCell(newRow, newCol);
                    }
                }
            }
        }
        
        this.checkWinCondition();
    }
    
    toggleFlag(row, col) {
        const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
        
        if (this.board[row][col].isFlagged) {
            this.board[row][col].isFlagged = false;
            cell.classList.remove('flagged');
            cell.textContent = '';
            this.flaggedCount--;
        } else {
            this.board[row][col].isFlagged = true;
            cell.classList.add('flagged');
            cell.textContent = '🚩';
            this.flaggedCount++;
        }
        
        this.updateMineCountDisplay();
    }
    
    updateMineCountDisplay() {
        const remainingMines = this.mineCount - this.flaggedCount;
        this.mineCountElement.textContent = remainingMines;
    }
    
    revealAllMines() {
        for (let row = 0; row < this.height; row++) {
            for (let col = 0; col < this.width; col++) {
                if (this.board[row][col].isMine) {
                    const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
                    cell.classList.add('mine', 'revealed');
                    cell.textContent = '💣';
                }
            }
        }
    }
    
    checkWinCondition() {
        const totalCells = this.width * this.height;
        const nonMineCells = totalCells - this.mineCount;
        
        if (this.revealedCount === nonMineCells) {
            this.gameOver = true;
            this.stopTimer();
            this.gameStatusElement.textContent = 'You Win!';
            this.showGameOverModal(true);
        }
    }
    
    showGameOverModal(won) {
        const modal = document.createElement('div');
        modal.className = `game-over ${won ? 'win' : 'lose'}`;
        
        const content = document.createElement('div');
        content.className = 'game-over-content';
        
        content.innerHTML = `
            <h2>${won ? '🎉 Congratulations!' : '💥 Game Over!'}</h2>
            <p>${won ? `You won in ${this.timer} seconds!` : 'Better luck next time!'}</p>
            <button class="btn btn-primary" onclick="this.parentElement.parentElement.remove()">Play Again</button>
        `;
        
        modal.appendChild(content);
        document.body.appendChild(modal);
        
        // Auto-remove modal after 5 seconds
        setTimeout(() => {
            if (modal.parentElement) {
                modal.remove();
            }
        }, 5000);
    }
    
    giveHint() {
        if (this.gameOver || !this.gameStarted) {
            return;
        }
        
        // Find a safe cell to reveal
        for (let row = 0; row < this.height; row++) {
            for (let col = 0; col < this.width; col++) {
                if (!this.board[row][col].isRevealed && 
                    !this.board[row][col].isFlagged && 
                    !this.board[row][col].isMine) {
                    this.revealCell(row, col);
                    return;
                }
            }
        }
    }
}

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new MinesweeperGame();
});