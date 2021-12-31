import { Canvas, ShaderType, TextAlign } from "./canvas.js";
import { CoreEvent, Scene } from "./core.js";
import { EnemyGenerator } from "./enemygen.js";


export const GAME_REGION_WIDTH = 1024;
export const GAME_REGION_HEIGHT = 768;


export class GameScene implements Scene {


    private enemyGen : EnemyGenerator;


    constructor(param : any, event : CoreEvent) {

        this.enemyGen = new EnemyGenerator();
    }


    public update(event: CoreEvent) : void {
        
        this.enemyGen.update(event);
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

        this.enemyGen.draw(canvas);

        canvas.transform
            .loadIdentity()
            .use();

        canvas.setColor();
        canvas.drawText(canvas.assets.getBitmap("font"),
            "Hello world!", 2, 2, -26, 0, TextAlign.Left);
    }


    public dispose() : any {
        
        return null;
    }
}