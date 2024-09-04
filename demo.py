import streamlit as st
from flowide3d import flowide3d

st.set_page_config(layout='wide')

flowide3d("https://test-pix4d-cloud-eu-central-1.s3.eu-central-1.amazonaws.com/lion_takanawa_converted")
# flowide3d("http://localhost:8080")

