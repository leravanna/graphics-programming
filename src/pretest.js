// ======================================================================
//  Low-level canvas access.
// ======================================================================

let canvas = document.getElementById("canvas");
let canvas_context = canvas.getContext("2d");
let canvas_buffer = canvas_context.getImageData(0, 0, canvas.width, canvas.height);

// A color.
function Color(r, g, b) {
    return {
        r, g, b,
        mul: function (n) {
            return new Color(this.r * n, this.g * n, this.b * n);
        },
    };
}

// The PutPixel() function.
function PutPixel(x, y, color) {
    x = canvas.width / 2 + (x | 0);
    y = canvas.height / 2 - (y | 0) - 1;

    if (x < 0 || x >= canvas.width || y < 0 || y >= canvas.height) {
        return;
    }

    let offset = 4 * (x + canvas_buffer.width * y);
    canvas_buffer.data[offset++] = color.r;
    canvas_buffer.data[offset++] = color.g;
    canvas_buffer.data[offset++] = color.b;
    canvas_buffer.data[offset++] = 255; // Alpha = 255 (full opacity)
}


// Displays the contents of the offscreen buffer into the canvas.
function UpdateCanvas() {
    canvas_context.putImageData(canvas_buffer, 0, 0);
}


// ======================================================================
//  Data model.
// ======================================================================

// A Point.
function Pt(x, y, h) {
    return {x, y, h};
}


// A 3D vertex.
function Vertex(x, y, z) {
    return {
        x, y, z,
        add: function (v) {
            return new Vertex(this.x + v.x, this.y + v.y, this.z + v.z);
        },
        mul: function (n) {
            return new Vertex(this.x * n, this.y * n, this.z * n);
        },
        dot: function (vec) {
            return this.x * vec.x + this.y * vec.y + this.z * vec.z;
        },
    }
}


// A 4D vertex (a 3D vertex in homogeneous coordinates).
function Vertex4(arg1, y, z, w) {
    if (y == undefined) {
        return {x: arg1.x, y: arg1.y, z: arg1.z, w: arg1.w | 1};
    } else {
        return {x: arg1, y, z, w};
    }
}


// A 4x4 matrix.
function Mat4x4(data) {
    return {data};
}


const Identity4x4 = new Mat4x4([[1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 1, 0], [0, 0, 0, 1]]);


// A Triangle.
function Triangle(v0, v1, v2, color) {
    return {v0, v1, v2, color};
}


// A Model.
function Model(vertices, triangles, bounds_center, bounds_radius) {
    return {vertices, triangles, bounds_center, bounds_radius};
}


// An Instance.
function Instance(model, position, orientation, scale) {
    this.model = model;
    this.position = position;
    this.orientation = orientation || Identity4x4;
    this.scale = scale || 1.0;
    this.transform = MultiplyMM4(MakeTranslationMatrix(this.position), MultiplyMM4(this.orientation, MakeScalingMatrix(this.scale)));
}


// The Camera.
function Camera(position, orientation) {
    this.position = position;
    this.orientation = orientation;
    this.clipping_planes = [];
}


// A Clipping Plane.
function Plane(normal, distance) {
    return {normal, distance};
}


// ======================================================================
//  Linear algebra and helpers.
// ======================================================================


// Makes a transform matrix for a rotation around the OY axis.
function MakeOYRotationMatrix(degrees) {
    let cos = Math.cos(degrees * Math.PI / 180.0);
    let sin = Math.sin(degrees * Math.PI / 180.0);

    return new Mat4x4([[cos, 0, -sin, 0],
        [0, 1, 0, 0],
        [sin, 0, cos, 0],
        [0, 0, 0, 1]])
}


// Makes a transform matrix for a translation.
function MakeTranslationMatrix(translation) {
    return new Mat4x4([[1, 0, 0, translation.x],
        [0, 1, 0, translation.y],
        [0, 0, 1, translation.z],
        [0, 0, 0, 1]]);
}


// Makes a transform matrix for a scaling.
function MakeScalingMatrix(scale) {
    return new Mat4x4([[scale, 0, 0, 0],
        [0, scale, 0, 0],
        [0, 0, scale, 0],
        [0, 0, 0, 1]]);
}


