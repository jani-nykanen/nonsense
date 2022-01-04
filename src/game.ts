import { Canvas, ShaderType, TextAlign } from "./canvas.js";
import { CoreEvent, Scene } from "./core.js";
import { EnemyGenerator } from "./enemygen.js";
import { nextObject } from "./gameobject.js";
import { Player } from "./player.js";
import { Star } from "./star.js";
import { TransitionEffectType } from "./transition.js";
import { RGBA, Vector2 } from "./vector.js";


export const GAME_REGION_WIDTH = 1024;
export const GAME_REGION_HEIGHT = 768;


const INITIAL_TIME = 60;


export type StarGeneratingFunction = (x : number, y : number, speedx : number, speedy : number, time : number, id : number) => void;


export class GameScene implements Scene {


    private enemyGen : EnemyGenerator;
    private player : Player;
    private stars : Array<Star>;

    private timer : number;
    private readonly starFunc : StarGeneratingFunction;


    constructor(param : any, event : CoreEvent) {

        this.starFunc = (x, y, sx, sy, time, id) => {

            nextObject<Star>(this.stars, Star)
                .spawn(x, y, sx, sy, time, id);
        };

        this.enemyGen = new EnemyGenerator();
        this.player = new Player(GAME_REGION_WIDTH/2, 128, this.starFunc);

        this.timer = INITIAL_TIME * 60;

        event.transition.activate(false, TransitionEffectType.Fade,
            1.0/30.0, null, new RGBA(0.33, 0.67, 1.0));

        this.stars = new Array<Star> ();
    }


    private reset(event : CoreEvent) {

        event.transition.activate(true, TransitionEffectType.Fade,
            1.0/30.0, event => {

                this.enemyGen.reset();
                this.player = new Player(GAME_REGION_WIDTH/2, 128, this.starFunc);

                this.timer = INITIAL_TIME * 60;
            }, new RGBA(0.33, 0.67, 1.0));
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
                Math.sin(angle) * STAR_SPEED);

            this.starFunc(x, y, speed.x, speed.y, STAR_TIME, 1);
        }

    }


    public update(event: CoreEvent) : void {
        
        if (event.transition.isActive()) return;

        let p : Vector2;

        if (!this.player.isDying()) {

            this.enemyGen.update(event);
            if (this.enemyGen.playerCollision(this.player, event)) {

                p = this.player.getPosition();

                this.spawnStars(p.x, p.y, 8);
            }

            this.timer = Math.max(-60, this.timer - event.step);
        }
        else {

            this.enemyGen.update(event, true);
        }

        this.player.update(event);
        if (!this.player.doesExist()) {

            this.reset(event);
            return;
        }

        for (let o of this.stars) {

            o.update(event);
        }
    }


    private drawShadowLayer(canvas : Canvas) {

        const SHADOW_OFFSET_X = 8;
        const SHADOW_OFFSET_Y = 8;
        const ALPHA = 0.25;

        let bmp = canvas.assets.getBitmap("background");

        canvas.drawBitmap(bmp, 0, 0);

        canvas.setColor(0, 0, 0);
        canvas.transform
            .push()
            .translate(SHADOW_OFFSET_X, SHADOW_OFFSET_Y)
            .use();

        this.enemyGen.draw(canvas);
        this.player.draw(canvas);

        canvas.transform.pop();
        canvas.transform.use();

        canvas.setColor(1, 1, 1, 1.0 - ALPHA);
        canvas.drawBitmap(bmp, 0, 0);
        canvas.setColor();

        canvas.resetVertexAndFragmentTransforms();
    }


    private drawHUD(canvas : Canvas, alpha = 1.0) {

        const Y_OFF = 16;
        const MAX_SCALE = 0.5;

        let str = String(Math.max(0, Math.ceil(this.timer / 60)));
        
        let scaleFactor = ((this.timer+60) % 60) / 60.0;
        let scale = 1.0 + MAX_SCALE * scaleFactor;

        canvas.setColor(1, 1, 1, alpha);
        canvas.drawText(canvas.assets.getBitmap("font"),
            str, canvas.width/2, Y_OFF - (scale-1)*32, -26, 0, TextAlign.Center,
            scale, scale);

        canvas.setColor();
    }


    public redraw(canvas: Canvas) : void {
        
        const OVERDRAW_ALPHA = 0.50;

        canvas.changeShader(ShaderType.Textured);

        canvas.transform
            .loadIdentity()
            .setView(canvas.width, canvas.height)
            .use();

        this.drawShadowLayer(canvas);

        this.drawHUD(canvas);

        this.player.preDraw(canvas);

        for (let o of this.stars) {

            o.draw(canvas);
        }

        this.enemyGen.draw(canvas);
        this.player.draw(canvas);

        canvas.transform
            .loadIdentity()
            .use();

        canvas.setColor();
        
        this.drawHUD(canvas, OVERDRAW_ALPHA);
    }


    public dispose() : any {
        
        return null;
    }
}