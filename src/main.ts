import { renderScene } from "./raytracing";
import { Sphere, Vector, Color, Light } from "./raytracing";

let spheres = [
  new Sphere(new Vector(0, -1, 3), 1, new Color(255, 0, 0), 500, 0.2),
  new Sphere(new Vector(2, 0, 4), 1, new Color(0, 0, 255), 500, 0.3),
  new Sphere(new Vector(-2, 0, 4), 1, new Color(0, 255, 0), 10, 0.4),
  new Sphere(new Vector(-2, -5001, 0), 5000, new Color(255, 255, 0), 1000, 0.5),
];

let lights = [
  new Light("ambient", 0.2),
  new Light("point", 0.6, new Vector(2, 1, 0)),
  new Light("directional", 0.2, undefined, new Vector(1, 4, 4)),
];

const scene = {
  spheres: spheres,
  lights: lights,
};

function updateSpheresList() {
  const spheresContainer = document.getElementById("spheresContainer")!;
  spheresContainer.innerHTML = "";

  scene.spheres.forEach((sphere, index) => {
    const sphereElement = document.createElement("div");
    sphereElement.innerHTML = `
<div class="hContainer">

      <p><strong>${index + 1}</strong></p>
      <label>X: <input type="number" id="sphere-center-x-${index}" value="${
      sphere.center.x
    }"></label>
      <label>Y: <input type="number" id="sphere-center-y-${index}" value="${
      sphere.center.y
    }"></label>
      <label>Z: <input type="number" id="sphere-center-z-${index}" value="${
      sphere.center.z
    }"></label>
      <label>Radius: <input type="number" id="sphere-radius-${index}" value="${
      sphere.radius
    }"></label>
      <label>R: <input type="number" id="sphere-color-r-${index}" value="${
      sphere.color.r
    }" max="255" min="0"></label>
      <label>G: <input type="number" id="sphere-color-g-${index}" value="${
      sphere.color.g
    }" max="255" min="0"></label>
      <label>B: <input type="number" id="sphere-color-b-${index}" value="${
      sphere.color.b
    }" max="255" min="0"></label>
      <label>Spec: <input type="number" id="sphere-color-s-${index}" value="${
      sphere.specular
    }" max="2000" min="0"></label>     
       <label>Ref: <input type="number" id="sphere-color-ref-${index}" value="${
      sphere.reflective
    }" max="1" min="0" step="0.1"></label>
      <button id="delete-sphere-${index}">X</button>
      </div>
    `;
    spheresContainer.appendChild(sphereElement);

    (
      document.getElementById(`sphere-center-x-${index}`) as HTMLInputElement
    ).addEventListener("input", () => updateSphere(index));
    (
      document.getElementById(`sphere-center-y-${index}`) as HTMLInputElement
    ).addEventListener("input", () => updateSphere(index));
    (
      document.getElementById(`sphere-center-z-${index}`) as HTMLInputElement
    ).addEventListener("input", () => updateSphere(index));
    (
      document.getElementById(`sphere-radius-${index}`) as HTMLInputElement
    ).addEventListener("input", () => updateSphere(index));
    (
      document.getElementById(`sphere-color-r-${index}`) as HTMLInputElement
    ).addEventListener("input", () => updateSphere(index));
    (
      document.getElementById(`sphere-color-g-${index}`) as HTMLInputElement
    ).addEventListener("input", () => updateSphere(index));
    (
      document.getElementById(`sphere-color-b-${index}`) as HTMLInputElement
    ).addEventListener("input", () => updateSphere(index));
    (
      document.getElementById(`sphere-color-s-${index}`) as HTMLInputElement
    ).addEventListener("input", () => updateSphere(index));

    (
      document.getElementById(`delete-sphere-${index}`) as HTMLButtonElement
    ).addEventListener("click", () => {
      deleteSphere(index);
    });
  });
}

function updateLightsList() {
  const lightsContainer = document.getElementById("lightsContainer")!;
  lightsContainer.innerHTML = "";

  scene.lights.forEach((light, index) => {
    const lightElement = document.createElement("div");
    lightElement.innerHTML = `
<div class="hContainer">
      <p><strong>${light.type}</strong></p>
      <label>Int: <input type="number" id="light-intensity-${index}" value="${
      light.intensity
    }" step="0.1"></label>
      <label>X: <input type="number" id="light-position-x-${index}" value="${
      light.position?.x || ""
    }"></label>
      <label>Y: <input type="number" id="light-position-y-${index}" value="${
      light.position?.y || ""
    }"></label>
      <label>Z: <input type="number" id="light-position-z-${index}" value="${
      light.position?.z || ""
    }"></label>
      <button id="delete-light-${index}">X</button></div>
    `;
    lightsContainer.appendChild(lightElement);

    (
      document.getElementById(`light-intensity-${index}`) as HTMLInputElement
    ).addEventListener("input", () => updateLight(index));
    (
      document.getElementById(`light-position-x-${index}`) as HTMLInputElement
    ).addEventListener("input", () => updateLight(index));
    (
      document.getElementById(`light-position-y-${index}`) as HTMLInputElement
    ).addEventListener("input", () => updateLight(index));
    (
      document.getElementById(`light-position-z-${index}`) as HTMLInputElement
    ).addEventListener("input", () => updateLight(index));

    (
      document.getElementById(`delete-light-${index}`) as HTMLButtonElement
    ).addEventListener("click", () => {
      deleteLight(index);
    });
  });
}

