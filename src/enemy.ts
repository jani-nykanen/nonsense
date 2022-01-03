import { Canvas, Flip } from "./canvas.js";
import { CoreEvent } from "./core.js";
import { GAME_REGION_HEIGHT, GAME_REGION_WIDTH } from "./game.js";
import { GameObject, updateSpeedAxis } from "./gameobject.js";
import { clamp } from "./math.js";
import { Player } from "./player.js";
import { Sprite } from "./sprite.js";
import { Vector2 } from "./vector.js";


export class Enemy extends GameObject {


    protected readonly id : number;

    protected scale : Vector2;
    protected angle : number;
    protected flip : Flip;
    protected dir : number;

    protected cannotBeKilled : boolean;


    constructor(x : number, y : number, dir : number,
        scalex : number, scaley : number, 
        id : number, cannotBeKilled = false) {

        super(x, y, true);

        this.friction = new Vector2(0.5, 0.5);
        this.sprite = new Sprite(256, 256);
        this.sprite.setFrame(0, id);

        this.scale = new Vector2(scalex, scaley);
        this.flip = Flip.None;

        this.angle = 0;
        this.dir = dir;

        this.id = id;

        this.hitbox = new Vector2(160*this.scale.x, 160*this.scale.y);

        this.cannotBeKilled = cannotBeKilled;
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


    public drawSpecial(canvas : Canvas) {}


    public draw(canvas : Canvas) {

        if (!this.exist) return;

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


    private playerCollisionBase(player : Player, tx : number, ty : number, event : CoreEvent) : boolean {

        const STOMP_OFFSET = 16;
        const STOMP_HEIGHT = 32;
        const SPEED_EPS = 0.5;
        const KNOCKBACK_Y = 8.0;

        let left = this.pos.x - this.hitbox.x/2;
        let top = this.pos.y - this.hitbox.y/2 - STOMP_OFFSET; 

        let p = Vector2.add(player.getPosition(), new Vector2(tx, ty));
        let phit = player.getHitbox();

        let px = p.x - phit.x/2;
        let py = p.y + phit.y/2;

        if (player.getSpeed().y > -SPEED_EPS &&
            px + phit.x >= left && px <= left + this.hitbox.x &&
            py >= top && py <= top+STOMP_HEIGHT + Math.max(0, player.getSpeed().y)) {

            player.bounce(event);

            if (!this.cannotBeKilled) {

                // Kill
                this.kill();
            }
            else {

                this.speed.y = KNOCKBACK_Y;
            }
            return false;
        }
        return this.overlayObject(player, new Vector2(tx, ty));
    }


    public playerCollision(player : Player, event : CoreEvent) : boolean {

        if (player.isDying() || this.isDying() || !this.exist)
            return;

        for (let y = -1; y <= 1; ++ y) {

            for (let x = -1; x <= 1; ++ x) {

                //if (Math.abs(x) == Math.abs(y) && x != 0)
                //    continue;

                if (this.playerCollisionBase(player, 
                        x * GAME_REGION_WIDTH, 
                        y * GAME_REGION_HEIGHT, event)) {

                    return true;
                }
            }
        }
        return false;
    }
}


//
// Enemy types
//


class VerticalMushroom extends Enemy {


    static FLY_SPEED = -2.0;


    private wave : number;


    constructor(x : number, y : number, dir : number) {

        super(x, y, dir, 0.50, 0.50, 0, true);

        this.target.y = VerticalMushroom.FLY_SPEED;
        this.speed.y = this.target.y;
        this.friction.y = 0.40;

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

        super(x, y, dir, 0.45, 0.45, 1);

        const JUMP_HEIGHT_MIN = -12.0;
        const JUMP_HEIGHT_MAX = -16.0;
        const H_SPEED_MIN = 0.5;
        const H_SPEED_MAX = 5.0;
        const GRAVITY = 12.0;

        this.friction.y = 0.167;

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

        super(x, y, dir, 0.50, 0.50, 2, true);

        const FLY_SPEED = 2.0;

        this.target.x = FLY_SPEED * this.dir;
        this.speed.x = this.target.x;
        this.friction.y = 0.40;

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

        super(x, y, dir, 0.67, 0.67*0.67, 3);

        this.startPos = x;
        this.phase = 0;

        this.friction.x = 0.15;

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

        super(x, y, dir, 0.60, 0.60*0.67, 4);

        const JUMP_HEIGHT_MIN = -6.0;
        const JUMP_HEIGHT_MAX = -10.0;
        const H_SPEED_MIN = 6.0;
        const H_SPEED_MAX = 10.0;
        const GRAVITY = 12.0;

        this.friction.y = 0.125;

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

        super(x, y, dir, 0.50, 0.50, 5);

        const FLY_SPEED = -2.0;

        this.startPos = x;

        this.target.y = FLY_SPEED;
        this.speed.y = this.target.y;

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

        super(x, y, dir, 0.475, 0.475, 6);

        this.startPos = y;
        this.phase = 0;

        this.friction.y = 0.33;

        this.sprite.setFrame(0, 4);

        this.wave = 0.0;
    }


    protected updateAI(event: CoreEvent): void {
        
        const ANIM_SPEED = 4;
        const START_SPEED = 1.5;
        const START_DISTANCE = 128;
        const GRAVITY = 12.0;

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

        super(x, y, dir, 0.50, 0.50, 7);

        this.startPos = x;

        this.friction.y = 0.50;

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


class Moon extends Enemy {


    private angleTarget : number;


    constructor(x : number, y : number, dir : number) {

        super(x, y, dir, 0.475, 0.475, 8);

        const JUMP_HEIGHT_MIN = 5.0;
        const JUMP_HEIGHT_MAX = 8.0;
        const H_SPEED_MIN = 0.5;
        const H_SPEED_MAX = 3.0;
        const GRAVITY = -8.0;

        this.friction.y = 0.033;

        this.speed.x = ((Math.random() * (H_SPEED_MAX - H_SPEED_MIN)) + H_SPEED_MIN) * dir;
        this.speed.y = ((Math.random() * (JUMP_HEIGHT_MAX - JUMP_HEIGHT_MIN)) + JUMP_HEIGHT_MIN) | 0;

        this.target.x = this.speed.x;
        this.target.y = GRAVITY;

        this.sprite.setFrame(1, 5);

        this.flip = dir < 0 ? Flip.None : Flip.Horizontal;

        this.angleTarget = 0;
    }


    protected updateAI(event: CoreEvent) : void {
        
        const ANGLE_SPEED = 0.005;
        const ANGLE_TARGET = Math.PI / 4;

        this.angleTarget = Math.sign(this.speed.y) * ANGLE_TARGET * this.dir;
        this.angle = updateSpeedAxis(this.angle, this.angleTarget, ANGLE_SPEED);

        // let s = new Vector2(this.speed.x * this.dir, this.speed.y);
        // let dir = Vector2.normalize(s, true);
        // this.angle = this.dir * Math.atan2(dir.y, dir.x);
    }


    public drawSpecial(canvas: Canvas) : void {
    
        const VINE_OFFSET_X = 32;
        const VINE_OFFSET_Y = -32;

        if (!this.exist) return;

        let bmp = canvas.assets.getBitmap("enemies");

        let sx = 512 + (128-16);
        let sy = 1280;

        let dw = 32 * this.scale.x;
        let dh = 256 * this.scale.y;

        let py = 0;

        let loopy = Math.ceil((this.pos.y+VINE_OFFSET_Y) / dh);

        for (let y = 0; y < loopy; ++ y) {

            py = this.pos.y + VINE_OFFSET_Y - y * dh;

            canvas.drawBitmapRegion(bmp, sx, sy, 32, 256, 
                this.pos.x - this.dir * VINE_OFFSET_X - 16, py-dh,
                dw, dh);
        }
    }
}


const ENEMY_TYPES = [
    VerticalMushroom, JumpingFish, 
    HorizontalMushroom, Fox, 
    Swordfish, Orc,
    Turnip, LeafBug,
    Moon
];


export const getEnemyType = (id : number) : Function => 
    ENEMY_TYPES[clamp(id, 0, ENEMY_TYPES.length-1) | 0];


export const getEnemyTypeCount = () : number => ENEMY_TYPES.length;
