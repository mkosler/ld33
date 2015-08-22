var SPACE_WIDTH = 80,
    SPACE_HEIGHT = 60,
    GAME_WIDTH = 800,
    GAME_HEIGHT = 600;

var data = [
    [ 0, 0, 1, 0, 1, 0, 0, 0, 0, 0 ],
    [ 0, 0, 0, 0, 1, 0, 0, 0, 2, 0 ],
    [ 0, 0, 2, 0, 2, 0, 1, 0, 0, 0 ],
    [ 0, 0, 0, 1, 0, 0, 1, 0, 0, 0 ],
    [ 2, 0, 0, 0, 0, 1, 0, 0, 0, 1 ],
    [ 0, 0, 1, 0, 0, 0, 0, 1, 0, 0 ],
    [ 0, 0, 2, 0, 0, 0, 1, 0, 0, 0 ],
    [ 1, 0, 0, 0, 2, 0, 0, 0, 0, 1 ],
    [ 0, 0, 0, 0, 0, 0, 1, 1, 0, 0 ],
    [ 0, 0, 2, 0, 0, 0, 0, 0, 0, 2 ]
];

function Level(data, rows, columns) {
    this.rows = rows;

    this.columns = columns;

    this._data = data;

    this.container = new PIXI.Container();

    this._gridGraphic = new PIXI.Graphics();

    this._rects = [];

    this.leftHeld = false;

    this.rightHeld = false;

    // grid background
    this._gridGraphic.lineStyle(0.5, 0xFFFFFF, 1);

    for (var i = 0; i < rows; i++) {
        this._gridGraphic.moveTo(0, SPACE_HEIGHT * i);
        this._gridGraphic.lineTo(GAME_WIDTH, SPACE_HEIGHT * i);
    }

    for (i = 0; i < columns; i++) {
        this._gridGraphic.moveTo(SPACE_WIDTH * i, 0);
        this._gridGraphic.lineTo(SPACE_WIDTH * i, GAME_HEIGHT);
    }

    this.container.addChild(this._gridGraphic);

    // rects
    for (r = 0; r < rows; r++) {
        var row = [];

        for (c = 0; c < columns; c++) {
            var rect = new PIXI.Rectangle(SPACE_WIDTH * c, SPACE_HEIGHT * r, SPACE_WIDTH, SPACE_HEIGHT);

            rect.row = r;
            rect.column = c;

            rect.centerX = rect.x + rect.width / 2;
            rect.centerY = rect.y + rect.height / 2;

            rect.left = false;
            rect.right = false;
            rect.up = false;
            rect.down = false;

            row.push(rect);
        }

        this._rects.push(row);
    }

    data.forEach(function(row, r) {
        row.forEach(function(column, c) {
            if (column !== 0) {
                var special = new PIXI.Graphics();

                if (column === 1) {
                    special.beginFill(0xFFFFFF, 0.75);
                } else if (column === 2) {
                    special.beginFill(0xB1B1B1, 0.5);
                }

                special.drawEllipse((SPACE_WIDTH * c) + (SPACE_WIDTH / 2), (SPACE_HEIGHT * r) + (SPACE_HEIGHT / 2), SPACE_WIDTH / 3, SPACE_HEIGHT / 3);
                special.endFill();

                this.container.addChild(special);

                this._rects[r][c].graphic = special;
            }
        }.bind(this));
    }.bind(this));
}

