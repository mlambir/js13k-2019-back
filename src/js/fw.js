import jsfxr from "./sound";
import CPlayer from "./player-small";
import song from "./song";

const levelTexts = {
    0: "FIX THE BROKEN WIRES",
    1: "USE THE BROWSER BACK BUTTON",
    2: "DONT FORGET TO SAVE",
    3: "KEEP GOING BACK",
    4: "DONT TOUCH THE SPARKS",
    5: "FLIP THE SWITCH",
    6: "FLIP IT TWICE",
    7: "LEAP OF FAITH",
    8: "BACK AND FORTH",
    9: "JUMP WITH CAUTION",
    10: "PATIENCE",
    11: "GOING UP",
    12: "SAVE ON THE WAY",
    13: "MIRRORED",
    14: "JUMP BACK",
    15: "TIMING",
    16: "THE END"
};

let assets = {};
let sounds = {};

export function loadAssets(cb) {
    let imgs = ["img/levels.png", "img/tiles.png", "img/bot.png", "img/entities.png", "img/font.png"];
    let _sounds = {
        jump: jsfxr([0, 0, 0.1, 0.4, 0.2, 0.3, 0, 0.1, 0, 0, 0, 0, 0, 0.47, 0, 0, 0, 0, 0.5, 0, 0, 0.2, 0, 0.5]),
        fix: jsfxr([1, 0, 0.08, 0.4, 0.1, 0.5, 0, -0.64, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0.5]),
        save: jsfxr([0, 0, 0.06, 0.4, 0.5, 0.4, 0, 0.43, 0, 0, 0, 0, 0, 0.2, 0, 0.5, 0, 0, 1, 0, 0, 0, 0, 0.5]),
        death: jsfxr([0,0,0.3,0.4,0.3,0.4,0,-0.4,0,0,0,0,0,0.3,0,0.4,0,0,1,0,0,0,0,0.5]),
        win: jsfxr([0,0,0.09,0.,0.4,0.6,0,0,0,0,0,0.65,0.5,0,0,0,0,0,1,0,0,0,0,0.5])
    };

    Object.keys(_sounds).map((k) => {
        sounds[k] = new Audio();
        sounds[k].src = _sounds[k];
    });

    let imgCnt = imgs.length;
    imgs.map(v => {
        let i = new Image();
        i.onload = () => {
            imgCnt--;
            if (!imgCnt) {
                let player = new CPlayer();
                player.init(song);
                let done = false;
                setInterval(function () {
                    if (done) {
                        return;
                    }

                    done = player.generate() >= 1;

                    if (done) {
                        let wave = player.createWave();
                        let audio = document.createElement("audio");
                        audio.src = URL.createObjectURL(new Blob([wave], {type: "audio/wav"}));
                        audio.volume = .5;
                        audio.loop = true;
                        audio.play();
                        cb()
                    }
                }, 100);
            }
        };
        i.src = v;
        assets[v] = i;
    });
}

export class Sprite {
    constructor(src, width, animations, defaultAnimation, x = 0, y = 0) {
        this.img = assets[src];
        this.rect = {x, y, w: width, h: this.img.height};
        this.hb = {x: 0, y: 0, w: width, h: this.img.height};
        this.animations = animations;
        this.currAnimation = defaultAnimation;
        this.frame = 0;
        this.lastUpdate = 0;
    }

    getHb() {
        return {x: this.rect.x + this.hb.x, y: this.rect.y + this.hb.y, w: this.hb.w, h: this.hb.h};
    }

    setAnimation(animation) {
        if (this.currAnimation !== animation) {
            this.frame = 0;
        }
        this.currAnimation = animation;
    }

    update(t) {
        if (t - this.lastUpdate > this.animations[this.currAnimation].t) {
            this.lastUpdate = t;
            this.frame++;
            this.frame = this.frame % this.animations[this.currAnimation].a.length
        }
    }

