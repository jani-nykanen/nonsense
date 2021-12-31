import { Canvas } from "./canvas.js";
import { CoreEvent } from "./core.js";
import { Enemy, getEnemyType, getEnemyTypeCount } from "./enemy.js";
import { GAME_REGION_HEIGHT, GAME_REGION_WIDTH } from "./game.js";


const TIMER_COUNT = 1;


export class EnemyGenerator {


    private enemies : Array<Enemy>;
    private timers : Array<number>;


    constructor() {

        this.enemies = new Array<Enemy> ();
        this.timers = (new Array<number> (TIMER_COUNT))
            .fill(0)
            .map(_ => 0); // ) this.computeNewTime());
    }


    private computeNewTime() : number {

        const MIN_TIME = 60;
        const MAX_TIME = 180;

        return Math.round(Math.random() * (MAX_TIME - MIN_TIME) + MIN_TIME);
    }


    private generateEnemy() {

        const OFFSET = 128;

        let id = (Math.random() * getEnemyTypeCount()) | 0;
        let enemyType = getEnemyType(id);

        let x = (Math.random() * (GAME_REGION_WIDTH - OFFSET*2)) + OFFSET;
        let y = GAME_REGION_HEIGHT + OFFSET;

        let enemy = <Enemy>(new enemyType.prototype.constructor(x, y));
        this.enemies.push(enemy);
    }


    private updateTimers(event : CoreEvent) {

        for (let i = 0; i < this.timers.length; ++ i) {

            if ((this.timers[i] -= event.step) <= 0) {

                this.generateEnemy();
                this.timers[i] += this.computeNewTime();
            }
        }
    }


    public update(event : CoreEvent) {

        let o : Enemy;
        for (let i = 0; i < this.enemies.length; ++ i) {

            o = this.enemies[i];
            if (!o.doesExist()) {

                this.enemies.splice(i, 1);
                continue;
            }
            o.update(event);
        }
        this.updateTimers(event);
    }


    public draw(canvas : Canvas) {

        for (let o of this.enemies) {

            o.draw(canvas);
        }
    }

} 
