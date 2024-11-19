import { OrthographicCamera, PerspectiveCamera, Scene, Vector3, WebGLRenderer } from "three";
import { ArcballControls, OrbitControls } from "three-stdlib";
import {ViewportGizmo} from 'three-viewport-gizmo';


export type CameraControlType = 'arcball' | 'orbit';


export class CameraControls {


    private _controls: ArcballControls | OrbitControls;

    private _viewportGizmo: ViewportGizmo | null = null;

    private _gizmoEnabled: boolean = false;

    constructor(
        private camera: PerspectiveCamera | OrthographicCamera,
        private renderer: WebGLRenderer,
        private scene: Scene,
        type: CameraControlType = 'orbit',
        viewportGizmoEnabled: boolean = false,
        arcballGizmoEnabled: boolean = false
    ) {
        if (type === 'arcball') {
            this._controls = new ArcballControls(this.camera, this.renderer.domElement, this.scene);
            this._controls.setGizmosVisible(arcballGizmoEnabled);
        } else {
            this._controls = new OrbitControls(this.camera, this.renderer.domElement);
            this._controls.enableDamping = true;
        }

        this.gizmoEnabled = viewportGizmoEnabled;
    }


    set gizmoEnabled(value: boolean) {
        this._gizmoEnabled = value;
        if (value) {
            this._viewportGizmo = new ViewportGizmo(this.camera, this.renderer);
            this._viewportGizmo.attachControls(this._controls as any);
        } else {
            if (this._viewportGizmo) {
                this._viewportGizmo.dispose();
                this._viewportGizmo = null;
            }
        }
    }

    get gizmoEnabled() {
        return this._gizmoEnabled;
    }

    update() {
        this._controls.update();
        if (this._viewportGizmo) {
            this._viewportGizmo.render();
        }
    }

}