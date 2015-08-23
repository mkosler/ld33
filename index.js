var SPACE_WIDTH = 80,
    SPACE_HEIGHT = 60,
    GAME_WIDTH = 800,
    GAME_HEIGHT = 600;

function Book(stage) {
    this.stage = stage;

    this.pages = [];

    this.pageNumber = -1;

    this.currentPage = null;
}

Book.prototype = {
    next: function() {
        this.goTo(this.pageNumber + 1);
    },

    prev: function() {
        this.goTo(this.pageNumber - 1);
    },

    goTo: function(n) {
        this.pageNumber = n;

        if (typeof(this.currentPage) !== 'undefined' && this.currentPage !== null) {
            this.stage.removeChild(this.currentPage);
        }

        if (!this.isEnd()) {
            this.currentPage = this.pages[this.pageNumber];

            this.stage.addChild(this.currentPage);
        }
    },

    isEnd: function() {
        return this.pageNumber >= this.pages.length || this.pageNumber < 0;
    },

    removeAndDestroy: function() {
        this.pages.forEach(function(page) {
            this.stage.removeChild(page);

            page.destroy();
        });
    }
};

function Level(data, rows, columns) {
    this.rows = rows;

    this.columns = columns;

    this._data = data;

    this.container = new PIXI.Container();

    this.container.hitArea = new PIXI.Rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT);

    //this.container.interactive = true;

    //this.container.buttonMode = true;

    this.container.on('mousedown', onMouseDown)
                  .on('mousemove', onMouseMove)
                  .on('mouseup', onMouseUp)
                  .on('mouseupoutside', onMouseUp);

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

var levelNum = 0;

var stage = new PIXI.Container();

var level = new Level(levels[levelNum], 10, 10);

stage.addChild(level.container);

var music = new Audio('level.mp3');

music.loop = true;

music.play();

var victory = false;

// Front book
var frontBook = new Book(stage);

frontBook.pages.push((function() {
    var pageOne = new PIXI.Container();

    pageOne.addChild((function() {
        var background = new PIXI.Graphics();

        var bgwidth = 3 * GAME_WIDTH / 7,
            bgheight = 3 * GAME_HEIGHT / 7;

        background.lineStyle(10, 0x0d0d0d, 1);

        background.beginFill(0x636c6f, 1);
        background.drawRoundedRect((GAME_WIDTH / 2) - (bgwidth / 2), (GAME_HEIGHT / 2) - (bgheight / 2), bgwidth, bgheight, 15);
        background.endFill();

        return background;
    }()));

    pageOne.addChild((function() {
        var titleText = new PIXI.Text('Masyu', {
            font: 'bold 38px Arial',
            stroke: 0xFFFFFF,
            strokeThickness: 2,
            padding: 10
        });

        titleText.x = 335;
        titleText.y = 200;

        return titleText;
    }()));

    pageOne.addChild((function() {
        var playButton = new PIXI.Graphics();

        playButton.beginFill(0x84b388, 1);
        playButton.drawRect(276, 300, 87, 42);
        playButton.endFill();

        playButton.interactive = playButton.buttonMode = true;

        playButton.on('click', function() {
            frontBook.removeAndDestroy();

            level.container.interactive = level.container.buttonMode = true;
        });

        playButton.addChild((function() {
            var playText = new PIXI.Text('Play', {
                font: 'bold 18px Arial',
                stroke: 0xFFFFFF,
                strokeThickness: 3
            });

            playText.x = 299;
            playText.y = 307;

            return playText;
        }()));

        return playButton;
    }()));

    pageOne.addChild((function() {
        var tutorialButton = new PIXI.Graphics();

        tutorialButton.beginFill(0xbed2e6, 1);
        tutorialButton.drawRect(422, 300, 100, 42);
        tutorialButton.endFill();

        tutorialButton.interactive = tutorialButton.buttonMode = true;

        tutorialButton.on('click', function() {
            frontBook.next();
        });

        tutorialButton.addChild((function() {
            var tutorialText = new PIXI.Text('Tutorial', {
                font: 'bold 18px Arial',
                stroke: 0xFFFFFF,
                strokeThickness: 3
            });

            tutorialText.x = 436;
            tutorialText.y = 307;

            return tutorialText;
        }()));

        return tutorialButton;
    }()));

    return pageOne;
}()));

