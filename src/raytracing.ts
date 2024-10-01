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
}

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

export class Sphere {
    center: Vector;
    radius: number;
    color: Color;
    specular: number;

    constructor(center: Vector, radius: number, color: Color, specular: number) {
        this.center = center;
        this.radius = radius;
        this.color = color;
        this.specular = specular;
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

    constructor(type: string, intensity: number, position?: Vector, direction?: Vector) {
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

function solveQuadratic(a: number, b: number, discriminant: number): [number, number] {
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
            const color = traceRay(cameraPosition, direction, 1, Infinity, scene.spheres, scene.lights);
            PutPixel(x, y, color, canvasImage);
        }
    }

    ctx.putImageData(canvasImage, 0, 0);
}

function PutPixel(x: number, y: number, color: Color, canvasImage: ImageData): void {
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

function traceRay(rayOrigin: Vector, rayDirection: Vector, minT: number, maxT: number, spheres: Sphere[], lights: Light[]): Color {
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

    if (!closestSphere) {
        return new Color(255, 255, 255);
    }

    const point = rayOrigin.add(rayDirection.mul(closestIntersectionDistance));
    let normal = point.sub((closestSphere as Sphere).center);
    normal = normal.mul(1.0 / normal.length());

    const view = rayDirection.mul(-1);
    const computedLight = computeLighting(point, normal, lights, (closestSphere as Sphere).specular, view);
    return (closestSphere as Sphere).color.mul(computedLight);
}

function intersectRayWithSphere(rayOrigin: Vector, rayDirection: Vector, sphere: Sphere): [number, number] {
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

function computeLighting(point: Vector, normal: Vector, sceneLights: Light[], specular: number, viewVector: Vector): number {
    let intensity = 0;
    sceneLights.forEach((light) => {
        if (light.type === lightTypes.ambient) {
            intensity += light.intensity;
        } else {
            let vectorL: Vector;

            if (light.type === lightTypes.point && light.position) {
                vectorL = light.position.sub(point);
            } else if (light.direction) {
                vectorL = light.direction;
            } else {
                return;
            }

            //diffuse light
            let normalDotL = normal.dot(vectorL);
            if (normalDotL > 0) {
                intensity += (light.intensity * normalDotL) / (normal.length() * vectorL.length());
            }

            //specular light
            if (specular > 0){
                const vectorR = normal.mul(2*normalDotL).sub(vectorL);
                const vectorRDotV = vectorR.dot(viewVector);
                if (vectorRDotV > 0) {
                    intensity += light.intensity * Math.pow(vectorRDotV / (vectorR.length() * viewVector.length()), specular);
                }

            }

        }
    });
    return intensity;
}
