var SPACE_WIDTH = 40,
    SPACE_HEIGHT = 30,
    GAME_WIDTH = 400,
    GAME_HEIGHT = 300;

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
            }
        }.bind(this));
    }.bind(this));

    // rects
    for (r = 0; r < rows; r++) {
        for (c = 0; c < columns; c++) {
            var rect = new PIXI.Rectangle(SPACE_WIDTH * c, SPACE_HEIGHT * r, SPACE_WIDTH, SPACE_HEIGHT);

            rect.row = r;
            rect.column = c;

            rect.centerX = rect.x + rect.width / 2;
            rect.centerY = rect.y + rect.height / 2;

            this._rects.push(rect);
        }
    }
}

Level.prototype = {};

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

    level._rects.forEach(function(rect) {
        if (rect.contains(e.data.global.x, e.data.global.y)) {
            if (typeof(level.lastRect) !== 'undefined' && level.lastRect !== null) {
                var lr = level.lastRect;

                if ((lr.row === rect.row - 1 || lr.row === rect.row + 1) &&
                    lr.column === rect.column) {

                    if (level.leftHeld &&
                        ((lr.row === rect.row - 1 && (typeof(lr.downLine) === 'undefined' || lr.downLine === null)) ||
                        (lr.row === rect.row + 1 && (typeof(rect.downLine) === 'undefined' || rect.downLine === null)))) {

                        var dl = new PIXI.Graphics();

                        dl.lineStyle(2, 0xFFFF00, 1);

                        dl.moveTo(lr.centerX, lr.centerY);
                        dl.lineTo(rect.centerX, rect.centerY);

                        if (lr.row === rect.row - 1) {
                            lr.downLine = dl;
                        } else {
                            rect.downLine = dl;
                        }

                        level.container.addChild(dl);

                    } else if (level.rightHeld &&
                               ((lr.row === rect.row - 1 && (typeof(lr.downLine) !== 'undefined' && lr.downLine !== null)) ||
                                (lr.row === rect.row + 1 && (typeof(rect.downLine) !== 'undefined' && rect.downLine !== null)))) {

                        if (lr.row === rect.row - 1) {
                            level.container.removeChild(lr.downLine);
                        } else {
                            level.container.removeChild(rect.downLine);
                        }
                    }
                }

                if (lr.row === rect.row &&
                    (lr.column === rect.column - 1 || lr.column === rect.column + 1)) {

                    if (level.leftHeld &&
                        ((lr.column === rect.column - 1 && (typeof(lr.rightLine) === 'undefined' || lr.rightLine === null)) ||
                         (lr.column === rect.column + 1 && (typeof(rect.rightLine) === 'undefined' || rect.rightLine === null)))) {

                        var rl = new PIXI.Graphics();

                        rl.lineStyle(2, 0xFFFF00, 1);

                        rl.moveTo(lr.centerX, lr.centerY);
                        rl.lineTo(rect.centerX, rect.centerY);

                        if (lr.column === rect.column - 1) {
                            lr.rightLine = rl;
                        } else {
                            rect.rightLine = rl;
                        }

                        level.container.addChild(rl);

                    } else if (level.rightHeld &&
                               ((lr.column === rect.column - 1 && (typeof(lr.rightLine) !== 'undefined' && lr.rightLine !== null)) ||
                                (lr.column === rect.column + 1 && (typeof(rect.rightLine) !== 'undefined' && rect.rightLine !== null)))) {

                        if (lr.column === rect.column - 1) {
                            level.container.removeChild(lr.rightLine);
                        } else {
                            level.container.removeChild(rect.rightLine);
                        }
                    }
                }
            }

            level.lastRect = rect;
        }
    });
}

var renderer = PIXI.autoDetectRenderer(GAME_WIDTH, GAME_HEIGHT, { backgroundColor: 0x000000 });

document.body.appendChild(renderer.view);

var stage = new PIXI.Container();

stage.hitArea = new PIXI.Rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT);

stage.interactive = true;
stage.buttonMode = true;

stage.on('mousedown', onMouseDown)
     .on('mousemove', onMouseMove)
     .on('mouseup', onMouseUp);

//stage.interactive = true;

//stage.on('click', function() { console.log('FUCK YOU'); });

//stage.on('mousedown', onMouseDown)
     //.on('mousemove', onMouseMove)
     //.on('mouseup', onMouseUp)
     //.on('click', function() { console.log('FUCK'); });

//stage.mousedown = onMouseDown;
//stage.mousemove = onMouseMove;
//stage.mouseup = onMouseUp;

//document.body.onmousedown = onMouseDown;
//document.body.onmousemove = onMouseMove;
//document.body.onmouseup = onMouseUp;

var level = new Level(data, 10, 10);

stage.addChild(level.container);

function animate() {
    requestAnimationFrame(animate);

    renderer.render(stage);
}

animate();
