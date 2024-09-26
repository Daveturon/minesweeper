// ===--- Abstract Functions ---===

// 'a * 'a array -> 'a
// Mutates arr by removing the first instance of val (if any).
const removeVal = (val, arr) => {
  const idx = arr.findIndex(x => x === val);
  if (idx >= 0) {
    return arr.splice(idx, 1);
  }
}

// 'a array * int -> 'a array array
/* Returns an array of every possible n-length array of elements in arr (without 
duplicates). Raises exception if n < 0 or n > arr.length. */
const getPermutations = (arr, n) => {
  if (n < 0 || n > arr.length) {
    throw Error(`Bad argument: getPermutations called with n=${n}.\
    n must be between 0 and arr.length.`);
  }  
  switch (n) { 
    case arr.length: // Simple case 1
      return [arr];
    case 0: // Simple case 2
      return [];
    case 1: // Simple case 3
      const result = [];
      const l = arr.length;
      for (let i = 0; i < l; i++) { result.push([arr[i]]); } 
      return result;
    default: // harder case: if n > 1 and n < arr.length

      // 'a array -> 'a array array
      // Returns each possible pairing of elements in arr (without duplicates). 
      const getPairs = (arr) => {
        const result = [];
        const l = arr.length;
        for (let i = 0; i < l - 1; i++) {
          for (let j = i + 1; j < l; j++) {
            result.push([arr[i], arr[j]]);
          }
        }
        return result;
      }

      const pairs = getPairs(arr); 
      if (n === 2) { 
        return pairs; 
      } else { 
        const combine = (subs) => {
          const newSubs = [];
          const l = subs.length;
          const lastSubIdx = subs[0].length - 1;
          for (let i = 0; i < l; i++) {
            const subArray = subs[i];
            const lastInSub = subArray[lastSubIdx];
            const pairsToUse = pairs.filter(x => x[0] === lastInSub);
            pairsToUse.forEach(x => newSubs.push(subArray.concat([x[1]])));        
          }
          if (newSubs[0].length === n) { 
            return newSubs;
          } else {
            return combine(newSubs); 
          }
        }
        return combine(pairs);
      }     
  }
}


// ===--- Classes ---===

// Class: Cell
// Represents a single cell on a Minesweeper board.
class Cell {
  constructor(x, y) {
    this._x = x;
    this._y = y;
    this._number = 0; // Represents the number of neighboring mines. 
    this._flagged = false;
    this._mined = false;
    this._revealed = false;
    this._touchingMinesRemaining = 0;
    
    // Getters and Setters
    this._props = { x: this._x, y: this._y, number: this._number, 
      flagged: this._flagged, mined: this._mined, revealed:this._revealed };
    for (const key in this._props) {
      Object.defineProperty(this, key, {
        get() {
          return this._props[key];
        },
        set(val) {
          this._props[key] = val;
        },
        enumerable: true
      });
    }
  }
}

