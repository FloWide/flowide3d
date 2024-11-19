import { BufferGeometry, Color, Line,EventDispatcher, LineBasicMaterial, Mesh, MeshBasicMaterial, Object3D, OrthographicCamera, PerspectiveCamera, Raycaster, Scene, SphereGeometry, Vector2, Vector3, WebGLRenderer } from 'three';
import { PointCloudOctree} from '@pnext/three-loader';
import { TextSprite } from './TextSprite';

const DISTINCT_COLORS: Color[] = [
    new Color(0xff0000), // Red
    new Color(0x00ff00), // Green
    new Color(0x0000ff), // Blue
    new Color(0xffff00), // Yellow
    new Color(0xff00ff), // Magenta
    new Color(0x00ffff), // Cyan
    new Color(0x800000), // Maroon
    new Color(0x808000), // Olive
    new Color(0x008000), // Dark Green
    new Color(0x800080), // Purple
    new Color(0x008080), // Teal
    new Color(0x000080), // Navy
    new Color(0xffa500), // Orange
    new Color(0x8b4513), // Saddle Brown
    new Color(0x2e8b57), // Sea Green
    new Color(0x4682b4), // Steel Blue
    new Color(0xd2691e), // Chocolate
    new Color(0x9acd32), // Yellow Green
    new Color(0x6495ed), // Cornflower Blue
    new Color(0xdc143c)  // Crimson
]

let COLOR_INDEX = 0;

export class Measurement extends Object3D {

    public startPoint: Vector3 | null = null;
    public endPoint: Vector3 | null = null;

    private startMesh: Mesh | null = null;

    private endMesh: Mesh | null = null;

    public color: Color;

    private coordsText: TextSprite | null = null;

    constructor(
    ) {
        super()
        this.color = DISTINCT_COLORS[COLOR_INDEX];
        COLOR_INDEX = (COLOR_INDEX + 1) % DISTINCT_COLORS.length;
    }

    setStartPoint(point: Vector3) {
        this.startPoint = point;
        this.startMesh = new Mesh(new SphereGeometry(0.05, 32, 32), new MeshBasicMaterial({ color: this.color, depthTest: false, depthWrite: false}));
        this.startMesh.position.copy(point);
        this.add(this.startMesh);

        this.coordsText = new TextSprite(`(${point.x.toFixed(2)}, ${point.y.toFixed(2)}, ${point.z.toFixed(2)})`);
        this.coordsText.position.copy(point);
        this.coordsText.setBackgroundColor({ r: 255, g: 255, b: 255, a: 0.5 });
        this.add(this.coordsText);

    }

    setEndPoint(point: Vector3) {
        this.endPoint = point;
        this.endMesh = new Mesh(new SphereGeometry(0.05, 32, 32), new MeshBasicMaterial({ color: this.color, depthTest: false, depthWrite: false}));
        this.endMesh.position.copy(point);
        this.add(this.endMesh);
        this.createLine();

        if (this.coordsText) {
            this.remove(this.coordsText);
            this.coordsText = null;
        }
    }

    private createLine() {
        if (this.startPoint && this.endPoint) {
            const lineGeometry = new BufferGeometry().setFromPoints([this.startPoint, this.endPoint]);
            const lineMaterial = new LineBasicMaterial({ color: 0x00ff00, linewidth: 10, depthTest: false, depthWrite: false });
            const line = new Line(lineGeometry, lineMaterial);
            this.add(line);

            const distance = this.startPoint.distanceTo(this.endPoint);
            const lineCenter = this.startPoint.clone().add(this.endPoint).multiplyScalar(0.5);
            const text = new TextSprite(distance.toFixed(2));
            text.position.copy(lineCenter);
            this.add(text);

        }
    }

}


interface MeasurementEventMap {
    measurement: { detail: Measurement };
}

export class MeasurementTool extends EventDispatcher<MeasurementEventMap> {

    private _measuring: boolean = false;

    private ghostPoint: Mesh;

    private ghostLine: Line;

    private currentMeasurement: Measurement | null = null;

    public measurements: Measurement[] = [];

    constructor(
        private scene: Scene,
        private camera: PerspectiveCamera | OrthographicCamera,
        private renderer: WebGLRenderer,
        private pointClouds: PointCloudOctree[]
    ) {
        super();
        renderer.domElement.addEventListener('click', this.onClick.bind(this));
        renderer.domElement.addEventListener('mousemove', this.onDrag.bind(this));
        renderer.domElement.addEventListener('contextmenu', this.onRightClick.bind(this));

        this.ghostPoint = new Mesh(new SphereGeometry(0.05, 32, 32), new MeshBasicMaterial({ color: 0xff0000, depthTest: false, depthWrite: false, transparent: true, opacity:0.5 }));
        this.ghostLine = new Line(new BufferGeometry(), new LineBasicMaterial({ color: 0xff0000, linewidth: 10, depthTest: false, depthWrite: false, transparent: true, opacity:0.5 }));
    }

    private onClick(event: MouseEvent) {
        if (!this.measuring) return;
        const point = this.findIntersection(event);
        if (!this.currentMeasurement) {
            this.currentMeasurement = new Measurement();
            this.scene.add(this.currentMeasurement);
        }
        if (point) {
            
            if (this.currentMeasurement.startPoint) {
                this.currentMeasurement.setEndPoint(point);
                this.measurements.push(this.currentMeasurement);
                this.dispatchEvent({ type: 'measurement', detail: this.currentMeasurement });
                this.currentMeasurement = null;
                this.ghostLine.geometry.setFromPoints([]);
            } else {
                this.currentMeasurement.setStartPoint(point);
            }
        }
    }

    private onRightClick(event: MouseEvent) {
        event.stopPropagation()
        event.preventDefault();

        if (this.currentMeasurement) {
            this.scene.remove(this.currentMeasurement);
            this.currentMeasurement = null;
            this.ghostLine.geometry.setFromPoints([]);
        }
    }

    private onDrag(event: MouseEvent) {
        if (!this.measuring) return;
        const point = this.findIntersection(event);

        if (point) {
            this.ghostPoint.position.copy(point);
            if (this.currentMeasurement && this.currentMeasurement.startPoint) {
                this.ghostLine.geometry.setFromPoints([this.currentMeasurement.startPoint, point]);
            }
        }

    }

    private findIntersection(event: MouseEvent) : Vector3 | null  {
        const mouse = new Vector2();
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        const raycaster = new Raycaster();
        raycaster.setFromCamera(mouse, this.camera);
        const points = [];
        for(const pointCloud of this.pointClouds) {
            const point = pointCloud.pick(this.renderer, this.camera, raycaster.ray);
            if (point && point.position) {
                points.push(point.position);
            }
        }
        // get closest point
        if (points.length > 0) {
            points.sort((a, b) => a.distanceTo(this.camera.position) - b.distanceTo(this.camera.position));
            return points[0];
        }
        return null
    }

    get measuring() {
        return this._measuring
    }

    set measuring(value: boolean) {
        this._measuring = value;
        if (this._measuring) {
            this.scene.add(this.ghostPoint);
            this.scene.add(this.ghostLine);
            this.renderer.domElement.classList.add('crosshair')
        } else {
            this.scene.remove(this.ghostPoint);
            this.scene.remove(this.ghostLine);
            this.renderer.domElement.classList.remove('crosshair')
        }
    }

    clear() {
        for (const measurement of this.measurements) {
            this.scene.remove(measurement);
        }
        this.measurements = [];
    }

}