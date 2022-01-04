import { Canvas, ShaderType, TextAlign } from "./canvas.js";
import { CoreEvent, Scene } from "./core.js";
import { GameScene } from "./game.js";
import { TransitionEffectType } from "./transition.js";
import { RGBA } from "./vector.js";


const TEXT = 
`You have won the game, but you
still feel empty: what is the
point of winning if eventually 
we all die?`;

const TEXT_TIME = 60;


export class Ending implements Scene {


    private phase : number;
    private transitionTime : number;
    private textTimer : number;


    constructor(param : any, event : CoreEvent) {

        this.phase = 0;
        this.transitionTime = 0;
        this.textTimer = 0;

        event.transition.activate(false, TransitionEffectType.Fade,
            1.0/240.0, null, new RGBA(1, 1, 1));
    }


    public update(event: CoreEvent) : void {

        if (event.transition.isActive()) {

            this.transitionTime = event.transition.getTime();
            if (!event.transition.isFadingIn()) {

                this.transitionTime = 1.0 - this.transitionTime;
            }
            else {

                this.textTimer = Math.max(0, this.textTimer - event.step);
            }

            return;
        }
        this.transitionTime = 1.0;


        switch (this.phase) {

        case 0:

            this.phase = 1;
            break;

        case 1:

            if ((this.textTimer += event.step) >= TEXT_TIME) {

                this.phase = 2;
                this.textTimer = TEXT_TIME;
            }
            break;

        case 2:

            if (event.input.anyPressed()) {

                this.phase = 3;
                event.transition.activate(true, TransitionEffectType.Fade,
                    1.0/240.0, event => {

                        event.changeScene(GameScene);
                    }, new RGBA(1, 1, 1));
                return;
            }
            break;

        default:
            break;
        }
    }


    public redraw(canvas: Canvas) : void {
        
        const INITIAL_SCALE = 0.1;

        let bmp = canvas.assets.getBitmap("ending");
        let font = canvas.assets.getBitmap("font");

        canvas.transform
            .loadIdentity()
            .setView(canvas.width, canvas.height)
            .use();

        canvas.changeShader(ShaderType.NoTexture);    
        canvas.fillRect();
    
        canvas.changeShader(ShaderType.Textured);

        let scale = INITIAL_SCALE + (1.0 - INITIAL_SCALE) * this.transitionTime;

        canvas.transform
            .push()
            .translate(canvas.width/2, 224 + bmp.height/2)
            .scale(scale, scale)
            .use();

        canvas.setColor();
        canvas.drawBitmap(bmp, -bmp.width/2, -bmp.height/2);

        canvas.transform
            .pop()
            .use();

        if (this.phase > 0) {

            canvas.setColor(1, 1, 1, this.textTimer / TEXT_TIME);
            canvas.drawText(font, TEXT, 32, 32, -26, 0, TextAlign.Left, 0.80, 0.80);
        }

        canvas.setColor();
    }


    public dispose() : any {
        
        return null;
    }
}