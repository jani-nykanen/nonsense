import { Canvas, ShaderType, TextAlign } from "./canvas.js";
import { CoreEvent, Scene } from "./core.js";


export class GameScene implements Scene {


    constructor(param : any, event : CoreEvent) {

        // ...
    }


    public update(event: CoreEvent) : void {
        
        // ...
    }


    public redraw(canvas: Canvas) : void {
        
        canvas.changeShader(ShaderType.NoTexture);

        canvas.transform
            .loadIdentity()
            .setView(canvas.width, canvas.height)
            .use();

        canvas.setColor(0.67, 0.67, 0.67);
        canvas.fillRect();

        canvas.changeShader(ShaderType.Textured);

        canvas.setColor();
        canvas.drawText(canvas.assets.getBitmap("font"),
            "Hello world!", 2, 2, -26, 0, TextAlign.Left);
    }


    public dispose() : any {
        
        return null;
    }
}