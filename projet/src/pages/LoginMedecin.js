import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const LoginMedecin = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [formData, setFormData] = useState({
        nom: '',
        email: '',
        password: '',
        telephone: '' 
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        
        // Harmonisation avec tes routes Laravel (pluriel recommandé)
        const endpoint = isLogin ? '/api/medecins/login' : '/api/medecins/register';
        
        try {
            const response = await axios.post(`http://localhost:8000${endpoint}`, formData);
            
            if (response.data.medecin) {
                // Sauvegarde des informations de session
                localStorage.setItem('medecinId', response.data.medecin.id);
                localStorage.setItem('medecinNom', response.data.medecin.nom);
                localStorage.setItem('medecinTel', response.data.medecin.telephone);
                
                // Redirection vers le dashboard
                navigate('/dashboard-medecin');
            }
        } catch (err) {
            console.error("Erreur d'authentification:", err);
            setError(err.response?.data?.message || "Identifiants incorrects ou erreur serveur");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={styles.container}>
            <div style={styles.card}>
                <div style={styles.header}>
                    <span style={{fontSize: '3rem'}}>👨‍⚕️</span>
                    <h2 style={styles.title}>
                        {isLogin ? 'Connexion Médecin' : 'Inscription Médecin'}
                    </h2>
                    <p style={styles.subtitle}>Gestion de l'observance thérapeutique</p>
                </div>
                
                {error && <div style={styles.error}>{error}</div>}

                <form onSubmit={handleSubmit} style={styles.form}>
                    {!isLogin && (
                        <>
                            <div style={styles.inputGroup}>
                                <label style={styles.label}>Nom complet</label>
                                <input
                                    type="text"
                                    placeholder="Dr. Votre Nom"
                                    style={styles.input}
                                    value={formData.nom}
                                    onChange={(e) => setFormData({...formData, nom: e.target.value})}
                                    required
                                />
                            </div>
                            <div style={styles.inputGroup}>
                                <label style={styles.label}>Numéro de téléphone</label>
                                <input
                                    type="tel"
                                    placeholder="06 XX XX XX XX"
                                    style={styles.input}
                                    value={formData.telephone}
                                    onChange={(e) => setFormData({...formData, telephone: e.target.value})}
                                    required
                                />
                            </div>
                        </>
                    )}
                    
                    <div style={styles.inputGroup}>
                        <label style={styles.label}>Email professionnel</label>
                        <input
                            type="email"
                            placeholder="medecin@exemple.com"
                            style={styles.input}
                            value={formData.email}
                            onChange={(e) => setFormData({...formData, email: e.target.value})}
                            required
                        />
                    </div>
                    
                    <div style={styles.inputGroup}>
                        <label style={styles.label}>Mot de passe</label>
                        <input
                            type="password"
                            placeholder="••••••••"
                            style={styles.input}
                            value={formData.password}
                            onChange={(e) => setFormData({...formData, password: e.target.value})}
                            required
                        />
                    </div>

                    <button type="submit" style={styles.button} disabled={loading}>
                        {loading ? 'Chargement...' : (isLogin ? 'Se connecter' : 'Créer mon compte')}
                    </button>
                </form>

                <div style={styles.footer}>
                    <p style={styles.toggleText}>
                        {isLogin ? "Nouveau sur la plateforme ?" : "Déjà inscrit ?"}
                        <span style={styles.toggleLink} onClick={() => { setIsLogin(!isLogin); setError(''); }}>
                            {isLogin ? " Créer un compte" : " Se connecter"}
                        </span>
                    </p>
                    <button onClick={() => navigate('/')} style={styles.backBtn}>
                        ← Retour à l'accueil
                    </button>
                </div>
            </div>
        </div>
    );
};

const styles = {
    container: { 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh', 
        backgroundColor: '#F0F4F8',
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
    },
    card: { 
        backgroundColor: 'white', 
        padding: '40px', 
        borderRadius: '20px', 
        boxShadow: '0 10px 25px rgba(0,0,0,0.1)', 
        width: '100%', 
        maxWidth: '450px' 
    },
    header: { textAlign: 'center', marginBottom: '30px' },
    title: { color: '#2A6F97', margin: '10px 0 5px 0', fontSize: '1.8rem' },
    subtitle: { color: '#666', fontSize: '0.9rem', margin: 0 },
    form: { display: 'flex', flexDirection: 'column', gap: '15px' },
    inputGroup: { display: 'flex', flexDirection: 'column', gap: '5px' },
    label: { fontSize: '0.85rem', fontWeight: 'bold', color: '#444', marginLeft: '5px' },
    input: { 
        padding: '12px 15px', 
        borderRadius: '10px', 
        border: '1px solid #DDD', 
        fontSize: '1rem',
        outline: 'none',
        transition: 'border-color 0.3s'
    },
    button: { 
        padding: '14px', 
        backgroundColor: '#2A6F97', 
        color: 'white', 
        border: 'none', 
        borderRadius: '10px', 
        cursor: 'pointer', 
        fontWeight: 'bold', 
        fontSize: '1.1rem',
        marginTop: '10px',
        transition: 'background 0.3s'
    },
    error: { 
        backgroundColor: '#FEE2E2', 
        color: '#B91C1C', 
        padding: '12px', 
        borderRadius: '10px', 
        marginBottom: '20px', 
        textAlign: 'center', 
        fontSize: '0.9rem',
        fontWeight: '500'
    },
    footer: { marginTop: '25px', textAlign: 'center' },
    toggleText: { color: '#666', fontSize: '0.9rem' },
    toggleLink: { 
        color: '#2A6F97', 
        fontWeight: 'bold', 
        cursor: 'pointer',
        textDecoration: 'underline'
    },
    backBtn: {
        background: 'none',
        border: 'none',
        color: '#999',
        marginTop: '15px',
        cursor: 'pointer',
        fontSize: '0.85rem'
    }
};

export default LoginMedecin;