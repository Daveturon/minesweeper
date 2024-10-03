import { Game } from "./classes.js";
import { initialRender } from "./rendering.js";

// ===--- Functionality for Pre-Defined Page Elements ---===

// Functionality for reset button
function resetGame() {
  let cellContainer = document.getElementById("cell_container");
  cellContainer.remove();
  document.getElementById("mine_counter").remove();
  play();
}

const reset = document.getElementById("reset_button");
reset.addEventListener("mouseup", resetGame);

// ===--- Page Initialization ---===
let game;
function play() {
  const sizeSlider = document.getElementById("size_slider");
  const modeSelector = document.getElementById("mode_selector");
  const size = sizeSlider.value;
  game = new Game(size, 5); // The smaller the second arg, the more mines
  game.realGame = true;
  if (modeSelector.checked) {
    game.noGuessing = true; 
  } else {
    game.noGuessing = false; 
  }

  initialRender(game);
}

//Initial call to start a game
play();  
