import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../service/api";

function RegisterPatient() {
  const [nom, setNom] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const navigate = useNavigate();

  const register = async () => {
    try {
      await API.post("/register", {
        nom,
        email,
        password
      });

      alert("Compte créé !");
      navigate("/login-patient");
    } catch (error) {
      alert("Erreur inscription");
    }
  };

  return (
    <div>
      <h2>Register Patient</h2>

      <input
        placeholder="Nom"
        onChange={(e) => setNom(e.target.value)}
      />

      <input
        placeholder="Email"
        onChange={(e) => setEmail(e.target.value)}
      />

      <input
        type="password"
        placeholder="Password"
        onChange={(e) => setPassword(e.target.value)}
      />

      <button onClick={register}>S'inscrire</button>
    </div>
  );
}

export default RegisterPatient;