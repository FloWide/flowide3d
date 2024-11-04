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