frontBook.pages.push((function() {
    var page = new PIXI.Container();

    page.addChild((function() {
        var background = new PIXI.Graphics();

        var bgwidth = 3 * GAME_WIDTH / 4,
            bgheight = 3 * GAME_HEIGHT / 4;

        background.lineStyle(10, 0x0d0d0d, 1);

        background.beginFill(0x636c6f, 1);
        background.drawRoundedRect((GAME_WIDTH / 2) - (bgwidth / 2), (GAME_HEIGHT / 2) - (bgheight / 2), bgwidth, bgheight, 15);
        background.endFill();

        return background;
    }()));

    page.addChild((function() {
        var addText = new PIXI.Text('The object of the game is to create a single, continuous, non-intersecting loop passes through all the special spaces. A line can enter and exit a grid cell in one of the four cardinal directions.\n\nYou play by holding a mouse button down and dragging from one grid cell to another. You add lines by holding down the LEFT mouse button, and remove them by holding down the MIDDLE mouse button', {
            font: 'bold 20px Arial',
            stroke: 0xFFFFFF,
            strokeThickness: 0,
            wordWrap: true,
            wordWrapWidth: (3 * GAME_WIDTH / 4) - 25
        });

        addText.x = 117;
        addText.y = 103;

        return addText;
    }()));

    page.addChild((function() {
        var textures = [];

        for (var i = 0; i <= 20; i++) {
            textures.push(PIXI.Texture.fromImage('add-split/frame_' + i + '.gif'));
        }

        var movieClip = new PIXI.extras.MovieClip(textures);

        movieClip.animationSpeed = 0.25;

        movieClip.x = 134;
        movieClip.y = 340;

        movieClip.play();

        return movieClip;
    }()));

    page.addChild(function() {
        var textures = [];

        for (var i = 0; i <= 24; i++) {
            textures.push(PIXI.Texture.fromImage('remove-split/frame_' + i + '.gif'));
        }

        var movieClip = new PIXI.extras.MovieClip(textures);

        movieClip.animationSpeed = 0.25;

        movieClip.x = GAME_WIDTH - 334 - 150;
        movieClip.y = 340;

        movieClip.play();

        return movieClip;
    }());

    page.addChild((function() {
        var next = new PIXI.Graphics();

        next.beginFill(0xbed2e6, 1);
        next.drawRect(543, 388, 87, 42);
        next.endFill();

        next.interactive = next.buttonMode = true;

        next.on('click', function() {
            frontBook.next();
        });

        next.addChild((function() {
            var text = new PIXI.Text('Next', {
                font: 'bold 18px Arial',
                stroke: 0xFFFFFF,
                strokeThickness: 3
            });

            text.x = 566;
            text.y = 395;

            return text;
        }()));

        return next;
    }()));

    return page;
}()));

frontBook.pages.push((function() {
    var page = new PIXI.Container();

    page.addChild((function() {
        var bg = new PIXI.Graphics(),
            bgwidth = GAME_WIDTH / 1.5,
            bgheight = GAME_HEIGHT / 1.5;

        bg.lineStyle(10, 0x0d0d0d, 1);

        bg.beginFill(0x636c6f, 1);
        bg.drawRoundedRect((GAME_WIDTH / 2) - (bgwidth / 2), (GAME_HEIGHT / 2) - (bgheight / 2), bgwidth, bgheight, 15);
        bg.endFill();

        return bg;
    }()));

    page.addChild((function() {
        var text = new PIXI.Text('There are two types of special spaces: white and black.\n\nThe white space must be traveled straight through, but must turn in the previous and/or the next cell in its path.', {
            font: 'bold 20px Arial',
            wordWrap: true,
            wordWrapWidth: (GAME_WIDTH / 1.5) - 25,
        });

        text.x = 155;
        text.y = 120;

        return text;
    }()));

    page.addChild((function() {
        var image = new PIXI.Sprite.fromImage('white.png');

        image.x = 255;
        image.y = 280;

        return image;
    }()));

    page.addChild((function() {
        var prev = new PIXI.Graphics();

        prev.beginFill(0xbed2e6, 1);
        prev.drawRect(543, 338, 87, 42);
        prev.endFill();

        prev.interactive = prev.buttonMode = true;

        prev.on('click', function() {
            frontBook.prev();
        });

        prev.addChild((function() {
            var text = new PIXI.Text('Prev', {
                font: 'bold 18px Arial',
                stroke: 0xFFFFFF,
                strokeThickness: 3
            });

            text.x = 566;
            text.y = 345;

            return text;
        }()));

        return prev;
    }()));

    page.addChild((function() {
        var next = new PIXI.Graphics();

        next.beginFill(0xbed2e6, 1);
        next.drawRect(543, 388, 87, 42);
        next.endFill();

        next.interactive = next.buttonMode = true;

        next.on('click', function() {
            frontBook.next();
        });

        next.addChild((function() {
            var text = new PIXI.Text('Next', {
                font: 'bold 18px Arial',
                stroke: 0xFFFFFF,
                strokeThickness: 3
            });

            text.x = 566;
            text.y = 395;

            return text;
        }()));

        return next;
    }()));

    return page;
}()));

