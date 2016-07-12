    var tiles = [];
    var matches = [];
    var moves = [];
    var columns = 10;
    var rows = 10;
    im = [];
    var selectedtile = { selected: false, column: 0, row: 0 }
    var tilecolors = ["stone1", "stone2", "stone3","stone4","stone5", "stone6", "stone7","stone8","stone9", "stone10"];
    var buttonNewGame = document.getElementById("buttonNewGame");
    var GameField;
    var isGenerationField = true;
    var score = 0;

        buttonNewGame.onclick = function () {
            if(!isGenerationField)
                isGenerationField = true;
            if (GameField == null)
                GameField = document.getElementById("GameField");
            else 
                GameField.innerHTML = "";
            GameField.className = "gameField";
            for (var i = 0; i < columns; i++) {
                tiles[i] = [];
                for (var j = 0; j < rows; j++) {
                    var newElement = document.createElement("div");
                    newElement.className = "stone";
                    newElement.className = tilecolors[1];
                    newElement.id = i + ' ' + j;
                    newElement.onclick = cellClick;
                    newElement.style.left = (50 * i) + "px";
                    newElement.style.top = (50 * j) + "px";
                    newElement.style.transition = '1s';
                    GameField.appendChild(newElement);
                    tiles[i][j] = {type: 0, shift:0, obj: newElement};
                }
            }
            createField();
            for (var i = 0; i < columns; i++)
                for (var j = 0; j < rows; j++){
                    tiles[i][j].obj.className = tilecolors[tiles[i][j].type];
                }
        }

    var column_new, row_new;
    function cellClick(event) {
        if(isGenerationField) {
            isGenerationField = false;
            score = 0;
        }
        var event = window.event,
            el = event.target  || event.srcElement,
            column_old = el.id.charAt(0)
            row_old = el.id.charAt(2);
        if ((column_old != column_new) || (row_old != row_new)) {
            if(Math.abs(row_old - row_new) +  Math.abs(column_old - column_new) == 1) {
                swap(column_old, row_old, column_new, row_new);
                if (findMatches()){
                    resolveMatches()
                for (var i = 0; i < columns; i++)
                    for (var j = 0; j < rows; j++){
                        tiles[i][j].obj.className = tilecolors[tiles[i][j].type];
                    }
                }
                else
                    swap(column_old, row_old, column_new, row_new);
                return(true);
            }
        }
        scoreMatches()
        column_new = column_old;
        row_new = row_old;
        return(false);
    }
    function createField() {
        var done = false;
        while (!done) {
            for (var i = 0; i < columns; i++) {
                for (var j = 0; j < rows; j++) {
                    tiles[i][j].type = Math.floor(Math.random() * tilecolors.length);
                }
            }
            resolveMatches();
            findMoves();
            if (moves.length > 0) {
                done = true;
            }
        }
    };

    function swap(x1, y1, x2, y2){
        var tmp = tiles[x1][y1].type;
        tiles[x1][y1].type = tiles[x2][y2].type;
        tiles[x2][y2].type = tmp;
    };

    function findMatches(){
        matches = []

        for (var j = 0; j < rows; j++) {
            var matchlength = 1;
            for (var i=0; i < columns; i++) {
                var checkmach = false;

                if (i === columns-1) {
                    checkmach = true;
                } else {
                    if (tiles[i][j].type == tiles[i+1][j].type && tiles[i][j].type != -1) {
                        matchlength += 1;
                    } else {
                        checkmach = true;
                    }
                }

                if (checkmach) {
                    if (matchlength >= 3) {
                        score += ((matchlength * 1 - 3) * 50 + 100) * (i + 1);
                        matches.push({ column: i + 1 - matchlength, row: j, length: matchlength, horizontal: true});
                    }
                    matchlength = 1;
                }
            }
        }

        for (var i = 0; i < columns; i++){
            var matchlength = 1;
            for (var j = 0; j < rows; j++) {
                var checkmach = false;
                if (j === rows - 1) {
                    checkmach = true;
                } else {
                    if (tiles[i][j].type=== tiles[i][j+1].type && tiles[i][j].type != -1)
                        matchlength += 1;
                     else
                        checkmach = true;
                }
                if (checkmach) {
                    if (matchlength >= 3) {
                        score += ((matchlength * 1 - 3) * 50 + 100) * (i + 1);
                        matches.push({ column: i, row:j + 1 - matchlength, length: matchlength, horizontal: false});
                    }
                    matchlength = 1;
                }
            }
        }
        return matches.length > 0;
    };

    function noteMaches() {
        for (var i = 0; i < matches.length; i++){
            var h = 0;
            var v = 0;
            for (var j = 0; j < matches[i].length; j++) {
                tiles[matches[i].column + h][matches[i].row + v].type = -1;
                if (matches[i].horizontal) h++;
                else  v++;
            }
        }
    };

    function removeMatches() {
        noteMaches();
        for (var i=0; i < columns; i++) {
            var shift = 0;
            for (var j = rows - 1; j >= 0; j--) {
                if (tiles[i][j].type == -1) {
                    shift++;
                    tiles[i][j].shift = 0;
                }
                else tiles[i][j].shift = shift;
            }
        }
    };
    function shiftTiles() {
        for (var i = 0; i < columns; i++) {
            for (var j = rows - 1; j >= 0; j--) {
                if (tiles[i][j].type == -1) {
                    tiles[i][j].type = Math.floor(Math.random() * tilecolors.length);
                } else {
                    var shift = tiles[i][j].shift;
                    if (shift > 0) swap(i, j, i, j + shift);
                }
                tiles[i][j].shift = 0;
            }
        }
    };
    function findMoves(){
          moves = []

          for (var j = 0; j < rows; j++) {
              for (var i = 0; i < columns - 1; i++) {
                  swap(i, j, i + 1, j);
                  findMatches();
                  swap(i, j, i + 1, j);

                  if (matches.length > 0) {
                      moves.push({column1: i, row1: j, column2: i + 1, row2: j});
                  }
              }
          }

          for (var i = 0; i < columns; i++) {
              for (var j = 0; j < rows - 1; j++) {
                  swap(i, j, i, j + 1);
                  findMatches();
                  swap(i, j, i, j + 1);

                  if (matches.length > 0) {
                      moves.push({column1: i, row1: j, column2: i, row2: j + 1});
                  }
              }
          }
          matches = [];
      };

        function resolveMatches() {
            findMatches();
          while (matches.length > 0) {
              removeMatches();
              shiftTiles();
              findMatches();
          }
      };

        function aibot() {
          findMoves();
          if (moves.length > 0) {
              var move = moves[Math.floor(Math.random() * moves.length)];
              mouseSwap(move.column1, move.row1, move.column2, move.row2);
          }
      };
      
        function scoreMatches() {
            alert(score);
        };