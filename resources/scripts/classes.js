import { render, renderWinState, renderLoseState } from "./rendering.js";
import { determineActiveCells, runChecks } from "./solvability.js";
import { removeVal } from "./abstract.js"; 

// Class: Board
// Represents an arrangement of cells constituting a Minesweeper board.
class Board {
  /* size is the number of cells along each side of the board. 
  mineDivisor is the number n such that 1/n cells on the board contain mines.*/
  constructor(size, mineDivisor) {   
    this.size = size;
    this.mineDivisor = mineDivisor;
    this.locations = Array.from(Array(size * size).keys());
    this.cells = this.populateCells(size);
   
    // neighborMap: maps cell indices to adjacent cells' indices 
    this.neighborMap = this.populateNeighborMap(this.cells, size);
    
    // mines: array of mine locations (populated later)
    this.mines = [];
  }

  // ===--- Class Methods ---===

  // int * int -> object
  /* Produces an object that represents a single cell on a Minesweeper board, 
  taking x and y to represent its x-y coordinates. */
  createCell(x, y) {
    return {
        x: x,
        y: y,
        number: 0,
        flagged: false,
        mined: false,
        revealed: false,
        touchingMinesRemaining: 0,
      };
  }

  // int -> object array
  // Returns an array of Cell objects for a board with side lengths of size
  populateCells(size) {
    const result = [];
    for (let i = 1; i <= size; i++) {
      for (let j = 1; j <= size; j++) {
        result.push(this.createCell(i, j));
    }};
    
    return result; 
  }

  // object array * int -> 
  /* Returns a map of neighbors from an array arr of cell objects (mapping each 
  to an array of indices of neighboring cells) */
  populateNeighborMap(arr, size) {
    const result = {};
    const l = arr.length;
    for (let i = 0; i < l; i++) {
      result[i] = [];
      const x = arr[i].x;
      const y = arr[i].y;
      const xMax = x + 1;
      const yMax = y + 1;
      for (let j = x - 1; j <= xMax; j++) {
        if (j > 0 && j <= size) {
          for (let k = y - 1; k <= yMax; k++) {
            if (k > 0 && k <= size && !(j === x && k === y)) {
              
              /* Explanation: size * (j - 1) + k - 1 gives the index of cell 
              whose x-y coordinates are (j, k) */
              
              result[i].push(size * (j - 1) + k - 1);
            }
          }
        }
      }
    }
    return result; 
  }

  // int * int -> int array
  /* Generates an array of randomized mine location indices
  Prevents any cell adjacent to exclude from being selected. */
  genMineIndices(exclude) {
    const locations = this.locations;
    const numberOfMines = Math.floor(locations.length / this.mineDivisor);  
    const result = [];
    let selectedFrom = [...locations];
    selectedFrom.splice(exclude, 1);
    for (let n of this.neighborMap[exclude]) {
      selectedFrom = selectedFrom.filter(x => x !== n);
    }

    for (let i = 0; i < numberOfMines; i++) {
      const selectionIdx = Math.floor(Math.random() * selectedFrom.length);
      result.push(selectedFrom[selectionIdx]);
      selectedFrom.splice(selectionIdx, 1);
    }

    return result;
  }

  // int -> int
  // Returns the number of mines touching a cell index
  getMinesTouching(i) {
    const neighbors = this.neighborMap[i];
    return neighbors.filter(n => this.cells[n].mined).length;
  }

  // int array -> None
  /* Sets the board's .mine property to arr, and updates each cell's .mined 
  value so that every cell is marked as mined if and only if its location is one
  of the values in arr. Then updates every cell's .number values. */
  addMines(arr) {
    this.mines = arr;
    const l = this.cells.length;
    for (let i = 0; i < l; i++) {
      if (arr.includes(i)) {
        this.cells[i].mined = true;
      } else {
        this.cells[i].mined = false;
      }
    } 

    this.cells.keys().forEach(c => {
      this.cells[c].number = this.getMinesTouching(c);
      this.cells[c].touchingMinesRemaining = this.cells[c].number;
    })
  }
}

// Class: Game
// Represents an actual or hidden test game of Minesweeper.
class Game {
  constructor(size, mineDivisor) {
    this.board = new Board(size, mineDivisor);
    this.revealedCounter = 0;
    this.winState = "in progress"; // Either "in progress", "won", or "lost"

    const cellCount = this.board.cells.length;
    this.numberOfMines = Math.floor(cellCount / mineDivisor);
    this.unminedCellCount = cellCount - this.board.mines.length;
    
    //An "open" neighbor is an adjacent cell that is not flagged or revealed
    this.openNeighbors = structuredClone(this.board.neighborMap); 
    this.revealedNeighbors = {};
    for (let i of this.board.cells.keys()) {
      this.revealedNeighbors[i] = [];
    }
    
    /* activeCells is used for checking solvability. Each key represents a 
    revealed cell with open neighbors, and its value is an array of sub-arrays 
    representing each possible arrangement of mines next to that cell (excluding
     mines that have been flagged). */
    this.activeCells = {}; 

    this.started = false;
    this.realGame = false; // Set to false for unrendered test games
    this.noGuessing = true; // Whether or not the game ensures solvability 
  }

  // ===--- Game Methods ---===

    // --- Helper Methods ---

  // int -> None
  // Removes cell i from a mapping of cells to cell neighbors
  removeFromMap(i, map) {
    for (let n of this.board.neighborMap[i]) {
      removeVal(i, map[n]);
    }
  }

