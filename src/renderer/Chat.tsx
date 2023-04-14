import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import "./App.css";
import { useEffect, useState } from "react";
import Alert from "react-bootstrap/Alert";
import Stack from "react-bootstrap/Stack";
import Container from "react-bootstrap/Container";
import Feature from "./Feature";

interface Message {
  id: string;
  from: string;
  message: string;
}

interface Config {
  pk: string;
  sk: string;
  appName: string;
  action: string;
  item: string;
  subject: string;
}

function send(message: string) {
  window.electron.ipcRenderer.sendMessage("chat-out", ["message", message]);
}

function renderMessage(message: Message) {
  if (message.from === "me") {
    return (
      <Stack key={message.id} direction="horizontal" gap={3}>
        <Container fluid>
          <Alert key={message.id} variant="primary" className="me-auto">
            {message.message}
          </Alert>
        </Container>
        <div>me</div>
      </Stack>
    );
  }

  return (
    <Stack key={message.id} direction="horizontal" gap={3}>
      <div>{message.from.substring(0, 5)}</div>
      <Container fluid>
        <Alert key={message.id} variant="secondary" className="me-auto">
          {message.message}
        </Alert>
      </Container>
    </Stack>
  );
}

const cache: Array<Message> = [];
function addToCache(item: Message) {
  if (cache.length > 29) {
    cache.shift();
  }
  cache.push(item);
}

export default function Chat({ username, config }: any) {
  const [inputValue, setInputValue] = useState("");
  const [messages, setMessages] = useState<Message[]>(cache);

  useEffect(() => {
    const removeListener = window.electron.ipcRenderer.on(
      "chat-in",
      (data: any) => {
        const nextMessage = JSON.parse(data);
        addToCache(nextMessage);
        setMessages([...cache]);
      }
    );
    return () => {
      if (removeListener) removeListener();
    };
  }, []);

  const handleChange = (e: any) => {
    setInputValue(e.target.value);
  };

  const handleFeatureSend = ({ item, subject }: any) => {
    const message = `${username} sent ${subject} a ${item}`;
    console.log(message);
    send(message);
    addToCache({ id: String(Math.random()), from: "me", message });
    setMessages([...cache]);
  };

  const handleSubmit = (e: any) => {
    e.preventDefault();
    // Call your function with the input value
    send(inputValue);
    addToCache({ id: String(Math.random()), from: "me", message: inputValue });
    setMessages([...cache]);
    setInputValue("");
  };

  function renderFeatures(appConfig: Config) {
    return (
      <Feature
        aciton={appConfig.action}
        item={appConfig.item}
        send={handleFeatureSend}
      />
    );
  }

  return (
    <>
      <Stack
        style={{ height: "70vh", overflow: "scroll", justifyContent: "end" }}
      >
        {messages.map(renderMessage)}
      </Stack>
      <Stack gap={3}>
        <Form onSubmit={handleSubmit}>
          <Stack direction="horizontal" gap={3}>
            <Form.Control
              className="me-auto"
              type="text"
              value={inputValue}
              onChange={handleChange}
              placeholder="say something!"
            />
            <Button variant="primary" type="submit">
              send
            </Button>
          </Stack>
        </Form>
        <hr />
        <div style={{ height: "200px", overflow: "scroll" }}>
          {renderFeatures(config)}
        </div>
      </Stack>
    </>
  );
}
