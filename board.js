export const CELL_COUNT = 12;
export const BOARD_RATIO = 0.9;
export const CELL_MARGIN = 8; // In pixel.

export var board, boardWidth, boardHeight;
export var cellDivs = Array.from(Array(CELL_COUNT), () => new Array(CELL_COUNT).fill(null));
export var cells = Array.from(Array(CELL_COUNT), () => new Array(CELL_COUNT).fill(null));
export var currentAxis = { x: CELL_COUNT / 2, y: CELL_COUNT / 2 };

/** Builds the board of the game. */
export function Build() {
    BoardInitialization();
    CellInitialization();
}

/** Gets called once the game intializes the board. */
function BoardInitialization() {
    board = CreateElement({ id: "board", parent: document.body });
    CreateElement({ parent: board });

    board.style.setProperty("--board-ratio", BOARD_RATIO);
    board.style.padding = CELL_MARGIN / 2 + "px";

    const Resizing = () => {
        let size = Math.min(window.innerWidth, window.innerHeight);

        boardWidth = size * BOARD_RATIO - CELL_MARGIN;
        boardHeight = size * BOARD_RATIO - CELL_MARGIN;

        board.style.width = boardWidth + "px";
        board.style.height = boardHeight + "px";
    };

    const Relocating = () => {
        board.style.top = window.innerHeight / 2 + "px";
        board.style.left = window.innerWidth / 2 + "px";
    };

    window.addEventListener("resize", Resizing);
    window.addEventListener("resize", Relocating);
    Resizing();
    Relocating();

    document.addEventListener("keydown", KeyboardHandling);
}

/** Handles all keyboard keys pressing events. */
function KeyboardHandling(e) {
    switch (e.key.toLowerCase()) {
        case "arrowup":
        case "w":
            cellDivs[currentAxis.x = Circle(--currentAxis.x, 0, CELL_COUNT - 1)][currentAxis.y].focus();
            break;
        case "arrowdown":
            case "s":
            cellDivs[currentAxis.x = Circle(++currentAxis.x, 0, CELL_COUNT - 1)][currentAxis.y].focus();
            break;
        case "arrowleft":
        case "a":
            cellDivs[currentAxis.x][currentAxis.y = Circle(--currentAxis.y, 0, CELL_COUNT - 1)].focus();
            break;
        case "arrowright":
        case "d":
            cellDivs[currentAxis.x][currentAxis.y = Circle(++currentAxis.y, 0, CELL_COUNT - 1)].focus();
            break;
        default:
            break;
    }
}

/** Gets called once the game initializes cells within the board. */
function CellInitialization() { 
    for (let i = 0; i < CELL_COUNT; i++) {
        for (let j = 0; j < CELL_COUNT; j++) {
            let cell = cellDivs[i][j] = CreateElement({ className: "cell", parent: board, tabbable: true });

            const Resizing = () => {
                cell.style.width = boardWidth / CELL_COUNT - CELL_MARGIN + "px";
                cell.style.height = boardHeight / CELL_COUNT - CELL_MARGIN + "px";
            };

            window.addEventListener("resize", Resizing);
            Resizing();

            cell.onfocus = () => currentAxis = { x: i, y: j };
        }
    }

    board.style.setProperty("--cell-count", CELL_COUNT);
}

/** Creates an element in the document.
 * @param {any} properties The wanted properties of the element.
 * @returns {HTMLElement} The element that has been created.
 */
export function CreateElement({ name = "div", className = "", id = "", parent = null, tabbable = false }) {
    let element = document.createElement(name);

    element.className = className;
    element.id = id;

    parent?.appendChild(element);

    element.tabIndex = tabbable ? 0 : -1;

    return element;
}

/** Circles a number between two numbers.
 * @param {number} x the selected number.
 * @param {number} a the 1st value.
 * @param {number} b the 2nd value.
 * @returns {number} the number after being circled.
 */
function Circle(x, a, b) { return x < a ? b : x > b ? a : x; }