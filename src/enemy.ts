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
    protected flip : Flip;


    constructor(x : number, y : number, dir : number, id : number) {

        super(x, y, true);

        this.friction = new Vector2(0.1, 0.1);
        this.sprite = new Sprite(256, 256);
        this.sprite.setFrame(0, id);

        this.scale = new Vector2(1, 1);
        this.flip = Flip.None;

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
            .scale(this.scale.x, this.scale.y)
            .use();

        canvas.setColor();
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

        this.scale = new Vector2(0.5, 0.5);

        this.wave = 0.0;
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


const ENEMY_TYPES = [VerticalMushroom];


export const getEnemyType = (id : number) : Function => 
    ENEMY_TYPES[clamp(id, 0, ENEMY_TYPES.length-1) | 0];


export const getEnemyTypeCount = () : number => ENEMY_TYPES.length;