frontBook.pages.push((function() {
    var page = new PIXI.Container();

    page.addChild((function() {
        var bg = new PIXI.Graphics(),
            bgwidth = GAME_WIDTH / 1.5,
            bgheight = GAME_HEIGHT / 1.5;

        bg.lineStyle(10, 0x0d0d0d, 1);

        bg.beginFill(0x636c6f, 1);
        bg.drawRoundedRect((GAME_WIDTH / 2) - (bgwidth / 2), (GAME_HEIGHT / 2) - (bgheight / 2), bgwidth, bgheight, 15);
        bg.endFill();

        return bg;
    }()));

    page.addChild((function() {
        var text = new PIXI.Text('There are two types of special spaces: white and black.\n\nThe black space must have a turn on their grid cell, but both the next and previous cells must have been traveled straight through.', {
            font: 'bold 20px Arial',
            wordWrap: true,
            wordWrapWidth: (GAME_WIDTH / 1.5) - 25,
        });

        text.x = 155;
        text.y = 120;

        return text;
    }()));

    page.addChild((function() {
        var image = new PIXI.Sprite.fromImage('black.png');

        image.x = 225;
        image.y = 280;

        return image;
    }()));

    page.addChild((function() {
        var prev = new PIXI.Graphics();

        prev.beginFill(0xbed2e6, 1);
        prev.drawRect(543, 338, 87, 42);
        prev.endFill();

        prev.interactive = prev.buttonMode = true;

        prev.on('click', function() {
            frontBook.prev();
        });

        prev.addChild((function() {
            var text = new PIXI.Text('Prev', {
                font: 'bold 18px Arial',
                stroke: 0xFFFFFF,
                strokeThickness: 3
            });

            text.x = 566;
            text.y = 345;

            return text;
        }()));

        return prev;
    }()));

    page.addChild((function() {
        var next = new PIXI.Graphics();

        next.beginFill(0x84b388, 1);
        next.drawRect(543, 388, 87, 42);
        next.endFill();

        next.interactive = next.buttonMode = true;

        next.on('click', function() {
            frontBook.removeAndDestroy();

            level.container.interactive = level.container.buttonMode = true;
        });

        next.addChild((function() {
            var text = new PIXI.Text('Play', {
                font: 'bold 18px Arial',
                stroke: 0xFFFFFF,
                strokeThickness: 3
            });

            text.x = 566;
            text.y = 395;

            return text;
        }()));

        return next;
    }()));

    return page;
}()));

frontBook.next();

function animate() {
    requestAnimationFrame(animate);

    if (!victory && level.isComplete() && level.isPathComplete()) {
    //if (!victory) {
        victory = true;

        level.container.interactive = level.container.buttonMode = false;

        var plaque = new PIXI.Container();

        plaque.addChild((function() {
            var bg = new PIXI.Graphics(),
                bgwidth = 220,
                bgheight = 140;

            bg.lineStyle(10, 0x0d0d0d, 1);

            bg.beginFill(0x636c6f, 1);
            bg.drawRoundedRect((GAME_WIDTH / 2) - (bgwidth / 2), (GAME_HEIGHT / 2) - (bgheight / 2) + 55, bgwidth, bgheight, 15);
            bg.endFill();

            return bg;
        }()));

        var nextArrow = new PIXI.Graphics();

        nextArrow.beginFill(0x7fc7af, 1);
        nextArrow.moveTo(0, 0);
        nextArrow.lineTo(120, 0);
        nextArrow.lineTo(120, -30);
        nextArrow.lineTo(170, 25);
        nextArrow.lineTo(120, 80);
        nextArrow.lineTo(120, 50);
        nextArrow.lineTo(0, 50);
        nextArrow.endFill();

        nextArrow.x = GAME_WIDTH / 2 - (170 / 2);
        nextArrow.y = GAME_HEIGHT / 2 + 30;

        nextArrow.interactive = nextArrow.buttonMode = true;

        nextArrow.on('click', function() {
            victory = false;

            levelNum++;

            stage.removeChild(level.container);

            level.container.destroy();

            stage.removeChild(plaque);

            plaque.destroy();

            if (levelNum >= levels.length) {
                console.log('were done!');
            } else {
                level = new Level(levels[levelNum], 10, 10);

                stage.addChild(level.container);

                level.container.interactive = level.container.buttonMode = true;
            }
        });

        plaque.addChild(nextArrow);

        stage.addChild(plaque);
    }

    renderer.render(stage);
}

animate();
