class Laser {
    constructor(game) {
        this.game = game;
        this.x = 0;
        this.y = 0;
        this.height = this.game.height - 50;
    }
    render(ctx) {
        this.x =
            this.game.player.x +
            this.game.player.width * 0.5 -
            this.width * 0.5;
        this.game.player.energy -= this.damage;
        ctx.save();
        ctx.fillStyle = "gold";
        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.fillStyle = "white";
        ctx.fillRect(
            this.x + this.width * 0.2,
            this.y,
            this.width * 0.6,
            this.height
        );
        ctx.restore();

        // check collision
        if (this.game.spriteUpdate) {
            this.game.waves.forEach((wave) => {
                wave.enemies.forEach((enemy) => {
                    if (!enemy.free && this.game.checkCollision(this, enemy)) {
                        enemy.hit(this.damage);
                    }
                });
            });
            this.game.bossArray.forEach((boss) => {
                if (this.game.checkCollision(this, boss) && boss.y >= 0) {
                    boss.hit(this.damage);
                }
            });
        }
    }
}

class SmallLaser extends Laser {
    constructor(game) {
        super(game);
        this.width = 5;
        this.damage = 0.3;
    }
    render(ctx) {
        super.render(ctx);
    }
}

class BigLaser extends Laser {
    constructor(game) {
        super(game);
        this.width = 15;
        this.damage = 0.7;
    }
    render(ctx) {
        super.render(ctx);
    }
}

class Player {
    constructor(game) {
        this.game = game;
        this.width = 140;
        this.height = 120;
        this.x = this.game.width * 0.5 - this.width * 0.5;
        this.y = this.game.height - this.height;
        this.lives = 3;
        this.maxLives = 10;
        this.speed = 5;
        this.image = playerImage;
        this.frameX = 0;
        this.jetImage = jetImage;
        this.jetFrame = 0;
        this.smallLaser = new SmallLaser(this.game);
        this.bigLaser = new BigLaser(this.game);
        this.energy = 50;
        this.maxEnergy = 100;
        this.coolDown = false;
    }
    draw(ctx) {
        if (this.game.keys.includes(" ")) {
            this.frameX = 1;
        } else if (this.game.keys.includes("a") && !this.coolDown) {
            this.frameX = 2;
            this.smallLaser.render(ctx);
        } else if (this.game.keys.includes("s") && !this.coolDown) {
            this.frameX = 3;
            this.bigLaser.render(ctx);
        } else {
            this.frameX = 0;
        }
        ctx.drawImage(
            this.jetImage,
            this.jetFrame * this.width,
            0,
            this.width,
            this.height,
            this.x,
            this.y,
            this.width,
            this.height
        );
        ctx.drawImage(
            this.image,
            this.frameX * this.width,
            0,
            this.width,
            this.height,
            this.x,
            this.y,
            this.width,
            this.height
        );
    }
    update() {
        //energy
        if (this.energy < this.maxEnergy) {
            this.energy += 0.1;
        }
        if (this.energy < 1) this.coolDown = true;
        else if (this.energy > this.maxEnergy * 0.2) this.coolDown = false;
        // horizontal movement
        if (this.game.keys.includes("ArrowLeft")) {
            this.x -= this.speed;
            this.jetFrame = 0;
        } else if (this.game.keys.includes("ArrowRight")) {
            this.x += this.speed;
            this.jetFrame = 2;
        } else {
            this.jetFrame = 1;
        }
        // horizontal boundaries
        if (this.x + this.width * 0.5 <= 0) this.x = -this.width * 0.5;
        else if (this.x + this.width * 0.5 >= this.game.width)
            this.x = this.game.width - this.width * 0.5;
    }
    shoot() {
        const projectile = this.game.getProjectile();
        if (projectile) projectile.start(this.x + this.width * 0.5, this.y);
    }
    restart() {
        this.x = this.game.width * 0.5 - this.width * 0.5;
        this.y = this.game.height - this.height;
        this.lives = 3;
    }
}