Level.prototype = {
    isComplete: function() {
        var specials = [];

        this._data.forEach(function (row, r) {
            row.forEach(function (column, c) {
                if (column !== 0) {
                    var passed = false,
                        middleRect = this._rects[r][c],
                        leftRect = (c - 1 >= 0) ? this._rects[r][c - 1] : null,
                        rightRect = (c + 1 < this._rects[r].length) ? this._rects[r][c + 1] : null,
                        upRect = (r - 1 >= 0) ? this._rects[r - 1][c] : null,
                        downRect = (r + 1 < this._rects.length) ? this._rects[r + 1][c] : null;

                    middleRect.graphic.tint = 0xFFFFFF;

                    if (column === 1) {
                        if (middleRect.left && middleRect.right && !middleRect.up && !middleRect.down) {
                            if (leftRect !== null &&
                                (leftRect.up || leftRect.down)) {

                                passed = true;
                            } else if (rightRect !== null &&
                                       (rightRect.up || rightRect.down)) {

                                passed = true;
                            }
                        } else if (middleRect.up && middleRect.down && !middleRect.left && !middleRect.right) {

                            if (upRect !== null &&
                                (upRect.left || upRect.right)) {

                                passed = true;
                            } else if (downRect !== null &&
                                       (downRect.left || downRect.right)) {

                                passed = true;
                            }
                        }
                    } else if (column === 2) {
                        var horizRect = null,
                            vertRect = null;

                        if (middleRect.left && !middleRect.right) {
                            horizRect = leftRect;
                        } else if (middleRect.right && !middleRect.left) {
                            horizRect = rightRect;
                        }

                        if (middleRect.up && !middleRect.down) {
                            vertRect = upRect;
                        } else if (middleRect.down && !middleRect.up) {
                            vertRect = downRect;
                        }

                        if (horizRect !== null && horizRect.left && horizRect.right && !horizRect.down && !horizRect.up &&
                            vertRect !== null && vertRect.up && vertRect.down && !vertRect.left && !vertRect.right) {

                            passed = true;
                        }
                    }

                    if (passed) {
                        middleRect.graphic.tint = 0x00FF00;
                    }

                    specials.push(passed);
                }

            }.bind(this));
        }.bind(this));

        return specials.filter(function(s) { return s === false; }).length === 0;
    },

    isPathComplete: function() {
        var pathRects = this._rects.reduce(function(pr, row) {
            return pr.concat(row.filter(function(rect) {
                var rectCount = 0;

                if (rect.up) rectCount++;
                if (rect.down) rectCount++;
                if (rect.left) rectCount++;
                if (rect.right) rectCount++;

                return rectCount === 2;
            }));
        }, []);

        if (pathRects.length === 0) return false;

        var passed = false;

        pathRects.forEach(function(rect) {
            rect.hOpen = rect.vOpen = true;
        });

        var count = 0;

        function recur(rect, allRects, origin, first) {
            var nextRect = null;

            if (nextRect === null && rect.left) {
                nextRect = allRects[rect.row][rect.column - 1];

                if (!nextRect.hOpen) {
                    nextRect = null;
                } else {
                    nextRect.hOpen = rect.hOpen = false;
                }
            }
            
            if (nextRect === null && rect.right) {
                nextRect = allRects[rect.row][rect.column + 1];

                if (!nextRect.hOpen) {
                    nextRect = null;
                } else {
                    nextRect.hOpen = rect.hOpen = false;
                }
            }
            
            if (nextRect === null && rect.up) {
                nextRect = allRects[rect.row - 1][rect.column];

                if (!nextRect.vOpen) {
                    nextRect = null;
                } else {
                    nextRect.vOpen = rect.vOpen = false;
                }
            }
            
            if (nextRect === null && rect.down) {
                nextRect = allRects[rect.row + 1][rect.column];

                if (!nextRect.vOpen) {
                    nextRect = null;
                } else {
                    nextRect.vOpen = rect.vOpen = false;
                }
            }

            if (nextRect !== null) {
                return recur(nextRect, allRects, origin, false);
            } else if (!rect.hOpen && !rect.vOpen && rect === origin) {
                origin.finished = true;

                return;
            }
        }

        pathRects[0].finished = false;

        recur(pathRects[0], this._rects, pathRects[0], true);

        return pathRects.filter(function(rect) { return rect.open; }).length === 0 && pathRects[0].finished;
    }
};

function onMouseDown(e) {
    var eventData = e.data.originalEvent;

    level.leftHeld = (eventData.buttons & 1) !== 0;
    level.rightHeld = (eventData.buttons & 4) !== 0;
}

function onMouseUp(e) {
    var eventData = e.data.originalEvent;

    level.leftHeld = (eventData.buttons & 1) !== 0;
    level.rightHeld = (eventData.buttons & 4) !== 0;
}

