window.onload = function() {
    (function() { // копипаста из инета для анимации чтоб норм работало во всех браузерах
        var lastTime = 0;
        var vendors = ['ms', 'moz', 'webkit', 'o'];
        for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
            window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
            window.cancelAnimationFrame = window[vendors[x]+'CancelAnimationFrame']
                || window[vendors[x] + 'CancelRequestAnimationFrame'];
        }

        if (!window.requestAnimationFrame)
            window.requestAnimationFrame = function(callback, element) {
                var currTime = new Date().getTime();
                var timeToCall = Math.max(0, 16 - (currTime - lastTime));
                var id = window.setTimeout(function() { callback(currTime + timeToCall); },
                    timeToCall);
                lastTime = currTime + timeToCall;
                return id;
            };

        if (!window.cancelAnimationFrame)
            window.cancelAnimationFrame = function(id) {
                clearTimeout(id);
            };
    }());
        var canvas = document.getElementById("GameField");
    canvas.className = "gameField";
    var context = canvas.getContext("2d");
    var tiles = [];
    var matches = [];
    var moves = [];
    var columns = 10;
    var rows = 10;
    var tilewidth = 50;
    var tileheight = 50;
    var tileTypeContaner = ["images/1.png", "images/2.png", "images/3.png", "images/4.png", "images/5.png", "images/6.png"];

    var lastframe = 0;// Сроки и кадры в секунду
    var fpstime = 0;
    var framecount = 0;
    var fps = 0;

    var currentmove = { column1: 0, row1: 0, column2: 0, row2: 0 }; // Текущее движениe
    var gamestate = 0; //Игровые состояния:0 - инициализуется, 1 - готова к ходу игрока, 2 - ищет и уничтожает матчи
    var score = 0;

    var animationstate = 0;// анимационные переменные
    var animationtime = 0;
    var animationtimetotal = 0.3; //константа шага

    var showmoves = false, isaibot = false, gameover = false; //флаги кнопок и конца игры и мыши

    var but1 = document.getElementById("button1"); //переменать поле
    but1.className = 'but1';
    var but2 = document.getElementById("button2"); //подсказки
    but2.className = 'but2';
    var but3 = document.getElementById("button3"); //бот
    but3.className = 'but3';

    function init() {
        canvas.addEventListener("mousedown", onMouseDown);
        for (var i=0; i<columns; i++) {
            tiles[i] = [];
            for (var j=0; j<rows; j++) {
                tiles[i][j] = { type: 0, shift:0 }
            }
        }
        newGame();
        stepAnimation(0);
    }

    function stepAnimation(t) {
        window.requestAnimationFrame(stepAnimation);
        update(t);
        draw();
    }

    // Обновление состояния игры
    function update(t) {
        var dt = (t - lastframe) / 1000;
        lastframe = t;
        if (fpstime > 0.25) {
            fps = Math.round(framecount / fpstime);
            fpstime = 0;
            framecount = 0;
        }
        fpstime += dt;
        framecount++;

        if (gamestate == 1) { // Игра готова для ввода игрока

            if (moves.length <= 0) {
                gameover = true;
            }
            if (isaibot) {
                animationtime += dt;
                if (animationtime > animationtimetotal) {
                    aibot();
                    animationtime = 0;
                }
            }
        } else if (gamestate == 2) { // Игра занята разрешением и анимацией матчей
            animationtime += dt;
            if (animationstate == 0) { //уничтожение матчей
                if (animationtime > animationtimetotal) {
                    findMatches();
                    if (matches.length > 0) {
                        for (var i=0; i<matches.length; i++) {
                            score += ((matches[i].length * 1 - 3) * 50 + 100) * (i + 1);
                        }
                        removeMatches();
                        animationstate = 1;
                    } else {
                        gamestate = 1;
                    }
                    animationtime = 0;
                }

            } else if (animationstate == 1) { //падение плиток
                if (animationtime > animationtimetotal) {
                    shiftTiles();
                    animationstate = 0;
                    animationtime = 0;

                    findMatches();
                    if (matches.length <= 0) {
                        gamestate = 1;
                    }
                }
            } else if (animationstate == 2) { //свап плиток
                if (animationtime > animationtimetotal) {
                    swap(currentmove.column1, currentmove.row1, currentmove.column2, currentmove.row2);
                    if (findMatches()) {
                        animationstate = 0;
                        animationtime = 0;
                        gamestate = 2;
                    } else {
                        animationstate = 3;
                        animationtime = 0;
                    }
                    findMoves();
                    findMatches();
                }
            } else if (animationstate == 3) { //свап назад
                if (animationtime > animationtimetotal) {
                    swap(currentmove.column1, currentmove.row1, currentmove.column2, currentmove.row2);
                    gamestate = 1;
                }
            }
            findMoves();
            findMatches();
        }
    }

    function draw() { //рисуем поле
        context.fillStyle = "#d0d0d0";
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.fillStyle = "#F4EDD0";
        context.fillRect(1, 1, canvas.width-2, canvas.height-2);

        var field_width = columns * tilewidth;
        var field_height = rows * tileheight;

        drawTiles();
        if (showmoves && matches.length <= 0 && gamestate == 1) {
            drawMoves();
        }
        if (gameover) {
            context.fillStyle = "rgba(0, 0, 0, 0.8)";
            context.fillRect(1, 1, canvas.width-2, canvas.height-2);
            context.fillStyle = "#ffffff";
            context.font = "24px ms sans serif";
            var textdim = context.measureText("Game Over!");
            context.fillText(text, (field_width - textdim.width)/2, field_height / 2 + 10);
        }
    }

    function drawTiles() { //рисуем плитки
        for (var i = 0; i < columns; i++) {
            for (var j = 0; j < rows; j++) {
                var shift = tiles[i][j].shift;
                var tilex = i * tilewidth;
                var tiley = (j + (animationtime / animationtimetotal) * shift) * tileheight;
                if (tiles[i][j].type >= 0) {
                    var emg = new Image();
                    emg.src = tileTypeContaner[tiles[i][j].type];
                    context.drawImage(emg, tilex, tiley);
                }
                if ((column_new != -1 ) ||(row_new != -1)) {
                    if (column_new == i && row_new == j) {
                        context.strokeStyle = "#8B0000";
                        context.strokeRect(tilex, tiley, tilewidth, tileheight);
                    }
                }
            }
        }
        // своп анимация
        if (gamestate == 2 && (animationstate == 2 || animationstate == 3)) {
            var shiftx = currentmove.column2 - currentmove.column1;
            var shifty = currentmove.row2 - currentmove.row1;

            var tilex1 = (currentmove.column1 + (animationtime / animationtimetotal) * shiftx)* tilewidth;
            var tiley1 = (currentmove.row1 + (animationtime / animationtimetotal) * shifty) * tileheight;
            var emg1 = new Image();
            emg1.src = tileTypeContaner[tiles[currentmove.column1][currentmove.row1].type];

            var tilex2 = (currentmove.column2 - (animationtime / animationtimetotal) * shiftx) * tilewidth;
            var tiley2 = (currentmove.row2 - (animationtime / animationtimetotal) * shifty) * tileheight;
            var emg2 = new Image();
            emg2.src = tileTypeContaner[tiles[currentmove.column2][currentmove.row2].type];

            context.fillStyle = "#F4EDD0";
            context.fillRect(currentmove.column1* tilewidth, currentmove.row1 * tilewidth, tilewidth, tileheight);
            context.fillRect(currentmove.column2* tilewidth, currentmove.row2 * tilewidth, tilewidth, tileheight);

            context.drawImage(emg1, tilex1, tiley1);
            context.drawImage(emg2, tilex2, tiley2);
        }
    }
    // отрисовать подсказки
    function drawMoves() {
        for (var i = 0; i < moves.length; i++) {
            var tilex1 = moves[i].column1 * tilewidth;
            var tiley1 = moves[i].row1 * tileheight;
            var tilex2 = moves[i].column2 * tilewidth;
            var tiley2 = moves[i].row2 * tileheight;
            context.strokeStyle = "#000000";
            context.beginPath();
            context.moveTo(tilex1 + tilewidth/2, tiley1 + tileheight/2);
            context.lineTo(tilex2 + tilewidth/2, tiley2 + tileheight/2);
            context.stroke();
        }
    }


    function newGame() {
        score = 0;
        gamestate = 1;
        gameover = false;
        createField();
        findMoves();
        findMatches();
    }

    function createField() {
        var done = false;
        while (!done) {
            for (var i=0; i<columns; i++) {
                for (var j=0; j<rows; j++) {
                    tiles[i][j].type = Math.floor(Math.random() * tileTypeContaner.length);
                }
            }
            resolveMatches();
            findMoves();
            if (moves.length > 0) {
                done = true;
            }
        }
    }

    function resolveMatches() {
        findMatches();
        while (matches.length > 0) {
            removeMatches();
            shiftTiles();
            findMatches();
        }
    }
    //вынести в 1
    function findMatches() {
        matches = [];
        for (var j=0; j<rows; j++) {
            var matchlength = 1;
            for (var i=0; i<columns; i++) {
                var checkmatches = false;

                if (i == columns-1) {
                    checkmatches = true;
                } else {
                    if (tiles[i][j].type == tiles[i+1][j].type &&
                        tiles[i][j].type != -1) {
                        matchlength += 1;
                    } else {
                        checkmatches = true;
                    }
                }
                if (checkmatches) {
                    if (matchlength >= 3) {
                        matches.push({ column: i+1-matchlength, row:j,
                            length: matchlength, horizontal: true });
                    }

                    matchlength = 1;
                }
            }
        }

        for (var i=0; i<columns; i++) {
            var matchlength = 1;
            for (var j=0; j<rows; j++) {
                var checkmatches = false;

                if (j == rows-1) {
                    checkmatches = true;
                } else {
                    if (tiles[i][j].type == tiles[i][j+1].type &&
                        tiles[i][j].type != -1) {
                        matchlength += 1;
                    } else {
                        checkmatches = true;
                    }
                }
                if (checkmatches) {
                    if (matchlength >= 3) {
                        matches.push({ column: i, row:j+1-matchlength,
                            length: matchlength, horizontal: false });
                    }

                    matchlength = 1;
                }
            }
        }
        return matches.length > 0;
    }

    function findMoves() {
        moves = []
        for (var j=0; j<rows; j++) {
            for (var i=0; i<columns-1; i++) {
                swap(i, j, i+1, j);
                findMatches();
                swap(i, j, i+1, j);
                if (matches.length > 0) {
                    moves.push({column1: i, row1: j, column2: i+1, row2: j});
                }
            }
        }

        for (var i=0; i<columns; i++) {
            for (var j=0; j<rows-1; j++) {
                swap(i, j, i, j+1);
                findMatches();
                swap(i, j, i, j+1);
                if (matches.length > 0) {
                    moves.push({column1: i, row1: j, column2: i, row2: j+1});
                }
            }
        }
        matches = []
    }

    function removeMatches() {
        for (var i=0; i<matches.length; i++) {
            var h = 0;
            var v = 0;
            for (var j=0; j<matches[i].length; j++) {
                tiles[matches[i].column + h][matches[i].row + v].type = -1;
                if (matches[i].horizontal)  h++;
                else v++;
            }
        }
        for (var i=0; i<columns; i++) {
            var shift = 0;
            for (var j=rows-1; j>=0; j--) {
                if (tiles[i][j].type == -1) {
                    shift++;
                    tiles[i][j].shift = 0;
                } else {
                    tiles[i][j].shift = shift;
                }
            }
        }
    }
    function shiftTiles() {
        for (var i=0; i<columns; i++) {
            for (var j=rows-1; j>=0; j--) {
                if (tiles[i][j].type == -1) {
                    tiles[i][j].type = Math.floor(Math.random() * tileTypeContaner.length);
                } else {
                    var shift = tiles[i][j].shift;
                    if (shift > 0) {
                        swap(i, j, i, j+shift)
                    }
                }
                tiles[i][j].shift = 0;
            }
        }
    }
    function aibot() {
        findMoves();
        if (moves.length > 0) {
            var move = moves[Math.floor(Math.random() * moves.length)];
            animationSwap(move.column1, move.row1, move.column2, move.row2);
        }
    }
    function swap(x1, y1, x2, y2) {
        var typeswap = tiles[x1][y1].type;
        tiles[x1][y1].type = tiles[x2][y2].type;
        tiles[x2][y2].type = typeswap;
    }

    function animationSwap(c1, r1, c2, r2) {
        currentmove = {column1: c1, row1: r1, column2: c2, row2: r2};
        animationstate = 2;
        animationtime = 0;
        gamestate = 2;
    }

    function getMousePos(canvas, e) {
        var rect = canvas.getBoundingClientRect();
        return {
            x: Math.round((e.clientX - rect.left)/(rect.right - rect.left)*canvas.width),
            y: Math.round((e.clientY - rect.top)/(rect.bottom - rect.top)*canvas.height)
        };
    }

    function getMouseTile(pos) {
        var tx = Math.floor(pos.x / tilewidth);
        var ty = Math.floor(pos.y / tileheight);
        if (tx >= 0 && tx < columns && ty >= 0 && ty < rows) {
            return {x: tx, y: ty};
        }
        return { x: -1, y: -1};
    }
    var column_new = -1, row_new = -1;

    function onMouseDown(e) {
        var pos = getMousePos(canvas, e);
        var mt = getMouseTile(pos);

        var column_old = mt.x;
        var row_old = mt.y;

        if ((column_old != column_new) || (row_old != row_new) || (column_new != -1 ) ||(row_new != -1)|| (column_old != -1 ) ||(row_old != -1)) {
            if (Math.abs(row_old - row_new) + Math.abs(column_old - column_new) == 1) {
                animationSwap(column_old, row_old, column_new, row_new);
                if (findMatches()) {
                    resolveMatches();
                }
                else
                    animationSwap(column_old, row_old, column_new, row_new);
                column_new = -1;
                row_new = -1;
                return;
            }
        }
        column_new = column_old;
        row_new = row_old;
    }

    but1.onclick = function () {
        newGame();
    }
    but2.onclick = function () {
        showmoves = !showmoves;
    }
    but3.onclick = function () {
        isaibot = !isaibot;
        if (isaibot) but3.className = 'actbut3';
        else but3.className = 'but3';
    }
    init();
};