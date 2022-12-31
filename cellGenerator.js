import * as Board from "./board.js";
import { CELL_TYPE } from "./cellType.js";
import * as Gameplay from "./gameplay.js";

export const MINIMUM_CHECKING = 2;
const CELL_EMPTYING_TIME = 400;
const CELL_REFRESHING_TIME = 25;

var movingLines = new Map();

/** Initializes a board cells with random values.
 * @param {Array<Array<any>>} array The array of the board cells.
 * @param {Array<Array<HTMLElement>>} divArray The array of the board cells div elements.
 * @param {symbol} cellTypes The possible types of cells to be generated.
 */
export function InitializeBoardRandomly(array, divArray, cellTypes) {
    let cellTypeValues = Object.values(cellTypes);
    for (let i = 0; i < array.length; i++) {
        for (let j = 0; j < array[0].length; j++) {
            InitializeCellRandomly(array, divArray, cellTypeValues, i, j);
        }
    }
    Validation(array, divArray, cellTypeValues);
}

/** Initializes a cell within a board with a random value.
 * @param {Array<Array<any>>} array The array of the board cells.
 * @param {Array<Array<HTMLElement>>} divArray The array of the board cells div elements.
 * @param {Array<string>} cellTypeValues The names of the possible types of cells to be generated.
 * @param {number} x The coordinates of the cell on the x-axis.
 * @param {number} y The coordinates of the cell on the y-axis.
 */
export function InitializeCellRandomly(array, divArray, cellTypeValues, x, y) {
    array[x][y] =  cellTypeValues[Math.floor(Math.random() * cellTypeValues.length)];
    InitializeCellContent(array[x][y], x, y);
    divArray[x][y].classList.remove("valid");
}

/** Makes the array of cell contents valid.
 * @param {Array<Array<any>>} array The array of the board cells.
 * @param {Array<Array<HTMLElement>>} divArray The array of the board cells div elements.
 * @param {Array<string>} cellTypeValues The names of the possible types of cells to be generated.
 */
function Validation(array, divArray, cellTypeValues) {
    let validCellCount = 0;
    for (let i = 0; i < array.length; i++) {
        for (let j = 0; j < array[0].length; j++) {
            array[i][j] != null && InitializeCellContent(array[i][j], i, j);

            let { length: hLength, valid: hValid, start: hStart } = CheckHorizontally(array, i, j),
                { length: vLength, valid: vValid, start: vStart } = CheckVertically(array, i, j);

            for (let k = 0; hValid && k < hLength; k++) {
                InitializeCellRandomly(array, divArray, cellTypeValues, hStart.x, hStart.y + k);
                validCellCount++;
            }
            
            for (let k = 0; vValid && k < vLength; k++) {
                InitializeCellRandomly(array, divArray, cellTypeValues, vStart.x + k, vStart.y);
                validCellCount++;
            }
        }
    }

    if (validCellCount > 0) { Validation(array, divArray, cellTypeValues); }
}

/** Initializes a cell's div's content, depending on a value.
 * @param {String} value The value of the cell.
 * @param {Number} x The coordinates of the cell on the x-axis.
 * @param {Number} y The coordinates of the cell on the y-axis.
 */
function InitializeCellContent(value, x, y) {
    Array.from(Board.cellDivs[x][y].children).forEach(child => child.remove());
    Board.CreateElement({ className: "cell_content " + value, parent: Board.cellDivs[x][y] });
}

/** Checks a cell content's neibours on a specified near place to see if it's valid.
 * @param {Array<Array<any>>} array The array of the board cells.
 * @param {Number} x The coordinates of the cell on the x-axis.
 * @param {Number} y The coordinates of the cell on the y-axis.
 * @param {Number} top The distance between the cell and the other cell vertically.
 * @param {Number} left The distance between the cell and the other cell horizontally.
 * @returns An object that tells if the cell is valid and the chaining length.
 */
export function Check(array, x, y, top, left) {
    let valid = true;
    for (var i = 1; i < array.length; i++) {
        if (array[x - i * top] == undefined || array[x - i * top][y - i * left] == undefined) { break; }
        if (array[x - i * top][y - i * left] != array[x][y]) { valid = i >= MINIMUM_CHECKING; break; }
    }
    return { length: i, valid: valid && i > MINIMUM_CHECKING };
}

