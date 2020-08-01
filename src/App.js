import React, { useEffect, useReducer } from "react";
import { API } from "aws-amplify";
import { List } from "antd";
import { listModels } from "./graphql/queries";

import "./App.css";
import "antd/dist/antd.css";

const styles = {
  container: { padding: 20 },
  input: { marginBottom: 10 },
  item: { textAlign: "left" },
  p: { color: "#1890ff" },
};

function reducer(state, action) {
  switch (action.type) {
    case "SET_NOTES":
      return { ...state, notes: action.notes, loading: false };
    case "ERROR":
      return { ...state, loading: false, error: true };
    default:
      return state;
  }
}

function App() {
  const initialState = {
    notes: [],
    loading: true,
    error: false,
    form: { name: "", description: "" },
  };
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

  useEffect(() => {
    fetchNotes();
  }, []);

  return (
    <div style={styles.container}>
      <List
        loading={state.loading}
        dataSource={state.notes}
        renderItem={renderItem}
      />
    </div>
  );
}

function renderItem(item) {
  return (
    <List.Item style={styles.item}>
      <List.Item.Meta title={item.name} description={item.description} />
    </List.Item>
  );
}

export default App;
