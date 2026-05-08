import { useState } from "react";

function UploadPhoto() {
  const [file, setFile] = useState(null);
  const [priseId, setPriseId] = useState("");

  const uploadImage = async () => {
    const formData = new FormData();

    formData.append("image", file);
    formData.append("prise_id", priseId);

    const response = await fetch("http://127.0.0.1:8000/api/prise/valider", {
      method: "POST",
      body: formData,
    });

    const data = await response.json();
    alert(data.message);
  };

  return (
    <div>
      <h2>Upload Photo</h2>

      <input
        type="text"
        placeholder="ID prise"
        onChange={(e) => setPriseId(e.target.value)}
      />

      <input
        type="file"
        onChange={(e) => setFile(e.target.files[0])}
      />

      <button onClick={uploadImage}>
        Envoyer
      </button>
    </div>
  );
}

export default UploadPhoto;