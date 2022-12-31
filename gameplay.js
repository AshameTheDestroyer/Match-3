import * as Board from "./board.js";
import * as CellGenerator from "./cellGenerator.js";

export var selectedCell = { div: null, x: -1, y: -1 };
export var areCellsMoving = false;
export const SetCellsAreMoving = value => areCellsMoving = value;

export const CELL_MOVEMENT_TIME = 400;
const CELL_PERCENTAGE_MOVEMENT = 200;

/** Occurs when a cell of the board gets clicked.
 * @param {HTMLElement} cellDiv The cell that has been clicked.
 * @param {Number} x The coordinates of the cell on the x-axis.
 * @param {Number} y The coordinates of the cell on the y-axis.
 * @param {Boolean} cancelling Determines wether or not the click is a cancelling click, thus it won't trigger another movement.
 */
export function ClickCell(cellDiv, x, y, cancelling = false) {
    if (areCellsMoving || Board.cells[x][y] == null) { return; }
    
    selectedCell.div?.classList.remove("selected");

    if (selectedCell.div && IsNeighbourCell(selectedCell.x, selectedCell.y, x, y))
    {
        let previousX = selectedCell.x, previousY = selectedCell.y;
        
        setTimeout(() => cellDiv.blur());
        setTimeout(() => {
            selectedCell = { div: null, x: -1, y: -1 };
            areCellsMoving = false;
        }, CELL_MOVEMENT_TIME + 5);

        MoveCellTo(previousX, previousY, x, y);
        
        cancelling || setTimeout(() => PerformMovement(previousX, previousY, x, y), CELL_MOVEMENT_TIME + 10);
        
        areCellsMoving = true;
        return;
    }
    
    // In case there weren't any selected cell, it just selects the cell that's been clicked.
    selectedCell = { div: cellDiv, x: x, y: y };
    selectedCell.div.classList.add("selected");
}

/** Checks if a cell is a neighbour to another cell.
 * @param {Number} x1 The coordinates of the selected cell on the x-axis.
 * @param {Number} y1 The coordinates of the selected cell on the y-axis.
 * @param {Number} x2 The coordinates of the neighbour cell on the x-axis.
 * @param {Number} y2 The coordinates of the neighbour cell on the y-axis.
 * @returns {Number} A boolean value that represents whether or not the cell is a neighbour to the selected cell.
 */
function IsNeighbourCell(x1, y1, x2, y2) { return Math.abs(x1 - x2) + Math.abs(y1 - y2) == 1; }

/** Performs a movement from a cell into another, and validates it.
 * @param {Number} x1 The coordinates of the first position of the cell on the x-axis.
 * @param {Number} y1 The coordinates of the first position of the cell on the y-axis.
 * @param {Number} x2 The coordinates of the second position of the cell on the x-axis.
 * @param {Number} y2 The coordinates of the second position of the cell on the y-axis.
 */
function PerformMovement(x1, y1, x2, y2) {
    let positions = [ { x: x1, y: y1 }, { x: x2, y: y2 } ];

    let validMovement = false;
    positions.forEach(position => {
        let horizontalChecking = CellGenerator.CheckHorizontally(Board.cells, position.x, position.y),
            verticalChecking = CellGenerator.CheckVertically(Board.cells, position.x, position.y);
            
        validMovement |= horizontalChecking.valid || verticalChecking.valid;

        if (!validMovement) { return; }

        // If the movement was valid, it empties the movement's valid cells' divs.
        for (let i = 0; horizontalChecking.valid && i < horizontalChecking.length; i++) {
            CellGenerator.Empty(Board.cells, Board.cellDivs, horizontalChecking.start.x, horizontalChecking.start.y + i, true);
        }
        for (let i = 0; verticalChecking.valid && i < verticalChecking.length; i++) {
            CellGenerator.Empty(Board.cells, Board.cellDivs, verticalChecking.start.x + i, verticalChecking.start.y, i == 0, verticalChecking.length);
        }
    });

    validMovement || setTimeout(() => {
        ClickCell(Board.cellDivs[x2][y2], x2, y2, true);
        ClickCell(Board.cellDivs[x1][y1], x1, y1, true);
    }, 50);
}

/** Swaps two cells places.
 * @param {Number} x1 The coordinates of the first position of the cell on the x-axis.
 * @param {Number} y1 The coordinates of the first position of the cell on the y-axis.
 * @param {Number} x2 The coordinates of the second position of the cell on the x-axis.
 * @param {Number} y2 The coordinates of the second position of the cell on the y-axis.
 */
export function MoveCellTo(x1, y1, x2, y2) {
    let firstDiv = Board.cellDivs[x1][y1],
        secondDiv = Board.cellDivs[x2][y2],
        firstChild = firstDiv.lastElementChild,
        secondChild = secondDiv.lastElementChild;

    /** Changes the position of a div's style.
     * @param {HTMLDivElement} div The selected div to change its style's position.
     * @param {String} top The amount of displacement in the new position of the div's style on the y-axis.
     * @param {String} left The amount of displacement in the new position of the div's style on the x-axis.
     */
    const SetDivPosition = (div, top, left) => { div.style.top = left; div.style.left = top; };

    // Alters the previously selected cell's div's position to the current selected one's.
    if (firstChild) {
        SetDivPosition(firstChild,
            -CELL_PERCENTAGE_MOVEMENT * Math.sign(y1 - y2) * Math.abs(y1 - y2) + "%",
            -CELL_PERCENTAGE_MOVEMENT * Math.sign(x1 - x2) * Math.abs(x1 - x2) + "%");
        
        secondChild || setTimeout(() => SetDivPosition(firstChild, "0%", "0%"), CELL_MOVEMENT_TIME);
    }

    // Alters the current selected cell's div's position to the previous selected one's.
    if (secondChild) {
        SetDivPosition(secondChild,
            CELL_PERCENTAGE_MOVEMENT * Math.sign(y1 - y2) * Math.abs(y1 - y2) + "%",
            CELL_PERCENTAGE_MOVEMENT * Math.sign(x1 - x2) * Math.abs(x1 - x2) + "%");
        
        firstChild || setTimeout(() => SetDivPosition(secondChild, "0%", "0%"), CELL_MOVEMENT_TIME);
    }

    // Exchanges the cells' divs' contents after the animation's ended,
    // and restores the identity positions of theirs.
    setTimeout(() => {
        secondChild && firstDiv.appendChild(secondChild);
        firstChild && secondDiv.appendChild(firstChild);
        
        firstChild && SetDivPosition(firstChild, "0%", "0%");
        secondChild && SetDivPosition(secondChild, "0%", "0%");
    }, CELL_MOVEMENT_TIME);
    
    // Swaps the cells' logical values.
    let temporary = Board.cells[x1][y1];
    Board.cells[x1][y1] = Board.cells[x2][y2];
    Board.cells[x2][y2] = temporary;
    
    console.log(`succeeded: from (${x1}, ${y1}), to (${x2}, ${y2})`);
}