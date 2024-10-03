// --- Functions for Rendering / Interacting with DOM Elements ---

// int -> None
// Updates the rendering of a given cell index
function render(i, game) {
  const cell = game.board.cells[i];
  const HTMLID = `cell${i}`;
  const sqr = document.getElementById(HTMLID);
  if (cell.flagged) {
    sqr.innerHTML = "F";
    sqr.style.color = "brown";
    sqr.style.backgroundColor = "#d6d3d3";
  } else if (cell.mined && cell.revealed) { 
    sqr.style.backgroundColor = "red";
    sqr.innerHTML = "*";
    sqr.style.color = "black";
  } else if (cell.revealed) {
    sqr.style.backgroundColor = "#f3f3f3";
    if (cell.number === 0) {
      sqr.style.color = "gray";
      sqr.style.border = "1px dotted gray";
      sqr.innerHTML = " ";
    } else {
      sqr.innerHTML = `${cell.number}`;
      switch (cell.number) {
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
function handleMouse(sqr, game, i) {
  sqr.addEventListener("contextmenu", function(e) {
    e.preventDefault();
  })

  sqr.addEventListener("mousedown", function(e) { // Middle mouse button down
    if (e.button === 1 && game.winState === "in progress") {
      renderOpenState(game);
    }
  }) 

  sqr.addEventListener("mouseup", function(e) {
    if (!game.started) {
      game.firstMove(i);
    } else if (game.winState === "in progress") {
      renderSmile(game);
      switch(e.button) {
        case 0: // Left mouse button release
          game.reveal(i);
          break;
        case 1: // Middle mouse button release
          if (game.board.cells[i].revealed && 
          game.board.cells[i].touchingMinesRemaining < 1) {
            game.revealNeighborsCheck(i);
          }
          break;
        case 2: // Right mouse button release
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
function initialRender(game) { 
  const size = game.board.size;
  const container = document.createElement("div");
  container.setAttribute("id", "cell_container");
  container.style.display = "grid";
  container.style.gridColumnStart = "2";
  container.style.gridRowStart = "1";
  container.style.grid = `repeat(${size}, 1fr) / repeat(${size}, 1fr)`;
  container.style.height = `${2 * size}rem`;
  container.style.width = `${2 * size}rem`;
  document.getElementById("game_area").appendChild(container);

  renderSmile(game);

  game.board.cells.keys().forEach(i => {
    let sqr = document.createElement("button");
    sqr.setAttribute("class", "game_button");
    sqr.setAttribute("id", `cell${i}`);
    container.appendChild(sqr);
    sqr.innerHTML = " ";
    handleMouse(sqr, game, i);
  });

  renderMineCounter(game);
}

// None -> None
// Creates html element for mine counter
function renderMineCounter(game) {
  const numToDisplay = game.numberOfMines.toString();
  const mineCounter = document.createElement("h2");
  mineCounter.setAttribute("id", "mine_counter");
  mineCounter.style.textAlign = "center";
  mineCounter.innerHTML = "Mines Remaining: " + numToDisplay;
  document.getElementById("mine_counter_container").appendChild(mineCounter);
}

// None -> None
function renderWinState(game) {
  const face = document.getElementById("face");
  face.setAttribute("src", "./resources/win.png");
}

// None -> None
function renderLoseState(game) {
  const face = document.getElementById("face");
  face.setAttribute("src", "./resources/lose.png");
}

// None -> None
function renderSmile(game) {
  const face = document.getElementById("face");
  face.setAttribute("src", "./resources/smile.png");
}

// None -> None
function renderOpenState(game) {
  const face = document.getElementById("face");
  face.setAttribute("src", "./resources/open.png");
}

export { render, initialRender, renderWinState, renderLoseState };
