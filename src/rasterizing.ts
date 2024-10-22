import {Color} from "./raytracing";

class Point {
    x: number;
    y: number;

    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }
}

let canvas = document.getElementById("canvasRasterizer") as HTMLCanvasElement;
let ctx = canvas.getContext("2d");
let rasterizedImage = ctx?.getImageData(0, 0, canvas.width, canvas.height);


function PutPixel(x: number,
                  y: number,
                  color: Color) {
    if (!rasterizedImage) return;
    x = canvas.width / 2 + (x | 0);
    y = canvas.height / 2 - (y | 0) - 1;

    if (x < 0 || x >= canvas.width || y < 0 || y >= canvas.height) {
        return;
    }
    let offset = 4 * (x + rasterizedImage.width * y);
    rasterizedImage.data[offset++] = color.r;
    rasterizedImage.data[offset++] = color.g;
    rasterizedImage.data[offset++] = color.b;
    rasterizedImage.data[offset++] = 255;
}

function drawLine(p0: Point, p1: Point, color: Color) {
    if (!rasterizedImage) {
        return;
    }
    let point0 = p0;
    let point1 = p1;
    const dx = p1.x - p0.x;
    const dy = p1.y - p0.y;

    if (Math.abs(dx) > Math.abs(dy)) {
        //line is more horizontal
        if (dx < 0) {
            point0 = p1;
            point1 = p0;
        }
        const ys = interpolate(point0.x, point0.y, point1.x, point1.y);
        for (let x = point0.x; x <= point1.x; x++) {
            PutPixel(x, ys[x - point0.x | 0], color);
        }

    } else {

        if (dy < 0) {
            point0 = p1;
            point1 = p0;
        }

        const xs = interpolate(point0.y, point0.x, point1.y, point1.x);


        for (let y = point0.y; y <= point1.y; y++) {
            PutPixel(xs[y - point0.y | 0], y, color);

        }

    }

}

function drawWireframeTriangle(p0: Point, p1: Point, p2: Point, color: Color) {
    drawLine(p0, p1, color);
    drawLine(p1, p2, color);
    drawLine(p2, p0, color);


}

function interpolate(i0: number, d0: number, i1: number, d1: number): number[] {

    if (i0 == i1) {
        return [d0];
    }
    const values: number[] = [];
    const a = (d1 - d0) / (i1 - i0);
    let d = d0;
    for (let i = i0; i <= i1; i++) {
        values.push(d);
        d += a;
    }
    return values;
}


export function renderRasterScene() {


    if (!ctx || !rasterizedImage) return;

    // drawLine(new Point(-200, -100), new Point(240, 120), new Color(0, 0, 0));
    // drawLine(new Point(-50, -200), new Point(60, 240), new Color(0, 0, 0));

    drawWireframeTriangle(new Point(-200, -250), new Point(200, 50), new Point(20, 250), new Color(0, 0, 0))
    ctx.putImageData(rasterizedImage, 0, 0);

}