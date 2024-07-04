"use strict";

function _countNewlines(str) {
    let count = 0;
    for (let i = 0; i < str.length; i += 1) {
        if (str[i] === '\n') {
            count += 1;
        }
    }
    return count;
}

function _truncateForRowBuffer(outputElem, rowBufferSize) {
    if (rowBufferSize === null) {
        return;
    }
    let totalNewlines = _countNewlines(outputElem.value);
    if (totalNewlines >= rowBufferSize) {
        let newlineCount = 0;
        let cutAt = 0;
        for (cutAt = 0; cutAt < outputElem.value.length; cutAt += 1) {
            if (outputElem.value[cutAt] === '\n') {
                if (newlineCount === totalNewlines - rowBufferSize) {
                    break;
                } else {
                    newlineCount += 1;
                }
            }
        }
        outputElem.value = outputElem.value.substring(cutAt + 1);
    }
}

function _processBackspaces(input) {
    let stack = [];
    for (let char of input) {
        if (char === '\b') {
            if (stack.length > 0) {
                stack.pop();
            }
        } else {
            stack.push(char);
        }
    }
    return stack.join('');
}

function sleep(delayInMilliseconds) {
    return new Promise(resolve => setTimeout(resolve, delayInMilliseconds));
}

class Tatjs {
    constructor(outputElem = null, inputElem = null, rowBufferSize = 256) {
        this.rowBufferSize = rowBufferSize;
        this.outputElem = outputElem;
        this.inputElem = inputElem;
        if (this.outputElem !== null) {
            this.outputElem.readOnly = true;
        }
        if (this.inputElem !== null) {
            this.inputElem.readOnly = true;
        }
        this.clear();
    }

    print() {
        if (this.outputElem === null) {
            throw "print() has been called but this.outputElem does not exist.";
        }
        let args = Array.prototype.slice.call(arguments);
        let newline = "\n";
        if (args.length !== 1 && args[args.length - 1] === "") {
            newline = "";
        }
        this.outputElem.value = _processBackspaces(this.outputElem.value + args.join("")) + newline;
        _truncateForRowBuffer(this.outputElem, this.rowBufferSize);
        this.outputElem.scrollTop = this.outputElem.scrollHeight;
    }

    input() {
        if (this.inputElem === null) {
            throw "input() has been called but this.inputElem does not exist.";
        }
        this.inputElem.readOnly = false;
        this.inputElem.focus();
        let that = this;
        return new Promise((resolve) => {
            function handleKeypress(e) {
                if (e.key === "Enter") {
                    that.print(e.target.value);
                    resolve(e.target.value);
                    e.target.value = "";
                    that.inputElem.removeEventListener('keypress', handleKeypress);
                    that.inputElem.readOnly = true;
                }
            }
            this.inputElem.addEventListener('keypress', handleKeypress);
        });
    }

    async sleep(delayInMilliseconds) {
        return new Promise(resolve => setTimeout(resolve, delayInMilliseconds));
    }

    clear() {
        if (this.outputElem === null) {
            throw "clear() has been called but this.outputElem does not exist.";
        }
        this.outputElem.value = "";
    }
}

let running = true;
const tat = new Tatjs(document.getElementById('outputTextarea'));

const WIDTH = 200;
const DELAY = 40;
const MOIRE_CHAR = ":";
const EMPTY_CHAR = ' ';
const MIN_CIRCLE_RADIUS = 2;
const MAX_CIRCLE_RADIUS = 8;
const CIRCLE_DENSITY = 0.3;

const SINE_CHAR = '_';
const SINE_WIDTH = 25;
let sine_step = 0.0;
const sine_inc = 0.1;

function normalize_img(img) {
    let normalized = {};
    let minx = Infinity,
        maxx = -Infinity,
        miny = Infinity,
        maxy = -Infinity;

    if (Object.keys(img).length === 0) {
        return {};
    }

    for (let key in img) {
        let [x, y] = key.split(',').map(Number);
        if (x < minx) minx = x;
        if (x > maxx) maxx = x;
        if (y < miny) miny = y;
        if (y > maxy) maxy = y;
    }

    for (let key in img) {
        let [x, y] = key.split(',').map(Number);
        normalized[`${x - minx},${y - miny}`] = img[key];
    }

    return [normalized, maxx - minx + 1, maxy - miny + 1];
}

function move_img(img, movex, movey) {
    let moved_img = {};
    for (let key in img) {
        let [x, y] = key.split(',').map(Number);
        moved_img[`${x + movex},${y + movey}`] = img[key];
    }
    return moved_img;
}

function get_moire(radius, centerx, centery) {
    let switch_val = 3 - (2 * radius);
    let cx = 0;
    let cy = radius;
    let img = {};

    while (cx <= cy) {
        img[`${cx + centerx},${-cy + centery}`] = MOIRE_CHAR;
        img[`${cy + centerx},${-cx + centery}`] = MOIRE_CHAR;
        img[`${cy + centerx},${cx + centery}`] = MOIRE_CHAR;
        img[`${cx + centerx},${cy + centery}`] = MOIRE_CHAR;
        img[`${-cx + centerx},${cy + centery}`] = MOIRE_CHAR;
        img[`${-cy + centerx},${cx + centery}`] = MOIRE_CHAR;
        img[`${-cy + centerx},${-cx + centery}`] = MOIRE_CHAR;
        img[`${-cx + centerx},${-cy + centery}`] = MOIRE_CHAR;
        if (switch_val < 0) {
            switch_val = switch_val + (4 * cx) + 6;
        } else {
            switch_val = switch_val + (4 * (cx - cy)) + 10;
            cy = cy - 1;
        }
        cx = cx + 1;
    }

    return img;
}

let next_columns = [];

async function main() {
    while (running) {
        while (next_columns.length < MAX_CIRCLE_RADIUS * 2 + 1) {
            next_columns.push(Array(WIDTH).fill(EMPTY_CHAR));
        }

        if (Math.random() < CIRCLE_DENSITY) {
            let moire_img = {};
            for (let i = 0; i < MAX_CIRCLE_RADIUS - MIN_CIRCLE_RADIUS; i++) {
                let circle_img = get_moire(Math.floor(Math.random() * (MAX_CIRCLE_RADIUS - MIN_CIRCLE_RADIUS + 1)) + MIN_CIRCLE_RADIUS
