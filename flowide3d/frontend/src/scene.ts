import { PointCloudOctree, Potree } from '@pnext/three-loader';
import {Clock, Color, CubeTexture, OrthographicCamera, PerspectiveCamera, Scene, Texture, WebGLRenderer, Object3D, AxesHelper, Vector3} from 'three';
import { Measurement, MeasurementTool } from './measurement';
import {CameraControls, CameraControlType} from './CameraControls'
import { GridBox } from './GridBox';

export type CameraType = 'perspective' | 'orthographic';


export interface CameraConfig {
    fov?: number;
    type: CameraType;
    up: [number, number, number];
    position: [number, number, number];
    look_at: [number, number, number];
    camera_control_type: CameraControlType;
    viewport_gizmo: boolean;
    arcball_gizmo: boolean;
}

export class PointCloudScene {
  
    private scene: Scene;

    private pointClouds: PointCloudOctree[];;

    private potree: Potree;

    private _camera: PerspectiveCamera | OrthographicCamera;

    private renderer: WebGLRenderer;

    private _cameraControls: CameraControls;

    private _measurementTool: MeasurementTool;

    public gridBox: GridBox | null = null;

    constructor(
        private width: number = window.innerWidth, 
        private height: number = window.innerHeight,
        parentDomElement: HTMLElement = document.body,
        camera: CameraType = 'perspective'
    ) {
        this.scene = new Scene();
        this.scene.background = new Color(Color.NAMES.skyblue);

        this.renderer = new WebGLRenderer();
        this.renderer.setSize(this.width, this.height);
        parentDomElement.appendChild(this.renderer.domElement);

        this.pointClouds = [];
        this.potree = new Potree('v2');

        if (camera === 'perspective') {
            this._camera = new PerspectiveCamera(75, this.width / this.height, 0.1, 10000);
        } else {
            this._camera = new OrthographicCamera(-1, 1, 1, -1, 0.1, 10000);
        }
        this._camera.position.z = 5;
        this._cameraControls = new CameraControls(this._camera, this.renderer, this.scene,'orbit',true);

        this._measurementTool = new MeasurementTool(this.scene, this._camera, this.renderer, this.pointClouds);

        this.renderer.setAnimationLoop(this.animate.bind(this));
        
        this._measurementTool.addEventListener('measurement', this.onNewMeasurement.bind(this));

        this.scene.add(new AxesHelper(10));
    }


    animate() {
        this.potree.updatePointClouds(this.pointClouds, this._camera, this.renderer);
        this.renderer.render(this.scene, this._camera);
        this.cameraControls.update();
    }

    async loadPointCloud(fullUrl: string): Promise<PointCloudOctree> {
        const pointCloud = await this.potree.loadPointCloud(
            'metadata.json', 
            (url: string) => `${fullUrl}/${url}` 
        );
        const metadata = await fetch(`${fullUrl}/metadata.json`).then(res => res.json());
        const offset = metadata.offset;
        const scale = metadata.scale;

        const vec = new Vector3(offset[0], offset[1], offset[2]);
        vec.multiply(new Vector3(scale[0], scale[1], scale[2]));
        pointCloud.position.sub(vec);

        this.pointClouds.push(pointCloud);
        this.scene.add(pointCloud);
        return pointCloud;
    }

    resize(width: number, height: number) {
        this.width = width;
        this.height = height;
        this.renderer.setSize(this.width, this.height);
        if (this._camera instanceof PerspectiveCamera) {
            this._camera.aspect = this.width / this.height;
        }
        this._camera.updateProjectionMatrix();
    }

    toggleMeasurement() {
        this._measurementTool.measuring = !this._measurementTool.measuring;
    }

    clearMeasurements() {
        this._measurementTool.clear();

        console.info('Camera position', this.camera.position);
        console.info('Camera look at', this.cameraControls.target);
        console.info('Camera up', this.camera.up);
    }

    setBackground(background: Color | Texture | CubeTexture) {
        this.scene.background = background;
    }

    get camera() {
        return this._camera;
    }

    get cameraControls() {
        return this._cameraControls;
    }

    get measurementTool() {
        return this._measurementTool
    }   

    updateCamera(cameraConfig: CameraConfig) {
        if (cameraConfig.type === 'perspective') {
            this._camera = new PerspectiveCamera(
                cameraConfig.fov ?? 90,
                this.width / this.height, 
                0.1, 
                1000
            );
        } else {
            this._camera = new OrthographicCamera();
        }
        this._cameraControls = new CameraControls(
            this._camera,
            this.renderer,
            this.scene,cameraConfig.camera_control_type,
            cameraConfig.viewport_gizmo,
            cameraConfig.arcball_gizmo
        );
        this.clearMeasurements();
        this._measurementTool = new MeasurementTool(this.scene, this._camera, this.renderer, this.pointClouds);
        this._measurementTool.addEventListener('measurement', this.onNewMeasurement.bind(this));

        this.camera.up.set(
            cameraConfig.up[0],
            cameraConfig.up[1],
            cameraConfig.up[2]
        );
        this.camera.position.set(
            cameraConfig.position[0],
            cameraConfig.position[1],
            cameraConfig.position[2]
        );
        this._cameraControls.target = new Vector3(
            cameraConfig.look_at[0],
            cameraConfig.look_at[1],
            cameraConfig.look_at[2]
        )
    }

    add(...objects: Object3D[]) {
        this.scene.add(...objects);
    }

    private onNewMeasurement(event: {type:string, detail: Measurement}) {
        this.gridBox?.addMeasurement(event.detail);
    }

}