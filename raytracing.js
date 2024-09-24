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



// intersection of a ray with a sphere
function intersectRayWithSphere(rayOrigin, rayDirection, sphere) {
    // Vector from ray origin to sphere center
    const originToCenter = rayOrigin.sub(sphere.center);

    // Coefficients for the quadratic equation
    const a = rayDirection.dot(rayDirection); // a = direction dot direction
    const b = 2 * originToCenter.dot(rayDirection); // b = 2 * (origin - center) dot direction
    const c = originToCenter.dot(originToCenter) - sphere.radius * sphere.radius; // c = (origin - center) dot (origin - center) - radius^2

    // Discriminant of the quadratic equation
    const discriminant = b * b - 4 * a * c;

    // If the discriminant is negative, there's no real intersection
    if (discriminant < 0) {
        return [Infinity, Infinity]; // No intersection
    }

    const t1 = (-b + Math.sqrt(discriminant)) / (2 * a);
    const t2 = (-b - Math.sqrt(discriminant)) / (2 * a);

    return [t1, t2]; //two intersection points
}

// Function to trace a ray and find the closest sphere it intersects
function traceRay(rayOrigin, rayDirection, minT, maxT) {
    let closestIntersection = Infinity;
    let closestSphere = null;

    for (let i = 0; i < spheres.length; i++) {
        const sphere = spheres[i];

        const [t1, t2] = intersectRayWithSphere(rayOrigin, rayDirection, sphere);

        if (t1 < closestIntersection && t1 > minT && t1 < maxT) {
            closestIntersection = t1;
            closestSphere = sphere;
        }

        if (t2 < closestIntersection && t2 > minT && t2 < maxT) {
            closestIntersection = t2;
            closestSphere = sphere;
        }
    }

    // If no sphere was hit, return a default background color (white)
    if (closestSphere == null) {
        return new Color(255, 255, 255); // White background
    }

    // Return the color of the closest sphere hit by the ray
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