    draw(ctx) {
        ctx.drawImage(
            this.img,
            this.rect.h * this.animations[this.currAnimation].a[this.frame], 0,
            this.rect.h, this.rect.h,
            this.rect.x, this.rect.y,
            this.rect.h, this.rect.h
        )
    }
}

function collides(x1, y1, w1, h1, x2, y2, w2, h2) {
    return x1 < x2 + w2 &&
        x1 + h1 > x2 &&
        y1 < y2 + h2 &&
        y1 + h1 > y2;
}

function collidesAnyTile(x, y, w, h, others) {
    for (let other of others) {
        if (collides(x, y, w, h, other.x, other.y, other.w, other.h)) {
            return true;
        }
    }
    return false;
}

export class Player extends Sprite {
    constructor(onWin) {
        super("img/bot.png", 8, {
            idler: {t: 240, a: [0, 1]},
            idlel: {t: 240, a: [2, 3]},
            walkr: {t: 100, a: [4, 5, 6, 7]},
            walkl: {t: 100, a: [8, 9, 10, 11]},
            jumpl: {t: 10000, a: [13]},
            jumpr: {t: 10000, a: [12]},
        }, "idler", 0, 0);
        this.vy = .1;
        this.dir = "r";
        this.onWin = onWin;
    }

    update(dt, Key, tiles, entities, onDeath) {
        super.update(dt);
        let collidables = [...tiles, ...entities.filter((e) => (e instanceof Floor)).filter((e) => e.collidable()).map((e) => e.getHb())];
        let r = this.rect;
        if (Key.isDown(Key.UP) && this.vy === 0) {
            this.vy = -2.1111;
            sounds.jump.play();
        }
        if (Key.isDown(Key.LEFT)) {
            if (!collidesAnyTile(r.x - 1, r.y, r.w, r.h, collidables)) {
                r.x -= 1;
            }
            this.dir = "l";
            this.setAnimation("walk" + this.dir)
        } else if (Key.isDown(Key.RIGHT)) {
            if (!collidesAnyTile(r.x + 1, r.y, r.w, r.h, collidables)) {
                r.x += 1;
            }
            this.dir = "r";
            this.setAnimation("walk" + this.dir)
        } else {
            this.setAnimation("idle" + this.dir)
        }

        this.vy += .08;
        r.y += Math.min(this.vy, 4);

        collidables.map((tile) => {
            if (collides(r.x, r.y, r.w, r.h, tile.x, tile.y, tile.w, tile.h)) {
                if (this.vy > 0) {
                    this.vy = 0;
                    r.y = tile.y - r.h;
                } else {
                    this.vy = .01;
                    r.y = tile.y + r.h;
                }
            }
        });
        let exit = false;
        entities.map((e) => {
            let {x, y, w, h} = e.getHb();
            if (collides(r.x, r.y, r.w, r.h, x, y, w, h)) {
                if (e instanceof CheckPoint) {
                    e.activate();
                } else if (e instanceof Circuit) {
                    e.fix();
                } else if (e instanceof Switch) {
                    e.switch(dt);
                } else if (e instanceof Spark && e.currAnimation !== "off") {
                    onDeath()
                } else if (e instanceof Door && e.isOpen) {
                    sounds.win.play();
                    this.onWin();
                    exit = true;
                }
            } else if (e instanceof Switch) {
                e.enabled = true;
            }
        });
        if (this.vy) {
            this.setAnimation("jump" + this.dir)
        }

        if (r.y > 30 * 8) {
            onDeath();
        }
    }
}

export class CheckPoint extends Sprite {
    constructor(x, y, onActivate) {
        super("img/entities.png", 8, {
            inactive: {t: 10000, a: [0]},
            active: {t: 90, a: [1, 2, 3, 4, 3, 2]},
        }, "inactive", x, y);
        this.onActivate = onActivate;
    }

    activate() {
        if (!this.active) {
            this.active = true;
            this.setAnimation("active");
            sounds.save.play();
            this.onActivate();
        }
    }

