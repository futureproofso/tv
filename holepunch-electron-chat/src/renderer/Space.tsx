import Button from "react-bootstrap/Button";
import InputGroup from "react-bootstrap/InputGroup";
import Form from "react-bootstrap/Form";
import Navbar from "react-bootstrap/Navbar";
import Container from "react-bootstrap/Container";
import Spinner from "react-bootstrap/Spinner";
import "./App.css";
import { useEffect, useState } from "react";
import Chat from "./Chat";
import Username from "./Username";

interface Config {
  pk: string;
  sk: string;
  appName: string;
  action: string;
  item: string;
  subject: string;
}

interface Metadata {
  topic: string;
  alias: string;
  error: string;
  config: Config;
}

function send(name: string) {
  window.electron.ipcRenderer.sendMessage("space-out", ["connect", name]);
}

function updateUsername(name: string) {
  window.electron.ipcRenderer.sendMessage("account-out", ["update", name]);
}

function getUsername() {
  window.electron.ipcRenderer.sendMessage("account-out", []);
}

export default function Space() {
  getUsername();
  const [inputValue, setInputValue] = useState("");
  const [error, setError] = useState("");
  const [username, setUsername] = useState(null);
  const [connected, setConnected] = useState(false);
  const [config, setConfig] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let removeListener: any;
    if (!username) {
      removeListener = window.electron.ipcRenderer.on(
        "account-in",
        (data: any) => {
          setUsername(data.substring(0, 10));
        }
      );
    }
    return () => {
      if (removeListener) removeListener();
    };
  }, [username]);

  useEffect(() => {
    let timeout: any;
    if (loading) {
      timeout = setTimeout(() => {
        // Set data to null and loading to false after 10 seconds
        setError("you can't join this app!");
        setLoading(false);
      }, 10000);
    }

    return () => {
      // Cleanup the timeout on component unmount
      clearTimeout(timeout);
    };
  }, [loading]);

  useEffect(() => {
    let removeListener: any;
    if (!connected) {
      removeListener = window.electron.ipcRenderer.on(
        "space-in",
        (data: any) => {
          const metadata: Metadata = JSON.parse(data);
          if (metadata.error) {
            setError(error);
          } else {
            setConnected(true);
            setConfig(metadata.config);
          }
          setLoading(false);
        }
      );
    }

    return () => {
      if (removeListener) removeListener();
    };
  }, [connected, error]);

  const handleChange = (e: any) => {
    setInputValue(e.target.value);
  };

  const handleSubmit = (e: any) => {
    e.preventDefault();
    if (loading) return;
    // Call your function with the input value
    setLoading(true);
    send(inputValue);
  };

  if (connected) {
    return (
      <div>
        <Navbar bg="light" fixed="top">
          <Container>
            <Navbar.Brand href="#home">
              <Username username={username} app={inputValue} send={updateUsername}/>
            </Navbar.Brand>
            <Navbar.Toggle />
            <Navbar.Collapse className="justify-content-end">
              <Navbar.Text>gtfol.so</Navbar.Text>
            </Navbar.Collapse>
          </Container>
        </Navbar>
        <Chat config={config} username={username} />
      </div>
    );
  }
  return (
    <div>
      <Form onSubmit={handleSubmit}>
        <InputGroup className="mb-3">
          <InputGroup.Text id="basic-addon1">#</InputGroup.Text>
          <Form.Control
            type="text"
            placeholder="app name"
            aria-label="app name"
            aria-describedby="basic-addon1"
            value={inputValue}
            onChange={handleChange}
          />
        </InputGroup>
        <Button variant="primary" type="submit" disabled={loading}>
          {loading ? (
            <>
              <Spinner
                as="span"
                animation="border"
                size="sm"
                role="status"
                aria-hidden="true"
              />
              <span className="visually-hidden">loading...</span>
            </>
          ) : (
            "start"
          )}
        </Button>
      </Form>
    </div>
  );
}
