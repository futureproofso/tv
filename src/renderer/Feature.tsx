import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import "./App.css";
import { useState } from "react";
import Stack from "react-bootstrap/Stack";

export default function Feature(props: any) {
  const { action } = props;
  const { item } = props;
  const { send } = props;
  const [subject, setSubject] = useState("");

  const handleChange = (e: any) => {
    setSubject(e.target.value);
  };

  const handleSubmit = (e: any) => {
    e.preventDefault();
    // Call your function with the input value
    send({ action, item, subject });
    setSubject("");
  };

  return (
    <Form onSubmit={handleSubmit}>
      <Stack direction="horizontal" gap={3}>
        {action} {item === "flower" ? <i className="bi bi-flower3" /> : item}
        <Form.Control
          className="me-auto"
          type="text"
          value={subject}
          onChange={handleChange}
          placeholder="to"
        />
        <Button variant="outline-light" type="submit">
          <i className="bi bi-arrow-up-circle-fill" />
        </Button>
      </Stack>
    </Form>
  );
}
