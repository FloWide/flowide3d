import './style.css'
import {Streamlit, RenderData} from 'streamlit-component-lib';
import {
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
  Color,
} from 'three';
import CameraControls from 'camera-controls';
import {PointCloudScene} from './scene';


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


const pointCloudScene = new PointCloudScene();
pointCloudScene.setBackground(textureCube);


function onStreamlitRender(event: Event) {
  const data = (event as CustomEvent<RenderData>).detail

  const url = data.args.base_url
  const cameraConfig = data.args?.camera;
  const background = data.args?.background;

  if (background) {
    pointCloudScene.setBackground(
      new Color(
        background[0],
        background[1],
        background[2]
      )
    );
  }

  if (cameraConfig) { 
    pointCloudScene.updateCamera(cameraConfig);
  }

  if (url) {
    const pointSize = data.args?.point_size ?? 1;

    pointCloudScene.loadPointCloud(url).then((pointCloud) => {
      pointCloud.material.size = pointSize;
      pointCloud.rotation.x = -Math.PI / 2;
      pointCloud.moveToOrigin();
    });

  }

  Streamlit.setFrameHeight(data.args?.height ?? DEFAULT_HEIGHT);
}


window.addEventListener('resize', () => {
  pointCloudScene.resize(window.innerWidth, window.innerHeight);
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
  pointCloudScene.toggleMeasurement();
  if (pointCloudScene.measurementTool.measuring) {
    measureButton?.classList.add('active');
  } else {
    measureButton?.classList.remove('active');
  }
});

Streamlit.setComponentReady();
Streamlit.setFrameHeight(DEFAULT_HEIGHT);
Streamlit.events.addEventListener(Streamlit.RENDER_EVENT, onStreamlitRender);
