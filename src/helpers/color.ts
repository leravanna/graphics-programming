export class Color {
    r: number;
    g: number;
    b: number;

    constructor(r: number, g: number, b: number) {
        this.r = r;
        this.g = g;
        this.b = b;
    }

    mul(intensity: number): Color {
        return new Color(
            Math.min(255, Math.max(0, this.r * intensity)),
            Math.min(255, Math.max(0, this.g * intensity)),
            Math.min(255, Math.max(0, this.b * intensity))
        );
    }

    add(color: Color): Color {
        return new Color(
            Math.min(255, Math.max(0, this.r + color.r)),
            Math.min(255, Math.max(0, this.g + color.g)),
            Math.min(255, Math.max(0, this.b + color.b))
        );
    }
}