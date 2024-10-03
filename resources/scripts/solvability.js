import { removeVal, subPermutations } from "./abstract.js";


// --- Functions for Checking Solvability ---

// int -> None
// Populates activeCells for cell i
function createMinePatterns(i, game) {
  const neighbors = game.openNeighbors[i];
  if (neighbors.length > 0) {
    const minesLeft = game.board.cells[i].touchingMinesRemaining;
    game.activeCells[i] = subPermutations(neighbors, minesLeft);
  }
}

/* TODO -- Room for optimization -- Instead of calling this every time a check is 
run, createMinePatterns could just be called for a cell when it's revealed, 
and the relevant values in activeCells could be updated after each call of 
reveal and placeFlag.
None -> None
Populates activeCells for all cells */
function determineActiveCells(game) {
  game.activeCells = {}; 
  const l = game.board.cells.length;
  for (let i = 0; i < l; i++) {
    const cell = game.board.cells[i];
    if (cell.revealed) createMinePatterns(i, game);
  }
}

// None -> Boolean
/* Runs the internal function check1 on every key in activeCells. Returns true
 and mutates the Game properties if check1 returns a value other than false 
 for any cell. Returns false otherwise. */
function runCheck1(game) {
  // int -> int array
  /* Returns the indices where flags may safely be placed if neighboring cell 
  i has exactly 1 possible mine configuration, returns false otherwise. */
  let check1 = (i) => {
    if (game.activeCells[i].length === 1) {
      return game.activeCells[i][0];
    } else {
      return false;
    }
  }
     
  const keys = Object.keys(game.activeCells);
  for (let cell of keys) {
    const result = check1(cell);
    if (result) {
      for (let i of result) {
        if (!game.board.cells[i].mined) {
          console.log(game);
          console.log(cell);
          throw Error (`Check 1 broke; incorrectly tried to flag ${i}`)
        }
        game.placeFlag(i);
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
function runCheck2(game) {
  // int -> int array OR false
  /* Returns the indices neighboring cell i that may safely be revealed (i.e. 
  i has all its neighboring mines already flagged). Returns false if there 
  are none. */
  let check2 = (i) => {
    const openNeighbors = game.openNeighbors[i];
    if (
      openNeighbors.length > 0 
      && game.board.cells[i].touchingMinesRemaining === 0
    ) {
      return openNeighbors;
    } else {
      return false;
    }
  }
  
  for (let cell of Object.keys(game.activeCells)) {
    let result = check2(cell);
    if (result) {
      for (let i of result) {
        if (game.board.cells[i].mined) {
          console.log(game);
          console.log(cell);
          throw Error (`Check 2 broke; tried to reveal a cell that was 
          mined`);
        }
        game.reveal(i);
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
function runCheck3(game) {
  // int -> int OR false
  /* Returns an index of a cell that is located in every possible 
  configuration of neighbor cell i's mines. That index can safely be flagged. 
  Returns false if no such cell exists. */
  let check3 = (i) => { 
    if (game.activeCells[i].length > 0) {
      let firstConfig = game.activeCells[i][0];
      const l = firstConfig.length;
      for (let idx = 0; idx < l; idx++) {
        if (
          game.activeCells[i].slice(1).every(x => x.includes(firstConfig[idx]))
        ) {
          return firstConfig[idx];
        } else {
          return false;
        }
      }
    } else {
      return false;
    }
  }
  
  for (let cell of Object.keys(game.activeCells)) {
    let result = check3(cell);
    if (result) {
      if (!game.board.cells[result].mined) {
        console.log(game);
        console.log(cell);
        throw Error (`Check 3 broke; tried to flag ${result} which contained 
        no mine`);
      }
      
      game.placeFlag(result);
      return true;
    }
  }
  return false;
}

// None -> Boolean
/* Runs the internal function check4 on every key in activeCells. Mutates the 
Game properties and returns true after the first time check4 returns a value 
other than false. Returns false if all calls of check4 return false. */
function runCheck4(game) {
  // int -> int OR false
  /* Returns index of an unrevealed neighbor that is not in any of cell i's 
  mine configurations. Returns false if no such cell exists. */
  let check4 = (i) => {
    if (game.activeCells[i].length > 0) {
      for (let neighbor of game.openNeighbors[i]) {
        if (game.activeCells[i].every(x => !x.includes(neighbor))) {
          return neighbor;
        } 
      }
      return false;
    } else {
      return false;
    }
  }
  
  for (let cell of Object.keys(game.activeCells)) {
    let result = check4(cell);
    if (result) {
      if (game.board.cells[result].mined) {
        console.log(game);
        console.log(cell);
        throw Error ("Check 4 broke; tried to reveal a mine-containing cell");
      }
      game.reveal(result);
      return true;
    }
  }
  return false;
}

// None -> None
/* Removes any patterns of mines in activeCells that would conflict with other 
revealed cells' numbers or with the revealed number of mines remaining. */
function removeImpossibles(game) {
  for (let cell of Object.keys(game.activeCells)) {
    const determined = game.openNeighbors[cell]; 
    
    /* affectedNeighbors represents all the neighbors (with known values) of 
      determined cells. */
    let affectedNeighbors = []; 
    for (let i of determined) {
      const neighbors = game.revealedNeighbors[i]; 
      const noDups = neighbors.filter(x => !affectedNeighbors.includes(x));
      affectedNeighbors = affectedNeighbors.concat(noDups); 
    }
    let l = game.activeCells[cell].length;
    for (let patternIdx = 0; patternIdx < l; patternIdx++) { 
      const pattern = game.activeCells[cell][patternIdx];
      if (tooManyOrFewMines(pattern, determined, affectedNeighbors, game)) { 
        game.activeCells[cell].splice(patternIdx, 1);
        l--;
      } 
    } 
  }
}

// int array * int array -> Boolean
/* Returns true if and only if mining every cell of pattern would result in 
too many or too few mines near some cell in affected neighbors. */
function tooManyOrFewMines (pattern, determined, affectedNeighbors, game) {
  for (let n of affectedNeighbors) {
    const neighbors = game.board.neighborMap[n];
    const numMinesRequired = game.board.cells[n].touchingMinesRemaining;
    let numMinesHyp = 0;
    for (let m of pattern) {
      if (neighbors.includes(m)) numMinesHyp++;
    }

    // Too-many-mines check
    if (numMinesHyp > numMinesRequired) return true;
    
    // Too-few-mines check
    const unaccountedCells = game.openNeighbors[n].filter(
      x => !determined.includes(x)
    );
    const minMines = numMinesRequired - unaccountedCells.length;
    if (minMines > numMinesHyp) return true;
  }
  return false;
}

/* TODO: the above two methods don't make all the inferences possible; in 
future versions, they could be altered so that they also take into account 
what would happen to the affectedNeighbors' values in activeCells. Then each 
of the patterns in those new values could be checked for tooManyOrFewMines. 
This would be more demanding to process, and so is best left to be done only 
after optimizing code elsewhere in the solvability section */

// None -> Boolean
/* Makes as many safe moves as possible with existing board arrangement. 
Returns true if no further game checks are needed, false otherwise */
function runChecks(game) {
  if (runCheck1(game)) {
    return false;
  } else if (runCheck2(game)) {
    return false;
  } else {
    removeImpossibles(game);
    if (runCheck3(game)) {
      return false;
    } else if (runCheck4(game)) {
      return false;
    } else {
      if ( // if there are only less than 8 mines left, make them non-mines
        (game.unminedCellCount - game.revealedCounter 
        + game.numberOfMines) < 8
      ) {
        const openCells = Object.values(game.openNeighbors).flat();
        for (let m of openCells) {
          game.board.cells[m].mined = false;
          removeVal(m, game.board.mines);  
        }
        game.numberOfMines = 0;
      } 
      return true;
    } 
  }
}

export { determineActiveCells, runChecks };
