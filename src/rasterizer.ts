import {Color} from "./helpers/color";
import {Point} from "./helpers/point";


export class Rasterizer {
    private readonly canvasBuffer: ImageData;
    private context: CanvasRenderingContext2D;
    private readonly canvasWidth: number;
    private readonly canvasHeight: number;

    constructor(context: CanvasRenderingContext2D) {
        const {width, height} = context.canvas;
        this.canvasBuffer = context.getImageData(0, 0, width, height);
        this.canvasWidth = width;
        this.canvasHeight = height;
        this.context = context;
    }

    private toCanvasCoordinates(x: number, y: number): [number, number] {
        const transformedX = this.canvasWidth / 2 + (x | 0);
        const transformedY = this.canvasHeight / 2 - (y | 0) - 1;
        return [transformedX, transformedY];
    }

    private isWithinBounds(x: number, y: number): boolean {
        return x >= 0 && x < this.canvasWidth && y >= 0 && y < this.canvasHeight;
    }

    private putPixel(x: number, y: number, color: Color): void {
        if (!this.canvasBuffer) return;

        const [canvasX, canvasY] = this.toCanvasCoordinates(x, y);
        if (!this.isWithinBounds(canvasX, canvasY)) return;

        const offset = 4 * (canvasX + this.canvasBuffer.width * canvasY);
        this.canvasBuffer.data[offset] = color.r;
        this.canvasBuffer.data[offset + 1] = color.g;
        this.canvasBuffer.data[offset + 2] = color.b;
        this.canvasBuffer.data[offset + 3] = 255;
    }

    private interpolate(i0: number, d0: number, i1: number, d1: number): number[] {
        if (i0 === i1) return [d0];

        const values: number[] = [];
        const a = (d1 - d0) / (i1 - i0);
        let d = d0;
        for (let i = i0; i <= i1; i++) {
            values.push(d);
            d += a;
        }
        return values;
    }

    private drawLine(p0: Point, p1: Point, color: Color): void {
        if (!this.canvasBuffer) return;

        const dx = p1.x - p0.x;
        const dy = p1.y - p0.y;
        let point0 = p0;
        let point1 = p1;

        if (Math.abs(dx) > Math.abs(dy)) {
            if (dx < 0) [point0, point1] = [p1, p0];
            const ys = this.interpolate(point0.x, point0.y, point1.x, point1.y);
            for (let x = point0.x; x <= point1.x; x++) {
                this.putPixel(x, ys[x - point0.x | 0], color);
            }
        } else {
            if (dy < 0) [point0, point1] = [p1, p0];
            const xs = this.interpolate(point0.y, point0.x, point1.y, point1.x);
            for (let y = point0.y; y <= point1.y; y++) {
                this.putPixel(xs[y - point0.y | 0], y, color);
            }
        }
    }

    drawWireframeTriangle(p0: Point, p1: Point, p2: Point, color: Color): void {
        this.drawLine(p0, p1, color);
        this.drawLine(p1, p2, color);
        this.drawLine(p2, p0, color);
    }


    private sortVerticesByY(p0: Point, p1: Point, p2: Point): [Point, Point, Point] {
        const points = [p0, p1, p2].sort((a, b) => a.y - b.y);
        return [points[0], points[1], points[2]];
    }

    private assignEdges(x01: number[], x12: number[], x02: number[], x_left: number[], x_right: number[]): void {
        const mergedShortSides = x01.slice(0, -1).concat(x12);
        const midIndex = Math.floor(x02.length / 2);

        if (x02[midIndex] < mergedShortSides[midIndex]) {
            x_left.push(...x02);
            x_right.push(...mergedShortSides);
        } else {
            x_left.push(...mergedShortSides);
            x_right.push(...x02);
        }
    }

    private fillTriangle(startY: number, endY: number, x_left: number[], x_right: number[], color: Color): void {
        for (let y = startY; y <= endY; y++) {
            for (let x = x_left[y - startY]; x <= x_right[y - startY]; x++) {
                this.putPixel(x, y, color);
            }
        }
    }

    private drawFilledTriangle(p0: Point, p1: Point, p2: Point, color: Color): void {
        [p0, p1, p2] = this.sortVerticesByY(p0, p1, p2);

        const x01 = this.interpolate(p0.y, p0.x, p1.y, p1.x);
        const x12 = this.interpolate(p1.y, p1.x, p2.y, p2.x);
        const x02 = this.interpolate(p0.y, p0.x, p2.y, p2.x);

        const x_left: number[] = [];
        const x_right: number[] = [];
        this.assignEdges(x01, x12, x02, x_left, x_right);

        this.fillTriangle(p0.y, p2.y, x_left, x_right, color);

    }


    render(): void {
        this.context.putImageData(this.canvasBuffer, 0, 0);

    }
}

