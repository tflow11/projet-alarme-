import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const LoginPatient = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.post('http://localhost:8000/api/patient/login', { email, password });
            localStorage.setItem('patientId', res.data.patient.id);
            localStorage.setItem('patientNom', res.data.patient.nom);
            navigate('/dashboard-patient');
        } catch (err) {
            setError('Identifiants incorrects. Vérifiez votre email et mot de passe.');
        }
    };

    return (
        <div style={styles.container}>
            {/* BOUTON RETOUR */}
            <button onClick={() => navigate('/')} style={styles.backBtn}>
                ← Accueil
            </button>

            <div style={styles.loginBox}>
                <div style={styles.header}>
                    <div style={styles.iconCircle}>🩹</div>
                    <h2 style={styles.title}>Espace Patient</h2>
                    <p style={styles.subtitle}>Accédez à votre suivi de traitement</p>
                </div>

                {error && <div style={styles.errorBanner}>{error}</div>}

                <form onSubmit={handleLogin} style={styles.form}>
                    <div style={styles.inputGroup}>
                        <label style={styles.label}>Adresse Email</label>
                        <input 
                            type="email" 
                            style={styles.input} 
                            placeholder="votre@email.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required 
                        />
                    </div>

                    <div style={styles.inputGroup}>
                        <label style={styles.label}>Mot de passe</label>
                        <input 
                            type="password" 
                            style={styles.input} 
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required 
                        />
                    </div>

                    <button type="submit" style={styles.submitBtn}>
                        Entrer dans mon espace
                    </button>
                </form>

                <div style={styles.infoBox}>
                    <p>💡 <b>Note :</b> Vos identifiants vous ont été fournis par votre médecin traitant lors de votre consultation.</p>
                </div>
            </div>
        </div>
    );
};

const styles = {
    container: {
        backgroundColor: '#F5F7FA',
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        fontFamily: "'Segoe UI', sans-serif",
    },
    backBtn: {
        position: 'absolute',
        top: '20px',
        left: '20px',
        background: 'none',
        border: 'none',
        color: '#2A6F97',
        cursor: 'pointer',
        fontWeight: 'bold',
        fontSize: '1rem'
    },
    loginBox: {
        backgroundColor: '#FFFFFF',
        width: '90%',
        maxWidth: '450px',
        padding: '40px',
        borderRadius: '20px',
        boxShadow: '0 15px 35px rgba(0,0,0,0.05)',
        border: '1px solid #E0E0E0'
    },
    header: {
        textAlign: 'center',
        marginBottom: '30px'
    },
    iconCircle: {
        width: '70px',
        height: '70px',
        backgroundColor: '#2EC4B6', // Vert Santé
        borderRadius: '50%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        fontSize: '2rem',
        margin: '0 auto 15px',
        color: 'white'
    },
    title: {
        color: '#2A6F97',
        margin: 0,
        fontSize: '1.8rem'
    },
    subtitle: {
        color: '#333333',
        fontSize: '0.9rem',
        marginTop: '5px',
        opacity: 0.8
    },
    errorBanner: {
        backgroundColor: '#E63946',
        color: 'white',
        padding: '12px',
        borderRadius: '10px',
        textAlign: 'center',
        marginBottom: '20px',
        fontSize: '0.9rem',
        fontWeight: '500'
    },
    form: {
        display: 'flex',
        flexDirection: 'column',
        gap: '20px'
    },
    inputGroup: {
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
    },
    label: {
        fontSize: '0.9rem',
        fontWeight: '600',
        color: '#333333'
    },
    input: {
        padding: '14px 15px',
        borderRadius: '10px',
        border: '1px solid #D1D5DB',
        fontSize: '1rem',
        outline: 'none',
        transition: 'border-color 0.2s',
        '&:focus': {
            borderColor: '#2EC4B6'
        }
    },
    submitBtn: {
        backgroundColor: '#2EC4B6',
        color: 'white',
        border: 'none',
        padding: '16px',
        borderRadius: '10px',
        fontSize: '1rem',
        fontWeight: 'bold',
        cursor: 'pointer',
        marginTop: '10px',
        transition: 'transform 0.2s',
        boxShadow: '0 4px 12px rgba(46, 196, 182, 0.2)'
    },
    infoBox: {
        marginTop: '30px',
        padding: '15px',
        backgroundColor: '#F0FDF4',
        borderRadius: '10px',
        border: '1px solid #DCFCE7',
        fontSize: '0.85rem',
        color: '#166534',
        lineHeight: '1.4'
    }
};

export default LoginPatient;