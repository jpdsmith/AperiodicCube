import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { State } from './state.js';

const state = State.load();

let showNearSlices = false;
let showDistantSlices = false;

let cubeCache = new Map();
let instanceCounters = new Map();
let dummyObject = new THREE.Object3D();


let scene;

// The camera
const camera = new THREE.PerspectiveCamera(
  15,
  window.innerWidth / window.innerHeight,
  1,
  10000
);
// camera.position.x = -9 * state.boxSize;
// camera.position.y = 9 * state.boxSize;
// camera.position.z = -24 * state.boxSize;
camera.position.x = - 11 * state.boxSize;
camera.position.y = - 11 * state.boxSize;
camera.position.z = - 11 * state.boxSize;

const renderer = new THREE.WebGLRenderer({ antialias: true, logarithmicDepthBuffer: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0xffffff, 1);
renderer.shadowMapEnabled = true;
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);

const render = function() {
  // Render the scene and the camera
  renderer.render(scene, camera);

  controls.update();
  requestAnimationFrame(render);
};


export function slicePlus() {
  state.increaseSlice();
  //showDistantSlices = false;
  drawFibonacciGrid();
}
export function sliceMinus() {
  state.decreaseSlice();
  //showDistantSlices = false;
  drawFibonacciGrid();
}
export function toggleCube() {
  // showDistantSlices = !showDistantSlices;
  showNearSlices = !showNearSlices;
  drawFibonacciGrid();
}
export function updateState(updateFn) {
  updateFn(state);
  drawFibonacciGrid();
}

export function onLoad() {
  drawFibonacciGrid();
  return state.sequence;
}
export function renderSequence(sequence) {
  state.sequence = sequence;
  B = state.getSequence();
  drawFibonacciGrid();
}

export function resize() {
  const width = window.innerWidth;
  const height = window.innerHeight;
  renderer.setSize(width, height);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
}

const J = [1, 0];
let A = [1];
let B = [1];
for (let a = 0; a < 5; a++) {
  A = B.concat(J).concat(A);
  B = A.concat(B);
}

class CubeType {
  static Even = new CubeType('Even', 0xcccccc, () => state.showEven);
  static Odd = new CubeType('Odd', 0xaaaaff, () => state.showOdd);
  static X = new CubeType('X', 0xffff00, () => state.showX);
  static Y = new CubeType('Y', 0xffff00, () => state.showY);
  static Z = new CubeType('Z', 0xffff00, () => state.showZ);
  static UNKNOWN = new CubeType('UNKNOWN', 0x000000, () => false);

  constructor(name, color, visible) {
    this.name = name;
    this.color = color;
    this.visible = visible;
  }

  toString() {
    return `CubeType.${this.name}`;
  }

  color() {
    return this.color;
  }

  isVisible() {
    return this.visible();
  }

  static forCoords(i, j, k) {
    if (B[i] && B[j] && B[k]) {
      return CubeType.Even;
    }
    if (!B[i] && !B[j] && !B[k]) {
      return CubeType.Odd;
    }
    if (B[i] == 0 && B[j] == 1) {
      return CubeType.X;
    }
    if (B[j] == 0 && B[k] == 1) {
      return CubeType.Y;
    }
    if (B[k] == 0 && B[i] == 1) {
      return CubeType.Z;
    }
    return CubeType.UNKNOWN;
  };
}

class FaceType {
  static X = new FaceType('X');
  static Y = new FaceType('Y');
  static Z = new FaceType('Z');
  static CUBE = new FaceType('CUBE');
  static ALL_TYPES = [FaceType.X, FaceType.Y, FaceType.Z];

  constructor(name) {
    this.name = name;
  }

  toString() {
    return `FaceType.${this.name}`;
  }
}

class SliceType {
  static Near = new SliceType('Near', () => state.showNear, [FaceType.CUBE]);
  static LowerDiagonal = new SliceType('LowerDiagonal', () => state.showLowerDiagonal, FaceType.ALL_TYPES);
  static Diagonal = new SliceType('Diagonal', () => state.showDiagonal, FaceType.ALL_TYPES);
  static Distant = new SliceType('Distant', () => state.showFar, [FaceType.CUBE]);

  constructor(name, visible, faces) {
    this.name = name;
    this.visible = visible;
    this.faces = faces;
  }

  toString() {
    return `SliceType.${this.name}`;
  }

  isVisible() {
    return this.visible();
  }

  static forCoords(x, y, z) {
    if (x + y + z < state.slice) {
      return SliceType.Near;
    }
    if (x + y + z == state.slice) {
      const cubeType = CubeType.forCoords(x, y, z);
      if (
        cubeType == CubeType.Even &&
        CubeType.forCoords(x + 1, y, z) == CubeType.Even &&
        CubeType.forCoords(x, y + 1, z) == CubeType.Even &&
        CubeType.forCoords(x, y, z + 1) == CubeType.Even) {
        return SliceType.Near;
      }
      if (cubeType == CubeType.X || cubeType == CubeType.Y || cubeType == CubeType.Z) {
        return SliceType.Near;
      }
      return SliceType.LowerDiagonal;
    }
    if (x + y + z == state.slice + 1) {
      if (
        CubeType.forCoords(x, y, z) == CubeType.Even &&
        CubeType.forCoords(x - 1, y, z) == CubeType.Even &&
        CubeType.forCoords(x, y - 1, z) == CubeType.Even &&
        CubeType.forCoords(x, y, z - 1) == CubeType.Even) {
        return SliceType.Distant;
      }
      return SliceType.Diagonal;
    }
    return SliceType.Distant;
  };
}

