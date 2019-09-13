import './styles/main.css'
import {Level, loadAssets, Player} from "./js/fw";

window.onload = () => {

    let canvas = document.querySelector("canvas");
    let context = canvas.getContext("2d");
    context.imageSmoothingEnabled = false;

    function resizeEventHandler() {
        const w = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
        const h = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
        for (let i = 10; i > 0; i--) {
            if (canvas.width * i < w && canvas.height * i < h) {
                canvas.style.width = "" + canvas.width * i + "px";
                canvas.style.height = "" + canvas.height * i + "px";
                return;
            }
        }
        canvas.style.width = "" + canvas.width + "px";
        canvas.style.height = "" + canvas.height + "px";
    }

    resizeEventHandler();
    window.addEventListener("resize", resizeEventHandler);

    let Key = {
        _pressed: {},

        LEFT: 37,
        UP: 38,
        RIGHT: 39,
        DOWN: 40,

        isDown: function (keyCode) {
            return this._pressed[keyCode];
        },

        onKeydown: function (event) {
            this._pressed[event.keyCode] = true;
        },

        onKeyup: function (event) {
            delete this._pressed[event.keyCode];
        }
    };

    window.addEventListener('keyup', function (event) {
        Key.onKeyup(event);
    }, false);

    window.addEventListener('keydown', function (event) {
        Key.onKeydown(event);
    }, false);

    let hist = [];

    function checkHistory() {
        while (hist.length < 10) {
            let r = Math.random().toString(36).substring(7);
            hist.push("#" + r);
            history.pushState(null, null, "#" + r);
        }
    }

    loadAssets(() => {
        document.getElementById("loading").remove();
        let currLevel = 0;

        let char = new Player(() => {
            currLevel++;
            world = new Level(char, currLevel);
        });
        let world = new Level(char, currLevel);

        checkHistory();

        window.addEventListener('keydown', (event) => {
            if (event.code === "Backspace")
                world.back();
        }, false);

        window.addEventListener("hashchange", () => {
            while (hist.length && hist.pop() !== location.hash) {
                world.back();
            }
            checkHistory();
        }, false);

        function loop() {
            window.requestAnimationFrame(loop);
            world.update(performance.now(), Key);
            context.clearRect(0, 0, canvas.width, canvas.height);
            world.draw(context);
        }
        loop();
    });
};