class Projectile {
    constructor() {
        this.width = 4;
        this.height = 40;
        this.x = 0;
        this.y = 0;
        this.speed = 30;
        this.free = true;
    }
    start(x, y) {
        this.x = x - this.width * 0.5;
        this.y = y;
        this.free = false;
    }
    reset() {
        this.free = true;
    }
    update() {
        if (!this.free) {
            this.y -= this.speed;
            if (this.y + this.height < 0) this.reset();
        }
    }
    draw(ctx) {
        if (!this.free) {
            ctx.save();
            ctx.fillStyle = "gold";
            ctx.fillRect(this.x, this.y, this.width, this.height);
            ctx.restore();
        }
    }
}

class Enemy {
    constructor(game, positionX, positionY) {
        this.game = game;
        this.x = 0;
        this.y = 0;
        this.width = this.game.enemySize;
        this.height = this.game.enemySize;
        this.positionX = positionX;
        this.positionY = positionY;
        this.markedForDeletion = false;
    }
    draw(ctx) {
        ctx.drawImage(
            this.image,
            this.frameX * this.width,
            this.frameY * this.height,
            this.width,
            this.height,
            this.x,
            this.y,
            this.width,
            this.height
        );
    }
    update(x, y) {
        this.x = x + this.positionX;
        this.y = y + this.positionY;

        // check collision with projectile
        this.game.projectilePool.forEach((projectile) => {
            if (
                !projectile.free &&
                this.game.checkCollision(this, projectile) &&
                this.lives > 0
            ) {
                this.hit(1);
                projectile.reset();
            }
        });

        //sprite animation
        if (this.lives < 1) {
            if (this.game.spriteUpdate) this.frameX++;
            if (this.frameX > this.maxFrame) {
                this.markedForDeletion = true;
                if (!this.game.gameOver) this.game.score += this.maxLives;
            }
        }
        // collision with player
        if (
            this.game.checkCollision(this, this.game.player) &&
            this.lives > 0
        ) {
            this.lives = 0;
            this.game.player.lives--;
        }
        // lose condition
        if (
            this.y + this.height > this.game.height ||
            this.game.player.lives < 1
        ) {
            this.game.gameOver = true;
        }
    }
    hit(damage) {
        this.lives -= damage;
    }
}

class Beetle extends Enemy {
    constructor(game, positionX, positionY) {
        super(game, positionX, positionY);
        this.image = beetleImage;
        this.frameX = 0;
        this.maxFrame = 2;
        this.frameY = Math.floor(Math.random() * 4);
        this.lives = 1;
        this.maxLives = this.lives;
    }
}

class Rhino extends Enemy {
    constructor(game, positionX, positionY) {
        super(game, positionX, positionY);
        this.image = rhinoImage;
        this.frameX = 0;
        this.maxFrame = 5;
        this.frameY = Math.floor(Math.random() * 4);
        this.lives = 4;
        this.maxLives = this.lives;
    }
    hit(damage) {
        this.lives -= damage;
        this.frameX = this.maxLives - Math.floor(this.lives);
    }
}

class Boss {
    constructor(game, bossLives) {
        this.game = game;
        this.width = 200;
        this.height = 200;
        this.image = bossImage;
        this.frameX = 0;
        this.maxFrame = 11;
        this.frameY = Math.floor(Math.random() * 4);
        this.x = this.game.width * 0.5 - this.width * 0.5;
        this.y = -this.height;
        this.speedX = Math.random() < 0.5 ? -1 : 1;
        this.speedY = 0;
        this.lives = bossLives;
        this.maxLives = this.lives;
        this.markedForDeletion = false;
    }

    draw(ctx) {
        ctx.drawImage(
            this.image,
            this.frameX * this.width,
            this.frameY * this.height,
            this.width,
            this.height,
            this.x,
            this.y,
            this.width,
            this.height
        );
        if (this.lives >= 1) {
            ctx.save();
            ctx.shadowOffsetX = 3;
            ctx.shadowOffsetY = 3;
            ctx.shadowColor = "black";
            ctx.textAlign = "center";
            ctx.fillText(
                Math.floor(this.lives),
                this.x + this.width * 0.5,
                this.y + 50
            );
            ctx.restore();
        }
    }

