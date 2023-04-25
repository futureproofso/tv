import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import "./App.css";
import { useState } from "react";
import Stack from "react-bootstrap/Stack";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck } from "@fortawesome/free-solid-svg-icons";

export default function Username(props: any) {
    const {app} = props;
    const {send} = props;
  const [editing, setEditing] = useState(false);
  const [prevUsername, setPrevUsername] = useState(props.username);
  const [username, setUsername] = useState(props.username);

  const handleEditing = (e: any) => {
    setEditing(true);
  }

  const handleChange = (e: any) => {
    setUsername(e.target.value);
  };

  const handleSubmit = (e: any) => {
    e.preventDefault();
    // Call your function with the input value
    send(username);
    setPrevUsername(username);
    setEditing(false);
  };

  return (
    <Form onSubmit={handleSubmit}>
      <Stack direction="horizontal" gap={3}>
        @{" "}
        {editing ? (
            <>
        <Form.Control
          className="me-auto"
          type="text"
          value={username}
          onChange={handleChange}
          placeholder={prevUsername}
        />
        <Button type="submit">
          <FontAwesomeIcon icon={faCheck} />
        </Button>
</>
        ): <span onClick={handleEditing}>{username}</span>}
        {" "}# {app}
      </Stack>
    </Form>
  );
}
