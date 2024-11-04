import os
import streamlit.components.v1 as components
import open3d as o3d
import laspy
import tempfile
import numpy as np
import subprocess
import matplotlib.pyplot as plt
import shutil
from typing import Tuple, TypedDict, TypeAlias, Literal


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


    @staticmethod
    def default() -> 'CameraConfig':
        return {
            "position": (0, 0, 5),
            "look_at": (0, 0, 0),
            "up":(0, 1, 0),
            "fov": 60,
            "type": "perspective"
        }


def pointcloud3d(
    base_url: str,
    point_size: int = 1,
    camera: CameraConfig = None,
    background: Vec3 | None = None,
    key=None, height:
    int | None =None
):
    """
        Visualize the pointcloud in potree format
    Args:
        base_url (str): Base UR path of the potree formatted pointcloud
        point_size (int, optional): Pointcloud point size. Defaults to 1.
        camera (CameraConfig, optional): Inital camera config Defaults to None.
        background (Vec3 | None, optional): An RGB Tuple of color in the range of 0.1 example: (0,0,1) for blue color Defaults to None.
        key (_type_, optional): streamlit key Defaults to None.
        height (int | None, optional): height of the display Defaults to None.

    Returns:
        None
    """
    if camera is None:
        camera = CameraConfig.default()

    component_value = _component_func(
        base_url=base_url, 
        point_size=point_size,
        camera=camera,
        background=background,
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