// Class: Board
// Represents an arrangement of cells constituting a Minesweeper board.
class Board {
  /* size is the number of cells along each side of the board. 
  mineDivisor is the number n such that 1/n cells on the board contain mines.*/
  constructor(size, mineDivisor) {   
    this._size = size;
    this._mineDivisor = mineDivisor;
    this._locations = (function(size) { 
      const locations = [];
      const l = size * size;
      for (let i = 0; i < l; i++) {
        locations.push(i);
      }
      return locations;
    })(size);

    // array of cells in the board. Index of cells in this array is hereafter 
    //used to identify cells.
    this._cells = (function(size) {
      const result = [];
      for (let i = 1; i <= size; i++) {
        for (let j = 1; j <= size; j++) {
          result.push(new Cell(i, j));
      }};
      return result; })(size);
   
    // _neighborMap: maps cell indices to adjacent cells' indices 
    this._neighborMap = (function(arr, size) {
      const result = {};
      const l = arr.length;
      for (let i = 0; i < l; i++) {
        result[i] = [];
        const x = arr[i]._x;
        const y = arr[i]._y;
        const xMax = x + 1;
        const yMax = y + 1;
        for (let j = x - 1; j <= xMax; j++) {
          if (j > 0 && j <= size) {
            for (let k = y - 1; k <= yMax; k++) {
              if (k > 0 && k <= size && !(j === x && k === y)) {
                
                /* size * (j - 1) + k - 1 gets the index of cell whose x-y 
                coordinates are (j, k) */
                
                result[i].push(size * (j - 1) + k - 1);
              }
            }
          }
        }
      }
      return result; })(this._cells, size);
    
    // _mines: array of mine locations (populated later)
    this._mines = [];
      
    // Getters and Setters
    this._props = { cells: this._cells, neighborMap: this._neighborMap };
    for (const key in this._props) {
      Object.defineProperty(this, key, {
        get() {
          return this._props[key];
        },
        set(val) {
          this._props[key] = val;
        },
        enumerable: true
      }); 
    }
  }


  // ===--- Class Methods ---===

  // int * int -> int array
  /* Generates an array of randomized mine location indices
  Prevents any cell adjacent to exclude from being selected. */
  genMineIndices(exclude) {
    const locations = this._locations;
    const numberOfMines = Math.floor(locations.length / this._mineDivisor);  
    const result = [];
    let selectedFrom = [...locations];

    selectedFrom.splice(exclude, 1);
    for (let n of this._neighborMap[exclude]) {
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
    let counter = 0;
    const neighborIndices = this._neighborMap[i];

    for (let n of neighborIndices) {
      if (this._cells[n]._mined) {
        counter++;
      } 
    } 
    return counter;
  }

  // int array -> None
  /* Sets the board's ._mine property to arr, and updates each cell's ._mined 
  value so that every cell is marked as mined if and only if its location is one
  of the values in arr. Then updates every cell's ._number values. */
  addMines(arr) {
    this._mines = arr;
    const l = this._cells.length;
    for (let i = 0; i < l; i++) {
      if (arr.includes(i)) {
        this._cells[i]._mined = true;
      } else {
        this._cells[i]._mined = false;
      }
    } 
    for (let c of this._locations) {
      const numMines = this.getMinesTouching(c);
      this._cells[c]._number = numMines;
      this._cells[c]._touchingMinesRemaining = numMines; 
    }
  }
}

// Class: Game
// Represents a given game of Minesweeper.
class Game {
  constructor(size, mineDivisor) {
    this._board = new Board(size, mineDivisor);
    this._revealedCounter = 0;
    this._winState = "in progress"; // Either "in progress", "won", or "lost"

    const cellCount = this._board._locations.length;
    this._numberOfMines = Math.floor(cellCount / mineDivisor);
    this._unminedCellCount = cellCount - this._board._mines.length;
    
    //An "open" neighbor is an adjacent cell that is not flagged or revealed
    this._openNeighbors = structuredClone(this._board._neighborMap); 
    this._revealedNeighbors = {};
    for (let i of this._board._locations) {
      this._revealedNeighbors[i] = [];
    }
    
    /* activeCells is used for checking solvability. Each key represents a 
    revealed cell with open neighbors, and its value is an array of sub-arrays 
    representing each possible arrangement of mines next to that cell (excluding
     mines that have been flagged). */
    this._activeCells = {}; 

    this._started = false;
    this._realGame = false; // Set to false for unrendered test games
    this._noGuessing = true; // Whether or not the game ensures solvability 

     // Getters and Setters
     if (this._realGame) {
      this._props = { board: this._board, revealedCounter : 
      this._revealedCounter, winState : this._winState, numberOfMines : 
      this._numberOfMines, unminedCellCount: this._unminedCellCount, 
      openNeighbors : this._openNeighbors, revealedNeighbors : 
      this._revealedNeighbors, activeCells : this._activeCells, started : 
      this._started, realGame : this._realGame, noGuessing : this._noGuessing };
      for (const key in this._props) {
        Object.defineProperty(this, key, {
          get() {
            return this._props[key];
          },
          set(val) {
            this._props[key] = val;
          },
          enumerable: true
        }); 
      }
    } 
  }

