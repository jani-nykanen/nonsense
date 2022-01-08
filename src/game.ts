import { Canvas, ShaderType, TextAlign } from "./canvas.js";
import { CoreEvent, Scene } from "./core.js";
import { Ending } from "./ending.js";
import { EnemyGenerator } from "./enemygen.js";
import { nextObject } from "./gameobject.js";
import { Player } from "./player.js";
import { Star } from "./star.js";
import { TransitionEffectType } from "./transition.js";
import { State } from "./types.js";
import { RGBA, Vector2 } from "./vector.js";


export const GAME_REGION_WIDTH = 1024;
export const GAME_REGION_HEIGHT = 768;


const START_PHASE_TIME = 60;
const INITIAL_TIME = 60;
const PLAYER_START_Y = 160;
const DEATH_TIME = 30;
const CONTROLS_FADE_TIME = 60;


export type StarGeneratingFunction = (x : number, y : number, speedx : number, speedy : number, time : number, id : number) => void;


export class GameScene implements Scene {


    private enemyGen : EnemyGenerator;
    private player : Player;
    private stars : Array<Star>;

    private startTimer : number;
    private startPhase : number;
    private deathTimer : number;

    private timer : number;
    private paused : boolean;
    private startPlayed : boolean;
    private fadeOutScale : number;
    private controlsFadeTimer : number;

    private readonly starFunc : StarGeneratingFunction;


    constructor(param : any, event : CoreEvent) {

        this.starFunc = (x, y, sx, sy, time, id) => {

            nextObject<Star>(this.stars, Star)
                .spawn(x, y, sx, sy, time, id);
        };

        this.enemyGen = new EnemyGenerator();
        this.player = new Player(GAME_REGION_WIDTH/2, PLAYER_START_Y, this.starFunc);

        this.startPhase = 0;
        this.startTimer = 0;
        this.deathTimer = 0;

        this.startPlayed = false;

        this.timer = INITIAL_TIME * 60;
        this.paused = false;

        this.fadeOutScale = 0;
        this.controlsFadeTimer = CONTROLS_FADE_TIME; 

        this.stars = new Array<Star> ();
    }


