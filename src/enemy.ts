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
        
        this.updateAI(event);

        if ((this.speed.x < 0 && this.pos.x < -this.sprite.width/2) ||
            (this.speed.x > 0 && this.pos.x > GAME_REGION_WIDTH  + this.sprite.width/2) ||
            (this.speed.y < 0 && this.pos.y < -this.sprite.height/2) ||
            (this.speed.y > 0 && this.pos.y > GAME_REGION_HEIGHT  + this.sprite.height/2)) {

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

        const JUMP_HEIGHT_MIN = -10.0;
        const JUMP_HEIGHT_MAX = -16.0;
        const H_SPEED_MIN = 0.5;
        const H_SPEED_MAX = 5.0;
        const GRAVITY = 12.0;

        this.target.y = VerticalMushroom.FLY_SPEED;
        this.speed.y = this.target.y;
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


const ENEMY_TYPES = [VerticalMushroom, JumpingFish];


export const getEnemyType = (id : number) : Function => 
    ENEMY_TYPES[clamp(id, 0, ENEMY_TYPES.length-1) | 0];


export const getEnemyTypeCount = () : number => ENEMY_TYPES.length;