function onMouseMove(e) {
    var eventData = e.data.originalEvent;

    level._rects.forEach(function(row) {
        row.forEach(function (rect) {
            if (rect.contains(e.data.global.x, e.data.global.y)) {
                if (typeof(level.lastRect) !== 'undefined' && level.lastRect !== null) {
                    var lr = level.lastRect,
                        rectCount = 0,
                        lrCount = 0;

                    if ((lr.row === rect.row - 1 || lr.row === rect.row + 1) &&
                        lr.column === rect.column) {

                        if (level.leftHeld &&
                            ((lr.row === rect.row - 1 && (typeof(lr.downLine) === 'undefined' || lr.downLine === null)) ||
                            (lr.row === rect.row + 1 && (typeof(rect.downLine) === 'undefined' || rect.downLine === null)))) {

                            if (rect.up) rectCount++;
                            if (rect.down) rectCount++;
                            if (rect.left) rectCount++;
                            if (rect.right) rectCount++;

                            if (lr.up) lrCount++;
                            if (lr.down) lrCount++;
                            if (lr.left) lrCount++;
                            if (lr.right) lrCount++;

                            if (rectCount <= 1 && lrCount <= 1) {
                                var dl = new PIXI.Graphics();

                                dl.lineStyle(2, 0xFFFF00, 1);

                                dl.moveTo(lr.centerX, lr.centerY);
                                dl.lineTo(rect.centerX, rect.centerY);

                                if (lr.row === rect.row - 1) {
                                    lr.downLine = dl;

                                    lr.down = true;
                                    rect.up = true;
                                } else {
                                    rect.downLine = dl;

                                    rect.down = true;
                                    lr.up = true;
                                }

                                level.container.addChild(dl);
                            }
                        } else if (level.rightHeld &&
                                   ((lr.row === rect.row - 1 && (typeof(lr.downLine) !== 'undefined' && lr.downLine !== null)) ||
                                    (lr.row === rect.row + 1 && (typeof(rect.downLine) !== 'undefined' && rect.downLine !== null)))) {

                            if (lr.row === rect.row - 1) {
                                level.container.removeChild(lr.downLine);

                                lr.downLine.destroy();

                                lr.downLine = null;

                                lr.down = false;
                                rect.up = false;
                            } else {
                                level.container.removeChild(rect.downLine);

                                rect.downLine.destroy();

                                rect.downLine = null;

                                rect.down = false;
                                lr.up = false;
                            }
                        }
                    } else if (lr.row === rect.row &&
                        (lr.column === rect.column - 1 || lr.column === rect.column + 1)) {

                        if (level.leftHeld &&
                            ((lr.column === rect.column - 1 && (typeof(lr.rightLine) === 'undefined' || lr.rightLine === null)) ||
                             (lr.column === rect.column + 1 && (typeof(rect.rightLine) === 'undefined' || rect.rightLine === null)))) {

                            if (rect.up) rectCount++;
                            if (rect.down) rectCount++;
                            if (rect.left) rectCount++;
                            if (rect.right) rectCount++;

                            if (lr.up) lrCount++;
                            if (lr.down) lrCount++;
                            if (lr.left) lrCount++;
                            if (lr.right) lrCount++;

                            if (rectCount <= 1 && lrCount <= 1) {
                                var rl = new PIXI.Graphics();

                                rl.lineStyle(2, 0xFFFF00, 1);

                                rl.moveTo(lr.centerX, lr.centerY);
                                rl.lineTo(rect.centerX, rect.centerY);

                                if (lr.column === rect.column - 1) {
                                    lr.rightLine = rl;

                                    lr.right = true;
                                    rect.left = true;
                                } else {
                                    rect.rightLine = rl;

                                    rect.right = true;
                                    lr.left = true;
                                }

                                level.container.addChild(rl);
                            }
                        } else if (level.rightHeld &&
                                   ((lr.column === rect.column - 1 && (typeof(lr.rightLine) !== 'undefined' && lr.rightLine !== null)) ||
                                    (lr.column === rect.column + 1 && (typeof(rect.rightLine) !== 'undefined' && rect.rightLine !== null)))) {

                            if (lr.column === rect.column - 1) {
                                level.container.removeChild(lr.rightLine);

                                lr.rightLine.destroy();

                                lr.rightLine = null;

                                lr.right = false;
                                rect.left = false;
                            } else {
                                level.container.removeChild(rect.rightLine);

                                rect.rightLine.destroy();

                                rect.rightLine = null;

                                rect.right = false;
                                lr.left = false;
                            }
                        }
                    }
                }

                level.lastRect = rect;
            }
        });
    });
}

var renderer = PIXI.autoDetectRenderer(GAME_WIDTH, GAME_HEIGHT, { backgroundColor: 0x000000 });

document.body.appendChild(renderer.view);

var stage = new PIXI.Container();

//stage.hitArea = new PIXI.Rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT);

//stage.interactive = true;
//stage.buttonMode = true;

//stage.on('mousedown', onMouseDown)
     //.on('mousemove', onMouseMove)
     //.on('mouseup', onMouseUp)
     //.on('mouseupoutside', onMouseUp);

var level = new Level(data, 10, 10);

level.container.hitArea = new PIXI.Rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT);

level.container.interactive = true;

level.container.buttonMode = true;

level.container.on('mousedown', onMouseDown)
               .on('mousemove', onMouseMove)
               .on('mouseup', onMouseUp)
               .on('mouseupoutside', onMouseUp);

var winnerText = null;

stage.addChild(level.container);

var music = new Audio('level.wav');

music.loop = true;

music.play();

function animate() {
    requestAnimationFrame(animate);

    if ((typeof(winnerText) === 'undefined' || winnerText === null) &&
        level.isComplete() && level.isPathComplete()) {

        winnerText = new PIXI.Text('Winner!', {
            align: 'center',
            stroke: 0xAFB4BB,
            strokeThickness: 2
        });

        winnerText.x = GAME_WIDTH / 2;
        winnerText.y = GAME_HEIGHT / 2;

        stage.addChild(winnerText);

        level.container.interactive = false;

        level.container.buttonMode = false;
    }

    renderer.render(stage);
}

animate();
