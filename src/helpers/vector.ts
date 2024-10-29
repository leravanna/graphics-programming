export class Vector {
    x: number;
    y: number;
    z: number;

    constructor(x: number, y: number, z: number) {
        this.x = x;
        this.y = y;
        this.z = z;
    }

    dot(vec: Vector): number {
        return this.x * vec.x + this.y * vec.y + this.z * vec.z;
    }

    sub(vec: Vector): Vector {
        return new Vector(this.x - vec.x, this.y - vec.y, this.z - vec.z);
    }

    mul(n: number): Vector {
        return new Vector(this.x * n, this.y * n, this.z * n);
    }

    add(vec: Vector): Vector {
        return new Vector(this.x + vec.x, this.y + vec.y, this.z + vec.z);
    }

    length(): number {
        return Math.sqrt(this.dot(this));
    }
}