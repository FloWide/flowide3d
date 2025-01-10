# Flowide 3D

Requires `PotreeConverter` to be installed and at /usr/bin.

## Example

```python
import streamlit as st
from flowide3d import pointcloud3d, to_potree
import open3d as o3d

st.set_page_config(layout='wide')


@st.cache
def convert_to_potree():
    # read some test data
    pcd = o3d.io.read_point_cloud("./test_data/test.pcd")

    # convert to portree format with a destination directory specified
    to_potree(pcd, "./test_data/test_tree")



# show a pointcloud with default config
pointcloud3d("https://test-pix4d-cloud-eu-central-1.s3.eu-central-1.amazonaws.com/lion_takanawa_converted")


# change camera and background
pointcloud3d(
    "https://test-pix4d-cloud-eu-central-1.s3.eu-central-1.amazonaws.com/lion_takanawa_converted",
    background=(0.678, 0.847, 0.902),  # light blue,
    camera={
        "position": (0, 0, 5),
        "look_at": (0, 0, 0),
        "up": (0, 1, 0),
        "type": "orthographic",
    }
)


convert_to_potree() # convert to potree format in test_tree directory

pointcloud3d(
    "http://localhost:8080", # test_tree directory is server under http,
    camera={
        "position": (0, 0, 0),
        "look_at": (0, -5, 0),
        "up": (0, 1, 0),
        "type": "perspective",
    }
)

```

## Documentation

### `pointcloud3d` Function

#### Parameters

| Parameter        | Type                                                                 | Default                       | Description                                                                                   |
|------------------|----------------------------------------------------------------------|-------------------------------|-----------------------------------------------------------------------------------------------|
| `base_url`       | `str`                                                               | Required                      | Base URL of the point cloud data.                                                             |
| `point_size`     | `int`                                                               | `1`                           | Size of the points in the visualization.                                                     |
| `camera`         | `CameraConfig`                                                     | `CameraConfig.default()`      | Camera configuration including position, view, and control types.                            |
| `background`     | `str` or `None`                                                    | `None`                        | Background color of the visualization (e.g., `#ffffff`).                                      |
| `boxes`          | `List[SimpleBox3D]` or `None`                                      | `[]`                          | List of 3D boxes to display alongside the point cloud.                                        |
| `show_toolbar`   | `bool`                                                             | `True`                        | Whether to show the toolbar in the viewer.                                                   |
| `grid_box`       | `Box3D` or `'bounding_box'` or `None`                              | `'bounding_box'`              | Bounding box for the grid.                                                                    |
| `grid_box_config`| `GridBoxConfig` or `None`                                          | `GridBoxConfig.default()`     | Configuration for the grid box, including color, opacity, and number of divisions.           |
| `placement`      | `'origin'`, `'grid_box_center'`, or `'none'`                       | `'none'`                      | Placement of the point cloud in the scene.                                                   |
| `height`         | `int` or `None`                                                    | `None`                        | Height of the visualization component in pixels.                                              |
| `measurements`   | `List[Measurement]` or `None`                                      | `None`                        | List of measurements to display alongside the point cloud.                                    |
| `key`            | `str` or `None`                                                    | `None`                        | Unique key for the component.                                                                 |                                                    |

#### Returns

`List[Measurement]` or `None` - A list of measurements that have been updated by the user.

---

### `to_potree` Function

#### Description

The `to_potree` function converts an Open3D point cloud to the Potree format for efficient visualization of large-scale point cloud datasets.

#### Parameters

| Parameter       | Type                              | Description                                                                                   |
|-----------------|-----------------------------------|-----------------------------------------------------------------------------------------------|
| `pointcloud`    | `o3d.geometry.PointCloud`        | The Open3D point cloud to convert.                                                           |
| `output_dir`    | `str`                             | Directory where the Potree output will be saved.                                              |

## Behavior

1. Converts the input point cloud to `.las` format using the `to_las_file` helper function.
2. Runs the PotreeConverter to generate the output files in the specified directory.

## Exceptions

- Raises an exception if the PotreeConverter process fails.
