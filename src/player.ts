import { Canvas, Flip } from "./canvas.js";
import { CoreEvent } from "./core.js";
import { GAME_REGION_HEIGHT, GAME_REGION_WIDTH } from "./game.js";
import { GameObject } from "./gameobject.js";
import { clamp, negMod } from "./math.js";
import { Sprite } from "./sprite.js";
import { State } from "./types.js";
import { Vector2 } from "./vector.js";


const FAST_FALL_BONUS = 20;


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


    constructor(x : number, y : number) {

        super(x, y, true);

        this.sprite = new Sprite(256, 256);
    
        this.angle = 0;
        this.angleTarget = 0;
        this.scale = new Vector2(0.50, 0.50);

        this.friction = new Vector2(0.50, 0.30);
        this.hitbox = new Vector2(this.scale.x * 128, this.scale.y * 176);

        this.jumpTimer = 0;
        this.bonusJumpTimer = 0;
        this.fastFall = false;
        this.canFastFall = true;
        this.fastFallBonus = false;
        this.doubleJump = false;
        this.fallingSlow = false;

        this.dir = 0;
    }


    private control(event : CoreEvent) {
        
        const BASE_GRAVITY = 8.0;
        const MOVEMENT_SPEED = 5.0;
        const FAST_FALL_EPS = 0.5;
        const FAST_FALL_SPEED = 16.0;
        const DOUBLE_JUMP_TIME = 60;
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

        this.dir = 0;
        if (this.speed.x < -EPS)
            this.dir = -1;
        else if (this.speed.x > EPS)
            this.dir = 1;

        if ((this.doubleJump && this.jumpTimer > 0) ||
            this.fallingSlow) {

            this.sprite.animate(
                this.dir == 0 ? 2 : 3, 
                0, 3, DOUBLE_JUMP_ANIM_SPEED, event.step);
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

        let row = this.dir == 0 ? 0 : 1;
        this.sprite.setFrame(frame, row);
    }


    private updateTimers(event : CoreEvent) {

        const JUMP_SPEED = -8.0;
        const JUMP_TIME_BONUS = 16;
        const DOUBLE_JUMP_MAX = 8.0;
        const DOUBLE_JUMP_SPEED = -0.75;

        if (this.bonusJumpTimer > 0) {

            this.bonusJumpTimer -= event.step;
        }

        if (this.jumpTimer > 0) {

            this.jumpTimer -= event.step;

            if (this.doubleJump) {

                this.speed.y = clamp(this.speed.y + DOUBLE_JUMP_SPEED * event.step,
                    JUMP_SPEED, DOUBLE_JUMP_MAX);
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


    protected preMovementEvent(event: CoreEvent) : void {
        
        this.control(event);
        this.animate(event);
        this.updateTimers(event);

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
    
        for (let x = -1; x <= 1; ++ x) {

            for (let y = -1; y <= 1; ++ y) {

                this.baseDraw(canvas, x * GAME_REGION_WIDTH, y * GAME_REGION_HEIGHT);
            }
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
    }
}
