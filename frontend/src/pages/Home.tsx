import Navbar from "../components/navbar";
import UrlForm from "../components/urlForm";

export default function Home() {
  return (
    <div>
      <Navbar />
      <div className="form">
        <UrlForm />
      </div>
    </div>
  );
}
