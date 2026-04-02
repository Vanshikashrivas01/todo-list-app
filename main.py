import streamlit as st
import json
import os

if 'tasks' not in st.session_state:
st.session_state.tasks = []

st.title("To-Do List App")

new_task = st.text_input("Add new task:")
if st.button("Add Task", key="add_unique"):
if new_task:
st.session_state.tasks.append({"text": new_task, "done": False})
st.rerun()

for i, task in enumerate(st.session_state.tasks):
col1, col2, col3 = st.columns([4, 1, 1])
status = "✅" if task["done"] else "⭕"
with col1:
st.write(f"{status} {task['text']}")
with col2:
if st.button("Toggle", key=f"toggle_{i}"):
task["done"] = not task["done"]
st.rerun()
with col3:
if st.button("Delete", key=f"del_{i}"):
st.session_state.tasks.pop(i)
st.rerun()

if st.button("Clear All", key="clear"):
st.session_state.tasks = []
st.rerun()

Save/Load
if st.button("Save Tasks", key="save"):
with open("tasks.json", "w") as f:
json.dump(st.session_state.tasks, f)
st.success("Saved!")

if st.button("Load Tasks", key="load"):
if os.path.exists("tasks.json"):
with open("tasks.json", "r") as f:
st.session_state.tasks = json.load(f)
st.rerun()
else:
st.warning("No save file found.")
