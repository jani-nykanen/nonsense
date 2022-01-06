import { Canvas, TextAlign } from "./canvas.js";
import { CoreEvent } from "./core.js";
import { negMod } from "./math.js";
import { State } from "./types.js";



export class MenuButton {


    private text : string;
    private callback : (event : CoreEvent) => void;


    constructor(text : string, callback : (event : CoreEvent) => void) {

        this.text = text;
        this.callback = callback;
    }


    public getText = () : string => this.text;
    public evaluateCallback = (event : CoreEvent) => this.callback(event);


    public clone() : MenuButton {

        return new MenuButton(this.text, this.callback);
    }


    public changeText(newText : string) {

        this.text = newText;
    }
}


export class Menu {


    private buttons : Array<MenuButton>;

    private cursorPos : number;
    private active : boolean;


    constructor(buttons : Array<MenuButton>) {

        this.buttons = (new Array<MenuButton> (buttons.length))
            .fill(null)
            .map((b, i) => buttons[i].clone());

        // this.maxLength = Math.max(
        //    ...this.buttons.map(b => b.getText().length));

        this.cursorPos = 0;
        this.active = false;
    }


    public activate(cursorPos = -1) {

        if (cursorPos >= 0)
            this.cursorPos = cursorPos % this.buttons.length;

        this.active = true;
    }


    public update(event : CoreEvent) {

        if (!this.active) return;

        let oldPos = this.cursorPos;

        if (event.input.upPress()) {

            -- this.cursorPos;
        }
        else if (event.input.downPress()) {

            ++ this.cursorPos;
        }

        if (oldPos != this.cursorPos) {

            this.cursorPos = negMod(this.cursorPos, this.buttons.length);

            event.audio.playSample(event.assets.getSample("choose"), 0.70);
        }

        let activeButton = this.buttons[this.cursorPos];
        
        if (event.input.getAction("select") == State.Pressed ||
            event.input.getAction("start") == State.Pressed) {

            event.audio.playSample(event.assets.getSample("select"), 0.50);    
            activeButton.evaluateCallback(event);
        }
    }


    public draw(canvas : Canvas, x : number, y : number,
        xoff = -26, yoff = 64, fontScale = 1) {

        const ACTIVE_SCALE = 1.25;

        if (!this.active) return;

        let font = canvas.assets.getBitmap("font");

        let h = (this.buttons.length * yoff);

        let dx = canvas.width/2 + x;
        let dy = canvas.height/2 - h / 2 + y;

        let scale : number;

        for (let i = 0; i < this.buttons.length; ++ i) {

            if (i == this.cursorPos) {

                canvas.setColor(1, 1, 0.33);
                scale = ACTIVE_SCALE;
            }
            else {

                canvas.setColor();
                scale = 1;
            }

            canvas.drawText(font, this.buttons[i].getText(), 
                dx, dy + i * yoff, xoff, 0, TextAlign.Center,
                scale, scale);
        } 
        canvas.setColor();
    }


    public isActive = () : boolean => this.active;


    public changeButtonText(index : number, text : string) {

        this.buttons[index].changeText(text);
    }
}
