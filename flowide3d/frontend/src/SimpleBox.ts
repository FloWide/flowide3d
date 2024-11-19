import { 
    Object3D,
    Box3,
    BoxGeometry,
    MeshBasicMaterial,
    Mesh,
    Vector3,
    EdgesGeometry,
    LineBasicMaterial,
    LineSegments,
    Color
} from "three";



export class SimpleBox3D extends Object3D {

    private box: Box3;

    private geometry: BoxGeometry;

    private material: MeshBasicMaterial;

    private mesh: Mesh;

    constructor(
        min: Vector3,
        max: Vector3,
        faceColor: string,
        lineColor: string,
        opacity: number,
    ) {
        super();

        this.box = new Box3(min, max);

        const size = new Vector3();
        this.box.getSize(size);
        this.geometry = new BoxGeometry(size.x, size.y, size.z);
        const center = new Vector3();
        this.box.getCenter(center);
        this.geometry.translate(center.x, center.y, center.z);

        const edgesGeometry = new EdgesGeometry(this.geometry);
        const edgesMaterial = new LineBasicMaterial({ color: new Color(lineColor) });
        const edges = new LineSegments(edgesGeometry, edgesMaterial);
        this.add(edges);


        this.material = new MeshBasicMaterial({ color: new Color(faceColor), transparent: true, opacity: opacity });
        this.mesh = new Mesh(this.geometry, this.material);

        this.add(this.mesh);
    }

}