    deactivate() {
        this.active = false;
        this.setAnimation("inactive");
    }
}

export class Circuit extends Sprite {
    constructor(x, y, onFix) {
        super("img/entities.png", 8, {
            broken: {t: 10000, a: [Math.floor(Math.random() * 3 + 5)]},
            fixed: {t: 10000, a: [8]},
        }, "broken", x, y);
        this.onFix = onFix;
        this.hb = {x: 2, y: 2, w: 4, h: 4};
    }

    fix() {
        if (!this.fixed) {
            this.fixed = true;
            this.setAnimation("fixed");
            sounds.fix.play();
            this.onFix()
        }
    }
}

export class Door extends Sprite {
    constructor(x, y) {
        super("img/entities.png", 8, {
            closed: {t: 10000, a: [9]},
            open: {t: 10000, a: [12]},
            opening: {t: 10000, a: [10, 11]},
        }, "closed", x, y);
        this.hb = {x: 4, y: 7, w: 0, h: 1};
    }

    open() {
        this.setAnimation("open");
        this.isOpen = true;
    }
}

export class Floor extends Sprite {
    constructor(x, y, alt=false) {
        super("img/entities.png", 8, {
            floor: {t: 1000, a: alt?[13, 14]:[14, 13]},
        }, "floor", x, y);
        this.hb = {x: 0, y: 0, w: 8, h: 4};
    }

    collidable() {
        return this.animations.floor.a[this.frame] === 13;
    }
}

export class Spark extends Sprite {
    constructor(x, y, color) {
        super("img/entities.png", 8, {
            blue: {t: 1, a: [17, 18, 19, 20]},
            green: {t: 1, a: [21, 22, 23, 24]},
            off: {t: 1, a: [25]},
        }, color==="blue"?color:"off", x, y);
        this.color = color;
        this.hb = {x: 1, y: 1, w: 6, h: 6};
    }
    setAnimation(a){
        super.setAnimation(this.color === a?a:"off");
    }
    update(t) {
        if (this.currAnimation !== "off" && Math.random() > .2) {
            this.frame = Math.floor(Math.random() * 4);
        }
    }
}

export class Switch extends Sprite {
    constructor(x, y, onSwitch) {
        super("img/entities.png", 8, {
            green: {t: 9999, a: [15]},
            blue: {t: 9999, a: [16]},
        }, "blue", x, y);
        this.onSwitch = onSwitch;
        this.enabled = true;
        this.hb = {x: 0, y: 0, w: 8, h: 8};
    }

    switch() {
        if (this.enabled) {
            this.setAnimation(this.currAnimation === "blue" ? "green" : "blue");
            this.onSwitch(this.currAnimation);
            this.enabled = false;
        }
    }
}

export function drawText(ctx, text, x, y) {
    let font = assets["img/font.png"];
    for (let i = 0; i < text.length; i++) {
        if (text[i] !== " ") {
            ctx.drawImage(
                font,
                8 * (text.charCodeAt(i) - 65), 0,
                8, 8,
                8 * i + x, y,
                8, 8);
        }
    }
}


