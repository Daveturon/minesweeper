# Minesweeper Clone : Readme

Go here to run the game:
https://daveturon.github.io/minesweeper/

This is a Minesweeper browser game made as a practice project. Of note, this version of Minesweeper can (if the player chooses) ensure that the board can be solved purely by deduction, without resorting to guesses. (No more losing an almost-complete game on a final 50-50 guess!) 

If you aren't familiar with Minesweeper, here are the rules:
  1. Each board is made up of cells. Cells either contain a mine or do not. The contents of a cell are hidden until the player turns the cell over.
  2. The objective of the game is to reveal all and only the cells that do not contain mines. The game is won once the player turns up every cell that does not contain a mine.
  3. If a cell that doesn't contain a mine is turned over, it displays a number. This number tells the player how many mines are directly next to it. (Diagonally adjacent cells count as touching.) For example, a "1" means there is one mine directly next to a given cell. An "8" means the cell is completely surrounded by mines.
  5. The player advances the game by either turning over a cell (left click) or flagging a cell (right click). If a cell containing a mine is turned over, the game ends in a loss.
  6. The purpose of flagging a cell (right click) is to mark a spot that the player suspects contains a mine. Mine locations are inferred from the numbers on the cells revealed so far. 
  7. A mine counter is displayed above the board. This number decreases as the player adds flags to the board. (Note: this number can become inaccurate if the player incorrectly flags a cell that contains no mine.)

Controls:
- Left click reveals (turns over) a cell.
- Right click places a flag on a location. This can be undone by right clicking it again. 
- Middle click reveals all cells surrounding the cell where the cursor is located, except for any cells that the player earlier flagged.


Potential Future Additions:
- Further optimize solvability-checking
- Add hint functionality
- Add more settings options
- Remake UI using React


Have fun, and thanks for visiting!

David Turon,
September 2024