let zeroCount = 0;
let oneCount = 0;

const drawCube = function(i, j, k) {
  let sliceType = SliceType.forCoords(i, j, k);
  let cubeType = CubeType.forCoords(i, j, k);
  if (!cubeType.isVisible()) {
    return;
  }
  if (!sliceType.isVisible()) {
    return;
  }
  if (cubeType == CubeType.Even || cubeType == CubeType.Odd) {
    oneCount++;
  } else {
    zeroCount++;
  }
  sliceType.faces.forEach((faceType) => {

    let boxColor = cubeType.color;
    if (((cubeType == CubeType.X && faceType == FaceType.X && k != 0) ||
        (cubeType == CubeType.Y && faceType == FaceType.Y && i != 0) ||
        (cubeType == CubeType.Z && faceType == FaceType.Z && j != 0))
    ) {
      boxColor = 0x000000;  // Black
      console.log("val= (" + i + ", " + j + ", " + k + ")");
    } else if (sliceType == SliceType.Diagonal && (
      cubeType == CubeType.X && faceType != FaceType.X ||
      cubeType == CubeType.Y && faceType != FaceType.Y  ||
      cubeType == CubeType.Z && faceType != FaceType.Z)) {
      boxColor = 0xff0000;  // Red
    } else if ((sliceType == SliceType.Diagonal || sliceType == SliceType.LowerDiagonal ) && cubeType == CubeType.Even) {
      boxColor = 0xffffff;  // White
    }

  const cacheKey = boxColor + cubeType.toString() + faceType.toString();
  let cube = cubeCache.get(cacheKey);
  if (!cube) {
    const materialRegular = new THREE.MeshLambertMaterial({
      color: boxColor,
      side: THREE.DoubleSide
    });
    let boxGeometry = (faceType == FaceType.CUBE) ? new THREE.BoxGeometry(0.98, 0.98, 0.98) : new THREE.PlaneGeometry(1, 1);
    cube = {
      // The geometry: the shape & size of the object
      geometry: boxGeometry,
      // The material: the appearance (color, texture) of the object
      material: materialRegular
    };
    cube.mesh = new THREE.InstancedMesh(cube.geometry, cube.material, Math.pow(state.boxSize, 3) / 2);

    instanceCounters.set(cacheKey, 0);
    cubeCache.set(cacheKey, cube);
    scene.add(cube.mesh);
  }
  dummyObject.position.set(i, j, k);
  dummyObject.rotation.set(0, 0, 0);
  if (!state.showXyzAsCubes) {
    const sign = (sliceType == SliceType.LowerDiagonal) ? -1 : 1;
    if (faceType == FaceType.X) {
      dummyObject.position.z -= sign * 0.49;
    }
    if (faceType == FaceType.Y) {
      dummyObject.rotation.y = Math.PI / 2;
      dummyObject.position.x -= sign * 0.49;
    }
    if (faceType == FaceType.Z) {
      dummyObject.rotation.x = Math.PI / 2;
      dummyObject.position.y -= sign * 0.49;
    }
  }
  dummyObject.updateMatrix();
  const counter = instanceCounters.get(cacheKey);
  instanceCounters.set(cacheKey, counter + 1);
  cube.mesh.setMatrixAt(counter, dummyObject.matrix);


});
};


const maybeCleanPreviousScene = function() {
  if (!scene) {
    return;
  }
  scene.clear();
  for (let child of scene.children) {
    scene.remove(child);
  }
  for (let [key, cube] of cubeCache) {
    cube.mesh.count = 0;
    cube.mesh.instanceMatrix.needsUpdate = true;
    cube.mesh.dispose();
    cube.geometry.dispose();
    if (cube.material instanceof Array) {
      for (let material of cube.material) {
        material.dispose();
      }
    } else {
      cube.material.dispose();
    }
  }
  dummyObject = new THREE.Object3D();
  cubeCache = new Map();
  instanceCounters = new Map();
  renderer.renderLists.dispose();

}

const drawFibonacciGrid = function() {
  maybeCleanPreviousScene();
  state.save();
  scene = new THREE.Scene();

  console.log("Slice: " + state.slice);
  // Clear the scene

  oneCount = 0;
  zeroCount = 0;
  for (let i = 0; i < state.boxSize; i++) {
    for (let j = 0; j < state.boxSize; j++) {
      for (let k = 0; k < state.boxSize; k++) {
        drawCube(i, j, k);
      }
    }
  }
  console.log("Zeros " + zeroCount);
  console.log("Ones " + oneCount);
  for (let [key, cube] of cubeCache) {
    cube.mesh.count = instanceCounters.get(key);
    cube.mesh.instanceMatrix.needsUpdate = true;
    cube.mesh.material.needsUpdate = true;
  }

  scene.add(new THREE.AmbientLight(0xffffff));
  const frontLight = new THREE.DirectionalLight(0xffffff, 1, 10000);
  frontLight.position.set(-1, -1.5, -1.8);
  scene.add(frontLight);
  const rearLight = new THREE.DirectionalLight(0xffffff, 1, 10000);
  rearLight.position.set(1, 0.5, 1.8);
  scene.add(rearLight);

  render();
};

///