// Multiplies a 4x4 matrix and a 4D vector.
function MultiplyMV(mat4x4, vec4) {
    let result = [0, 0, 0, 0];
    let vec = [vec4.x, vec4.y, vec4.z, vec4.w];

    for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
            result[i] += mat4x4.data[i][j] * vec[j];
        }
    }

    return new Vertex4(result[0], result[1], result[2], result[3]);
}


// Multiplies two 4x4 matrices.
function MultiplyMM4(matA, matB) {
    let result = new Mat4x4([[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]]);

    for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
            for (let k = 0; k < 4; k++) {
                result.data[i][j] += matA.data[i][k] * matB.data[k][j];
            }
        }
    }

    return result;
}


// Transposes a 4x4 matrix.
function Transposed(mat) {
    let result = new Mat4x4([[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]]);
    for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
            result.data[i][j] = mat.data[j][i];
        }
    }
    return result;
}


// ======================================================================
//  Rasterization code.
// ======================================================================

// Scene setup.
let viewport_size = 1;
let projection_plane_z = 1;


function Interpolate(i0, d0, i1, d1) {
    if (i0 == i1) {
        return [d0];
    }

    let values = [];
    let a = (d1 - d0) / (i1 - i0);
    let d = d0;
    for (let i = i0; i <= i1; i++) {
        values.push(d);
        d += a;
    }

    return values;
}


function DrawLine(p0, p1, color) {
    let dx = p1.x - p0.x, dy = p1.y - p0.y;

    if (Math.abs(dx) > Math.abs(dy)) {
        // The line is horizontal-ish. Make sure it's left to right.
        if (dx < 0) {
            let swap = p0;
            p0 = p1;
            p1 = swap;
        }

        // Compute the Y values and draw.
        let ys = Interpolate(p0.x, p0.y, p1.x, p1.y);
        for (let x = p0.x; x <= p1.x; x++) {
            PutPixel(x, ys[(x - p0.x) | 0], color);
        }
    } else {
        // The line is verical-ish. Make sure it's bottom to top.
        if (dy < 0) {
            let swap = p0;
            p0 = p1;
            p1 = swap;
        }

        // Compute the X values and draw.
        let xs = Interpolate(p0.y, p0.x, p1.y, p1.x);
        for (let y = p0.y; y <= p1.y; y++) {
            PutPixel(xs[(y - p0.y) | 0], y, color);
        }
    }
}


function DrawWireframeTriangle(p0, p1, p2, color) {
    DrawLine(p0, p1, color);
    DrawLine(p1, p2, color);
    DrawLine(p0, p2, color);
}


// Converts 2D viewport coordinates to 2D canvas coordinates.
function ViewportToCanvas(p2d) {
    return new Pt(
        p2d.x * canvas.width / viewport_size,
        p2d.y * canvas.height / viewport_size);
}


function ProjectVertex(v) {
    return ViewportToCanvas(new Pt(
        v.x * projection_plane_z / v.z,
        v.y * projection_plane_z / v.z));
}


function RenderTriangle(triangle, projected) {
    DrawWireframeTriangle(
        projected[triangle.v0],
        projected[triangle.v1],
        projected[triangle.v2],
        triangle.color);
}


// Clips a triangle against a plane. Adds output to triangles and vertices.
function ClipTriangle(triangle, plane, triangles, vertices) {
    let v0 = vertices[triangle.v0];
    let v1 = vertices[triangle.v1];
    let v2 = vertices[triangle.v2];

    let in0 = plane.normal.dot(v0) + plane.distance > 0;
    let in1 = plane.normal.dot(v1) + plane.distance > 0;
    let in2 = plane.normal.dot(v2) + plane.distance > 0;

    let in_count = in0 + in1 + in2;
    if (in_count == 0) {
        // Nothing to do - the triangle is fully clipped out.
    } else if (in_count == 3) {
        // The triangle is fully in front of the plane.
        triangles.push(triangle);
    } else if (in_count == 1) {
        // The triangle has one vertex in. Output is one clipped triangle.
    } else if (in_count == 2) {
        // The triangle has two vertices in. Output is two clipped triangles.
    }
}


