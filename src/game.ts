import { Canvas, ShaderType, TextAlign } from "./canvas.js";
import { CoreEvent, Scene } from "./core.js";
import { EnemyGenerator } from "./enemygen.js";
import { Player } from "./player.js";
import { TransitionEffectType } from "./transition.js";
import { RGBA } from "./vector.js";


export const GAME_REGION_WIDTH = 1024;
export const GAME_REGION_HEIGHT = 768;


const INITIAL_TIME = 60;


export class GameScene implements Scene {


    private enemyGen : EnemyGenerator;
    private player : Player;

    private timer : number;


    constructor(param : any, event : CoreEvent) {

        this.enemyGen = new EnemyGenerator();
        this.player = new Player(GAME_REGION_WIDTH/2, 128);

        this.timer = INITIAL_TIME * 60;

        event.transition.activate(false, TransitionEffectType.Fade,
            1.0/30.0, null, new RGBA(0.33, 0.67, 1.0));
    }


    public update(event: CoreEvent) : void {
        
        if (event.transition.isActive()) return;

        this.enemyGen.update(event);
        if (this.enemyGen.playerCollision(this.player, event)) {

            // Game over!
        }

        this.player.update(event);

        this.timer = Math.max(-60, this.timer - event.step);
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