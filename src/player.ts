import { Canvas, Flip, ShaderType } from "./canvas.js";
import { CoreEvent } from "./core.js";
import { GAME_REGION_HEIGHT, GAME_REGION_WIDTH, StarGeneratingFunction } from "./game.js";
import { ExistingObject, GameObject, nextObject } from "./gameobject.js";
import { clamp, negMod } from "./math.js";
import { Sprite } from "./sprite.js";
import { State } from "./types.js";
import { Vector2 } from "./vector.js";


const FAST_FALL_BONUS = 20;



class AfterImage extends ExistingObject {


    private pos : Vector2;
    private scale : Vector2;

    private timer : number;
    private startTime : number;
    private sprite : Sprite;

    private flip : Flip;


    constructor() {

        super(false);

        this.pos = new Vector2();
        this.scale = new Vector2(1, 1);
        this.sprite = new Sprite(256, 256);

        this.timer = 0;
        this.startTime = 1;

        this.flip = Flip.None;
    }


    public spawn(pos : Vector2, scale : Vector2, time : number, 
        flip : Flip, sprite : Sprite) {

        this.pos = pos.clone();
        this.scale = scale.clone();
        this.startTime = time;
        this.timer = time;
        this.flip = flip;

        this.exist = true;

        this.sprite.setFrame(sprite.getColumn(), sprite.getRow());
    }


    public update(event : CoreEvent) {

        if (!this.exist) return;

        if ((this.timer -= event.step) <= 0) {

            this.exist = false;
        }
    }


    private baseDraw(canvas : Canvas, tx : number, ty : number) {
    
        canvas.transform
            .push()
            .translate(this.pos.x + tx, this.pos.y + ty)
            .scale(this.scale.x, this.scale.y)
            .use();

        canvas.drawSprite(this.sprite, 
            canvas.assets.getBitmap("player"),
            -this.sprite.width/2,
            -this.sprite.height/2,
            this.sprite.width,
            this.sprite.height, this.flip);

        canvas.transform.pop();
    }


    public draw(canvas : Canvas) {

        const BASE_ALPHA = 0.5;

        let alpha = BASE_ALPHA * this.timer / this.startTime;

        canvas.setColor(1.0, 1.0, 0.67, alpha);
    
        for (let x = -1; x <= 1; ++ x) {

            for (let y = -1; y <= 1; ++ y) {

                this.baseDraw(canvas, 
                    x * GAME_REGION_WIDTH, 
                    y * GAME_REGION_HEIGHT);
            }
        }
    }
}



export class Player extends GameObject {


    private scale : Vector2;
    private angle : number;
    private angleTarget : number;

    private jumpTimer : number;
    private bonusJumpTimer : number;
    private fastFall : boolean;
    private canFastFall : boolean;
    private fastFallBonus : boolean;
    private doubleJump : boolean;
    private fallingSlow : boolean;

    private dir : number;

    private afterimages : Array<AfterImage>;
    private afterimageTimer : number;

    private starFunc : StarGeneratingFunction;

    // TEMP
    private hurtTimer : number;


    constructor(x : number, y : number, starFunc : StarGeneratingFunction) {

        super(x, y, true);

        this.sprite = new Sprite(256, 256);
    
        this.angle = 0;
        this.angleTarget = 0;
        this.scale = new Vector2(0.50, 0.50);

        this.friction = new Vector2(0.50, 0.30);
        this.hitbox = new Vector2(this.scale.x * 128, this.scale.y * 128);

        this.jumpTimer = 0;
        this.bonusJumpTimer = 0;
        this.fastFall = false;
        this.canFastFall = true;
        this.fastFallBonus = false;
        this.doubleJump = false;
        this.fallingSlow = false;

        this.dir = 0;

        this.afterimages = new Array<AfterImage> ();
        this.afterimageTimer = 0;

        this.hurtTimer = 0;

        this.starFunc = starFunc;
    }


