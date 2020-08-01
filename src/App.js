import React, { useEffect, useReducer } from "react";
import { List, Input, Button } from "antd";
import { API } from "aws-amplify";
import { v4 as uuid } from "uuid";

import { listModels } from "./graphql/queries";
import { onCreateModel } from "./graphql/subscriptions";
import {
  createModel as CreateModel,
  deleteModel as DeleteModel,
  updateModel as UpdateModel,
} from "./graphql/mutations";

import "./App.css";
import "antd/dist/antd.css";

const CLIENT_ID = uuid();

const styles = {
  container: { padding: 20 },
  input: { marginBottom: 10 },
  item: { textAlign: "left" },
  p: { color: "#1890ff" },
};

const initialState = {
  notes: [],
  loading: true,
  error: false,
  form: { name: "", description: "" },
};

function reducer(state, action) {
  switch (action.type) {
    case "SET_NOTES":
      return { ...state, notes: action.notes, loading: false };
    case "ADD_NOTE":
      return { ...state, notes: [action.note, ...state.notes] };
    case "RESET_FORM":
      return { ...state, form: initialState.form };
    case "SET_INPUT":
      return { ...state, form: { ...state.form, [action.name]: action.value } };
    case "ERROR":
      return { ...state, loading: false, error: true };
    default:
      return state;
  }
}

function App() {
  const [state, dispatch] = useReducer(reducer, initialState);

  const fetchNotes = async () => {
    try {
      const notesData = await API.graphql({
        query: listModels,
      });
      dispatch({ type: "SET_NOTES", notes: notesData.data.listModels.items });
    } catch (error) {
      console.log("error", error);
      dispatch({ type: "ERROR" });
    }
  };

  const createModel = async () => {
    const { form } = state;
    if (!form.name || !form.description) {
      return alert("please enter a name and description");
    }
    const note = { ...form, clientId: CLIENT_ID, completed: false, id: uuid() };
    dispatch({ type: "ADD_NOTE", note });
    dispatch({ type: "RESET_FORM" });
    try {
      await API.graphql({
        query: CreateModel,
        variables: { input: note },
      });
      console.log("successfully created note!");
    } catch (err) {
      console.log("error: ", err);
    }
  };

  const deleteModel = async ({ id }) => {
    const index = state.notes.findIndex((n) => n.id === id);
    const notes = [
      ...state.notes.slice(0, index),
      ...state.notes.slice(index + 1),
    ];
    dispatch({ type: "SET_NOTES", notes });
    try {
      await API.graphql({
        query: DeleteModel,
        variables: { input: { id } },
      });
      console.log("successfully deleted note!");
    } catch (err) {
      console.log({ err });
    }
  };

  async function updateModel(note) {
    const index = state.notes.findIndex((n) => n.id === note.id);
    const notes = [...state.notes];
    notes[index].completed = !note.completed;
    dispatch({ type: "SET_NOTES", notes });
    try {
      await API.graphql({
        query: UpdateModel,
        variables: {
          input: { id: note.id, completed: notes[index].completed },
        },
      });
      console.log("note successfully updated!");
    } catch (err) {
      console.log("error: ", err);
    }
  }

  const onChange = (e) => {
    dispatch({ type: "SET_INPUT", name: e.target.name, value: e.target.value });
  };

  function ListItem(item) {
    return (
      <List.Item
        style={styles.item}
        actions={[
          <p style={styles.p} onClick={() => deleteModel(item)}>
            Delete
          </p>,
          <p style={styles.p} onClick={() => updateModel(item)}>
            {item.completed ? "completed" : "mark completed"}
          </p>,
        ]}
      >
        <List.Item.Meta title={item.name} description={item.description} />
      </List.Item>
    );
  }

  useEffect(() => {
    fetchNotes();
    const subscription = API.graphql({
      query: onCreateModel,
    }).subscribe({
      next: (noteData) => {
        const note = noteData.value.data.onCreateModel;
        if (CLIENT_ID === note.clientId) return;
        dispatch({ type: "ADD_NOTE", note });
      },
    });
    return subscription.unsubscribe();
  }, []);

  return (
    <div style={styles.container}>
      <Input
        onChange={onChange}
        value={state.form.name}
        placeholder="Note Name"
        name="name"
        style={styles.input}
      />
      <Input
        onChange={onChange}
        value={state.form.description}
        placeholder="Note description"
        name="description"
        style={styles.input}
      />
      <Button onClick={createModel} type="primary">
        Create Note
      </Button>
      <List
        loading={state.loading}
        dataSource={state.notes}
        renderItem={ListItem}
      />
    </div>
  );
}

export default App;
