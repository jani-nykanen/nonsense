import { Canvas, ShaderType, TextAlign } from "./canvas.js";
import { CoreEvent, Scene } from "./core.js";
import { GameScene } from "./game.js";
import { updateSpeedAxis } from "./gameobject.js";
import { TransitionEffectType } from "./transition.js";
import { RGBA } from "./vector.js";
import { VERSION } from "./version.js";


const FLOOR_POS = 0;
const BOUNCE_TIME = 60;


export class TitleScreen implements Scene {


    private waveTimer : number;
    private fadingOut : boolean;
    private fadeOutTimer : number;

    private flickerTimer : number;
    private pressAnyKeyAlpha : number;

    private phase : number;

    private pos : number;
    private gravity : number;
    private bounceTimer : number;
   

    constructor(param : any, event : CoreEvent) {

        this.waveTimer = 0.0;

        this.fadingOut = false;
        this.fadeOutTimer = 0;
        this.bounceTimer = 0;
        this.pressAnyKeyAlpha = 0;

        this.pos = -400;
        this.gravity = 0;

        this.phase = 0;

        this.flickerTimer = 0;

        event.transition.deactivate();
    }


    public update(event: CoreEvent) : void {

        const WAVE_TIME = 0.15;
        const GRAVITY_TARGET = 64.0;
        const GRAVITY_DELTA = 1.0;
        const ALPHA_SPEED = 0.033;
        const FLICKER_TIME = 40;

        if (event.transition.isActive()) {

            // Good naming here
            if (event.transition.isFadingIn()) {

                this.fadingOut = true;
                this.fadeOutTimer = 1.0 - event.transition.getTime();
            }

            return;
        }
        this.fadingOut = false;

        if (this.flickerTimer > 0) {

            if ((this.flickerTimer -= event.step) <= 0) {

                event.transition.activate(true, TransitionEffectType.Fade,
                    1.0/60.0, event => {
    
                        event.changeScene(GameScene);
                    }, new RGBA(1, 1, 1));
            }
            return;
        }

        if (this.phase == 0) {

            this.gravity = updateSpeedAxis(this.gravity, 
                GRAVITY_TARGET, GRAVITY_DELTA*event.step);

            this.pos += this.gravity * event.step;
            if (this.pos > FLOOR_POS) {

                event.audio.playSample(event.assets.getSample("hit"), 0.60);

                this.pos = FLOOR_POS;
                ++ this.phase;
            }
            return;
        }
        else if (this.phase == 1) {

            if ((this.bounceTimer += event.step) >= BOUNCE_TIME) {

                this.bounceTimer = BOUNCE_TIME;
                ++ this.phase;
            }
            return;
        }

        this.pressAnyKeyAlpha = updateSpeedAxis(
            this.pressAnyKeyAlpha, 1.0, ALPHA_SPEED*event.step);

        this.waveTimer = (this.waveTimer + WAVE_TIME*event.step) % (Math.PI*2);
        
        if (event.input.anyPressed()) {

            this.flickerTimer = FLICKER_TIME;
            event.audio.playSample(event.assets.getSample("start"), 0.60);
        }
    }


    public redraw(canvas: Canvas) : void {
        
        // TODO: Split to smaller functions (stop being lazy)

        const LOGO_SCALE_MOD = 0.45;
        const LOGO_BASE_SCALE = 0.75;
        const FADE_OUT_SCALE = 4.0;
        const FADE_OUT_ROTATION = Math.PI/3;

        let bmp = canvas.assets.getBitmap("logo");
        let font = canvas.assets.getBitmap("font");

        let angle = 0;
        let scale = 1;
        if (this.fadingOut) {

            angle = FADE_OUT_ROTATION * this.fadeOutTimer;
            scale += FADE_OUT_SCALE * this.fadeOutTimer * this.fadeOutTimer;
        }

        canvas.transform
            .loadIdentity()
            .translate(canvas.width/2, canvas.height/2)
            .rotate(angle)
            .scale(scale, scale)
            .translate(-canvas.width/2, -canvas.height/2)
            .setView(canvas.width, canvas.height)
            .use();

        canvas.changeShader(ShaderType.NoTexture);    
        canvas.fillRect();
    
        canvas.changeShader(ShaderType.Textured);

        let bounceScaleX = 1;
        let bounceScaleY = 1;
        let t = this.bounceTimer / BOUNCE_TIME;

        if (this.bounceTimer > 0) {

            if (t >= 0.5) {

                bounceScaleY = 1.0 + LOGO_SCALE_MOD * Math.sin((t-0.5)*2 * Math.PI);
                bounceScaleX = 1.0 - LOGO_SCALE_MOD * Math.sin((t-0.5)*2 * Math.PI);
            }
            else {

                bounceScaleY = 1.0 - LOGO_SCALE_MOD * Math.sin(t*2 * Math.PI);
                bounceScaleX = 1.0 + LOGO_SCALE_MOD * Math.sin(t*2 * Math.PI);
            }
        }

        canvas.transform
            .push()
            .translate(canvas.width/2, canvas.height/2 + this.pos)
            .scale(LOGO_BASE_SCALE * bounceScaleX, 
                   LOGO_BASE_SCALE * bounceScaleY)
            .use();

        canvas.setColor();
        canvas.drawBitmap(bmp, -bmp.width/2, -bmp.height/2 - 128);

        canvas.transform.pop();
        canvas.transform.use();

        if (!this.fadingOut && this.phase >= 2) {

            if (this.flickerTimer <= 0 || Math.floor(this.flickerTimer/4) % 2 == 0) {

                canvas.setColor(0.67, 1, 0.33, this.pressAnyKeyAlpha);
                canvas.drawText(font, "PRESS ANY KEY", 
                    canvas.width/2, canvas.height/2 + 128, -26, 0, TextAlign.Center, 
                    1, 1, this.waveTimer, 32, Math.PI*2 / 12);
            }
            
            canvas.setColor(1.0, 1, 0.33);
            canvas.drawText(font, "(c) 2022 Jani Nyk@nen", 
                canvas.width/2, canvas.height - 40, -26, 0, TextAlign.Center, 
                0.5, 0.5);

            canvas.setColor(0.67, 0.67, 0.67);
            canvas.drawText(font, "Version " + VERSION, 
                2, 2, -26, 0, TextAlign.Left, 
                0.5, 0.5);
        }

        canvas.setColor();
    }


    public dispose() : any {
        
        return null;
    }
}