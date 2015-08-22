var SPACE_WIDTH = 40,
    SPACE_HEIGHT = 30,
    GAME_WIDTH = 800,
    GAME_HEIGHT = 600;

var renderer = PIXI.autoDetectRenderer(800, 600, { backgroundColor: 0x000000 });
document.body.appendChild(renderer.view);

var stage = new PIXI.Container(),
    grid = new PIXI.Graphics();

grid.lineStyle(1, 0xb1b1b1, 1);

for (var i = 0, spaces = Math.floor(GAME_WIDTH / SPACE_WIDTH); i < spaces; i++) {
    grid.moveTo(SPACE_WIDTH * i, 0);
    grid.lineTo(SPACE_WIDTH * i, GAME_HEIGHT);
}

for (var i = 0, spaces = Math.floor(GAME_HEIGHT / SPACE_HEIGHT); i < spaces; i++) {
    grid.moveTo(0, SPACE_HEIGHT * i);
    grid.lineTo(GAME_WIDTH, SPACE_HEIGHT * i);
}

stage.addChild(grid);

function animate() {
    requestAnimationFrame(animate);

    renderer.render(stage);
}

animate();
