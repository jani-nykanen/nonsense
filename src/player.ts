import { Canvas, Flip } from "./canvas.js";
import { CoreEvent } from "./core.js";
import { GAME_REGION_HEIGHT } from "./game.js";
import { GameObject } from "./gameobject.js";
import { Sprite } from "./sprite.js";
import { State } from "./types.js";
import { Vector2 } from "./vector.js";


const FAST_FALL_BONUS = 12;


export class Player extends GameObject {


    private scale : Vector2;
    private angle : number;
    private angleTarget : number;

    private jumpTimer : number;
    private bonusJumpActivated : boolean;
    private fastFall : boolean;
    private canFastFall : boolean;
    private fastFallBonus : boolean;
    private doubleJump : boolean;
    private fallingSlow : boolean;
    private canFallSlow : boolean;

    private dir : number;


    constructor(x : number, y : number) {

        super(x, y, true);

        this.sprite = new Sprite(256, 256);
    
        this.angle = 0;
        this.angleTarget = 0;
        this.scale = new Vector2(0.67, 0.67);

        this.friction = new Vector2(0.60, 0.40);
        this.hitbox = new Vector2(this.scale.x * 96, this.scale.y * 160);

        this.jumpTimer = 0;
        this.bonusJumpActivated = true;
        this.fastFall = false;
        this.canFastFall = true;
        this.fastFallBonus = false;
        this.doubleJump = false;
        this.fallingSlow = false;
        this.canFallSlow = true;

        this.dir = 0;
    }


    private control(event : CoreEvent) {
        
        const BASE_GRAVITY = 12.0;
        const MOVEMENT_SPEED = 6.0;
        const FAST_FALL_EPS = 0.5;
        const FAST_FALL_SPEED = 24.0;
        const DOUBLE_JUMP_TIME = 60;
        const FALL_SLOW_SPEED = 2.0;

        let stick = event.input.getStick();

        this.target.x = MOVEMENT_SPEED * stick.x;
        this.target.y = BASE_GRAVITY;

        this.fastFall = this.canFastFall &&
            stick.y > FAST_FALL_EPS;
        if (this.fastFall) {

            this.speed.y = FAST_FALL_SPEED;
            this.canFallSlow = false;
        }
        else {

            this.speed.y = Math.min(BASE_GRAVITY, this.speed.y);
        }

        if (stick.y < FAST_FALL_EPS && !(this.doubleJump && this.jumpTimer > 0)) {

            if (this.fastFallBonus) {

                this.jumpTimer = Math.max(0, this.jumpTimer - FAST_FALL_BONUS);
                this.fastFallBonus = false;
            }

            if (!this.canFastFall)
                this.canFastFall = true;
        }

        if (!this.doubleJump) {

            if (event.input.getAction("jump") == State.Pressed) {
                
                this.jumpTimer = DOUBLE_JUMP_TIME;
                this.doubleJump = true;
                this.canFallSlow = true;
            }
        }
        else if ((event.input.getAction("jump") & State.DownOrPressed) == 0) {

            this.jumpTimer = 0;
        }

        this.fallingSlow = this.canFallSlow &&
            this.doubleJump && !this.fastFall &&
            this.jumpTimer <= 0 &&
            ((event.input.getAction("jump") & State.DownOrPressed) == 1);
        if (this.fallingSlow) {

            this.speed.y = Math.min(this.speed.y, FALL_SLOW_SPEED);
        }
    }


    private animate(event : CoreEvent) {

        const EPS = 2.0;
        const DOUBLE_JUMP_ANIM_SPEED = 2.0;

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

        const JUMP_SPEED = -10.0;
        const JUMP_TIME_BONUS = 12;
        const DOUBLE_JUMP_MIN = -8.0;
        const DOUBLE_JUMP_SPEED = -1.0;

        if (this.jumpTimer > 0) {

            this.jumpTimer -= event.step;

            if (this.doubleJump) {

                this.speed.y = Math.max(DOUBLE_JUMP_MIN,
                    this.speed.y + DOUBLE_JUMP_SPEED * event.step);
            }
            else {

                this.speed.y = JUMP_SPEED;

                if (!this.bonusJumpActivated &&
                    (event.input.getAction("jump") & State.DownOrPressed) == 1) {

                    this.jumpTimer += JUMP_TIME_BONUS;
                    this.bonusJumpActivated = true;
                }
            }
        }
    }


    protected preMovementEvent(event: CoreEvent) : void {
        
        this.control(event);
        this.animate(event);
        this.updateTimers(event);

        // TEMP!!!
        if (this.pos.y > GAME_REGION_HEIGHT + this.sprite.height/2*this.scale.y) {

            this.pos.y -= GAME_REGION_HEIGHT + this.sprite.height*this.scale.y;
        }
    }


    public draw(canvas : Canvas) {
    
        let flip = Flip.None;
        if (this.dir < 0)  
            flip = Flip.Horizontal;

        canvas.transform
            .push()
            .translate(this.pos.x, this.pos.y)
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


    public bounce(event : CoreEvent) {

        const JUMP_TIME = 8;

        this.jumpTimer = JUMP_TIME;
        this.bonusJumpActivated = false;
        
        if (this.fastFall) {

            this.jumpTimer += FAST_FALL_BONUS;
            this.fastFallBonus = true;

            this.bonusJumpActivated = true;
        }

        this.canFastFall = false;
        this.doubleJump = false;
    }
}
