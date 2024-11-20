import os
import streamlit.components.v1 as components
import open3d as o3d
import laspy
import tempfile
import numpy as np
import subprocess
import matplotlib.pyplot as plt
import shutil
from typing import List, Tuple, TypedDict, TypeAlias, Literal


_RELEASE = True

COMPONENT_NAME = "flowide3d"

if not _RELEASE:
    _component_func = components.declare_component(
        COMPONENT_NAME,
        url="http://localhost:5173",
    )
else:
    parent_dir = os.path.dirname(os.path.abspath(__file__))
    build_dir = os.path.join(parent_dir, "frontend/dist")
    _component_func = components.declare_component(COMPONENT_NAME, path=build_dir)



Vec3: TypeAlias = Tuple[float, float, float]

class CameraConfig(TypedDict):
    position: Vec3
    look_at: Vec3
    fov: float
    type: Literal['perspective'] | Literal['orthographic']
    camera_control_type: Literal['orbit'] | Literal['arcball']
    viewport_gizmo: bool
    arcball_gizmo: bool

    @staticmethod
    def default() -> 'CameraConfig':
        return {
            "position": (0, 5, 0),
            "look_at": (0, 0, 0),
            "up":(0, 0, 1),
            "fov": 60,
            "type": "perspective",
            "camera_control_type": "orbit",
            "viewport_gizmo": True,
            "arcball_gizmo": False,
        }


class Box3D(TypedDict):
    min: Vec3
    max: Vec3

class SimpleBox3D(Box3D):
    min: Vec3
    max: Vec3

    face_color: str
    line_color: str
    opacity: float

    @staticmethod
    def default() -> 'SimpleBox3D':
        return {
            "min": (-1, -1, -1),
            "max": (1, 1, 1),
            "face_color": "#ffffff",
            "line_color": "#000000",
            "opacity": 0.5,
        }

class GridBoxConfig(TypedDict):
    grid_color: str
    line_color: str
    opacity: float
    divisions: int


    @staticmethod
    def default() -> 'GridBoxConfig':
        return {
            "grid_color": "#aaaaaa",
            "line_color": "#000000",
            "opacity": 0.3,
            "divisions": 10,
        }


def pointcloud3d(
    base_url: str,
    point_size: int = 1,
    camera: CameraConfig = None,
    background: str | None = None,
    boxes: List[SimpleBox3D] | None = None,
    show_toolbar: bool = True,
    grid_box: Box3D | Literal['bounding_box'] | None = 'bounding_box',
    grid_box_config: GridBoxConfig | None = None,
    placement: Literal['origin','grid_box_center', 'none'] = 'none',
    height: int | None =None,
    key: str | None = None
):
    if camera is None:
        camera = CameraConfig.default()

    if boxes is None:
        boxes = []

    if grid_box_config is None:
        grid_box_config = GridBoxConfig.default()

    component_value = _component_func(
        base_url=base_url, 
        point_size=point_size,
        camera=camera,
        background=background,
        boxes=boxes,
        show_toolbar=show_toolbar,
        grid_box=grid_box,
        grid_box_config=grid_box_config,
        placement=placement,
        key=key, 
        height=height
    )

    return component_value



def to_potree(pointcloud: o3d.geometry.PointCloud, output_dir: str):
    with tempfile.NamedTemporaryFile(suffix=".las") as f:
        las_file = to_las_file(pointcloud, f.name)
        if os.path.exists(output_dir):
            shutil.rmtree(output_dir)
        result = subprocess.run(["/usr/bin/PotreeConverter", las_file, "-o", output_dir,], check=True)
        if result.returncode != 0:
            raise Exception("PotreeConverter failed! Check logs for more information.")

def to_las_file(pointcloud: o3d.geometry.PointCloud, output_file: str):
    header = laspy.LasHeader(point_format=3, version="1.2")
    las = laspy.LasData(header)
    header.scales = [0.01, 0.01, 0.01]
    header.offsets = [0, 0, 0]

    centroid = pointcloud.get_center()
    pointcloud.translate(-centroid)

    points = np.asarray(pointcloud.points)

    las.x = points[:, 0]
    las.y = points[:, 1]
    las.z = points[:, 2]

    if not pointcloud.has_colors():
        # height map as colors
        min_z = points[:, 2].min()
        max_z = points[:, 2].max()
        colors = (points[:, 2] - min_z) / (max_z - min_z)
        colormap = plt.get_cmap("viridis")
        pointcloud.colors = o3d.utility.Vector3dVector(colormap(colors)[:, :3])

    colors = np.asarray(pointcloud.colors) if pointcloud.has_colors() else None
    
    las.red = (colors[:, 0] * 65535).astype(np.uint16)
    las.green = (colors[:, 1] * 65535).astype(np.uint16)
    las.blue = (colors[:, 2] * 65535).astype(np.uint16)


    las.write(output_file)

    return output_file