import { Canvas } from "./canvas";
import { CoreEvent } from "./core";
import { ExistingObject } from "./gameobject.js";
import { Sprite } from "./sprite.js";
import { Vector2 } from "./vector.js";



export class Star extends ExistingObject {


    private pos : Vector2;
    private speed : Vector2;
    private timer : number;

    private sprite : Sprite;


    constructor() {

        super(false);

        this.pos = new Vector2();
        this.speed = new Vector2();

        this.sprite = new Sprite(64, 64);
    }


    public spawn(x : number, y : number, speedx : number, speedy : number, time : number) {

        this.pos.x = x;
        this.pos.y = y;

        this.speed.x = speedx;
        this.speed.y = speedy;

        this.timer = time;

        this.sprite.setFrame(0, 0);

        this.exist = true;
    }


    public update(event : CoreEvent) {

        const ANIM_SPEED = 2;

        if (!this.exist) return;

        this.sprite.animate(0, 0, 3, ANIM_SPEED, event.step);

        this.pos.x += this.speed.x * event.step;
        this.pos.y += this.speed.y * event.step;

        if ((this.timer -= event.step) <= 0) {

            this.exist = false;
        }
    }


    public draw(canvas : Canvas) {

        const BASE_SCALE = 1.0;

        if (!this.exist) return;

        canvas.drawSprite(this.sprite,
            canvas.assets.getBitmap("star"),
            this.pos.x-32*BASE_SCALE, 
            this.pos.y-32*BASE_SCALE, 
            64*BASE_SCALE, 
            64*BASE_SCALE);
    }

}