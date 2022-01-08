import { Canvas, ShaderType, TextAlign } from "./canvas.js";
import { CoreEvent, Scene } from "./core.js";
import { Intro } from "./intro.js";
import { Menu, MenuButton } from "./menu.js";


const QUESTION =
`Would you like to enable
audio? You cannot change 
this later.

Press Enter to confirm.`;


export class AudioIntro implements Scene {


    private yesNoMenu : Menu;

    private readonly width : number;


    constructor(param : any, event : CoreEvent) {

        const START_SCENE = Intro;
        const INITIAL_SAMPLE_VOLUME = 0.50;
        const INITIAL_MUSIC_VOLUME = 0.80;

        this.yesNoMenu = new Menu(
            [
                new MenuButton("YES",
                    event => {

                        event.audio.toggle(true);
        
                        event.audio.setGlobalMusicVolume(INITIAL_MUSIC_VOLUME);
                        event.audio.setGlobalSampleVolume(INITIAL_SAMPLE_VOLUME);

                        event.changeScene(START_SCENE);
                    }),

                new MenuButton("NO",
                    event => {

                        event.audio.toggle(false);

                        event.changeScene(START_SCENE);
                    })
            ]
        );

        this.yesNoMenu.activate(0);

        this.width = Math.max(...QUESTION.split('\n').map(s => s.length));
    }


    public update(event : CoreEvent) {

        this.yesNoMenu.update(event);
    }


    public redraw(canvas : Canvas) {

        const XOFF = -26;
        const YOFF = 2;

        const Y_POS = 128;

        canvas.transform
            .loadIdentity()
            .setView(canvas.width, canvas.height)
            .use();

        canvas.changeShader(ShaderType.NoTexture);
        canvas.setColor(0.0, 0.33, 0.67);
        canvas.fillRect();

        canvas.changeShader(ShaderType.Textured);
        canvas.setColor();

        canvas.drawText(canvas.assets.getBitmap("font"), 
            QUESTION, 
            canvas.width/2 - this.width*(64 + XOFF) * 0.75 /2, Y_POS, 
            XOFF, YOFF, TextAlign.Left, 0.75, 0.75);

        this.yesNoMenu.draw(canvas, 0, 224, -26, 60, 0.80);
    }


    public dispose = () : any => <any>0;

}
