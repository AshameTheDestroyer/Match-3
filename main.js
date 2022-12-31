import * as Board from "./board.js";
import { CELL_TYPE } from "./cellType.js";
import * as CellGenerator from "./cellGenerator.js";
import * as Gameplay from "./gameplay.js";

Start();

/** Gets called when the game is first initialized. */
function Start() {
    BackgroundInitialization();
    Board.Build();

    CellGenerator.InitializeBoardRandomly(Board.cells, Board.cellDivs, CELL_TYPE);

    for (let i = 0; i < Board.cellDivs.length; i++) {
        for (let j = 0; j < Board.cellDivs[i].length; j++) {    
            Board.cellDivs[i][j].addEventListener("mousedown", () => Gameplay.ClickCell(Board.cellDivs[i][j], i, j));
            Board.cellDivs[i][j].addEventListener("keydown", e => [" ", "Enter"].includes(e.key) && Gameplay.ClickCell(Board.cellDivs[i][j], i, j));
        }
    }
}

/** Picks a random colour for the background as it's initialized. */
function BackgroundInitialization() {
    const MAXIMUM_HUE = 360;
    let hue = Math.floor(Math.random() * MAXIMUM_HUE + 1);
    
    document.body.style.setProperty("--background-hue", hue);
}