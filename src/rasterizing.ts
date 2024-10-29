import {Color} from "./raytracing";

class Point {
    constructor(public x: number, public y: number) {
    }
}

class Rasterizer {
    private canvas: HTMLCanvasElement;
    private readonly ctx: CanvasRenderingContext2D | null;
    private readonly rasterizedImage: ImageData | null;

    constructor(canvasId: string) {
        this.canvas = document.getElementById(canvasId) as HTMLCanvasElement;
        this.ctx = this.canvas.getContext("2d");
        this.rasterizedImage = this.ctx?.getImageData(0, 0, this.canvas.width, this.canvas.height) ?? null;
    }

    private toCanvasCoordinates(x: number, y: number): [number, number] {
        const transformedX = this.canvas.width / 2 + (x | 0);
        const transformedY = this.canvas.height / 2 - (y | 0) - 1;
        return [transformedX, transformedY];
    }

    private isWithinBounds(x: number, y: number): boolean {
        return x >= 0 && x < this.canvas.width && y >= 0 && y < this.canvas.height;
    }

    private putPixel(x: number, y: number, color: Color): void {
        if (!this.rasterizedImage) return;

        const [canvasX, canvasY] = this.toCanvasCoordinates(x, y);
        if (!this.isWithinBounds(canvasX, canvasY)) return;

        const offset = 4 * (canvasX + this.rasterizedImage.width * canvasY);
        this.rasterizedImage.data[offset] = color.r;
        this.rasterizedImage.data[offset + 1] = color.g;
        this.rasterizedImage.data[offset + 2] = color.b;
        this.rasterizedImage.data[offset + 3] = 255;
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
        if (!this.rasterizedImage) return;

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

    private drawWireframeTriangle(p0: Point, p1: Point, p2: Point, color: Color): void {
        this.drawLine(p0, p1, color);
        this.drawLine(p1, p2, color);
        this.drawLine(p2, p0, color);
    }


    private sortVerticesByY(p0: Point, p1: Point, p2: Point): [Point, Point, Point] {
        const points = [p0, p1, p2].sort((a, b) => a.y - b.y);
        return [points[0], points[1], points[2]];
    }

    private assignEdges(x01: number[], x12: number[], x02: number[], x_left: number[], x_right: number[]): void {
        // Remove the last element of x01 to avoid duplication in the merged array
        const mergedShortSides = x01.slice(0, -1).concat(x12);
        const midIndex = Math.floor(x02.length / 2);

        // Determine which merged side is left or right based on midpoint comparison
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

    public render(): void {
        if (!this.ctx || !this.rasterizedImage) return;

        this.drawWireframeTriangle(
            new Point(-200, -250),
            new Point(200, 50),
            new Point(20, 250),
            new Color(0, 0, 0)
        );
        this.drawFilledTriangle(
            new Point(-200, -250),
            new Point(200, 50),
            new Point(20, 250),
            new Color(255, 0, 0)
        );

        this.ctx.putImageData(this.rasterizedImage, 0, 0);
    }
}

export function renderRasterScene(): void {
    const rasterizer = new Rasterizer("canvasRasterizer");
    rasterizer.render();
}