  // int -> None
  // Adds cell i from a mapping of cells to cell neighbors 
  addToMap(i, map) {
    for (let n of this.board.neighborMap[i]) {
      map[n].push(i);
    }
  }
    
  // int -> int array
  // Returns an array of all of i's neighbors that are not flagged or revealed
  getOpenNeighbors(i) {
    let result = [];
    for (let n of this.board.neighborMap[i]) {
      const neighbor = this.board.cells[n];
      if (!neighbor.flagged && !neighbor.revealed) result.push(n);
    }
  }

  // --- Methods for Updating Game Properties ---

  // None -> None
  // Checks to see if the game is won.
  updateWinState() {
    if (this.revealedCounter === this.unminedCellCount) {
      this.winState = "won";
      renderWinState(this);
    }
  }

  // int -> None
  // Makes the first move, setting mines on the board
  firstMove(exclude) {
    let testMines = this.board.genMineIndices(exclude);
    const mineCount = document.getElementById("mine_counter");
    while (this.noGuessing) {
      /* The solvable method will return [] if test copy of the board is 
      unsolvable. Otherwise, returns the updated mine list. */ 
      let newMines = solvable(exclude, testMines, this) 
      if (newMines.length > 0) {
        testMines = newMines; //Updating testMines after solvability check.
        break;
      } else {
        testMines = this.board.genMineIndices(exclude);
      }
    }

    this.board.addMines(testMines);
    this.numberOfMines = testMines.length;
    this.unminedCellCount = this.board.size * this.board.size - 
    this.numberOfMines;
    mineCount.innerHTML = "Mines Remaining: " + this.numberOfMines.toString();
    this.reveal(exclude);
    this.started = true;
  }

  // int * int -> None
  /* Reveals the selected cell with index i. Calls updateWinState. Automatically
   reveals all neighbors if cell has no neighboring mines. */
  reveal(i) {
    const cell = this.board.cells[i];
    if (cell.flagged) { 
      this.placeFlag(i);
    } else if (cell.mined) { 
      this.winState = "lost";
      this.revealMines();
      renderLoseState(this);
    } else if (!cell.revealed) { 
      cell.revealed = true;
      this.revealedCounter++;
      this.removeFromMap(i, this.openNeighbors);
      this.addToMap(i, this.revealedNeighbors);
      this.updateWinState();
      if (this.realGame) { 
        render(i, this); 
      } else { 
        determineActiveCells(this); 
      }

      if (cell.number === 0) this.revealNeighbors(i);
    }
  }

  // int -> None
  // Calls reveal on all unrevealed, unflagged neighbors of i
  revealNeighbors(i) {
    this.board.neighborMap[i].forEach(n => {
      if (!this.board.cells[n].revealed && !this.board.cells[n].flagged) {
        this.reveal(n);
      }
    });
  }

  // int -> None
  /* Checks to see if i or any neighbors of i that are not flagged contain 
  mines. If so, reveal them immediately and stop. Otherwise, call 
  revealNeighbors on i and call reveal on i. */
  revealNeighborsCheck(i) {
    if (this.board.cells[i].mined) {
      this.reveal(i);
    } else {
      for (let n of this.board.neighborMap[i]) {
        if (this.board.cells[n].mined && !this.board.cells[n].flagged) {
          this.reveal(n);
          return;
        }
      }
    }

    this.reveal(i);
    this.revealNeighbors(i);
  }

  // None -> None
  // Reveals and renders all mines on the board (for when game is lost).
  revealMines() {
    const l = this.board.cells.length;
    for (let i = 0; i < l; i++) {
      if (this.board.cells[i].mined) {
        this.board.cells[i].revealed = true;
        render(i, this);
      }
    }
  }

  // int * int -> None
  // Places a flag on the cell i if currently unflagged, otherwise removes flag.
  placeFlag(i) {
    const cell = this.board.cells[i];
    if (!cell.revealed) {
      const neighbors = this.board.neighborMap[i];
      if (!cell.flagged) {
        neighbors.forEach(n => this.board.cells[n].touchingMinesRemaining--);
        this.numberOfMines -= 1;
        this.removeFromMap(i, this.openNeighbors);
        cell.flagged = true;
      } else {
        neighbors.forEach(n => this.board.cells[n].touchingMinesRemaining++);
        this.numberOfMines += 1;
        this.addToMap(i, this.openNeighbors);
        cell.flagged = false;
      }

      if (this.realGame) { 
        render(i, this); 
        const counterDisplay = document.getElementById("mine_counter");
        const numToDisplay = this.numberOfMines.toString();
        counterDisplay.innerHTML = "Mines Remaining: " + numToDisplay;
      } else { 
        determineActiveCells(this); 
      }
    }
  }
}

// --- Other Functions ---

// int * int array * Game -> int array
/* Creates hidden copy of the game with i as the initial revealed cell and 
mines as a list of mine locations. Returns an updated list of mine locations 
if board is solvable, [] otherwise. */
function solvable(i, mines, game) {
  const testGame = new Game(game.board.size, game.board.mineDivisor);
  testGame.board.addMines(mines);
  testGame.reveal(i);
  let checksComplete = false;
  while (!checksComplete) {
    checksComplete = runChecks(testGame);
  }

  if (testGame.numberOfMines === 0) {
    return testGame.board.mines;
  } else {
    return [];
  }
}

export { Game };