    private reset(event : CoreEvent) {

        event.transition.activate(true, TransitionEffectType.Fade,
            1.0/30.0, event => {

                this.enemyGen.reset();
                this.player = new Player(GAME_REGION_WIDTH/2 + 0.5, PLAYER_START_Y, this.starFunc);

                this.timer = INITIAL_TIME * 60;

                this.startPhase = 0;
                this.startTimer = 0;
                this.deathTimer = 0;
                
                this.fadeOutScale = 0;
                this.controlsFadeTimer = CONTROLS_FADE_TIME; 

                this.startPlayed = false;

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
        
        if (event.transition.isActive()) {

            if (!event.transition.isFadingIn()) {

                this.player.updateWaitingAnimation(event);
            }
            else {

                this.fadeOutScale = 1.0 - event.transition.getTime();
            }

            return;
        }

        if (!this.startPlayed) {

            event.audio.playSample(event.assets.getSample("ready"), 0.60);
            this.startPlayed = true;
        }

        if (this.startPhase < 2) {

            if ((this.startTimer += event.step) >= START_PHASE_TIME) {

                if (this.startPhase == 0) {
                    
                    event.audio.playSample(event.assets.getSample("go"), 0.60);
                }
                else {

                    event.audio.fadeInMusic(event.assets.getSample("theme"), 0.925, 1000);
                }

                this.startTimer -= START_PHASE_TIME;
                ++ this.startPhase;
            }
            this.player.updateWaitingAnimation(event);

            return;
        }

        if (event.input.getAction("start") == State.Pressed) {

            this.paused = !this.paused;
            if (this.paused) {

                event.audio.pauseMusic();
            }
            else {

                event.audio.resumeMusic();
            }

            event.audio.playSample(event.assets.getSample("pause"), 0.60);
        }
        if (this.paused) return;

        if (this.controlsFadeTimer > 0) {

            this.controlsFadeTimer -= event.step;
        }

        let p : Vector2;

        if (!this.player.isDying()) {

            this.timer = Math.max(-60, this.timer - event.step);
            if (this.timer <= 0) {

                event.audio.stopMusic();
                event.audio.playSample(event.assets.getSample("finish"), 0.70);

                this.timer = 0;
                event.transition.activate(true, TransitionEffectType.Fade, 1.0/120.0,
                    event => {
                        
                        event.changeScene(Ending);
                    }, new RGBA(1, 1, 1));
                return;
            }

            this.enemyGen.update(event);
            if (this.enemyGen.playerCollision(this.player, event)) {

                p = this.player.getPosition();

                this.spawnStars(p.x, p.y, 8);
                this.deathTimer = 0;

                event.audio.stopMusic();
            }
        }
        else {

            this.enemyGen.update(event, true);

            this.deathTimer = Math.min(DEATH_TIME, this.deathTimer + event.step);
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
        const DEATH_MOD = 0.5;

        let bmp = canvas.assets.getBitmap("background");

        let t = 1.0 - this.deathTimer / DEATH_TIME;
        let s = (1.0-DEATH_MOD) + DEATH_MOD * t;

        canvas.setColor(1, s, s);
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

        canvas.setColor(1, s, s, 1.0 - ALPHA);
        canvas.drawBitmap(bmp, 0, 0);
        canvas.setColor();

        canvas.resetVertexAndFragmentTransforms();
    }


    private drawHUD(canvas : Canvas, alpha = 1.0) {

        const Y_OFF = 16;
        const MAX_SCALE = 0.5;
        const CONTROL_FADE_START = 30;
        const CONTROLS_SCALE = 0.67;

        let font = canvas.assets.getBitmap("font");
        let controls = canvas.assets.getBitmap("controls");

        let str = String(Math.max(0, Math.floor(this.timer / 60)));
        
        let scaleFactor = (this.timer % 60) / 60.0;
        let scale = 1.0 + MAX_SCALE * scaleFactor;

        canvas.setColor(1, 1, 1, alpha);
        canvas.drawText(font,
            str, canvas.width/2, Y_OFF - (scale-1)*32, -26, 0, TextAlign.Center,
            scale, scale);

        if (this.paused) {

            canvas.changeShader(ShaderType.NoTexture);
            canvas.setColor(0, 0, 0, 0.33);
            canvas.fillRect();

            canvas.changeShader(ShaderType.Textured);
            canvas.setColor(0.67, 1, 0.33);

            canvas.drawText(font, "PAUSED", 
                canvas.width/2, canvas.height/2-32, 
                -26, 0, TextAlign.Center);
        }

        // Controls
        if (this.controlsFadeTimer <= 0 && !this.paused) {

            canvas.setColor();
            return;
        }

        alpha = 1.0;
        if (!this.paused && this.controlsFadeTimer < CONTROL_FADE_START) {

            alpha = this.controlsFadeTimer / CONTROL_FADE_START;
        }

        canvas.setColor(1, 1, 1, alpha);

        // Left
        canvas.drawBitmapRegion(controls, 0, 0, 512, 256, 
            0,  canvas.height - 256 * CONTROLS_SCALE,
            controls.width * CONTROLS_SCALE, 
            controls.height/2 * CONTROLS_SCALE);

        // Right
        canvas.drawBitmapRegion(controls, 0, 256, 512, 256, 
            canvas.width - 512 * CONTROLS_SCALE,  
            canvas.height - 256 * CONTROLS_SCALE,
            controls.width * CONTROLS_SCALE, 
            controls.height/2 * CONTROLS_SCALE);

        canvas.setColor();
    }


    public drawStart(canvas : Canvas) {

        const BASE_SCALE = 1.25;
        const BONUS_SCALE = 2.25;
        const WAVE_AMPLITUDE = 32;

        const TEXT = ["READY?", "GO!"];

        let t = 1.0;
        if (this.startTimer < START_PHASE_TIME/2) {

            t = this.startTimer / (START_PHASE_TIME/2);
        }
        let scale = BASE_SCALE + (1.0 - t) * (BONUS_SCALE - BASE_SCALE);

        canvas.setColor(1, 1, 0.33, t);

        canvas.drawText(canvas.assets.getBitmap("font"),
            TEXT[this.startPhase],
            canvas.width/2, canvas.height/2 - 32 * scale, -26, 0, 
            TextAlign.Center, scale, scale, 
            Math.PI*2 * t, 
            (1.0-t) * WAVE_AMPLITUDE, 
            Math.PI*2 / TEXT[this.startPhase].length);

        canvas.setColor();
    }


    public redraw(canvas: Canvas) : void {
        
        const FADE_OUT_SCALE = 3.0;
        const FADE_OUT_ROTATION = Math.PI/3;
        const OVERDRAW_ALPHA = 0.50;

        canvas.changeShader(ShaderType.Textured);

        let scale = 1.0 + FADE_OUT_SCALE * this.fadeOutScale;
        let angle = FADE_OUT_ROTATION * this.fadeOutScale;

        canvas.transform
            .loadIdentity()
            .translate(canvas.width/2, canvas.height/2)
            .rotate(angle)
            .scale(scale, scale)
            .translate(-canvas.width/2, -canvas.height/2)
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

        canvas.transform.use();

        canvas.setColor();
        
        this.drawHUD(canvas, OVERDRAW_ALPHA);
    
        if (this.startPhase < 2) {

            this.drawStart(canvas);
        }
    }


    public dispose() : any {
        
        return null;
    }
}