/** Empties a cell and its content.
 * @param {Array<Array<any>>} array The array of the board cells.
 * @param {Array<Array<HTMLElement>>} divArray The array of the board cells div elements.
 * @param {Number} x The coordinates of the cell on the x-axis.
 * @param {Number} y The coordinates of the cell on the y-axis.
 * @param {Boolean} startCell Indicates wether or not the cell is a starter cell, so it only calls the MoveLine function once.
 */
export function Empty(array, divArray, x, y, startCell = false) {
    // Refreshes the animation cycle of each scored cell.
    divArray[x][y].classList.contains("scored") ||
    document.querySelectorAll(".cell.scored").forEach(scoredCell => {
        scoredCell.classList.remove("scored");
        setTimeout(() => scoredCell.classList.add("scored"), CELL_REFRESHING_TIME);
    });

    divArray[x][y].classList.add("scored");
    divArray[x][y].classList.add("emptying");
    setTimeout(() => divArray[x][y].classList.remove("emptying"), CELL_EMPTYING_TIME);
    
    // Clears the content of the cell's div after the animation's ended.
    setTimeout(() => {
        array[x][y] = null;
        divArray[x][y].children[0]?.remove();
    }, CELL_EMPTYING_TIME);

    startCell && setTimeout(() => MoveLine(x, y), CELL_EMPTYING_TIME + 100);
}

/** Moves all the cells within one line, as they were affected by gravity.
 * @param {Number} x The coordinates of the cell on the x-axis.
 * @param {Number} y The coordinates of the cell on the y-axis.
 */
function MoveLine(x, y) {
    if (movingLines.has(y)) { return; }

    movingLines.set(y, x);
    Gameplay.SetCellsAreMoving(true);

    let movingLine = false;
    for (let i = 0; i < Board.cells.length - 1; i++) {
        // Indicates whether or not the i-th element reached the cell that has to fall.
        let topCase = Board.cells[i][y] != null && Board.cells[i + 1][y] == null;
        movingLine |= topCase;

        for (let j = i + 1; topCase && j < Board.cells.length; j++) {
            if (Board.cells[j][y] == null && j != Board.cells.length - 1) { continue; }

            // Indicates whether or not the cell should jump into bottom.
            let bottomCase = j == Board.cells.length - 1 && Board.cells[j][y] == null;
            Gameplay.MoveCellTo(i, y, bottomCase ? j : j - 1, y);

            if (i != 0) { 
                movingLines.delete(y);
                setTimeout(() => MoveLine(x, y), Gameplay.CELL_MOVEMENT_TIME);
            }
            else { movingLine = false; }
            break;
        }
    }

    if (movingLine) { return; }

    Gameplay.SetCellsAreMoving(false);
    movingLines.delete(y);

    setTimeout(() => {
        if (movingLines.size > 0) { return; }

        for (let i = 0; i < Board.cells.length; i++) {
            let horizontalChecking = CheckHorizontally(Board.cells, i, y),
                verticalChecking = CheckVertically(Board.cells, i, y);
    
            // If the movement was valid, it empties the movement's valid cells' divs.
            for (let j = 0; horizontalChecking.valid && j < horizontalChecking.length; j++) {
                Empty(Board.cells, Board.cellDivs, horizontalChecking.start.x, horizontalChecking.start.y + j, true);
            }
            for (let j = 0; verticalChecking.valid && j < verticalChecking.length; j++) {
                Empty(Board.cells, Board.cellDivs, verticalChecking.start.x + j, verticalChecking.start.y, j == 0, verticalChecking.length);
            }
            
            i == Board.cells.length - 1 && setTimeout(() => RegenerateLine(y));
        }
    }, Gameplay.CELL_MOVEMENT_TIME + 100);
}

/** Regenerates a line's all contents.
 * @param {Number} y The coordinates of the line in the board.
 */
function RegenerateLine(y) {
    for (let i = 0; i < Board.cells.length; i++) {
        if (Board.cells[i][y] != null) { break; }
        InitializeCellRandomly(Board.cells, Board.cellDivs, Object.values(CELL_TYPE), i, y);
    }
    Validation(Board.cells, Board.cellDivs, Object.values(CELL_TYPE));
}

/** Checks a cell content's neibours on the left to see if it's valid.
 * @param {Array<Array<any>>} array The array of the board cells.
 * @param {Number} x The coordinates of the cell on the x-axis.
 * @param {Number} y The coordinates of the cell on the y-axis.
 * @returns An object that tells if the cell is valid and the chaining length.
 */
export function CheckLeft(array, x, y) { return Check(array, x, y, 0, 1); }

