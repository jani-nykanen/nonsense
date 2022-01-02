import { Canvas } from "./canvas.js";
import { CoreEvent } from "./core.js";
import { Enemy, getEnemyType } from "./enemy.js";
import { GAME_REGION_HEIGHT, GAME_REGION_WIDTH } from "./game.js";
import { Player } from "./player.js";


const TIMER_COUNT = 6;


export class EnemyGenerator {


    private enemies : Array<Enemy>;
    private timers : Array<number>;


    constructor() {

        this.enemies = new Array<Enemy> ();
        this.timers = new Array<number> (TIMER_COUNT);

        this.computeInitialTimes();

        // Create the initial enemy
        this.enemies.push(
            <Enemy>(new (getEnemyType(0)).prototype.constructor(
                GAME_REGION_WIDTH/2, 
                GAME_REGION_HEIGHT+128, 
                1))
        )
    }


    private computeInitialTimes() {

        const INITIAL_TIMES = [180, 180, 240, 15*60, 30*60, 45*60];

        for (let i = 0; i < this.timers.length; ++ i) {

            this.timers[i] = INITIAL_TIMES[i];
        }
    }


    private computeNewTime(index : number) : number {

        const MIN_TIME = [180, 240, 240, 240, 300, 300];
        const MAX_TIME = [360, 480, 480, 480, 600, 600];

        return Math.round(Math.random() * (MAX_TIME[index] - MIN_TIME[index]) + MIN_TIME[index]);
    }


    private createEnemyFromBelow() : Enemy {

        const OFFSET = 128;
        const IDS = [0, 1, 5];

        let id = IDS[(Math.random() * IDS.length) | 0];
        let enemyType = getEnemyType(id);

        let x = (Math.random() * (GAME_REGION_WIDTH - OFFSET*2)) + OFFSET;
        let y = GAME_REGION_HEIGHT + OFFSET;
        let dir = Math.random() < 0.5 ? 1 : -1;

        return <Enemy>(new enemyType.prototype.constructor(x, y, dir));
    }


    private createEnemyFromSides() : Enemy {

        const OFFSET = 128;
        const IDS = [2, 3, 4];

        let dir = Math.random() < 0.5 ? 1 : -1;

        let id = IDS[(Math.random() * IDS.length) | 0];
        let enemyType = getEnemyType(id);

        let y = (Math.random() * (GAME_REGION_HEIGHT - OFFSET*2)) + OFFSET;
        let x = -OFFSET;
        if (dir == -1)
            x += GAME_REGION_WIDTH + 2 * OFFSET; 

        return <Enemy>(new enemyType.prototype.constructor(x, y, dir));
    }


    private createEnemyFromAbove() : Enemy {

        const OFFSET = 128;
        const IDS = [6, 7, 8];

        let id = IDS[(Math.random() * IDS.length) | 0];
        let enemyType = getEnemyType(id);

        let x = (Math.random() * (GAME_REGION_WIDTH - OFFSET*2)) + OFFSET;
        let y = -OFFSET;
        let dir = Math.random() < 0.5 ? 1 : -1;

        return <Enemy>(new enemyType.prototype.constructor(x, y, dir));
    }


    private generateEnemy(timerIndex : number) {

        let enemy = <Enemy> null;

        switch (timerIndex % 3) {

        case 0:
            enemy = this.createEnemyFromBelow();
            break;

        case 1:
            enemy = this.createEnemyFromSides();
            break;

        case 2:
            enemy = this.createEnemyFromAbove();
            break;

        default:
            break;
        }
        if (enemy == null) return;

        this.enemies.push(enemy);
    }


    private updateTimers(event : CoreEvent) {

        for (let i = 0; i < this.timers.length; ++ i) {

            if ((this.timers[i] -= event.step) <= 0) {

                this.generateEnemy(i);
                this.timers[i] += this.computeNewTime(i);
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

        // Draws vines etc.
        for (let o of this.enemies) {

            o.drawSpecial(canvas);
        }

        for (let o of this.enemies) {

            o.draw(canvas);
        }
    }


    public playerCollision(player : Player, event : CoreEvent) : boolean {

        for (let e of this.enemies) {

            if (e.playerCollision(player, event)) {

                return true;
            }
        }
        return false;
    }
} 
