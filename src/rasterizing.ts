import {Color, PutPixel} from "./raytracing";

class Point {
    x: number;
    y: number;

    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }
}

const canvas = document.getElementById("canvasRasterizer") as HTMLCanvasElement;
const ctx = canvas.getContext("2d");


function drawLine(p0: Point, p1: Point, color: Color, canvasImage: ImageData) {
    if (!canvasImage) {
        return;
    }
    let point0 = p0;
    let point1 = p1;
    const dx = p1.x - p0.x;
    const dy = p1.y - p0.y;

    if (Math.abs(dx) > Math.abs(dy)) {
        //line is more horizontal
        if (p0.x > p1.x) {

            point0 = p1;
            point1 = p0;
        }
        const ys = interpolate(point0.x, point0.y, point1.x, point1.y);
        for (let x = point0.x; x <= point1.x; x++) {
            PutPixel(x, ys[x - point0.x | 0], color, canvasImage);
        }

    } else {

        if (dy < 0) {
            point0 = p1;
            point1 = p0;
        }

        const xs = interpolate(point0.y, point0.x, point1.y, point1.x);


        for (let y = point0.y; y <= point1.y; y++) {
            PutPixel(xs[y - point0.y | 0], y, color, canvasImage);

        }

    }

}

function drawWireframeTriangle(p0: Point, p1: Point, p2: Point, color: Color, image: ImageData) {
    drawLine(p0, p1, color, image);
    drawLine(p1, p2, color, image);
    drawLine(p2, p0, color, image);


}

function interpolate(i0: number, d0: number, i1: number, d1: number): number[] {

    if (i0 === i1) {
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


    if (!ctx) return;
    const rasterizedImage = ctx.getImageData(0, 0, canvas.width, canvas.height);

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // drawLine(new Point(-200, -100), new Point(240, 120), new Color(0, 0, 0), rasterizedImage);
    // drawLine(new Point(-50, -200), new Point(60, 240), new Color(0, 0, 0), rasterizedImage);

    drawWireframeTriangle(new Point(-200, -250), new Point(200, 50), new Point(20, 250), new Color(0, 0, 0), rasterizedImage)
    ctx.putImageData(rasterizedImage, 0, 0);

}