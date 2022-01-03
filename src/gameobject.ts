import { Canvas } from "./canvas.js";
import { CoreEvent } from "./core.js";
import { Sprite } from "./sprite.js";
import { Vector2, Rect } from "./vector.js";


export const updateSpeedAxis = (speed : number, target : number, step : number) : number => {
		
    if (speed < target) {
        
        return Math.min(target, speed+step);
    }
    return Math.max(target, speed-step);
}


export const boxOverlay = (pos : Vector2, center : Vector2, hitbox : Vector2, 
    x : number, y : number, w : number, h : number) : boolean => {

    let px = pos.x + center.x - hitbox.x/2;
    let py = pos.y + center.y - hitbox.y/2;

    return px + hitbox.x >= x && px < x+w &&
           py + hitbox.y >= y && py < y+h;
}


export const boxOverlayRect = (rect : Rect, 
    x : number, y : number, w : number, h : number) : boolean => {

    return boxOverlay(
        new Vector2(rect.x, rect.y), 
        new Vector2(), 
        new Vector2(rect.w, rect.h), 
        x, y, w, h);
}


export class ExistingObject {

    
    protected exist : boolean;


    constructor(exist = true) {

        this.exist = exist;
    }


    public doesExist = () : boolean => this.exist;
}


export function nextObject<T extends ExistingObject> (arr : Array<T>, type : Function) {

    let o : T;

    o = null;
    for (let a of arr) {

        if (!a.doesExist()) {

            o = a;
            break;
        }
    }

    if (o == null) {

        o = new type.prototype.constructor();
        arr.push(o);
    }
    return o;
}


export class WeakGameObject extends ExistingObject {


    protected pos : Vector2;
    protected dying : boolean;


    constructor(x : number, y : number, exist = true) {

        super(exist);

        this.pos = new Vector2(x, y);
        this.dying = false;
    }


    protected die(event : CoreEvent) : boolean {

        return true;
    }

    protected updateEvent(event : CoreEvent) {}


    public update(event : CoreEvent) {

        if (!this.exist) return;

        if (this.dying) {

            if (this.die(event)) {

                this.exist = false;
                this.dying = false;
            }
            return;
        }

        this.updateEvent(event);
    }


    public kill(force = false) {

        this.dying = true;
        if (force) {

            this.exist = false;
        }
    }


    public getPosition = () : Vector2 => this.pos.clone();
    public isDying = () : boolean => this.dying;
}


export class GameObject extends WeakGameObject {


    protected speed : Vector2;
    protected target : Vector2;
    protected friction : Vector2;
    protected center : Vector2;

    protected hitbox : Vector2;

    protected sprite : Sprite;


    constructor(x : number, y : number, exist = true) {

        super(x, y, exist);

        this.speed = new Vector2();
        this.target = new Vector2();
        this.friction = new Vector2(0.1, 0.1);
        this.center = new Vector2();

        this.hitbox = new Vector2(16, 16);
        this.sprite = new Sprite(16, 16);
    }


    public overlayObject = (o : GameObject, translation = new Vector2()) : boolean =>
        boxOverlay(
            this.pos, this.center, this.hitbox,
            o.pos.x + translation.x + o.center.x - o.hitbox.x/2,
            o.pos.y + translation.y + o.center.y - o.hitbox.y/2,
            o.hitbox.x, o.hitbox.y);


    protected updateMovement(event : CoreEvent) {

        this.speed.x = updateSpeedAxis(this.speed.x,
            this.target.x, this.friction.x*event.step);
        this.speed.y = updateSpeedAxis(this.speed.y,
            this.target.y, this.friction.y*event.step);

        this.pos.x += this.speed.x * event.step;
        this.pos.y += this.speed.y * event.step;
    }


    protected preMovementEvent(event : CoreEvent) {}
    protected postMovementEvent(event : CoreEvent) {}


    protected updateEvent(event : CoreEvent) {

        this.preMovementEvent(event);
        this.updateMovement(event);
        this.postMovementEvent(event);
    }


    public stopMovement() {

        this.speed.zeros();
        this.target.zeros();
    }


    public preDraw(canvas : Canvas) {}
    public draw(canvas : Canvas) {}


    public getHitbox = () : Vector2 => this.hitbox.clone();
    public getSpeed = () : Vector2 => this.speed.clone();

}