  // ===--- Game Methods ---===

  // --- Abstract Helper Methods ---

  // int -> None
  // Removes cell i from a mapping of cells to cell neighbors
  removeFromMap(i, map) {
    for (let n of this._board._neighborMap[i]) {
      removeVal(i, map[n]);
    }
  }

  // int -> None
  // Adds cell i from a mapping of cells to cell neighbors 
  addToMap(i, map) {
    for (let n of this._board._neighborMap[i]) {
      map[n].push(i);
    }
  }
    
  // int -> int array
  // Returns an array of all of i's neighbors that are not flagged or revealed
  getOpenNeighbors(i) {
    let result = [];
    for (let n of this._board._neighborMap[i]) {
      const neighbor = this._board._cells[n];
      if (!neighbor._flagged && !neighbor._revealed) {
        result.push(n);
      }
    }
  }

  // --- Methods for Updating Game Properties ---

  // None -> None
  // Checks to see if the game is won.
  updateWinState() {
    if (this._revealedCounter === this._unminedCellCount) {
      this._winState = "won";
      this.renderWinState();
    }
  }

  // int -> None
  // Makes the first move, setting mines on the board
  firstMove(exclude) {
    let testMines = this._board.genMineIndices(exclude); 
    while (this._noGuessing) {
      /* The solvable method will return [] if test copy of the board is 
      unsolvable. Otherwise, returns the updated mine list. */ 
      let newMines = this.solvable(exclude, testMines) 
      if (newMines.length > 0) {
        testMines = newMines; //Updating testMines after solvability check.
        break;
      } else {
        testMines = this._board.genMineIndices(exclude);
      }
    }
    this._board.addMines(testMines);
    this._numberOfMines = testMines.length;
    this._unminedCellCount = this._board._size * this._board._size - 
    this._numberOfMines;
    document.getElementById("mine_counter").innerHTML = "Mines Remaining: " + 
    this._numberOfMines.toString();

    this.reveal(exclude);
    this._started = true;
  }

  // int * int -> None
  /* Reveals the selected cell with index i. Calls updateWinState. Automatically
   reveals all neighbors if cell has no neighboring mines. */
  reveal(i) {
    const cell = this._board._cells[i];
    if (cell._flagged) { 
      this.placeFlag(i);
    } else if (cell._mined) { 
      this._winState = "lost";
      this.revealMines();
      this.renderLoseState();
    } else if (!cell._revealed) { 
      cell._revealed = true;
      this._revealedCounter++;
      this.removeFromMap(i, this._openNeighbors);
      this.addToMap(i, this._revealedNeighbors);
      this.updateWinState();
      if (this._realGame) { 
        this.render(i); 
      } else { 
        this.determineActiveCells(); 
      }
      if (cell._number === 0) { 
        this.revealNeighbors(i);
      } 
    }
  }

  // int -> None
  // Calls reveal(...) on all neighbors of i
  revealNeighbors(i) {
    for (let n of this._board._neighborMap[i]) {
      if (!this._board._cells[n]._revealed && !this._board._cells[n]._flagged) {
        this.reveal(n);
      }
    }
  }