    update() {
        if (this.game.spriteUpdate && this.lives >= 1) this.frameX = 0;
        this.speedY = 0;
        if (this.y < 0) this.y += 10;
        if (
            this.x < 0 ||
            (this.x + this.width > this.game.width && this.lives >= 1)
        ) {
            this.speedX *= -1;
            this.speedY = this.height * 0.5;
        }
        this.x += this.speedX;
        this.y += this.speedY;

        // projectiles hit
        this.game.projectilePool.forEach((projectile) => {
            if (
                !projectile.free &&
                this.game.checkCollision(this, projectile) &&
                this.lives >= 1 &&
                this.y >= 0
            ) {
                this.hit(1);
                projectile.reset();
            }
        });

        // boss collided player
        if (
            this.game.checkCollision(this, this.game.player) &&
            this.lives >= 1
        ) {
            this.game.gameOver = true;
            this.lives = 0;
        }

        // boss destroyed
        if (this.game.spriteUpdate && this.lives < 1) {
            this.frameX++;
            if (this.frameX > this.maxFrame) {
                this.markedForDeletion = true;
                this.game.score += this.maxLives;
                this.game.bossLives += 5;
                if (!this.game.gameOver) {
                    this.game.newWave();
                }
            }
        }
        // lose condition
        if (this.y + this.height > this.game.height) {
            this.game.gameOver = true;
        }
    }
    hit(damage) {
        this.lives -= damage;
        this.frameX = 1;
    }
}

class Wave {
    constructor(game) {
        this.game = game;
        this.width = this.game.columns * this.game.enemySize;
        this.height = this.game.rows * this.game.enemySize;
        this.speedX = Math.random() < 0.5 ? -1 : 1;
        this.speedY = 0;
        this.x = this.game.width * 0.5 - this.width * 0.5;
        this.y = -this.height;
        this.enemies = [];
        this.nextWaveTrigger = false;
        this.markedForDeletion = false;
        this.create();
    }
    render(ctx) {
        if (this.y < 0) this.y += 5;
        this.speedY = 0;
        if (this.x + this.width >= this.game.width || this.x < 0) {
            this.speedX *= -1;
            this.speedY = this.game.enemySize;
        }
        this.x += this.speedX;
        this.y += this.speedY;
        this.enemies.forEach((enemy) => {
            enemy.draw(ctx);
            enemy.update(this.x, this.y);
        });
        this.enemies = this.enemies.filter((enemy) => !enemy.markedForDeletion);
        if (this.enemies.length === 0) this.markedForDeletion = true;
    }
    create() {
        for (let y = 0; y < this.game.rows; y++) {
            for (let x = 0; x < this.game.columns; x++) {
                const enemyPositionX = x * this.game.enemySize;
                const enemyPositionY = y * this.game.enemySize;
                const randomize = Math.random();
                if (randomize < 0.7)
                    this.enemies.push(
                        new Beetle(this.game, enemyPositionX, enemyPositionY)
                    );
                else
                    this.enemies.push(
                        new Rhino(this.game, enemyPositionX, enemyPositionY)
                    );
            }
        }
    }
}

