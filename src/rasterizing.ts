import {Rasterizer} from "./rasterizer";
import {Vertex, Vertex4} from "./helpers/vertexUtils";
import {Point} from "./helpers/point";
import {Camera, Instance, Model, Scene, Triangle} from "./scene";
import {
    makeOYRotationMatrix,
    makeTranslationMatrix,
    MatrixQuadratic,
    multiplyMM4,
    multiplyMV,
    transposed
} from "./helpers/matrixUtils";
import {Color} from "./helpers/color";


const canvas = document.getElementById("canvasRasterizer") as HTMLCanvasElement;
const canvasContext = canvas.getContext("2d")!;
const viewportSize = 1;
const projectionPlaneZ = 1;
const rasterizer = new Rasterizer(canvasContext);

function viewportToCanvas(p2d: Point): Point {
    return new Point(
        (p2d.x * canvas.width) / viewportSize,
        (p2d.y * canvas.height) / viewportSize
    );
}

function projectVertex(v: Vertex4): Point {
    return viewportToCanvas(
        new Point((v.x * projectionPlaneZ) / v.z, (v.y * projectionPlaneZ) / v.z)
    );
}

function renderModel(model: Model, transform: MatrixQuadratic, rasterizer: Rasterizer): void {
    const projected: Point[] = [];
    for (const vertex of model.vertices) {
        const vertexH = new Vertex4(vertex.x, vertex.y, vertex.z, 1);
        projected.push(projectVertex(multiplyMV(transform, vertexH)));
    }

    for (const triangle of model.triangles) {
        rasterizer.drawWireframeTriangle(
            projected[triangle.v0],
            projected[triangle.v1],
            projected[triangle.v2],
            triangle.color
        );
    }
}

function renderScene(camera: Camera, cubes: { position: Vertex; orientation: MatrixQuadratic; scale: number; color: Color }[], rasterizer: Rasterizer) {
    const scene = new Scene();
    for (const {position, orientation, scale} of cubes) {
        const cube = createCubeModel();
        scene.addInstance(new Instance(cube, position, orientation, scale));
    }

    const cameraMatrix = multiplyMM4(
        transposed(camera.orientation),
        makeTranslationMatrix(camera.position.mul(-1))
    );

    for (const instance of scene.instances) {
        const transform = multiplyMM4(cameraMatrix, instance.transform);
        renderModel(instance.model, transform, rasterizer);
    }
    rasterizer.render();
}

function createCubeModel(): Model {
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

    return new Model(vertices, triangles);
}

const camera = new Camera(new Vertex(-4, 1, -1), makeOYRotationMatrix(-25));
const cubes = [
    {
        position: new Vertex(-1.5, 0, 7),
        orientation: MatrixQuadratic.identity(),
        scale: 0.75,
        color: new Color(255, 0, 0)
    },
    {
        position: new Vertex(1.25, 2.5, 7.5),
        orientation: makeOYRotationMatrix(195),
        scale: 0.75,
        color: new Color(0, 255, 0)
    },
    {position: new Vertex(0, -2, 6.5), orientation: makeOYRotationMatrix(90), scale: 0.5, color: new Color(0, 0, 255)},
];


export function renderRasterScene() {
    renderScene(camera, cubes, rasterizer);
}
