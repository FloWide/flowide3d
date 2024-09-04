import os
import streamlit.components.v1 as components

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



def flowide3d(base_url, key=None, height=None):

    component_value = _component_func(base_url=base_url, key=key, height=height)

    return component_value