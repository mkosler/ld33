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

    this._leftHeld = false;

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

            this._rects.push(rect);
        }
    }
}

Level.prototype = {
};

function onMouseDown(eventData) {
    level._leftHeld = (eventData.buttons & 1) !== 0;
}

function onMouseUp(eventData) {
    level._leftHeld = (eventData.buttons & 1) !== 0;
}

function onMouseMove(eventData) {
    if (level._leftHeld) {
        level._rects.forEach(function(rect) {
            if (rect.contains(eventData.clientX, eventData.clientY)) {
                console.log(rect.row, rect.column);
            }
        });
    }
}

var renderer = PIXI.autoDetectRenderer(GAME_WIDTH, GAME_HEIGHT, { backgroundColor: 0x000000 });

document.body.appendChild(renderer.view);

var stage = new PIXI.Container();

var level = new Level(data, 10, 10);

document.body.onmousedown = onMouseDown;
document.body.onmouseup = onMouseUp;
document.body.onmousemove = onMouseMove;

stage.addChild(level.container);

function animate() {
    requestAnimationFrame(animate);

    renderer.render(stage);
}

animate();
