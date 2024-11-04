import { BufferGeometry, Line, LineBasicMaterial, Mesh, MeshBasicMaterial, OrthographicCamera, PerspectiveCamera, Raycaster, Scene, SphereGeometry, Vector2, Vector3, WebGLRenderer } from 'three';
import { PointCloudOctree} from '@pnext/three-loader';
import { TextSprite } from './TextSprite';

export class Measurement {

    private firstPoint: Mesh | null = null;
    private secondPoint: Mesh | null = null;

    private _measuring: boolean = false;

    constructor(private scene: Scene, private camera: PerspectiveCamera | OrthographicCamera, private renderer: WebGLRenderer, private pointClouds: PointCloudOctree[]) {
        renderer.domElement.addEventListener('click', this.onClick.bind(this));
        renderer.domElement.addEventListener('mousemove', this.onDrag.bind(this));
    }

    private onClick(event: MouseEvent) {
        if (!this.measuring) return;
        const point = this.findIntersection(event);
        if (point) {
            // add a sphere to the scene
            const cameraDistance = this.camera.position.distanceTo(point);
            const geometry = new SphereGeometry(0.01 * cameraDistance, 32, 32);
            const material = new MeshBasicMaterial({ color: 0xff0000 });
            const sphere = new Mesh(geometry, material);
            sphere.position.copy(point);
            this.scene.add(sphere);

            if (!this.firstPoint) {
                this.firstPoint = sphere;
            } else if (!this.secondPoint) {
                this.secondPoint = sphere;
            }

            if (this.firstPoint && this.secondPoint) {
                // draw line between first and second point
                const lineGeometry = new BufferGeometry().setFromPoints([this.firstPoint.position, this.secondPoint.position]);
                const lineMaterial = new LineBasicMaterial({ color: 0x00ff00, linewidth: 10 });
                lineMaterial.depthTest = false;
                lineMaterial.depthWrite = false;
                const line = new Line(lineGeometry, lineMaterial);
                this.scene.add(line);
                // draw text with distance on the center of the line
                // Calculate the distance between the two points
                const distance = this.firstPoint.position.distanceTo(this.secondPoint.position);

                const lineCenterPoint = this.firstPoint.position.clone().add(this.secondPoint.position).multiplyScalar(0.5);

                const text = new TextSprite(distance.toFixed(2));
                text.position.copy(lineCenterPoint);
                this.scene.add(text);

                this.firstPoint = null;
                this.secondPoint = null;
            }
        }

    }

    private onDrag(event: MouseEvent) {

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
            this.renderer.domElement.classList.add('crosshair')
        } else {
            this.renderer.domElement.classList.remove('crosshair')
        }
    }

}