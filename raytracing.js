let canvas = document.getElementById("canvas");
let canvasPlane = canvas.getContext("2d");
let canvasImage = canvasPlane.getImageData(0, 0, canvas.width, canvas.height);

function Color(r, g, b) {
    return {r, g, b};
}

function PutPixel(x, y, color) {
    x = canvas.width/2 + x;
    y = canvas.height/2 - y - 1;

    if (x < 0 || x >= canvas.width || y < 0 || y >= canvas.height) {
        return;
    }

    let offset = 4*(x + canvasImage.width*y);
    canvasImage.data[offset++] = color.r;
    canvasImage.data[offset++] = color.g;
    canvasImage.data[offset++] = color.b;
    canvasImage.data[offset++] = 255; //not transparent
}


function Vector(x, y, z) {
    return {
        x, y, z,
        dot: function(vec) { return this.x*vec.x + this.y*vec.y + this.z*vec.z; },
        sub: function(vec) { return new Vector(this.x - vec.x, this.y - vec.y, this.z - vec.z); }
    }
}


function Sphere(center, radius, color) {
    return {center, radius, color};
}

const viewportSize = 1;
const cameraPosition = new Vector(0, 0, 0);
const spheres = [
    new Sphere(new Vector(0, -3, 4), 2, new Color(255, 0, 0)),
    new Sphere(new Vector(-2, 0, 4), 1, new Color(0, 255, 0)),
    new Sphere(new Vector(2, 0, 4), 1, new Color(0, 0, 255)),
];



function calculateDiscriminant(a, b, c) {
    return b * b - 4 * a * c;
}

function solveQuadratic(a, b, discriminant) {
    const sqrtDiscriminant = Math.sqrt(discriminant);
    const root1 = (-b + sqrtDiscriminant) / (2 * a);
    const root2 = (-b - sqrtDiscriminant) / (2 * a);
    return [root1, root2];
}

// intersection of a ray with a sphere
function intersectRayWithSphere(rayOrigin, rayDirection, sphere) {
    // Compute vector from ray origin to sphere center
    const originToCenter = rayOrigin.sub(sphere.center);

    // Calculate quadratic coefficients (a, b, and c)
    const a = rayDirection.dot(rayDirection);  // a = direction dot direction
    const b = 2 * originToCenter.dot(rayDirection); // b = 2 * (origin - center) dot direction
    const c = originToCenter.dot(originToCenter) - Math.pow(sphere.radius, 2); // c = (origin - center) dot (origin - center) - radius^2

    const discriminant = calculateDiscriminant(a, b, c);

    if (discriminant < 0) {
        return [Infinity, Infinity]; // No intersection
    }

    // find intersection points
    return solveQuadratic(a, b, discriminant);
}

// trace  ray and determine the closest intersecting sphere
function traceRay(rayOrigin, rayDirection, minT, maxT) {
    let closestIntersectionDistance = Infinity; // Track the smallest t - the closest intersection
    let closestSphere = null; // Track the sphere closest to the ray

    spheres.forEach(sphere => {
        // Get the two possible intersection points (t1, t2) for the current sphere
        const [t1, t2] = intersectRayWithSphere(rayOrigin, rayDirection, sphere);

        // Update the closest intersection if t1 is valid and closer
        if (t1 > minT && t1 < maxT && t1 < closestIntersectionDistance) {
            closestIntersectionDistance = t1;
            closestSphere = sphere;
        }

        // Update the closest intersection if t2 is valid and closer
        if (t2 > minT && t2 < maxT && t2 < closestIntersectionDistance) {
            closestIntersectionDistance = t2;
            closestSphere = sphere;
        }
    });

    // If no sphere was intersected, return a default background color (white)
    if (!closestSphere) {
        return new Color(255, 255, 255);
    }

    // Return the color of the closest intersected sphere
    return closestSphere.color;
}




for (let x = -canvas.width/2; x < canvas.width/2; x++) {
    for (let y = -canvas.height/2; y < canvas.height/2; y++) {
        let direction = new Vector(
            x * viewportSize / canvas.width,
            y * viewportSize / canvas.height,
            1);
        let color = traceRay(cameraPosition, direction, 1, Infinity);
        PutPixel(x, y, color);
    }
}

canvasPlane.putImageData(canvasImage, 0, 0);