    private control(event : CoreEvent) {
        
        const BASE_GRAVITY = 8.0;
        const MOVEMENT_SPEED = 5.0;
        const FAST_FALL_EPS = 0.5;
        const FAST_FALL_SPEED = 16.0;
        const DOUBLE_JUMP_TIME = 90;
        const DOUBLE_JUMP_MIN = 0.0;
        const FALL_SLOW_SPEED = 2.0;

        let stick = event.input.getStick();

        this.target.x = MOVEMENT_SPEED * stick.x;
        this.target.y = BASE_GRAVITY;

        this.fastFall = !(this.doubleJump && this.jumpTimer > 0) &&
            !this.fallingSlow &&
            this.canFastFall &&
            stick.y > FAST_FALL_EPS;
        if (this.fastFall) {

            this.speed.y = FAST_FALL_SPEED;
            this.bonusJumpTimer = 0;
        }
        else {

            this.speed.y = Math.min(BASE_GRAVITY, this.speed.y);
        }

        if (stick.y < FAST_FALL_EPS) {

            if (this.fastFallBonus) {

                this.jumpTimer = Math.max(0, this.jumpTimer - FAST_FALL_BONUS);
                this.fastFallBonus = false;
            }

            if (!this.canFastFall)
                this.canFastFall = true;
        }

        if (!this.doubleJump) {

            if (this.bonusJumpTimer <= 0 &&
                event.input.getAction("jump") == State.Pressed) {
                
                this.jumpTimer = DOUBLE_JUMP_TIME;
                this.doubleJump = true;

                this.speed.y = Math.max(this.speed.y, DOUBLE_JUMP_MIN);
            }
        }
        else if ((event.input.getAction("jump") & State.DownOrPressed) == 0) {

            this.jumpTimer = 0;
        }

        this.fallingSlow = this.doubleJump && !this.fastFall &&
            this.jumpTimer <= 0 &&
            ((event.input.getAction("jump") & State.DownOrPressed) == 1);
        if (this.fallingSlow) {

            this.target.y = FALL_SLOW_SPEED;
        }
        
    }


    private animate(event : CoreEvent) {

        const EPS = 2.0;
        const DOUBLE_JUMP_ANIM_SPEED = 3.0;

        let row : number;

        this.dir = 0;
        if (this.speed.x < -EPS)
            this.dir = -1;
        else if (this.speed.x > EPS)
            this.dir = 1;

        if ((this.doubleJump && this.jumpTimer > 0) ||
            this.fallingSlow) {

            row = (this.speed.y < -EPS) ? 4 : 2;
            if (this.dir != 0)
                ++ row;

            this.sprite.animate(row, 0, 3, DOUBLE_JUMP_ANIM_SPEED, event.step);
            return;
        }

        let frame = 0;
        if (this.fastFall) {

            frame = 3;
        }
        else {

            if (this.speed.y < -EPS)
                frame = 1;
            else if (this.speed.y > EPS)
                frame = 2;
        }

        row = this.dir == 0 ? 0 : 1;
        this.sprite.setFrame(frame, row);
    }


    private updateTimers(event : CoreEvent) {

        const JUMP_SPEED = -8.0;
        const JUMP_TIME_BONUS = 16;
        const DOUBLE_JUMP_MAX = 8.0;
        const DOUBLE_JUMP_MIN = -6.0;
        const DOUBLE_JUMP_SPEED = -0.60;

        if (this.bonusJumpTimer > 0) {

            this.bonusJumpTimer -= event.step;
        }

        if (this.jumpTimer > 0) {

            this.jumpTimer -= event.step;
            if (this.jumpTimer <= 0) {

                this.bonusJumpTimer = 0;
            }
            else {

                if (this.doubleJump) {

                    this.speed.y = clamp(this.speed.y + DOUBLE_JUMP_SPEED * event.step,
                        DOUBLE_JUMP_MIN, DOUBLE_JUMP_MAX);
                }
                else {

                    this.speed.y = JUMP_SPEED;

                    if (this.bonusJumpTimer > 0 &&
                        (event.input.getAction("jump") & State.DownOrPressed) == 1) {

                        this.jumpTimer += JUMP_TIME_BONUS;
                        this.bonusJumpTimer = 0;
                    }
                }
            }
        }


        if (this.hurtTimer > 0) {

            this.hurtTimer -= event.step;
        }
    }


