import {Vertex, Vertex4} from './vertexUtils';

export class MatrixQuadratic {
    constructor(public data: number[][]) {
    }

    static identity(): MatrixQuadratic {
        return new MatrixQuadratic([
            [1, 0, 0, 0],
            [0, 1, 0, 0],
            [0, 0, 1, 0],
            [0, 0, 0, 1],
        ]);
    }
}

export function makeOYRotationMatrix(degrees: number): MatrixQuadratic {
    const cos = Math.cos((degrees * Math.PI) / 180.0);
    const sin = Math.sin((degrees * Math.PI) / 180.0);

    return new MatrixQuadratic([
        [cos, 0, -sin, 0],
        [0, 1, 0, 0],
        [sin, 0, cos, 0],
        [0, 0, 0, 1],
    ]);
}

export function makeTranslationMatrix(translation: Vertex): MatrixQuadratic {
    return new MatrixQuadratic([
        [1, 0, 0, translation.x],
        [0, 1, 0, translation.y],
        [0, 0, 1, translation.z],
        [0, 0, 0, 1],
    ]);
}

export function makeScalingMatrix(scale: number): MatrixQuadratic {
    return new MatrixQuadratic([
        [scale, 0, 0, 0],
        [0, scale, 0, 0],
        [0, 0, scale, 0],
        [0, 0, 0, 1],
    ]);
}

export function multiplyMV(mat4x4: MatrixQuadratic, vec4: Vertex4): Vertex4 {
    const result = [0, 0, 0, 0];
    const vec = [vec4.x, vec4.y, vec4.z, vec4.w];

    for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
            result[i] += mat4x4.data[i][j] * vec[j];
        }
    }

    return new Vertex4(result[0], result[1], result[2], result[3]);
}

export function multiplyMM4(matA: MatrixQuadratic, matB: MatrixQuadratic): MatrixQuadratic {
    const result = new MatrixQuadratic([
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
    ]);

    for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
            for (let k = 0; k < 4; k++) {
                result.data[i][j] += matA.data[i][k] * matB.data[k][j];
            }
        }
    }

    return result;
}

export function transposed(mat: MatrixQuadratic): MatrixQuadratic {
    const result = new MatrixQuadratic([
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
    ]);

    for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
            result.data[i][j] = mat.data[j][i];
        }
    }
    return result;
}
