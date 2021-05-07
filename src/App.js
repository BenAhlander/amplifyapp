import React, { useState, useEffect } from "react";
import "./App.css";
import { API, Storage } from "aws-amplify";
import { withAuthenticator } from "@aws-amplify/ui-react";
import { listTodos } from "./graphql/queries";
import {
  createTodo as createNoteMutation,
  deleteTodo as deleteNoteMutation,
} from "./graphql/mutations";
import TextField from "@material-ui/core/TextField";
import Button from "@material-ui/core/Button";
import Card from "./components/Card";
import Nav from "./components/Nav";
import Grid from "@material-ui/core/Grid";
import Paper from "@material-ui/core/Paper";
import { ThemeProvider } from "@material-ui/styles";
import { createMuiTheme } from "@material-ui/core/styles";
import orange from "@material-ui/core/colors/red";
import deepOrange from "@material-ui/core/colors/deepOrange";

const theme = createMuiTheme({
  palette: {
    primary: {
      main: deepOrange[500],
    },
    secondary: {
      main: orange[500],
    },
  },
});

const initialFormState = { name: "", description: "" };

function App() {
  const [notes, setNotes] = useState([]);
  const [formData, setFormData] = useState(initialFormState);

  useEffect(() => {
    fetchNotes();
  }, []);

  async function onChange(e) {
    if (!e.target.files[0]) return;
    const file = e.target.files[0];
    setFormData({ ...formData, image: file.name });
    await Storage.put(file.name, file);
    fetchNotes();
  }

  async function fetchNotes() {
    const apiData = await API.graphql({ query: listTodos });
    const notesFromAPI = apiData.data.listTodos.items;
    await Promise.all(
      notesFromAPI.map(async (note) => {
        if (note.image) {
          const image = await Storage.get(note.image);
          note.image = image;
        }
        return note;
      })
    );
    setNotes(apiData.data.listTodos.items);
  }

  async function createNote() {
    if (!formData.name || !formData.description) return;
    await API.graphql({
      query: createNoteMutation,
      variables: { input: formData },
    });
    if (formData.image) {
      const image = await Storage.get(formData.image);
      formData.image = image;
    }
    setNotes([...notes, formData]);
    setFormData(initialFormState);
  }

  async function deleteNote({ id }) {
    const newNotesArray = notes.filter((note) => note.id !== id);
    setNotes(newNotesArray);
    await API.graphql({
      query: deleteNoteMutation,
      variables: { input: { id } },
    });
  }

  return (
    <ThemeProvider theme={theme}>
      <div className="App">
        <Nav />
        <h1>My Notes App</h1>
        <Paper style={{ padding: "24px", maxWidth: "1000px", margin: "auto" }}>
          <Grid container spacing={6}>
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Note name"
                value={formData.name}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Note description"
                value={formData.description}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <input
                accept="image/*"
                id="contained-button-file"
                multiple
                type="file"
                onChange={onChange}
                style={{ display: "none" }}
              />
              <label htmlFor="contained-button-file">
                <Button
                  variant="contained"
                  color="primary"
                  component="span"
                  fullWidth
                >
                  Upload Image
                </Button>
              </label>
            </Grid>
            <Grid item xs={12}>
              <Button
                fullWidth
                variant="contained"
                color="secondary"
                onClick={createNote}
              >
                Create Note
              </Button>
            </Grid>
          </Grid>
        </Paper>
        <div style={{ padding: "24px" }}>
          <Grid container spacing={6}>
            {notes.map((note) => (
              <Grid item xs={12} sm={6} md={4} lg={3} xl={2}>
                <Card
                  title={note.name}
                  description={note.description}
                  img={note.image}
                  handleDelete={() => deleteNote(note)}
                />
              </Grid>
            ))}
          </Grid>
        </div>
      </div>
    </ThemeProvider>
  );
}

export default withAuthenticator(App);
