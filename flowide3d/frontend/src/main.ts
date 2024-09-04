import './style.css'
import {Streamlit, RenderData} from 'streamlit-component-lib';
import {
  Scene, PerspectiveCamera, WebGLRenderer, Clock,
  CubeTextureLoader,
  Vector2,
  Vector3,
  Vector4,
  Quaternion,
  Matrix4,
  Spherical,
  Box3,
  Sphere,
  Raycaster,
} from 'three';
import {PointCloudOctree, Potree, } from '@pnext/three-loader';
import CameraControls from 'camera-controls';
import { Measurement } from './measurement';

const subsetOfTHREE = {
  Vector2   : Vector2,
  Vector3   : Vector3,
  Vector4   : Vector4,
  Quaternion: Quaternion,
  Matrix4   : Matrix4,
  Spherical : Spherical,
  Box3      : Box3,
  Sphere    : Sphere,
  Raycaster : Raycaster,
};
CameraControls.install( { THREE: subsetOfTHREE } );

const DEFAULT_HEIGHT = 600;

const loader = new CubeTextureLoader();
loader.setPath('skybox/');

const textureCube = loader.load([
  'px.jpg', 'nx.jpg',
  'py.jpg', 'ny.jpg',
  'pz.jpg', 'nz.jpg'
]);

let pointClouds: PointCloudOctree[] = [];
let potree = new Potree('v2');
let scene = new Scene();
scene.background = textureCube;
let camera = new PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 5;
let renderer = new WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement)

const controls = new CameraControls( camera, renderer.domElement );
const measurementTool = new Measurement(scene, camera, renderer, pointClouds);

renderer.setAnimationLoop(animate);

const clock = new Clock();
function animate() {
    const delta = clock.getDelta();
    controls.update(delta);
    potree?.updatePointClouds(pointClouds, camera, renderer);
    renderer.render(scene, camera);
}

function onRender(event: Event) {
  const data = (event as CustomEvent<RenderData>).detail

  const url = data.args.base_url
  console.log(url)
  if (url)
    loadPointCloud(url);

  Streamlit.setFrameHeight(data.args?.height ?? DEFAULT_HEIGHT);
}


function loadPointCloud(fullUrl: string) {
  potree.loadPointCloud('metadata.json', (url: string) => `${fullUrl}/${url}` ).then((pointCloud) => {
    pointClouds.push(pointCloud);
    scene?.add(pointCloud);
    pointCloud.position.set(0, 0, 0);
    controls.fitToSphere(pointCloud.boundingSphere, true);
});

}


window.addEventListener('resize', () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
});

document.getElementById('fullscreen-button')?.addEventListener('click', () => {
  if (document.fullscreenElement) {
    document.exitFullscreen();
  } else {
    document.documentElement.requestFullscreen();
  }
});

const measureButton = document.getElementById('measure-button');
measureButton?.addEventListener('click', () => {
  measurementTool.measuring = !measurementTool.measuring;

  if (measurementTool.measuring) {
    measureButton.classList.add('active')
  } else {
    measureButton.classList.remove('active')
  }

});

Streamlit.setComponentReady();
Streamlit.setFrameHeight(DEFAULT_HEIGHT);
Streamlit.events.addEventListener(Streamlit.RENDER_EVENT, onRender);