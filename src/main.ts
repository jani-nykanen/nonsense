import { Core } from "./core.js";
import { Intro } from "./intro.js";


window.onload = () => (new Core(1024, 768))
    .run(Intro, "assets/index.json",
    event => {

        event.input
            .addAction("fire1", "KeyZ", null, 0)
            .addAction("fire2", "KeyX", null, 1)
            .addAction("select", "Space", null, 0)
            .addAction("start", "Enter", null, 9, 7)
            .addAction("jump", "ArrowUp", null, 0);
    },
    event => {

        event.toggleFilter(event.assets.getBitmap("paperFilter"), 0.0);
    });