export class Level {
    reset() {
        this.tiles = [];
        this.entities = [];
        let lvlImg = assets["img/levels.png"];
        let tilesImg = assets["img/tiles.png"];
        let levelCanvas = document.createElement('canvas');
        levelCanvas.width = 32;
        levelCanvas.height = 30;
        levelCanvas.getContext('2d').drawImage(lvlImg, -32 * this.leveln, 0);

        this.canvas = document.createElement('canvas');
        this.canvas.width = 32 * 8;
        this.canvas.height = 30 * 8;
        this.circuitCount = 0;
        this.activatedButtons = [];

        this.player.rect.x = 0;
        this.player.rect.y = 0;
        this.player.vy = .1;

        this.textPosition = null;

        let ctx = this.canvas.getContext('2d');
        for (let i = 0; i < 32; i++) {
            for (let j = 0; j < 30; j++) {
                let x = i * 8, y = j * 8;
                let pd = levelCanvas.getContext('2d').getImageData(i, j, 1, 1).data;
                let prgba = (pd[3] + pd[2] * 256 + pd[1] * 256 * 256 + pd[0] * 256 * 256 * 256);
                if (prgba !== 0x000000FF) {
                    ctx.drawImage(
                        tilesImg,
                        8 * Math.floor(Math.random() * 7 + 4), 0,
                        8, 8,
                        x, y,
                        8, 8);
                }
                let tileIndex = 1;
                switch (pd[3] + pd[2] * 256 + pd[1] * 256 * 256 + pd[0] * 256 * 256 * 256) {
                    case 0xFFFFFFFF:
                        this.tiles.push({t: "floor", x: x, y: y, w: 8, h: 8});
                        tileIndex = Math.floor(Math.random() * 4);
                        ctx.drawImage(
                            tilesImg,
                            8 * tileIndex, 0,
                            8, 8,
                            x, y,
                            8, 8);
                        break;
                    case 0xFF0000FF:
                        let btn = new CheckPoint(x, y, () => {
                            this.activatedButtons.push(btn);
                        });
                        this.entities.push(btn);
                        break;
                    case 0x00FF00FF:
                        this.circuitCount++;
                        this.entities.push(new Circuit(x, y, () => {
                            this.circuitCount--;
                            if (!this.circuitCount) {
                                this.exitDoor.open();
                            }
                        }));
                        break;
                    case 0x0000FFFF:
                        this.exitDoor = new Door(x, y);
                        this.entities.push(this.exitDoor);
                        break;
                    case 0xFFFF00FF:
                        this.enterDoor = new Door(x, y);
                        this.entities.push(this.enterDoor);
                        this.player.rect = {...this.player.rect, x, y};
                        break;
                    case 0xFF00FFFF:
                        this.entities.push(new Floor(x, y));
                        break;
                    case 0xFFCCFFFF:
                        this.entities.push(new Floor(x, y, true));
                        break;
                    case 0xCCCCFFFF:
                        this.entities.push(new Spark(x, y, "blue"));
                        break;
                    case 0xCCFFCCFF:
                        this.entities.push(new Spark(x, y, "green"));
                        break;
                    case 0xFFCCCCFF:
                        this.entities.push(new Switch(x, y, anim => {
                            this.entities.filter(e => e instanceof Spark || e instanceof Switch).map(e => e.setAnimation(anim));
                            sounds.fix.play();
                        }));
                        break;
                    case 0x00FFFFFF:
                        this.textPosition = [x, y];
                        break;
                }
            }
        }
        if (this.textPosition && levelTexts[this.leveln]) {
            drawText(ctx, levelTexts[this.leveln], this.textPosition[0], this.textPosition[1]);
        }
    }

    constructor(player, leveln = 0) {
        this.player = player;
        this.leveln = leveln;
        this.reset();
    }

    back() {
        if (this.activatedButtons.length) {
            let btn = this.activatedButtons.pop();
            btn.deactivate();
            let pr = this.player.rect, br = btn.rect;
            if (this.activatedButtons.length && collides(pr.x, pr.y, pr.w, pr.h, br.x, br.y, br.w, br.h)) {
                btn = this.activatedButtons.pop();
                btn.deactivate();
            }
            this.player.rect = {...this.player.rect, x: btn.rect.x, y: btn.rect.y};
            this.player.vy = .1;
        }
    }

    update(dt, Key) {
        this.entities.map(e => e.update(dt));
        this.player.update(dt, Key, this.tiles, this.entities, ()=>{
            sounds.death.play();
            this.reset();
        });
    }

    draw(ctx) {
        ctx.drawImage(this.canvas, 0, 0);
        this.entities.map(e => e.draw(ctx));
        this.player.draw(ctx)
    }
}