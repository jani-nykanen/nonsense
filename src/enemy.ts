import { Canvas, Flip } from "./canvas.js";
import { CoreEvent } from "./core.js";
import { GAME_REGION_HEIGHT, GAME_REGION_WIDTH } from "./game.js";
import { GameObject } from "./gameobject.js";
import { clamp } from "./math.js";
import { Sprite } from "./sprite.js";
import { Vector2 } from "./vector.js";


export class Enemy extends GameObject {


    protected readonly id : number;

    protected scale : Vector2;
    protected angle : number;
    protected flip : Flip;
    protected dir : number;


    constructor(x : number, y : number, dir : number, id : number) {

        super(x, y, true);

        this.friction = new Vector2(0.5, 0.5);
        this.sprite = new Sprite(256, 256);
        this.sprite.setFrame(0, id);

        this.scale = new Vector2(1, 1);
        this.flip = Flip.None;

        this.angle = 0;
        this.dir = dir;

        this.id = id;
    }


    // Also add player here?
    protected updateAI(event : CoreEvent) {}


    protected preMovementEvent(event: CoreEvent): void {
        
        const EPS = 0.0001;

        this.updateAI(event);

        if ((this.speed.x < -EPS && this.pos.x < -this.sprite.width/2) ||
            (this.speed.x > EPS && this.pos.x > GAME_REGION_WIDTH  + this.sprite.width/2) ||
            (this.speed.y < -EPS && this.pos.y < -this.sprite.height/2) ||
            (this.speed.y > EPS && this.pos.y > GAME_REGION_HEIGHT  + this.sprite.height/2)) {

            this.kill(true);
        }
    }

    

    public draw(canvas : Canvas) {

        let bmp = canvas.assets.getBitmap("enemies");

        canvas.transform
            .push()
            .translate(this.pos.x, this.pos.y)
            .rotate(this.angle)
            .scale(this.scale.x, this.scale.y)
            .use();

        // canvas.setColor();
        canvas.drawSprite(this.sprite, bmp, 
            -this.sprite.width/2, 
            -this.sprite.height/2,
            this.sprite.width,
            this.sprite.height,
            this.flip);

        canvas.transform.pop();
    }
}


//
// Enemy types
//


class VerticalMushroom extends Enemy {


    static FLY_SPEED = -2.0;


    private wave : number;


    constructor(x : number, y : number, dir : number) {

        super(x, y, dir, 0);

        this.target.y = VerticalMushroom.FLY_SPEED;
        this.speed.y = this.target.y;
        this.friction.y = 0.40;

        this.scale = new Vector2(0.67, 0.67);

        this.wave = 0.0;

        this.sprite.setFrame(0, 0);
    }


    protected updateAI(event: CoreEvent): void {
        
        const WAVE_SPEED = 0.10;
        const SPEED_MOD = 4.0;
        const ANIM_EPS = 0.33;

        this.wave = (this.wave + WAVE_SPEED*event.step) % (Math.PI*2);
        let s = Math.sin(this.wave);

        this.target.y = VerticalMushroom.FLY_SPEED - s * SPEED_MOD;

        let frame = 0;
        if (s > ANIM_EPS)
            frame = 2;
        else if (s < -ANIM_EPS)
            frame = 1;

        this.sprite.setFrame(frame, this.sprite.getRow());
    }

}


class JumpingFish extends Enemy {


    constructor(x : number, y : number, dir : number) {

        super(x, y, dir, 1);

        const JUMP_HEIGHT_MIN = -12.0;
        const JUMP_HEIGHT_MAX = -16.0;
        const H_SPEED_MIN = 0.5;
        const H_SPEED_MAX = 5.0;
        const GRAVITY = 12.0;

        this.friction.y = 0.167;

        this.scale = new Vector2(0.60, 0.60);
        
        this.speed.x = ((Math.random() * (H_SPEED_MAX - H_SPEED_MIN)) + H_SPEED_MIN) * dir;
        this.speed.y = ((Math.random() * (JUMP_HEIGHT_MAX - JUMP_HEIGHT_MIN)) + JUMP_HEIGHT_MIN) | 0;

        this.target.x = this.speed.x;
        this.target.y = GRAVITY;

        this.sprite.setFrame(3, 0);

        this.flip = dir > 0 ? Flip.None : Flip.Horizontal;
    }


