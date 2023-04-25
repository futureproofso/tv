import { MemoryRouter as Router, Routes, Route } from "react-router-dom";
import "./App.css";
import Space from "./Space";
import "bootstrap/dist/css/bootstrap.min.css";

function Main() {
  return (
    <div>
      <Space />
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Main />} />
      </Routes>
    </Router>
  );
}