  // int -> None
  /* Checks to see if i or any neighbors of i that are not flagged contain 
  mines. If so, reveal them immediately and stop. Otherwise, call 
  revealNeighbors on i and call reveal on i. */
  revealNeighborsCheck(i) {
    if (this._board._cells[i]._mined) {
      this.reveal(i);
    } else {
      for (let n of this._board._neighborMap[i]) {
        if (this._board._cells[n]._mined && !this._board._cells[n]._flagged) {
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
    const l = this._board._cells.length;
    for (let i = 0; i < l; i++) {
      if (this._board._cells[i]._mined) {
        this._board._cells[i]._revealed = true;
        this.render(i);
      }
    }
  }

  // int * int -> None
  // Places a flag on the cell i if currently unflagged, otherwise removes flag.
  placeFlag(i) {
    const cell = this._board._cells[i];
    if (!cell._revealed) {
      if (!cell._flagged) {
        this._numberOfMines -= 1;
        cell._flagged = true;
        this.removeFromMap(i, this._openNeighbors);
        const neighbors = this._board._neighborMap[i];
        for (let n of neighbors) {
          this._board._cells[n]._touchingMinesRemaining--;
        }
      } else {
        this._numberOfMines += 1;
        cell._flagged = false;
        this.addToMap(i, this._openNeighbors);
        const neighbors = this._board._neighborMap[i];
        for (let n of neighbors) {
          this._board._cells[n]._touchingMinesRemaining++;
        }
      }
      if (this._realGame) { 
        this.render(i); 
        const counterDisplay = document.getElementById("mine_counter");
        const numToDisplay = this._numberOfMines.toString();
        counterDisplay.innerHTML = "Mines Remaining: " + numToDisplay;
      } else { 
        this.determineActiveCells(); 
      }
    }
  }

  // --- Methods for Rendering / Interacting with DOM Elements ---

  // int -> None
  // Updates the rendering of a given cell index
  render(i) {
    const cell = this._board._cells[i];
    const htmlID = `cell_${i}`;
    const sqr = document.getElementById(htmlID);
    if (cell._flagged) {
      sqr.innerHTML = "F";
      sqr.style.color = "brown";
      sqr.style.backgroundColor = "#d6d3d3";
    } else if (cell._mined && cell._revealed) { 
      sqr.style.backgroundColor = "red";
      sqr.innerHTML = "*";
      sqr.style.color = "black";
    } else if (cell._revealed) {
      sqr.style.backgroundColor = "#f3f3f3";
      if (cell._number === 0) {
        sqr.style.color = "gray";
        sqr.style.border = "1px dotted gray";
        sqr.innerHTML = " ";
      } else {
        sqr.innerHTML = `${cell._number}`;
        switch (cell._number) {
          case 1:
            sqr.style.color = "blue";
            break;
          case 2:
            sqr.style.color = "green";
            break;
          case 3:
            sqr.style.color = "red";
            break;
          case 4:
            sqr.style.color = "indigo";
            break;
          case 5:
            sqr.style.color = "orange";
            break;
          case 6:
            sqr.style.color = "cornflowerblue";
            break;
          case 7:
            sqr.style.color = "seafoamgreen";
            break;
          default:
            sqr.style.color = "black";
      }
      
      }
    } else {
      sqr.innerHTML = " ";
      sqr.style.backgroundColor = "#e7e7e7";
    }
  }

  // HTML Element * Game * int -> None
  /* Mouse handler function for the square sqr on the board of game, 
  corresponding to cell i */
  handleMouse(sqr, game, i) {
    sqr.addEventListener("contextmenu", function(e) {
      e.preventDefault();
    })

    sqr.addEventListener("mousedown", function(e) {
      if (e.button === 1 && game._winState === "in progress") {
        game.renderOpenState();
      }
    }) 

    sqr.addEventListener("mouseup", function(e) {
      if (!game._started) {
        game.firstMove(i);
      } else if (game._winState === "in progress") {
        game.renderSmile();
        switch(e.button) {
          case 0:
            game.reveal(i);
            break;
          case 1:
            if (!game._board._cells[i]._flagged) {
              game.revealNeighborsCheck(i);
            }
            break;
          case 2:
            game.placeFlag(i);
            break;
          default:
            return;
        }
      }
    })
  }

  // None -> None
  // Creates html elements for game elements to be rendered 
  initialRender() { 
    const size = this._board._size;
    const container = document.createElement("div");
    container.setAttribute("id", "cell_container");
    container.style.display = "grid";
    container.style.gridColumnStart = "2";
    container.style.gridRowStart = "1";
    container.style.grid = `repeat(${size}, 1fr) / repeat(${size}, 1fr)`;
    container.style.height = `${2 * size}rem`;
    container.style.width = `${2 * size}rem`;
    document.getElementById("game_area").appendChild(container);

    this.renderSmile();

    const l = this._board._locations.length;
    for (let i = 0; i < l; i++) {
      let sqr = document.createElement("button");
      sqr.setAttribute("class", "game_button");
      sqr.setAttribute("id", `cell_${i}`);
      container.appendChild(sqr);
      sqr.innerHTML = " ";
      this.handleMouse(sqr, this, i); 
    }

    this.renderMineCounter();
  }

  // None -> None
  // Creates html element for mine counter
  renderMineCounter() {
    const numToDisplay = this._numberOfMines.toString();
    const mineCounter = document.createElement("h2");
    mineCounter.setAttribute("id", "mine_counter");
    mineCounter.style.textAlign = "center";
    mineCounter.innerHTML = "Mines Remaining: " + numToDisplay;
    document.getElementById("mine_counter_container").appendChild(mineCounter);
  }

  // None -> None
  renderWinState() {
    const face = document.getElementById("face");
    face.setAttribute("src", "./resources/win.png");
  }
  
  // None -> None
  renderLoseState() {
    const face = document.getElementById("face");
    face.setAttribute("src", "./resources/lose.png");
  }

  // None -> None
  renderSmile() {
    const face = document.getElementById("face");
    face.setAttribute("src", "./resources/smile.png");
  }
  
  // None -> None
  renderOpenState() {
    const face = document.getElementById("face");
    face.setAttribute("src", "./resources/open.png");
  }

  // --- Methods for Checking Solvability ---

  // int -> None
  // Populates activeCells for cell i
  createMinePatterns(i) {
    const neighbors = this._openNeighbors[i];
    if (neighbors.length > 0) {
      const minesLeft = this._board._cells[i]._touchingMinesRemaining;
      this._activeCells[i] = getPermutations(neighbors, minesLeft);
    }
  }

  /* !!! Room for optimization !!! Instead of calling this every time a check is 
  run, createMinePatterns could just be called for a cell when it's revealed, 
  and the relevant values in activeCells could be updated after each call of 
  reveal and placeFlag.
  None -> None
  Populates activeCells for all cells */
  determineActiveCells() {
    this._activeCells = {}; 
    const l = this._board._cells.length;
    for (let i = 0; i < l; i++) {
      const cell = this._board._cells[i];
      if (cell._revealed) {
        this.createMinePatterns(i);
      }
    }
  }

  // None -> Boolean
  /* Runs the internal function check1 on every key in activeCells. Returns true
   and mutates the Game properties if check1 returns a value other than false 
   for any cell. Returns false otherwise. */
  runCheck1() {
    // int -> int array
    /* Returns the indices where flags may safely be placed if neighboring cell 
    i has exactly 1 possible mine configuration, returns [] otherwise. */
    let check1 = (i) => {
      if (this._activeCells[i].length === 1) {
        return this._activeCells[i][0];
      } else {
        return [];
      }
    }
       
    const keys = Object.keys(this._activeCells);
    for (let cell of keys) {
      const result = check1(cell);
      if (result.length > 0) {
        for (let i of result) {
          if (!this._board._cells[i]._mined) {
            console.log(this);
            console.log(cell);
            throw Error (`Check 1 broke; incorrectly tried to flag ${i}`)
          }
          this.placeFlag(i);
        }
        return true;
      }
    }
    return false;
  }

  // None -> Boolean
  /* Runs the internal function check2 on every key in activeCells. Mutates the 
  Game properties and returns true after the first time check2 returns a value 
  other than false. Returns false if all calls of check2 return false. */
  runCheck2() {
    // int -> int array OR false
    /* Returns the indices neighboring cell i that may safely be revealed (i.e. 
    i has all its neighboring mines already flagged). Returns false if there 
    are none. */
    let check2 = (i) => {
      const openNeighbors = this._openNeighbors[i];
      if (openNeighbors.length > 0 && 
        this._board._cells[i]._touchingMinesRemaining === 0) {

        return openNeighbors;
      } else {
        return false;
      }
    }
    
    for (let cell of Object.keys(this._activeCells)) {
      let result = check2(cell);
      if (result) {
        for (let i of result) {
          if (this._board._cells[i]._mined) {
            console.log(this);
            console.log(cell);
            throw Error (`Check 2 broke; tried to reveal a cell that was 
            mined`);
          }
          this.reveal(i);
        }
        return true;
      }
    }
    return false;
  }
    
  // None -> Boolean
  /* Runs the internal function check3 on every key in activeCells. Mutates the 
  Game properties and returns true after the first time check3 returns a value 
  other than false. Returns false if all calls of check3 return false. */
  runCheck3() {
    // int -> int OR false
    /* Returns an index of a cell that is located in every possible 
    configuration of neighbor cell i's mines. That index can safely be flagged. 
    Returns false if no such cell exists. */
    let check3 = (i) => { 
      if (this._activeCells[i].length > 0) {
        let firstConfig = this._activeCells[i][0];
        const l = firstConfig.length;
        for (let idx = 0; idx < l; idx++) {
          if (this._activeCells[i].slice(1).every(x => 
            x.includes(firstConfig[idx]))) {
            return firstConfig[idx];
          } else {
            return false;
          }
        }
      } else {
        return false;
      }
    }
    
    for (let cell of Object.keys(this._activeCells)) {
      let result = check3(cell);
      if (result) {
        if (!this._board._cells[result]._mined) {
          console.log(this);
          console.log(cell);
          throw Error (`Check 3 broke; tried to flag ${result} which contained 
          no mine`);
        }
        
        this.placeFlag(result);
        return true;
      }
    }
    return false;
  }
  
  // None -> Boolean
  /* Runs the internal function check4 on every key in activeCells. Mutates the 
  Game properties and returns true after the first time check4 returns a value 
  other than false. Returns false if all calls of check4 return false. */
  runCheck4() {
    // int -> int OR false
    /* Returns index of an unrevealed neighbor that is not in any of cell i's 
    mine configurations. Returns false if no such cell exists. */
    let check4 = (i) => {
      if (this._activeCells[i].length > 0) {
        for (let neighbor of this._openNeighbors[i]) {
          if (this._activeCells[i].every(x => !x.includes(neighbor))) {
            return neighbor;
          } 
        }
        return false;
      } else {
        return false;
      }
    }
    
    for (let cell of Object.keys(this._activeCells)) {
      let result = check4(cell);
      if (result) {
        if (this._board._cells[result]._mined) {
          console.log(this);
          console.log(cell);
          throw Error ("Check 4 broke; tried to reveal a mine-containing cell");
        }
        this.reveal(result);
        return true;
      }
    }
    return false;
  }
  
  // None -> None
  /* Removes any patterns of mines in activeCells that would conflict with other 
  revealed cells' numbers or with the revealed number of mines remaining. */
  removeImpossibles() {
    for (let cell of Object.keys(this._activeCells)) {
      const determined = this._openNeighbors[cell]; 
      /* affectedNeighbors represents all the neighbors (with known values) of 
       determined cells. */
      let affectedNeighbors = []; 
      for (let i of determined) {
        const neighbors = this._revealedNeighbors[i]; 
        const noDups = neighbors.filter(x => !affectedNeighbors.includes(x));
        affectedNeighbors = affectedNeighbors.concat(noDups); 
      }
      let l = this._activeCells[cell].length;
      for (let patternIdx = 0; patternIdx < l; patternIdx++) { 
        const pattern = this._activeCells[cell][patternIdx];
        if (this.tooManyOrFewMines(pattern, determined, affectedNeighbors)) { 
          this._activeCells[cell].splice(patternIdx, 1);
          l--;
        } 
      } 
    }
  }

  // int array * int array -> Boolean
  /* Returns true if and only if mining every cell of pattern would result in 
  too many or too few mines near some cell in affected neighbors. */
  tooManyOrFewMines (pattern, determined, affectedNeighbors) {
    for (let n of affectedNeighbors) {
      const neighbors = this._board._neighborMap[n];
      const numMinesRequired = this._board._cells[n]._touchingMinesRemaining;
      let numMinesHyp = 0;
      for (let m of pattern) {
        if (neighbors.includes(m)) {
          numMinesHyp++;
        }
      }
      // Too-many-mines check
      if (numMinesHyp > numMinesRequired) {
        return true;
      } 
      // Too-few-mines check
      const unaccountedCells = this._openNeighbors[n].filter(x => 
        !determined.includes(x));
      const minMines = numMinesRequired - unaccountedCells.length;
      if (minMines > numMinesHyp) {
        return true;
      }
    }
    return false;
  }

  /* Note: the above two methods don't make all the inferences possible; in 
  future versions, they could be altered so that they also take into account 
  what would happen to the affectedNeighbors' values in activeCells. Then each 
  of the patterns in those new values could be checked for tooManyOrFewMines. 
  This would be more demanding to process, and so is best left to be done only 
  after optimizing code elsewhere in the solvability section */

  // None -> Boolean
  /* Makes as many safe moves as possible with existing board arrangement. 
  Returns true if no further game checks are needed, false otherwise */
  runChecks() {
    if (this.runCheck1()) {
      return false;
    } else if (this.runCheck2()) {
      return false;
    } else {
      this.removeImpossibles();
      if (this.runCheck3()) {
        return false;
      } else if (this.runCheck4()) {
        return false;
      } else {
        if (this._unminedCellCount - this._revealedCounter + 
          this._numberOfMines < 8) {
          const openCells = Object.values(this._openNeighbors).flat();
          for (let m of openCells) {
            this._board._cells[m]._mined = false;
            removeVal(m, this._board._mines);  
          }
          this._numberOfMines = 0;
        } 
        return true;
      } 
    }
  }
  
  // int * int array -> int array
  /* Creates hidden copy of the game with i as the initial revealed cell and 
  mines as a list of mine locations. Returns an updated list of mine locations 
  if board is solvable, [] otherwise. */
  solvable(i, mines) {
    const testGame = new Game(this._board._size, this._board._mineDivisor);
    testGame._board.addMines(mines);
    testGame.reveal(i);
    let checksComplete = false;
    while (!checksComplete) {
      checksComplete = testGame.runChecks();
    }
    if (testGame._numberOfMines === 0) {
      return testGame._board._mines;
    } else {
      return [];
    }
  }
}



// ===--- Functionality for Pre-Defined Page Elements ---===

// Functionality for reset button
const resetGame = () => {
  let cellContainer = document.getElementById("cell_container");
  cellContainer.remove();
  document.getElementById("mine_counter").remove();
  play();
}

const reset = document.getElementById("reset_button");
reset.addEventListener("mouseup", resetGame);


// ===--- Page Initialization ---===
let game;
const play = () => {
  const sizeSlider = document.getElementById("size_slider");
  const modeSelector = document.getElementById("mode_selector");
  const size = sizeSlider.value;
  game = new Game(size, 5); // The smaller the second arg, the more mines
  game._realGame = true;
  if (modeSelector.checked) {
    game._noGuessing = true; 
  } else {
    game._noGuessing = false; 
  }
  game.initialRender();
}
play();  //Initial call to start a game.