    protected updateAI(event: CoreEvent): void {
        
        let s = new Vector2(this.speed.x * this.dir, this.speed.y);
        let dir = Vector2.normalize(s, true);
        this.angle = this.dir * Math.atan2(dir.y, dir.x);
    }

}


class HorizontalMushroom extends Enemy {


    private wave : number;


    constructor(x : number, y : number, dir : number) {

        super(x, y, dir, 2);

        const FLY_SPEED = 2.0;

        this.target.x = FLY_SPEED * this.dir;
        this.speed.x = this.target.x;
        this.friction.y = 0.40;

        this.scale = new Vector2(0.67, 0.67);

        this.wave = 0.0;

        this.sprite.setFrame(0, 1);

        this.flip = dir > 0 ? Flip.Horizontal : Flip.None;
    }


    protected updateAI(event: CoreEvent): void {
        
        const WAVE_SPEED = 0.10;
        const SPEED_MOD = 4.0;
        const ANIM_EPS = 0.33;

        this.wave = (this.wave + WAVE_SPEED*event.step) % (Math.PI*2);
        let s = Math.sin(this.wave);

        this.target.y = -s * SPEED_MOD;

        let frame = 0;
        if (s > ANIM_EPS)
            frame = 2;
        else if (s < -ANIM_EPS)
            frame = 1;

        this.sprite.setFrame(frame, this.sprite.getRow());
    }

}


class Fox extends Enemy {


    private startPos : number;
    private phase : number;


    constructor(x : number, y : number, dir : number) {

        super(x, y, dir, 3);

        this.startPos = x;
        this.phase = 0;

        this.friction.x = 0.15;

        this.scale = new Vector2(0.80, 0.80 * 0.67);

        this.sprite.setFrame(0, 2);

        this.flip = dir > 0 ? Flip.Horizontal : Flip.None;
    }


    protected updateAI(event: CoreEvent): void {
        
        const ANIM_SPEED = 4;
        const START_SPEED = 2.0;
        const START_DISTANCE = 128;
        const BASE_TARGET = 12.0;

        if (this.phase == 0) {

            this.target.x = START_SPEED * this.dir;
            this.speed.x = this.target.x;

            if (Math.abs(this.pos.x - this.startPos) > START_DISTANCE) {

                ++ this.phase;
                this.speed.x = 0;
            }
        }
        else {

            this.target.x = BASE_TARGET * this.dir;
        }
        
        this.sprite.animate(this.sprite.getRow(), 0, 3, ANIM_SPEED, event.step);
    }

}


// Pretty much the same as jumping fish, might need a 
// base class for these two
class Swordfish extends Enemy {


    constructor(x : number, y : number, dir : number) {

        super(x, y, dir, 4);

        const JUMP_HEIGHT_MIN = -8.0;
        const JUMP_HEIGHT_MAX = -12.0;
        const H_SPEED_MIN = 8.0;
        const H_SPEED_MAX = 12.0;
        const GRAVITY = 12.0;

        this.friction.y = 0.167;

        this.scale = new Vector2(0.80, 0.80 * 0.67);
        
        this.speed.x = ((Math.random() * (H_SPEED_MAX - H_SPEED_MIN)) + H_SPEED_MIN) * dir;
        this.speed.y = ((Math.random() * (JUMP_HEIGHT_MAX - JUMP_HEIGHT_MIN)) + JUMP_HEIGHT_MIN) | 0;

        this.target.x = this.speed.x;
        this.target.y = GRAVITY;

        this.sprite.setFrame(3, 1);

        this.flip = dir > 0 ? Flip.None : Flip.Horizontal;
    }


