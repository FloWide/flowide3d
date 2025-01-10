import streamlit as st
from flowide3d import pointcloud3d, to_potree, CameraConfig
import open3d as o3d

st.set_page_config(layout='wide')


@st.cache_data
def convert_to_potree():
    # read some test data
    pcd = o3d.io.read_point_cloud("./test_data/test.pcd")

    # convert to portree format with a destination directory specified
    to_potree(pcd, "./test_data/test_tree")



pointcloud3d("http://localhost:8080")

# # show a pointcloud with default config
st.header('Default config')
result = pointcloud3d("https://test-pix4d-cloud-eu-central-1.s3.eu-central-1.amazonaws.com/lion_takanawa_converted")
st.write(result)

# arcball control
st.header('Arcball control')
pointcloud3d(
    "https://test-pix4d-cloud-eu-central-1.s3.eu-central-1.amazonaws.com/lion_takanawa_converted",
    camera={
        **CameraConfig.default(),
        "camera_control_type": "arcball",
        "arcball_gizmo": True
    }
)


# with boxes
st.header('With boxes')
pointcloud3d(
    "https://test-pix4d-cloud-eu-central-1.s3.eu-central-1.amazonaws.com/lion_takanawa_converted",
    boxes=[
        {
            "min": (-1, -1, -1),
            "max": (1, 1, 1),
            "face_color": "#ff0000",
            "line_color": "#000000",
            "opacity": 0.5,
        },
        {
            "min": (1, 1, 1),
            "max": (2, 2, 2),
            "face_color": "#00ff00",
            "line_color": "#000000",
            "opacity": 0.5,
        },
        {
            "min": (2, 2, 2),
            "max": (3, 3, 3),
            "face_color": "#0000ff",
            "line_color": "#000000",
            "opacity": 0.5,
        }
    ]
)

st.header('Color background')
pointcloud3d(
    "https://test-pix4d-cloud-eu-central-1.s3.eu-central-1.amazonaws.com/lion_takanawa_converted",
    background='lightblue'
)


st.header('Grid box')
pointcloud3d(
    "https://test-pix4d-cloud-eu-central-1.s3.eu-central-1.amazonaws.com/lion_takanawa_converted",
    grid_box={
        "min": (0, 0, 0),
        "max": (10, 10, 10),
    },
    grid_box_config={
        "grid_color": "#ff0000",
        "line_color": "#000000",
        "opacity": 0.5,
        "divisions": 10,
    },
    placement='grid_box_center'
)