    private updateAfterImages(event : CoreEvent) {

        const AFTER_IMAGE_SPAWN_TIME = 4;
        const AFTER_IMAGE_TIME = 20;

        for (let o of this.afterimages) {

            o.update(event);
        }

        if ((this.afterimageTimer -= event.step) > 0)
            return;

        this.afterimageTimer += AFTER_IMAGE_SPAWN_TIME;

        nextObject<AfterImage>(this.afterimages, AfterImage)
            .spawn(this.pos, this.scale, AFTER_IMAGE_TIME, 
                this.dir < 0 ? Flip.Horizontal : Flip.None,
                this.sprite);
    }



    protected preMovementEvent(event: CoreEvent) : void {
        
        this.control(event);
        this.animate(event);
        this.updateTimers(event);
        this.updateAfterImages(event);

        this.pos.x = negMod(this.pos.x, GAME_REGION_WIDTH);
        this.pos.y = negMod(this.pos.y, GAME_REGION_HEIGHT);
    }


    private baseDraw(canvas : Canvas, tx : number, ty : number) {
    
        let flip = Flip.None;
        if (this.dir < 0)  
            flip = Flip.Horizontal;

        canvas.transform
            .push()
            .translate(this.pos.x + tx, this.pos.y + ty)
            .rotate(this.angle)
            .scale(this.scale.x, this.scale.y)
            .use();

        canvas.drawSprite(this.sprite, canvas.assets.getBitmap("player"),
            -this.sprite.width/2,
            -this.sprite.height/2,
            this.sprite.width,
            this.sprite.height, flip);

        canvas.transform.pop();
    }


    public draw(canvas : Canvas) {
    
        const EPS = 1;

        if (this.hurtTimer > 0 &&
            Math.floor(this.hurtTimer / 2) % 2 == 0)
            return;

        let hbox = new Vector2(this.sprite.width * this.scale.x, this.sprite.height * this.scale.y);
        let p = this.pos;

        let startx = p.x + hbox.x/2 >= GAME_REGION_WIDTH-EPS ? -1 : 0;
        let endx = p.x - hbox.x/2 <= EPS ? 1 : 0;
        let starty = p.y + hbox.y/2 >= GAME_REGION_HEIGHT-EPS ? -1 : 0;
        let endy = p.y - hbox.y/2 <= EPS ? 1 : 0;

        for (let y = starty; y <= endy; ++ y) {

            for (let x = startx; x <= endx; ++ x) {

                this.baseDraw(canvas, x * GAME_REGION_WIDTH, y * GAME_REGION_HEIGHT);
            }
        }
    }


    public preDraw(canvas : Canvas) {

        canvas.changeShader(ShaderType.TexturedAlphaMask);

        for (let o of this.afterimages) {

            o.draw(canvas);
        }

        canvas.changeShader(ShaderType.Textured);
        canvas.setColor();
    }


    private spawnStars(x : number, y : number, count : number) {

        const STAR_SPEED = 12.0;
        const STAR_TIME = 16;

        let angleStep = Math.PI*2 / count;
        let angleStart = 0; // angleStep/2;
        let angle : number;

        let speed : Vector2;

        for (let i = 0; i < count; ++ i) {

            angle = angleStart + angleStep * i;

            speed = new Vector2(
                Math.cos(angle) * STAR_SPEED,
                Math.sin(angle) * STAR_SPEED * 0.67);

            this.starFunc(x, y, speed.x, speed.y, STAR_TIME);
        }

    }


    public bounce(event : CoreEvent) {

        const JUMP_TIME = 8;
        const BONUS_JUMP_TIME = 8;

        this.jumpTimer = JUMP_TIME;
        this.bonusJumpTimer = BONUS_JUMP_TIME;
        
        if (this.fastFall) {

            this.jumpTimer += FAST_FALL_BONUS;
            this.fastFallBonus = true;

            this.bonusJumpTimer = 0;
        }

        this.canFastFall = false;
        this.doubleJump = false;

        this.spawnStars(
            this.pos.x, 
            this.pos.y + this.sprite.height/2 * this.scale.y,  
            6);
    }



    public hurt() {

        const HURT_TIME = 60;

        if (this.hurtTimer > 0) return;
        
        this.hurtTimer = HURT_TIME;
    }
}