    protected updateAI(event: CoreEvent): void {
        
        let s = new Vector2(this.speed.x * this.dir, this.speed.y);
        let dir = Vector2.normalize(s, true);
        this.angle = this.dir * Math.atan2(dir.y, dir.x);
    }

}


class Orc extends Enemy {


    private wave : number;
    private startPos : number;


    constructor(x : number, y : number, dir : number) {

        super(x, y, dir, 5);

        const FLY_SPEED = -2.0;

        this.startPos = x;

        this.target.y = FLY_SPEED;
        this.speed.y = this.target.y;

        this.scale = new Vector2(0.67, 0.67);

        this.wave = 0.0;

        this.sprite.setFrame(0, 3);
    }


    protected updateAI(event: CoreEvent): void {
        
        const WAVE_SPEED = 0.025;
        const AMPLITUDE = 128;
        const ANIM_SPEED = 4;
        const ROTATION = Math.PI / 8;

        this.wave = (this.wave + WAVE_SPEED*event.step) % (Math.PI*2);

        let s = Math.sin(this.wave);
        this.pos.x = this.startPos + s * AMPLITUDE;
        this.angle = ROTATION * s;

        this.sprite.animate(3, 0, 3, ANIM_SPEED, event.step);
    }

}


class Turnip extends Enemy {


    private startPos : number;
    private phase : number;
    private wave : number;


    constructor(x : number, y : number, dir : number) {

        super(x, y, dir, 6);

        this.startPos = y;
        this.phase = 0;

        this.friction.y = 0.40;

        this.scale = new Vector2(0.60, 0.60);

        this.sprite.setFrame(0, 4);

        this.wave = 0.0;
    }


    protected updateAI(event: CoreEvent): void {
        
        const ANIM_SPEED = 4;
        const START_SPEED = 1.5;
        const START_DISTANCE = 128;
        const GRAVITY = 16.0;

        const WAVE_SPEED = 0.10;
        const ROTATION = Math.PI / 12;

        this.wave = (this.wave + WAVE_SPEED*event.step) % (Math.PI*2);
        this.angle = Math.sin(this.wave) * ROTATION;

        if (this.phase == 0) {

            this.target.y = START_SPEED;
            this.speed.y = this.target.y;

            if (Math.abs(this.pos.y - this.startPos) > START_DISTANCE) {

                ++ this.phase;
                this.speed.y = 0;
            }
        }
        else {

            this.target.y = GRAVITY;
        }
        
        this.sprite.animate(
            this.sprite.getRow(), 0, 3, ANIM_SPEED, event.step);
    }

}


class LeafBug extends Enemy {


    private wave : number;
    private startPos : number;


    constructor(x : number, y : number, dir : number) {

        super(x, y, dir, 7);

        this.startPos = x;

        this.friction.y = 0.50;

        this.scale = new Vector2(0.67, 0.67);

        this.sprite.setFrame(0, 5);

        this.wave = 0.0;
    }


    protected updateAI(event: CoreEvent): void {
        
        const WAVE_SPEED = 0.025;
        const AMPLITUDE = 256;
        const ROTATION = Math.PI / 6;
        const BASE_TARGET_Y = 4.0;
        const SPEED_MOD = 3.0;

        this.wave = (this.wave + WAVE_SPEED*event.step) % (Math.PI*2);

        let s = Math.sin(this.wave);
        this.pos.x = this.startPos + s * AMPLITUDE;
        this.angle = -ROTATION * s;

        this.target.y = BASE_TARGET_Y - Math.abs(s) * SPEED_MOD;
    }

}




const ENEMY_TYPES = [
    VerticalMushroom, JumpingFish, 
    HorizontalMushroom, Fox, 
    Swordfish, Orc,
    Turnip, LeafBug,
];


export const getEnemyType = (id : number) : Function => 
    ENEMY_TYPES[clamp(id, 0, ENEMY_TYPES.length-1) | 0];


export const getEnemyTypeCount = () : number => ENEMY_TYPES.length;
