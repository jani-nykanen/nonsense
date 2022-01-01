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


    private drawShadowLayer(canvas : Canvas) {

        const SHADOW_OFFSET_X = 8;
        const SHADOW_OFFSET_Y = 8;

        let bmp = canvas.assets.getBitmap("background");

        canvas.drawBitmap(bmp, 0, 0);

        canvas.setColor(0, 0, 0);
        canvas.transform
            .push()
            .translate(SHADOW_OFFSET_X, SHADOW_OFFSET_Y)
            .use();

        this.enemyGen.draw(canvas);

        canvas.transform.pop();
        canvas.transform.use();

        canvas.setColor(1, 1, 1, 0.67);
        canvas.drawBitmap(bmp, 0, 0);
        canvas.setColor();

        canvas.resetVertexAndFragmentTransforms();
    }


    public redraw(canvas: Canvas) : void {
        
        canvas.changeShader(ShaderType.Textured);

        canvas.transform
            .loadIdentity()
            .setView(canvas.width, canvas.height)
            .use();

        this.drawShadowLayer(canvas);
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