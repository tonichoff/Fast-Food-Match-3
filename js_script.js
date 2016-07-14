window.onload = function() {
    // для анимации чтоб нормально работало во всех браузерах, скопировано из статьи http://html5.by/blog/what-is-requestanimationframe/
    (function() {
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

    var lineTimer = document.getElementById("LineTimer");
    var startTimerWidth = lineTimer.offsetWidth;
    var startTime;
    var presentTime;
    var bonusTime;
    var totalScore;
    var time;

    var tiles = [];
    var matches = [];
    var moves = [];
    var lvl;
    var columns = 10,  rows = 10;
    var tilewidth = 50;
    var tileheight = 50;
    var lvl_type;
    var score = 0, win_score;

    var lastframe = 0, fpstime = 0, framecount = 0, fps = 0;// для анимации, время и кадры в секунду
    var animation_time = 0, animation_interval = 0.3; //текущее время и через которое делать шаг

    var currentmove = { column1: 0, row1: 0, column2: 0, row2: 0 };
    var gamestate = 'no init';

    var showmoves = false, isaibot = false, gameover = false, isswap = false, gamewin = false; //флаги кнопок и конца игры и мыши

    var reset_button = document.getElementById("button_reset"); //переменать поле
    reset_button.className = 'reset_button';
    var hint_button = document.getElementById("button_hint"); //подсказки
    hint_button.className = 'hint_button';
    var ai_button = document.getElementById("button_ai"); //бот
    ai_button.className = 'ai_button';

    function init() {
        canvas.addEventListener("mousedown", onMouseDown);
        canvas.addEventListener("mouseup", onMouseUp);
        lvl = 0;
        lvl_type = 4;
        win_score = 1500;
        totalScore = 0;
        startTime = 30;
        presentTime = 0;
        bonusTime = 0;
        for (var i=0; i<columns; i++) {
            tiles[i] = [];
            for (var j=0; j<rows; j++) {
                tiles[i][j] = { type: 0, shift:0 }
            }
        }
        newLvl();
        stepAnimation(0);
    }

    function stepAnimation(t) {
        window.requestAnimationFrame(stepAnimation);
        update(t);
        draw();
    }
    var  animation_function = animation_remove_matchs;

    function animation_remove_matchs(dt) {
        findMatches();
        if (matches.length > 0) {
            for (var i=0; i<matches.length; i++) {
                score += ((matches[i].length * 1 - 3) * 50 + 100) * (i + 1);
            }
            markMatches();
            removeMatches();
            isswap = false;
            animation_function = animation_shift_tiles;
        } else {
            gamestate = 'waiting';
        }
    }
    function animation_shift_tiles(dt) {
        shiftTiles();
        isswap = false;
        animation_function = animation_remove_matchs;
        findMatches();
        if (matches.length <= 0) {
            gamestate = 'waiting';
        }
    }

    function animation_swap_tiles(dt) {
        swap(currentmove.column1, currentmove.row1, currentmove.column2, currentmove.row2);
        if (findMatches()) {
            isswap = false;
            animation_function = animation_remove_matchs;
            gamestate = 'processing';
        } else {
            isswap = true;
            animation_function = animation_back_swap_tiles;
        }
        findMoves();
        findMatches();
    }

    function animation_back_swap_tiles(dt) {
        swap(currentmove.column1, currentmove.row1, currentmove.column2, currentmove.row2);
        gamestate = 'waiting';
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
        animation_time += dt;

        if (score >= win_score)  gamewin = true;
        if (moves.length <= 0)
            resolveMatches();
        if (animation_time > animation_interval) {
            if (gamestate == 'waiting') { // Игра ждет действий игрока
                if ((isaibot) && (!gameover) && (!gamewin)) {
                    aibot();
                }
            } else if (gamestate == 'processing') { // Игра занята разрешением и анимацией матчей
                animation_function(dt);
            }
            animation_time = 0;
        }
        findMoves();
        findMatches();
    }

    function draw() { //рисуем поле
        context.fillStyle = "#d0d0d0";
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.fillStyle = "#fef190";
        context.fillRect(1, 1, canvas.width-2, canvas.height-2);

        if (showmoves && matches.length <= 0 && gamestate == 'waiting') {
            drawMoves();
        }
        drawTiles();
        if (gameover) drawGameTotal('GameOver');
        if (gamewin) drawGameTotal('Уровень пройден!');
    }
    function drawGameTotal(s){
        isaibot = false;
        ai_button.className = 'ai_button';
        showmoves = false;
        context.fillStyle = 'rgba(255, 165, 100, 0.9)';
        context.fillRect(1, 1, canvas.width-2, canvas.height-2);
        context.fillStyle = 'rgba(255, 240, 145, 1)';
        context.strokeStyle = '#8B0000';
        context.strokeStyle.fontsize(5);
        context.fillRect(140, 186, canvas.width - 280, canvas.height - 344);
        context.strokeRect(140, 186, canvas.width - 280, canvas.height - 344);
        context.fillStyle = "#8B0000";
        context.font = "24px Comic Sans MS";
        textdim = context.measureText(s);
        context.fillText(s, ((columns * tilewidth) - textdim.width)/2, (rows * tileheight) / 2 - 10);
        textdim = context.measureText("Очки: " + score.toString());
        context.fillText("Очки: " + score.toString(), ((columns * tilewidth) - textdim.width)/2, (rows * tileheight) / 2 + 30);
        if (s == 'Уровень пройден!'){
            textdim = context.measureText('Next >>');
            context.fillText('Next >>', ((columns * tilewidth) - textdim.width)/2, (rows * tileheight) / 2 + 60);
        }
    }
    function drawTiles() { // рисуем плитки
        document.getElementById('score').innerHTML = score;
        for (var i = 0; i < columns; i++) {
            for (var j = 0; j < rows; j++) {
                var shift = tiles[i][j].shift;
                var tilex = i * tilewidth;
                var tiley = (j + (animation_time / animation_interval) * shift) * tileheight;
                if (tiles[i][j].type >= 0) {
                    var emg = new Image();
                    emg.src = 'images/' + (tiles[i][j].type + 1).toString() + '.png';
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
        if (gamestate == 'processing' && isswap) {
            drawSwap();
        }
    }
    function drawSwap() {
        var dshiftx = (currentmove.column2 - currentmove.column1) * (animation_time / animation_interval);
        var dshifty = (currentmove.row2 - currentmove.row1) * (animation_time / animation_interval);

        var tilex1 = (currentmove.column1 + dshiftx)* tilewidth;
        var tiley1 = (currentmove.row1 + dshifty) * tileheight;
        var emg1 = new Image();
        emg1.src = 'images/' + (tiles[currentmove.column1][currentmove.row1].type + 1).toString() + '.png';

        var tilex2 = (currentmove.column2 - dshiftx) * tilewidth;
        var tiley2 = (currentmove.row2 - dshifty) * tileheight;
        var emg2 = new Image();
        emg2.src = 'images/' + (tiles[currentmove.column2][currentmove.row2].type + 1).toString() + '.png';

        context.fillStyle = "#fef190";
        context.fillRect(currentmove.column1* tilewidth, currentmove.row1 * tilewidth, tilewidth, tileheight);
        context.fillRect(currentmove.column2* tilewidth, currentmove.row2 * tilewidth, tilewidth, tileheight);

        context.drawImage(emg1, tilex1, tiley1);
        context.drawImage(emg2, tilex2, tiley2);
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

    function newLvl() {
        if (time != null)
            clearInterval(time);
        if (gamewin) lvl++;
        totalScore += score + bonusTime * 50;
        bonusTime = 0;
        score = 0;
        gamestate = 'waiting';
        isaibot = false;
        ai_button.className = 'ai_button';
        showmoves = false;
        time = setInterval(animationLineTimer, 1000);
        lineTimer.style.width = startTimerWidth + "px";
        gameover = false;
        gamewin = false;
        presentTime = startTime;
        createField();
        findMoves();
        findMatches();
    }

    function createField() {
        var done = false;
        while (!done) {
            for (var i=0; i<columns; i++) {
                for (var j=0; j<rows; j++) {
                    tiles[i][j].type = Math.floor(Math.random() * lvl_type);
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
            markMatches();
            removeMatches();
            shiftTiles();
            findMatches();
        }
    }

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



    function markMatches(){
        for (var i=0; i<matches.length; i++) {
            var h = 0;
            var v = 0;
            for (var j=0; j<matches[i].length; j++) {
                tiles[matches[i].column + h][matches[i].row + v].type = -1;
                if (matches[i].horizontal)  h++;
                else v++;
            }
        }
    }

    function removeMatches() {
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
                    tiles[i][j].type = Math.floor(Math.random() * lvl_type);
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
        isswap = true;
        animation_function = animation_swap_tiles;
        animationtime = 0;
        gamestate = 'processing';
    }

    function getMousePos(canvas, e) {
        var rect = canvas.getBoundingClientRect();
        return {
            x: Math.round((e.clientX - rect.left)/(rect.right - rect.left) * canvas.width),
            y: Math.round((e.clientY - rect.top)/(rect.bottom - rect.top) * canvas.height)
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
    var mdown;
    function onMouseDown(e) {
        mdown = getMouseTile(getMousePos(canvas, e));
    }
    function onMouseUp(e) {
        var mup = getMouseTile(getMousePos(canvas, e));
        if ((gameover || gamewin) && mdown.x != -1 && mup.x != -1 && mdown.y != -1 && mup.y != -1) newLvl();
        else if (mdown.x == mup.x && mdown.y == mup.y) {
            var  column_old = mup.x;
            var row_old = mup.y;
            if ((column_new != -1 ) && (row_new != -1) && (column_old != -1 ) && (row_old != -1)) {
                if ((column_old == column_new) && (row_old == row_new)) {
                    column_new = -1;
                    row_new = -1;
                    return;
                }
                if ((column_old != column_new) || (row_old != row_new)) {
                    if (Math.abs(row_old - row_new) + Math.abs(column_old - column_new) == 1) {
                        animationSwap(column_old, row_old, column_new, row_new);
                        if (findMatches()) resolveMatches();
                        else
                            animationSwap(column_old, row_old, column_new, row_new);
                        column_new = -1;
                        row_new = -1;
                        return;
                    }
                }
            }
            column_new = column_old;
            row_new = row_old;
        }
    }
    reset_button.onclick = function () {
        clearInterval(time);
        newLvl();
    }
    hint_button.onclick = function () {
        showmoves = !showmoves;
    }
    ai_button.onclick = function () {
        isaibot = !isaibot;
        if (isaibot) ai_button.className = 'active_ai_button';
        else ai_button.className = 'ai_button';
    }
    
    function animationLineTimer() {
        presentTime--;
        if (gamewin) {
            clearInterval(time);
            bonusTime = presentTime;
            console.log("bonus:" + bonusTime);
            return;
        }
        if (presentTime == 0) {
            lineTimer.style.width = "0px";
            gameover = true;
        }
        else {
            var reductionWidth = (startTimerWidth / startTime);
            lineTimer.style.width = reductionWidth * presentTime + "px";
        }
        console.log("time:" + presentTime);
    }

    var cookAnimation = document.getElementById("cookAnimation");
    setInterval(randomizeAnimationCook, 5000);

    function randomizeAnimationCook() {
        var randomInt = Math.round(1 + Math.random() * 9);
        if (randomInt == 1)
            cookAnimation.src = "images/3.gif";
        else if (randomInt <= 5)
            cookAnimation.src = "images/2.gif";
        else
            cookAnimation.src = "images/1.gif";
    }

    init();
};