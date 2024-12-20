import {Color} from "./helpers/color";
import {Vector} from "./helpers/vector";


export class Sphere {
    center: Vector;
    radius: number;
    color: Color;
    specular: number;
    reflective: number;

    constructor(
        center: Vector,
        radius: number,
        color: Color,
        specular: number,
        reflective: number
    ) {
        this.center = center;
        this.radius = radius;
        this.color = color;
        this.specular = specular;
        this.reflective = reflective;
    }
}

const lightTypes = {
    ambient: "ambient",
    point: "point",
    directional: "directional",
};

export class Light {
    type: string;
    intensity: number;
    position?: Vector;
    direction?: Vector;

    constructor(
        type: string,
        intensity: number,
        position?: Vector,
        direction?: Vector
    ) {
        this.type = type;
        this.intensity = intensity;
        this.position = position;
        this.direction = direction;
    }
}

interface Scene {
    spheres: Sphere[];
    lights: Light[];
}

function calculateDiscriminant(a: number, b: number, c: number): number {
    return b * b - 4 * a * c;
}

function solveQuadratic(
    a: number,
    b: number,
    discriminant: number
): [number, number] {
    const sqrtDiscriminant = Math.sqrt(discriminant);
    const root1 = (-b + sqrtDiscriminant) / (2 * a);
    const root2 = (-b - sqrtDiscriminant) / (2 * a);
    return [root1, root2];
}

const canvas = document.getElementById("canvas") as HTMLCanvasElement;
const ctx = canvas.getContext("2d");

export function renderScene(scene: Scene) {
    if (!ctx) return;

    const canvasImage = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const viewportSize = 1;
    const cameraPosition = new Vector(0, 0, 0);

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let x = -canvas.width / 2; x < canvas.width / 2; x++) {
        for (let y = -canvas.height / 2; y < canvas.height / 2; y++) {
            const direction = new Vector(
                (x * viewportSize) / canvas.width,
                (y * viewportSize) / canvas.height,
                1
            );
            const color = traceRay(
                cameraPosition,
                direction,
                1,
                Infinity,
                scene.spheres,
                scene.lights
            );
            PutPixel(x, y, color, canvasImage);
        }
    }

    ctx.putImageData(canvasImage, 0, 0);
}

export function PutPixel(
    x: number,
    y: number,
    color: Color,
    canvasImage: ImageData
): void {
    x = canvas.width / 2 + x;
    y = canvas.height / 2 - y - 1;

    if (x < 0 || x >= canvas.width || y < 0 || y >= canvas.height) {
        return;
    }

    const offset = 4 * (x + canvasImage.width * y);
    canvasImage.data[offset] = color.r;
    canvasImage.data[offset + 1] = color.g;
    canvasImage.data[offset + 2] = color.b;
    canvasImage.data[offset + 3] = 255;
}

function closestIntersection(
    rayOrigin: Vector,
    rayDirection: Vector,
    minT: number,
    maxT: number,
    spheres: Sphere[]
): [number, Sphere | null] {
    let closestIntersectionDistance = Infinity;
    let closestSphere: Sphere | null = null;

    spheres.forEach((sphere) => {
        const [t1, t2] = intersectRayWithSphere(rayOrigin, rayDirection, sphere);

        if (t1 > minT && t1 < maxT && t1 < closestIntersectionDistance) {
            closestIntersectionDistance = t1;
            closestSphere = sphere;
        }

        if (t2 > minT && t2 < maxT && t2 < closestIntersectionDistance) {
            closestIntersectionDistance = t2;
            closestSphere = sphere;
        }
    });
    return [closestIntersectionDistance, closestSphere];
}

function traceRay(
    rayOrigin: Vector,
    rayDirection: Vector,
    minT: number,
    maxT: number,
    spheres: Sphere[],
    lights: Light[],
    recursionDepth = 1
): Color {
    const [closestIntersectionDistance, closestSphere] = closestIntersection(
        rayOrigin,
        rayDirection,
        minT,
        maxT,
        spheres
    );

    if (!closestSphere) {
        return new Color(0, 0, 0);
    }

    const point = rayOrigin.add(rayDirection.mul(closestIntersectionDistance));
    let normal = point.sub((closestSphere as Sphere).center);
    normal = normal.mul(1.0 / normal.length());

    const view = rayDirection.mul(-1);
    const computedLight = computeLighting(
        point,
        normal,
        lights,
        (closestSphere as Sphere).specular,
        view,
        spheres
    );

    const localColor = (closestSphere as Sphere).color.mul(computedLight);
    const reflection = (closestSphere as Sphere).reflective;
    if (recursionDepth <= 0 || reflection <= 0) {
        return localColor;
    }

    const reflectedRay = reflectRay(rayDirection.mul(-1), normal);
    const reflectedColor = traceRay(
        point,
        reflectedRay,
        0.001,
        Infinity,
        spheres,
        lights,
        recursionDepth - 1
    );
    return localColor.mul(1 - reflection).add(reflectedColor.mul(reflection));

    //(closestSphere as Sphere).color.mul(computedLight);
}

function intersectRayWithSphere(
    rayOrigin: Vector,
    rayDirection: Vector,
    sphere: Sphere
): [number, number] {
    const originToCenter = rayOrigin.sub(sphere.center);

    const a = rayDirection.dot(rayDirection);
    const b = 2 * originToCenter.dot(rayDirection);
    const c = originToCenter.dot(originToCenter) - Math.pow(sphere.radius, 2);

    const discriminant = calculateDiscriminant(a, b, c);

    if (discriminant < 0) {
        return [Infinity, Infinity];
    }

    return solveQuadratic(a, b, discriminant);
}

function reflectRay(ray: Vector, normal: Vector): Vector {
    return normal.mul(2 * normal.dot(ray)).sub(ray);
}

function computeLighting(
    point: Vector,
    normal: Vector,
    sceneLights: Light[],
    specular: number,
    viewVector: Vector,
    spheres: Sphere[]
): number {
    let intensity = 0;

    sceneLights.forEach((light) => {
        if (light.type === lightTypes.ambient) {
            intensity += light.intensity;
        } else {
            let vectorL: Vector;
            let maxT = 0;
            if (light.type === lightTypes.point && light.position) {
                vectorL = light.position.sub(point);
                maxT = 1;
            } else if (light.direction) {
                vectorL = light.direction;
                maxT = Infinity;
            } else {
                return;
            }

            const [, shadowSphere] = closestIntersection(
                point,
                vectorL,
                0.001,
                maxT,
                spheres
            );
            if (!shadowSphere) {
                //diffuse light
                let normalDotL = normal.dot(vectorL);
                if (normalDotL > 0) {
                    intensity +=
                        (light.intensity * normalDotL) /
                        (normal.length() * vectorL.length());
                }

                //specular light
                if (specular > 0) {
                    const vectorR = reflectRay(vectorL, normal);
                    const vectorRDotV = vectorR.dot(viewVector);
                    if (vectorRDotV > 0) {
                        intensity +=
                            light.intensity *
                            Math.pow(
                                vectorRDotV / (vectorR.length() * viewVector.length()),
                                specular
                            );
                    }
                }
            }
        }
    });
    return intensity;
}
