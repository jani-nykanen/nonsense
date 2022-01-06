import { Canvas, ShaderType } from "./canvas.js";
import { CoreEvent, Scene } from "./core.js";
import { TitleScreen } from "./titlescreen.js";
import { TransitionEffectType } from "./transition.js";
import { RGBA } from "./vector.js";


const WAIT_TIME = 90;


export class Intro implements Scene {


    private timer :number;


    constructor(param : any, event : CoreEvent) {

        event.transition.activate(false, TransitionEffectType.Fade,
            1.0/30.0, null, new RGBA(1, 1, 1));

        this.timer = 0;
    }


    public update(event: CoreEvent) : void {

        if (event.transition.isActive()) return;

        if (event.input.anyPressed()) {

            this.timer = WAIT_TIME;
        }

        if ((this.timer += event.step) >= WAIT_TIME) {

            event.transition.activate(true, TransitionEffectType.Fade,
                1.0/30.0, event => {

                    event.changeScene(TitleScreen);
                }, new RGBA(1, 1, 1));
        }
    }


    public redraw(canvas: Canvas) : void {
        
        canvas.transform
            .loadIdentity()
            .setView(canvas.width, canvas.height)
            .use();

        canvas.changeShader(ShaderType.NoTexture);    
        canvas.fillRect();
    
        canvas.changeShader(ShaderType.Textured);

        let bmp = canvas.assets.getBitmap("creator");
        canvas.drawBitmap(bmp, canvas.width/2 - bmp.width/2, 
            canvas.height/2 - bmp.height/2);
    }


    public dispose() : any {
        
        return null;
    }
}