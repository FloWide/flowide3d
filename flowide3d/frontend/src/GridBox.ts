import {
    Object3D,
    Color,
    Box3,
    Mesh,
    PlaneGeometry,
    Vector3,
    DoubleSide,
    ShaderMaterial,
    Raycaster,
    SphereGeometry,
    MeshBasicMaterial
} from 'three';
import { TextSprite } from './TextSprite';
import { Measurement } from './measurement';
import { Line, BufferGeometry, LineBasicMaterial } from 'three';

const checkerBoard = new ShaderMaterial({
    vertexShader: `
        precision highp float;
        varying vec2 vUv;
        void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,
    fragmentShader: `
        precision highp float;
        varying vec2 vUv;
        void main() {
            vec2 position = floor(vUv * 30.0);
            float color = mod(position.x + position.y, 2.0);
            vec3 grey = mix(vec3(0.2), vec3(0.8), color);
            gl_FragColor = vec4(grey, 0.3);
        }
    `,
    side: DoubleSide,
    transparent: true
});


export interface GridBoxPoints {
    front?: Vector3,
    side?: Vector3,
    bottom?: Vector3
}


export class GridBoxMeasurement extends Object3D {

    private thirdPoints: GridBoxPoints;

    constructor(
        public measurement: Measurement,
        public startGridBoxPoints: GridBoxPoints,
        public endGridBoxPoints: GridBoxPoints
    ) {
        super();
        const objKeys = Object.keys(startGridBoxPoints) as Array<keyof GridBoxPoints>;
        this.thirdPoints = {};
        for(const key of objKeys) {
            const start = startGridBoxPoints[key];
            const end = endGridBoxPoints[key];
            if (start && end) {
                this.thirdPoints[key] = this.getThirdPoint(start, end);
            }
        }
        this.createLines();
    }

    getThirdPoint(start: Vector3, end: Vector3) : Vector3 | undefined {

        if (start.distanceTo(end) < 0.1) {
            return undefined;
        }

        const p1 = new Vector3(start.x, end.y, end.z);
        const p2 = new Vector3(start.x, end.y, start.z);

        let thirdPoint = new Vector3();
        if (p1.distanceTo(start) < 0.01 || p1.distanceTo(end) < 0.01) {
            thirdPoint = p2;
        } else {
            thirdPoint = p1;
        }

        if (thirdPoint.distanceTo(start) < 0.1 || thirdPoint.distanceTo(end) < 0.1) {
            return undefined;
        }
        return thirdPoint;
    }

    private createLines() {
        const material = new LineBasicMaterial({ color: 0xffffff, linewidth: 3});

        const createLine = (start: Vector3, end: Vector3) => {
            const geometry = new BufferGeometry().setFromPoints([start, end]);
            return new Line(geometry, material);
        };

        const objKeys = Object.keys(this.startGridBoxPoints) as Array<keyof GridBoxPoints>;
        for (const key of objKeys) {
            const start = this.startGridBoxPoints[key];
            const end = this.endGridBoxPoints[key];
            const third = this.thirdPoints[key];

            if (start && end) {
                this.measurement.add(createLine(start, end));
                const startMesh = new Mesh(new SphereGeometry(0.05, 32, 32), new MeshBasicMaterial({ color: this.measurement.color, depthTest: false, depthWrite: false}));
                startMesh.position.copy(start);
                this.measurement.add(startMesh);

                const endMesh = new Mesh(new SphereGeometry(0.05, 32, 32), new MeshBasicMaterial({ color: this.measurement.color, depthTest: false, depthWrite: false}));
                endMesh.position.copy(end);
                this.measurement.add(endMesh);

                this.addDistanceText(start, end);

            }

            if (start && end && third) {
                this.measurement.add(createLine(start, third));

                this.addDistanceText(start, third);

                this.measurement.add(createLine(third, end));

                this.addDistanceText(third, end);
            }
        }
    }

    private addDistanceText(start: Vector3, end: Vector3) {
        const distance = start.distanceTo(end);
        const lineCenter = start.clone().add(end).multiplyScalar(0.5);
        const text = new TextSprite(distance.toFixed(2));
        text.position.copy(lineCenter);
        this.measurement.add(text);
    }
}

export class GridBox extends Object3D {

    private bottomPlane: Mesh;

    private sidePlane: Mesh;

    private frontPlane: Mesh;

    private box: Box3;

    // the corner where all planes intersect, used as the origin point
    private zeroCorner: Vector3;

    constructor(box: Box3) {
        super();
        this.box = box;
        const size = new Vector3();
        box.getSize(size);

        const center = new Vector3();
        box.getCenter(center);
    
        const high = box.max;
        const low = box.min;

        // Bottom plane
        this.bottomPlane = this.createPlane(size.x, size.z, new Color(0xff0000));
        this.bottomPlane.position.set(center.x, low.y, center.z);
        this.bottomPlane.rotation.x = Math.PI / 2;
        this.add(this.bottomPlane);

        // Front plane
        this.frontPlane = this.createPlane(size.x, size.y, new Color(0x00ff00));
        this.frontPlane.position.set(center.x, center.y, low.z);
        this.add(this.frontPlane);

        // Side plane
        this.sidePlane = this.createPlane(size.z, size.y, new Color(0x0000ff));
        this.sidePlane.position.set(low.x, center.y, center.z);
        this.sidePlane.rotation.y = Math.PI / 2;
        this.add(this.sidePlane);


        this.zeroCorner = new Vector3(low.x, low.y, low.z);
    }

    private createPlane(width: number, height: number, color: Color): Mesh {
        const geometry = new PlaneGeometry(width, height);
        return new Mesh(geometry, checkerBoard);
    }

    private createTexts(plane: Mesh) {
        const vertices = plane.geometry.attributes.position.array;
        plane.updateMatrixWorld(true);
        for (let i = 0; i < vertices.length; i += 3) {
            const localVertex = new Vector3(vertices[i], vertices[i + 1], vertices[i + 2]);
            const worldVertex = localVertex.applyMatrix4(plane.matrixWorld);
            const xDistance = Math.abs(worldVertex.x - this.zeroCorner.x);
            const yDistance = Math.abs(worldVertex.y - this.zeroCorner.y);
            const zDistance = Math.abs(worldVertex.z - this.zeroCorner.z);
            const text = new TextSprite(`(${xDistance.toFixed(2)}, ${yDistance.toFixed(2)}, ${zDistance.toFixed(2)})`);
            text.position.copy(worldVertex);
            this.add(text);
        }
    }

    worldCoordToBoxCoord(coord: Vector3) : Vector3 {
        return coord.clone().sub(this.zeroCorner);
    }

    boxCoordToWorldCoord(coord: Vector3) : Vector3 {
        return coord.clone().add(this.zeroCorner);
    }


    center() : Vector3 {
        return this.box.getCenter(new Vector3());
    }

    centerBoxCoord() : Vector3 {
        return this.worldCoordToBoxCoord(this.center());
    }

    getIntersectPoints(start: Vector3) : GridBoxPoints {
        const points: GridBoxPoints = {};
        const raycaster = new Raycaster();

        const frontPlaneDirection = new Vector3(0, 0, -1);
        const sidePlaneDirection = new Vector3(-1, 0, 0);
        const bottomPlaneDirection = new Vector3(0, -1, 0);

        raycaster.set(start, frontPlaneDirection);
        const frontPlanePoint = raycaster.intersectObject(this.frontPlane);
        points.front = frontPlanePoint[0]?.point;

        raycaster.set(start, sidePlaneDirection);
        const sidePlanePoint = raycaster.intersectObject(this.sidePlane);
        points.side = sidePlanePoint[0]?.point;

        raycaster.set(start, bottomPlaneDirection);
        const bottomPlanePoint = raycaster.intersectObject(this.bottomPlane);
        points.bottom = bottomPlanePoint[0]?.point;

        return points;

    }

    addMeasurement(measurement: Measurement) {
        if (!measurement.startPoint || !measurement.endPoint) return;

        const startGridBoxPoints = this.getIntersectPoints(measurement.startPoint);
        const endGridBoxPoints = this.getIntersectPoints(measurement.endPoint);
        this.add(new GridBoxMeasurement(measurement, startGridBoxPoints, endGridBoxPoints));
    }

}