document.getElementById("addSphereButton")?.addEventListener("click", () => {
  const x = parseFloat(
    (document.getElementById("newSphereX") as HTMLInputElement).value
  );
  const y = parseFloat(
    (document.getElementById("newSphereY") as HTMLInputElement).value
  );
  const z = parseFloat(
    (document.getElementById("newSphereZ") as HTMLInputElement).value
  );
  const radius = parseFloat(
    (document.getElementById("newSphereRadius") as HTMLInputElement).value
  );
  const r = parseInt(
    (document.getElementById("newSphereR") as HTMLInputElement).value
  );
  const g = parseInt(
    (document.getElementById("newSphereG") as HTMLInputElement).value
  );
  const b = parseInt(
    (document.getElementById("newSphereB") as HTMLInputElement).value
  );
  const specular = parseInt(
    (document.getElementById("newSphereS") as HTMLInputElement).value
  );
  const reflective = parseFloat(
    (document.getElementById("newSphereReflective") as HTMLInputElement).value
  );

  const newSphere = new Sphere(
    new Vector(x, y, z),
    radius,
    new Color(r, g, b),
    specular,
    reflective
  );
  scene.spheres.push(newSphere);
  updateSpheresList();
  renderScene(scene);
});

document.getElementById("addLightButton")?.addEventListener("click", () => {
  const type = (document.getElementById("newLightType") as HTMLSelectElement)
    .value;
  const intensity = parseFloat(
    (document.getElementById("newLightIntensity") as HTMLInputElement).value
  );
  const x = parseFloat(
    (document.getElementById("newLightX") as HTMLInputElement).value
  );
  const y = parseFloat(
    (document.getElementById("newLightY") as HTMLInputElement).value
  );
  const z = parseFloat(
    (document.getElementById("newLightZ") as HTMLInputElement).value
  );

  const newLight = new Light(
    type,
    intensity,
    type !== "ambient" ? new Vector(x, y, z) : undefined,
    type === "point" ? new Vector(x, y, z) : undefined
  );
  scene.lights.push(newLight);
  updateLightsList();
  renderScene(scene);
});

function updateSphere(index: number) {
  const sphere = scene.spheres[index];
  sphere.center.x = parseFloat(
    (document.getElementById(`sphere-center-x-${index}`) as HTMLInputElement)
      .value
  );
  sphere.center.y = parseFloat(
    (document.getElementById(`sphere-center-y-${index}`) as HTMLInputElement)
      .value
  );
  sphere.center.z = parseFloat(
    (document.getElementById(`sphere-center-z-${index}`) as HTMLInputElement)
      .value
  );
  sphere.radius = parseFloat(
    (document.getElementById(`sphere-radius-${index}`) as HTMLInputElement)
      .value
  );
  sphere.color.r = parseInt(
    (document.getElementById(`sphere-color-r-${index}`) as HTMLInputElement)
      .value
  );
  sphere.color.g = parseInt(
    (document.getElementById(`sphere-color-g-${index}`) as HTMLInputElement)
      .value
  );
  sphere.color.b = parseInt(
    (document.getElementById(`sphere-color-b-${index}`) as HTMLInputElement)
      .value
  );
  sphere.specular = parseInt(
    (document.getElementById(`sphere-color-s-${index}`) as HTMLInputElement)
      .value
  );
  sphere.reflective = parseFloat(
    (document.getElementById(`sphere-color-ref-${index}`) as HTMLInputElement)
      .value
  );

  renderScene(scene);
}

function updateLight(index: number) {
  const light = scene.lights[index];
  light.intensity = parseFloat(
    (document.getElementById(`light-intensity-${index}`) as HTMLInputElement)
      .value
  );
  if (light.position) {
    light.position.x = parseFloat(
      (document.getElementById(`light-position-x-${index}`) as HTMLInputElement)
        .value
    );
    light.position.y = parseFloat(
      (document.getElementById(`light-position-y-${index}`) as HTMLInputElement)
        .value
    );
    light.position.z = parseFloat(
      (document.getElementById(`light-position-z-${index}`) as HTMLInputElement)
        .value
    );
  }

  renderScene(scene);
}

function deleteSphere(index: number) {
  scene.spheres.splice(index, 1);
  updateSpheresList();
  renderScene(scene);
}

function deleteLight(index: number) {
  scene.lights.splice(index, 1);
  updateLightsList();
  renderScene(scene);
}

updateSpheresList();
updateLightsList();
renderScene(scene);