class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        this.player = new Player(this);
        this.keys = [];
        this.winningScore = 5;
        this.score = 0;
        this.numberOfProjectiles = 15;
        this.columns = 2;
        this.rows = 2;
        this.waveCount = 1;
        this.enemySize = 80;
        this.projectilePool = [];
        this.createProjectile();
        this.waves = [];
        this.waves.push(new Wave(this));
        this.gameOver = false;
        this.fired = false;
        this.spriteUpdate = false;
        this.spriteTimer = 0;
        this.spriteInterval = 80;
        this.bossArray = [];
        this.bossLives = 10;
        this.restart();
    }
    render(ctx, deltaTime) {
        // sprite animation
        if (this.spriteTimer > this.spriteInterval) {
            this.spriteTimer = 0;
            this.spriteUpdate = true;
        } else {
            this.spriteTimer += deltaTime;
            this.spriteUpdate = false;
        }
        this.drawTextStatus(ctx);
        this.projectilePool.forEach((pro) => {
            pro.draw(ctx);
            pro.update();
        });
        this.player.draw(ctx);
        this.player.update();
        this.bossArray.forEach((boss) => {
            boss.draw(ctx);
            boss.update();
        });
        this.bossArray = this.bossArray.filter(
            (boss) => !boss.markedForDeletion
        );
        this.waves.forEach((wave) => {
            wave.render(ctx);
            if (
                wave.enemies.length < 1 &&
                !wave.nextWaveTrigger &&
                !this.gameOver
            ) {
                this.newWave();
                wave.nextWaveTrigger = true;
            }
        });
    }
    createProjectile() {
        for (let i = 0; i < this.numberOfProjectiles; i++) {
            this.projectilePool.push(new Projectile());
        }
    }
    getProjectile() {
        return this.projectilePool.find((pro) => pro.free);
    }
    checkCollision(a, b) {
        return (
            a.x < b.x + b.width &&
            a.y < b.y + b.height &&
            b.x < a.x + a.width &&
            b.y < a.y + a.height
        );
    }
    drawTextStatus(ctx) {
        ctx.save();
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;
        ctx.shadowBlur = 4;
        ctx.shadowColor = "black";
        ctx.fillText(`Score: ${this.score}`, 20, 40);
        ctx.fillText(`Waves: ${this.waveCount}`, 20, 80);

        for (let i = 0; i < this.player.maxLives; i++) {
            ctx.strokeRect(20 + i * 20, 100, 10, 15);
        }
        for (let i = 0; i < this.player.lives; i++) {
            ctx.fillRect(20 + i * 20, 100, 10, 15);
        }
        // energy
        ctx.save();
        ctx.fillStyle = this.player.coolDown ? "red" : "gold";
        for (let i = 0; i < this.player.energy; i++) {
            ctx.fillRect(20 + 2 * i, 130, 2, 15);
        }
        ctx.restore();
        if (this.gameOver) {
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.font = "100px Impact";
            ctx.fillText(
                "GAME OVER!!!",
                this.width * 0.5,
                this.height * 0.5 - 50
            );
            ctx.font = "30px Impact";
            ctx.fillText(
                'Press "R" to restart',
                this.width * 0.5,
                this.height * 0.5 + 30
            );
        }
        ctx.restore();
    }
    newWave() {
        this.waveCount++;
        if (this.player.lives < this.player.maxLives) this.player.lives++;
        if (this.waveCount % 3 === 0) {
            this.bossArray.push(new Boss(this, this.bossLives));
        } else {
            if (
                Math.random() < 0.5 &&
                this.enemySize * this.columns < this.width * 0.8
            ) {
                this.columns++;
            } else if (this.enemySize * this.rows < this.height * 0.6) {
                this.rows++;
            }
            this.waves.push(new Wave(this));
        }
        this.waves = this.waves.filter((wave) => !wave.markedForDeletion);
    }
    restart() {
        this.player.restart();
        this.score = 0;
        this.columns = 2;
        this.rows = 2;
        this.waveCount = 1;
        this.waves = [];
        this.waves.push(new Wave(this));
        this.gameOver = false;
        this.fired = false;
        this.spriteUpdate = false;
        this.spriteTimer = 0;
        this.bossArray = [];
        this.bossLives = 10;
        // this.bossArray.push(new Boss(this, this.bossLives));
    }
}

window.addEventListener("load", () => {
    const canvas = document.getElementById("canvas");
    const ctx = canvas.getContext("2d");
    canvas.width = 600;
    canvas.height = 800;
    ctx.fillStyle = "white";
    ctx.strokeStyle = "white";
    ctx.font = "30px Impact";
    ctx.textAlign = "left";

    const game = new Game(canvas);

    // keyboard control direction player
    window.addEventListener("keydown", (e) => {
        if (!game.keys.includes(e.key)) game.keys.push(e.key);
        if (e.key === " " && !game.fired) {
            game.player.shoot();
            game.fired = true;
        }
        if (e.key === "r" && game.gameOver) {
            game.restart();
        }
    });
    window.addEventListener("keyup", (e) => {
        game.fired = false;
        const index = game.keys.indexOf(e.key);
        if (index >= 0) game.keys.splice(index, 1);
    });

    let lastTime = 0;
    function animate(timeStamp) {
        const deltaTime = timeStamp - lastTime;
        lastTime = timeStamp;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        game.render(ctx, deltaTime);
        requestAnimationFrame(animate);
    }
    animate(0);
});
