import {Vertex} from "./helpers/vertexUtils";
import {Color} from "./helpers/color";
import {
    makeScalingMatrix,
    makeTranslationMatrix,
    MatrixQuadratic,
    multiplyMM4,
} from "./helpers/matrixUtils";

export class Triangle {
    constructor(public v0: number, public v1: number, public v2: number, public color: Color) {
    }
}

export class Model {
    constructor(public vertices: Vertex[], public triangles: Triangle[]) {
    }
}

export class Instance {
    public transform: MatrixQuadratic;

    constructor(
        public model: Model,
        public position: Vertex,
        public orientation: MatrixQuadratic = MatrixQuadratic.identity(),
        public scale: number = 1.0
    ) {
        this.transform = multiplyMM4(
            makeTranslationMatrix(this.position),
            multiplyMM4(this.orientation, makeScalingMatrix(this.scale))
        );
    }
}

export class Camera {
    constructor(public position: Vertex, public orientation: MatrixQuadratic) {
    }
}

export class Scene {
    public instances: Instance[] = [];

    addInstance(instance: Instance) {
        this.instances.push(instance);
    }

}