/** Checks a cell content's neibours on the right to see if it's valid.
 * @param {Array<Array<any>>} array The array of the board cells.
 * @param {Number} x The coordinates of the cell on the x-axis.
 * @param {Number} y The coordinates of the cell on the y-axis.
 * @returns An object that tells if the cell is valid and the chaining length.
 */
export function CheckRight(array, x, y) { return Check(array, x, y, 0, -1); }

/** Checks a cell content's neibours on the top to see if it's valid.
 * @param {Array<Array<any>>} array The array of the board cells.
 * @param {Number} x The coordinates of the cell on the x-axis.
 * @param {Number} y The coordinates of the cell on the y-axis.
 * @returns An object that tells if the cell is valid and the chaining length.
 */
export function CheckTop(array, x, y) { return Check(array, x, y, 1, 0); }

/** Checks a cell content's neibours on the bottom to see if it's valid.
 * @param {Array<Array<any>>} array The array of the board cells.
 * @param {Number} x The coordinates of the cell on the x-axis.
 * @param {Number} y The coordinates of the cell on the y-axis.
 * @returns An object that tells if the cell is valid and the chaining length.
 */
export function CheckBottom(array, x, y) { return Check(array, x, y, -1, 0); }

/** Checks a cell content's neibours on the left and top to see if it's valid.
 * @param {Array<Array<any>>} array The array of the board cells.
 * @param {Number} x The coordinates of the cell on the x-axis.
 * @param {Number} y The coordinates of the cell on the y-axis.
 * @returns An object that tells if the cell is valid and the chaining length.
*/
export function CheckLeftTop(array, x, y) { return Check(array, x, y, 1, 1); }

/** Checks a cell content's neibours on the right and top to see if it's valid.
 * @param {Array<Array<any>>} array The array of the board cells.
 * @param {Number} x The coordinates of the cell on the x-axis.
 * @param {Number} y The coordinates of the cell on the y-axis.
 * @returns An object that tells if the cell is valid and the chaining length.
*/
export function CheckRightTop(array, x, y) { return Check(array, x, y, 1, -1); }

/** Checks a cell content's neibours on the left and bottom to see if it's valid.
 * @param {Array<Array<any>>} array The array of the board cells.
 * @param {Number} x The coordinates of the cell on the x-axis.
 * @param {Number} y The coordinates of the cell on the y-axis.
 * @returns An object that tells if the cell is valid and the chaining length.
*/
export function CheckLeftBottom(array, x, y) { return Check(array, x, y, -1, 1); }

/** Checks a cell content's neibours on the right and bottom to see if it's valid.
 * @param {Array<Array<any>>} array The array of the board cells.
 * @param {Number} x The coordinates of the cell on the x-axis.
 * @param {Number} y The coordinates of the cell on the y-axis.
 * @returns An object that tells if the cell is valid and the chaining length.
*/
export function CheckRightBottom(array, x, y) { return Check(array, x, y, -1, -1); }

/** Checks a cell content's neibours at the same x-axis to see if it's valid.
 * @param {Array<Array<any>>} array The array of the board cells.
 * @param {Number} x The coordinates of the cell on the x-axis.
 * @param {Number} y The coordinates of the cell on the y-axis.
 * @returns An object that tells if the cell is valid and the chaining length, and the position of the first chained cell.
 */
export function CheckHorizontally(array, x, y) {
    let rightChecking = CheckRight(array, x, y),
        leftChecking = CheckLeft(array, x, y);
    return {
        length: rightChecking.length + leftChecking.length - 1,
        valid: rightChecking.length + leftChecking.length - 1 > MINIMUM_CHECKING,
        start: {
            x: x,
            y: y - leftChecking.length + 1
        }
    };
}

/** Checks a cell content's neibours at the same y-axis to see if it's valid.
 * @param {Array<Array<any>>} array The array of the board cells.
 * @param {Number} x The coordinates of the cell on the x-axis.
 * @param {Number} y The coordinates of the cell on the y-axis.
 * @returns An object that tells if the cell is valid and the chaining length, and the position of the first chained cell.
 */
export function CheckVertically(array, x, y) {
    let topChecking = CheckTop(array, x, y),
        bottomChecking = CheckBottom(array, x, y);
    return {
        length: topChecking.length + bottomChecking.length - 1,
        valid: topChecking.length + bottomChecking.length - 1 > MINIMUM_CHECKING,
        start: {
            x: x - topChecking.length + 1,
            y: y
        }
    };
}