export class Vertex {
    constructor(public x: number, public y: number, public z: number) {
    }

    add(v: Vertex): Vertex {
        return new Vertex(this.x + v.x, this.y + v.y, this.z + v.z);
    }

    mul(n: number): Vertex {
        return new Vertex(this.x * n, this.y * n, this.z * n);
    }
}

export class Vertex4 {
    constructor(public x: number, public y: number, public z: number, public w: number) {
    }
}
