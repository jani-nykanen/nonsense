import { Canvas, ShaderType, TextAlign } from "./canvas.js";
import { CoreEvent, Scene } from "./core.js";
import { GameScene } from "./game.js";
import { TransitionEffectType } from "./transition.js";
import { RGBA } from "./vector.js";


export class TitleScreen implements Scene {


    private waveTimer : number;
    private fadingOut : boolean;
    private fadeOutTimer : number;


    constructor(param : any, event : CoreEvent) {

        event.transition.activate(false, TransitionEffectType.Fade,
            1.0/30.0, null, new RGBA(1, 1, 1));

        this.waveTimer = 0.0;

        this.fadingOut = false;
        this.fadeOutTimer = 0;
    }


    public update(event: CoreEvent) : void {

        const WAVE_TIME = 0.15;

        if (event.transition.isActive()) {

            // Good naming here
            if (event.transition.isFadingIn()) {

                this.fadingOut = true;
                this.fadeOutTimer = 1.0 - event.transition.getTime();
            }

            return;
        }
        this.fadingOut = false;
        
        if (event.input.anyPressed()) {

            event.transition.activate(true, TransitionEffectType.Fade,
                1.0/60.0, event => {

                    event.changeScene(GameScene);
                }, new RGBA(1, 1, 1));
        }

        this.waveTimer = (this.waveTimer + WAVE_TIME*event.step) % (Math.PI*2);
    }


    public redraw(canvas: Canvas) : void {
        
        const LOGO_BASE_SCALE = 0.75;
        const FADE_OUT_SCALE = 2.0;
        const FADE_OUT_ROTATION = Math.PI/3;

        let bmp = canvas.assets.getBitmap("logo");
        let font = canvas.assets.getBitmap("font");

        let angle = 0;
        let scale = 1;
        if (this.fadingOut) {

            angle = FADE_OUT_ROTATION * this.fadeOutTimer;
            scale += FADE_OUT_SCALE * this.fadeOutTimer;
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

        canvas.transform
            .push()
            .translate(canvas.width/2, canvas.height/2)
            .scale(LOGO_BASE_SCALE, LOGO_BASE_SCALE)
            .use();

        canvas.setColor();
        canvas.drawBitmap(bmp, -bmp.width/2, -bmp.height/2 - 128);

        canvas.transform.pop();
        canvas.transform.use();

        if (!this.fadingOut) {

            canvas.setColor(0.67, 1, 0.33);
            canvas.drawText(font, "PRESS ANY KEY", 
                canvas.width/2, canvas.height/2 + 128, -26, 0, TextAlign.Center, 
                1, 1, this.waveTimer, 32, Math.PI*2 / 12);

            canvas.setColor(1.0, 1, 0.33);
            canvas.drawText(font, "(c) 2022 Jani Nyk@nen", 
                canvas.width/2, canvas.height - 40, -26, 0, TextAlign.Center, 
                0.5, 0.5);
        }

        canvas.setColor();
    }


    public dispose() : any {
        
        return null;
    }
}