import { PointCloudOctree, Potree } from '@pnext/three-loader';
import CameraControls from 'camera-controls';
import {Clock, Color, CubeTexture, OrthographicCamera, PerspectiveCamera, Scene, Texture, WebGLRenderer, AxesHelper} from 'three';
import { Measurement } from './measurement';

export type CameraType = 'perspective' | 'orthographic';

export class PointCloudScene {

    private scene: Scene;

    private pointClouds: PointCloudOctree[];;

    private potree: Potree;

    private _camera: PerspectiveCamera | OrthographicCamera;

    private renderer: WebGLRenderer;

    private clock: Clock;

    private _cameraControls: CameraControls;

    private _measurementTool: Measurement;

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

        this.clock = new Clock();

        this.pointClouds = [];
        this.potree = new Potree('v2');

        if (camera === 'perspective') {
            this._camera = new PerspectiveCamera(75, this.width / this.height, 0.1, 1000);
        } else {
            this._camera = new OrthographicCamera(-1, 1, 1, -1, 0.1, 1000);
        }
        this._camera.position.z = 5;
        this._cameraControls = new CameraControls(this._camera, this.renderer.domElement);

        this._measurementTool = new Measurement(this.scene, this._camera, this.renderer, this.pointClouds);

        this.renderer.setAnimationLoop(this.animate.bind(this));

        this.scene.add(new AxesHelper());
    }


    animate() {
        const delta = this.clock.getDelta();
        this._cameraControls.update(delta);
        this.potree.updatePointClouds(this.pointClouds, this._camera, this.renderer);
        this.renderer.render(this.scene, this._camera);
    }

    async loadPointCloud(fullUrl: string): Promise<PointCloudOctree> {
        const pointCloud = await this.potree.loadPointCloud(
            'metadata.json', 
            (url: string) => `${fullUrl}/${url}` 
        );
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

    updateCamera(cameraConfig: any) {
        if (cameraConfig.type === 'perspective') {
            this._camera = new PerspectiveCamera(
                cameraConfig.fov,
                this.width / this.height, 
                0.1, 
                1000
            );
        } else {
            this._camera = new OrthographicCamera();
        }
        this._cameraControls = new CameraControls(this._camera, this.renderer.domElement);

        this._measurementTool = new Measurement(this.scene, this._camera, this.renderer, this.pointClouds);

        this.camera.up.set(
            cameraConfig.up[0],
            cameraConfig.up[1],
            cameraConfig.up[2]
        );
        this.cameraControls.updateCameraUp();
        this._cameraControls.setLookAt(
            cameraConfig.position[0],
            cameraConfig.position[1],
            cameraConfig.position[2],
            cameraConfig.look_at[0],
            cameraConfig.look_at[1],
            cameraConfig.look_at[2],
        )
    }

}