function TransformAndClip(clipping_planes, model, scale, transform) {
    // Transform the bounding sphere, and attempt early discard.
    let center = MultiplyMV(transform, new Vertex4(model.bounds_center));
    let radius = model.bounds_radius * scale;
    for (let p = 0; p < clipping_planes.length; p++) {
        let distance = clipping_planes[p].normal.dot(center) + clipping_planes[p].distance;
        if (distance < -radius) {
            return null;
        }
    }

    // Apply modelview transform.
    let vertices = [];
    for (let i = 0; i < model.vertices.length; i++) {
        vertices.push(MultiplyMV(transform, new Vertex4(model.vertices[i])));
    }

    // Clip the entire model against each successive plane.
    let triangles = model.triangles.slice();
    for (let p = 0; p < clipping_planes.length; p++) {
        let new_triangles = []
        for (let i = 0; i < triangles.length; i++) {
            ClipTriangle(triangles[i], clipping_planes[p], new_triangles, vertices);
        }
        triangles = new_triangles;
    }

    return Model(vertices, triangles, center, model.bounds_radius);
}


function RenderModel(model) {
    let projected = [];
    for (let i = 0; i < model.vertices.length; i++) {
        projected.push(ProjectVertex(new Vertex4(model.vertices[i])));
    }
    for (let i = 0; i < model.triangles.length; i++) {
        RenderTriangle(model.triangles[i], projected);
    }
}


function RenderScene(camera, instances) {
    let cameraMatrix = MultiplyMM4(Transposed(camera.orientation), MakeTranslationMatrix(camera.position.mul(-1)));

    for (let i = 0; i < instances.length; i++) {
        let transform = MultiplyMM4(cameraMatrix, instances[i].transform);
        let clipped = TransformAndClip(camera.clipping_planes, instances[i].model, instances[i].scale, transform);
        if (clipped != null) {
            RenderModel(clipped);
        }
    }
}


const vertices = [
    new Vertex(1, 1, 1),
    new Vertex(-1, 1, 1),
    new Vertex(-1, -1, 1),
    new Vertex(1, -1, 1),
    new Vertex(1, 1, -1),
    new Vertex(-1, 1, -1),
    new Vertex(-1, -1, -1),
    new Vertex(1, -1, -1)
];

const RED = new Color(255, 0, 0);
const GREEN = new Color(0, 255, 0);
const BLUE = new Color(0, 0, 255);
const YELLOW = new Color(255, 255, 0);
const PURPLE = new Color(255, 0, 255);
const CYAN = new Color(0, 255, 255);

const triangles = [
    new Triangle(0, 1, 2, RED),
    new Triangle(0, 2, 3, RED),
    new Triangle(4, 0, 3, GREEN),
    new Triangle(4, 3, 7, GREEN),
    new Triangle(5, 4, 7, BLUE),
    new Triangle(5, 7, 6, BLUE),
    new Triangle(1, 5, 6, YELLOW),
    new Triangle(1, 6, 2, YELLOW),
    new Triangle(4, 5, 1, PURPLE),
    new Triangle(4, 1, 0, PURPLE),
    new Triangle(2, 6, 7, CYAN),
    new Triangle(2, 7, 3, CYAN)
];

let cube = new Model(vertices, triangles, new Vertex(0, 0, 0), Math.sqrt(3));

let instances = [
    new Instance(cube, new Vertex(-1.5, 0, 7), Identity4x4, 0.75),
    new Instance(cube, new Vertex(1.25, 2.5, 7.5), MakeOYRotationMatrix(195)),
    new Instance(cube, new Vertex(0, 0, -10), MakeOYRotationMatrix(195)),
];

let camera = new Camera(new Vertex(-3, 1, 2), MakeOYRotationMatrix(-30));

let s2 = 1.0 / Math.sqrt(2);
camera.clipping_planes = [
    new Plane(new Vertex(0, 0, 1), -1), // Near
    new Plane(new Vertex(s2, 0, s2), 0), // Left
    new Plane(new Vertex(-s2, 0, s2), 0), // Right
    new Plane(new Vertex(0, -s2, s2), 0), // Top
    new Plane(new Vertex(0, s2, s2), 0), // Bottom
];

function Render() {
    RenderScene(camera, instances);
    UpdateCanvas();
}

Render();

