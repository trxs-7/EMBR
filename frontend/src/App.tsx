import { BrowserRouter, Route, Routes } from "react-router-dom";
import Home from "./pages/Home";

export default function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <div className="Pages">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/result" element={<h1>Result</h1>} />
          </Routes>
        </div>
      </BrowserRouter>
    </div>
  );
}
