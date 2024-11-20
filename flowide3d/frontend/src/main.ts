import './style.css'
import {Streamlit, RenderData} from 'streamlit-component-lib';
import {
  CubeTextureLoader,
  Vector3,
  Color,
  Box3,
} from 'three';
import {PointCloudScene} from './scene';
import { GridBox } from './GridBox';
import { SimpleBox3D } from './SimpleBox';

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


const toolbar = document.getElementById('toolbar');

function onStreamlitRender(event: Event) {
  const data = (event as CustomEvent<RenderData>).detail

  const url = data.args.base_url
  const cameraConfig = data.args?.camera;
  const background = data.args?.background;
  const showToolbar = data.args?.show_toolbar ?? true;
  const gridBoxType: 'bounding_box' | {min:number[], max:number[]} | null = data.args?.grid_box ?? null;
  const gridBoxConfig = data.args?.grid_box_config;
  const placement = data.args?.placement;

  if (gridBoxType !== 'bounding_box' && gridBoxType !== null) {
    const min = new Vector3(gridBoxType.min[0], gridBoxType.min[1], gridBoxType.min[2]);
    const max = new Vector3(gridBoxType.max[0], gridBoxType.max[1], gridBoxType.max[2]);

    const gridBox = new GridBox(new Box3(min, max), gridBoxConfig.grid_color, gridBoxConfig.line_color, gridBoxConfig.divisions, gridBoxConfig.opacity);
    pointCloudScene.add(gridBox);

    pointCloudScene.gridBox = gridBox;
  }

  if (showToolbar) {
    toolbar?.classList.remove('hidden');
  } else {
    toolbar?.classList.add('hidden');
  }

  if (background) {
    pointCloudScene.setBackground(
      new Color(
        background
      )
    );
  }

  if (cameraConfig) { 
    pointCloudScene.updateCamera(cameraConfig);
  }

  const boxes = data.args.boxes;

  if (boxes) {
    for (const box of boxes) {
      const simpleBox = new SimpleBox3D(
        new Vector3(box.min[0], box.min[1], box.min[2]),
        new Vector3(box.max[0], box.max[1], box.max[2]),
        box.face_color,
        box.line_color,
        box.opacity
      );
      pointCloudScene.add(simpleBox)
    }
  }

  if (url) {
    const pointSize = data.args?.point_size ?? 1;

    pointCloudScene.loadPointCloud(url).then((pointCloud) => {
      pointCloud.material.size = pointSize;
      if (placement === 'origin')
        pointCloud.moveToOrigin();

      if (gridBoxType === 'bounding_box') {
        let box = pointCloud.getBoundingBoxWorld().clone();

        const gridBox = new GridBox(box, gridBoxConfig.grid_color, gridBoxConfig.line_color, gridBoxConfig.divisions, gridBoxConfig.opacity);

        pointCloudScene.add(gridBox);

        pointCloudScene.gridBox = gridBox;

      }

      if (placement === 'grid_box_center' && pointCloudScene.gridBox) {
        const center = pointCloudScene.gridBox?.center()
        pointCloud.moveToOrigin();
        pointCloud.position.add(center);
      }

    });

  }
  pointCloudScene.resize(window.innerWidth, window.innerHeight);
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

document.getElementById('clear-button')?.addEventListener('click', () => {
  pointCloudScene.clearMeasurements();
})

Streamlit.setComponentReady();
Streamlit.setFrameHeight(DEFAULT_HEIGHT);
Streamlit.events.addEventListener(Streamlit.RENDER_EVENT, onStreamlitRender);
