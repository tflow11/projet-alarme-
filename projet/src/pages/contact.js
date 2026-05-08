import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Contact = () => {
    const navigate = useNavigate();
    
    // États
    const [medecins, setMedecins] = useState([]);
    const [confirmes, setConfirmes] = useState([]);
    const [showList, setShowList] = useState(false);
    
    // État du formulaire avec 'motif' ajouté
    const [rdvData, setRdvData] = useState({
        nom: '',
        telephone: '',
        date: '',
        nom_medecin: '',
        motif: '' // Ajouté pour corriger l'erreur de validation
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const resMed = await axios.get('http://localhost:8000/api/medecins');
                setMedecins(resMed.data);
                
                const resRDV = await axios.get('http://localhost:8000/api/contact/rdv/confirmes');
                setConfirmes(resRDV.data);
            } catch (error) {
                console.error("Erreur de chargement:", error);
            }
        };
        fetchData();
    }, []);

    const handleDemandeRDV = async (e) => {
        e.preventDefault();
        
        // Nettoyage des données avant envoi
        const finalData = {
            ...rdvData,
            date: rdvData.date.replace('T', ' ') // Format SQL
        };

        try {
            const response = await axios.post('http://localhost:8000/api/contact/rdv', finalData);
            
            if (response.status === 200 || response.status === 201) {
                alert(`Demande envoyée avec succès.`);
                navigate('/');
            }
        } catch (error) {
            if (error.response && error.response.status === 422) {
                // Affiche l'erreur exacte du backend (ex: "The motif field is required")
                const validationErrors = error.response.data.errors;
                const firstError = Object.values(validationErrors)[0][0];
                alert("Erreur de validation : " + firstError);
            } else {
                alert("Erreur lors de l'envoi au serveur.");
            }
        }
    };

    return (
        <div style={styles.layout}>
            {/* --- SIDEBAR --- */}
            <aside style={styles.sidebar}>
                <div style={styles.brand}>
                    <h2 style={{color: 'white'}}>🏥 MaSanté</h2>
                </div>
                <nav style={styles.nav}>
                    <div style={styles.navItem} onClick={() => navigate('/')}>🏠 Accueil</div>
                    <div style={styles.navItemActive}>📅 Rendez-vous</div>
                </nav>
            </aside>

            {/* --- CONTENU PRINCIPAL --- */}
            <main style={styles.mainContent}>
                <div style={styles.infoSegment}>
                    <h2 style={styles.title}>Contact & Aide</h2>
                    <p style={styles.subtitle}>Consultez les confirmations ou envoyez une nouvelle demande.</p>
                    
                    <div style={styles.contactCards}>
                        <div 
                            style={{...styles.actionCard, cursor: 'pointer', borderColor: showList ? '#2A6F97' : '#E2E8F0'}} 
                            onClick={() => setShowList(!showList)}
                        >
                            <span style={styles.cardIcon}>📅</span>
                            <div>
                                <strong>Rendez-vous confirmés</strong>
                                <p>{showList ? "Cliquer pour masquer" : "Afficher les noms et dates"}</p>
                            </div>
                        </div>

                        {showList && (
                            <div style={styles.confirmedDropdown}>
                                {confirmes.length > 0 ? confirmes.map((r, i) => (
                                    <div key={i} style={styles.rdvMiniRow}>
                                        <strong style={styles.patientName}>{r.nom_client || r.nom}</strong>
                                        <span style={styles.rdvDetails}>
                                            Dr. {r.nom_medecin} — {new Date(r.date_rdv || r.date).toLocaleString('fr-FR')}
                                        </span>
                                    </div>
                                )) : <p style={{fontSize:'0.8rem', color:'#64748B'}}>Aucun rendez-vous confirmé.</p>}
                            </div>
                        )}
                    </div>
                </div>

                {/* FORMULAIRE */}
                <div style={styles.formSegment}>
                    <div style={styles.formCard}>
                        <h3 style={styles.formTitle}>Nouvelle Demande</h3>
                        <form onSubmit={handleDemandeRDV} style={styles.form}>
                            
                            {/* MÉDECIN */}
                            <div style={styles.inputGroup}>
                                <label style={styles.label}>Spécialiste</label>
                                <select 
                                    style={styles.inputMedecin} 
                                    required 
                                    value={rdvData.nom_medecin}
                                    onChange={(e) => setRdvData({...rdvData, nom_medecin: e.target.value})}
                                >
                                    <option value="">-- Sélectionner --</option>
                                    {medecins.map((med) => <option key={med.id} value={med.nom}>Dr. {med.nom}</option>)}
                                </select>
                            </div>

                            {/* NOM */}
                            <div style={styles.inputGroup}>
                                <label style={styles.label}>Nom du patient</label>
                                <input 
                                    type="text" style={styles.input} placeholder="Nom complet" required 
                                    value={rdvData.nom}
                                    onChange={(e) => setRdvData({...rdvData, nom: e.target.value})} 
                                />
                            </div>

                            <div style={styles.row}>
                                {/* TÉLÉPHONE */}
                                <div style={{...styles.inputGroup, flex: 1}}>
                                    <label style={styles.label}>Téléphone</label>
                                    <input 
                                        type="tel" style={styles.input} required 
                                        value={rdvData.telephone}
                                        onChange={(e) => setRdvData({...rdvData, telephone: e.target.value})} 
                                    />
                                </div>
                                {/* DATE */}
                                <div style={{...styles.inputGroup, flex: 1}}>
                                    <label style={styles.label}>Date & Heure</label>
                                    <input 
                                        type="datetime-local" style={styles.input} required 
                                        value={rdvData.date}
                                        onChange={(e) => setRdvData({...rdvData, date: e.target.value})} 
                                    />
                                </div>
                            </div>


                            <button type="submit" style={styles.submitBtn}>Envoyer la demande</button>
                        </form>
                    </div>
                </div>
            </main>
        </div>
    );
};

const styles = {
    layout: { display: 'flex', minHeight: '100vh', backgroundColor: '#F8FAFC' },
    sidebar: { width: '260px', backgroundColor: '#1A5276', color: 'white', padding: '30px 20px', position: 'fixed', height: '100vh', left: 0, top: 0 },
    brand: { marginBottom: '50px', textAlign: 'center' },
    nav: { display: 'flex', flexDirection: 'column', gap: '10px' },
    navItem: { padding: '12px 15px', cursor: 'pointer', borderRadius: '8px', color: '#BDC3C7', transition: '0.3s' },
    navItemActive: { padding: '12px 15px', borderRadius: '8px', backgroundColor: '#2980B9', color: 'white', fontWeight: 'bold' },
    mainContent: { marginLeft: '260px', flex: 1, display: 'flex', padding: '60px 5%', gap: '40px' },
    infoSegment: { flex: 1 },
    title: { fontSize: '2.2rem', color: '#1E293B', fontWeight: '800' },
    subtitle: { color: '#64748B', marginBottom: '30px' },
    contactCards: { display: 'flex', flexDirection: 'column', gap: '15px' },
    actionCard: { display: 'flex', alignItems: 'center', gap: '15px', padding: '18px', backgroundColor: 'white', borderRadius: '12px', border: '1px solid #E2E8F0' },
    cardIcon: { fontSize: '1.3rem', backgroundColor: '#F0F7FF', padding: '10px', borderRadius: '10px' },
    confirmedDropdown: { backgroundColor: '#FFF', padding: '15px', borderRadius: '12px', border: '1px solid #E2E8F0', marginTop: '-10px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', maxHeight: '350px', overflowY: 'auto' },
    rdvMiniRow: { padding: '10px 0', borderBottom: '1px solid #F1F5F9', display: 'flex', flexDirection: 'column' },
    patientName: { color: '#1A5276', fontSize: '0.95rem', fontWeight: '700' },
    rdvDetails: { fontSize: '0.85rem', color: '#64748B' },
    formSegment: { flex: 1.2 },
    formCard: { backgroundColor: 'white', padding: '35px', borderRadius: '20px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)', border: '1px solid #E2E8F0' },
    formTitle: { marginBottom: '25px', color: '#1A5276', textAlign: 'center', fontSize: '1.4rem' },
    form: { display: 'flex', flexDirection: 'column', gap: '15px' },
    inputGroup: { display: 'flex', flexDirection: 'column', gap: '6px' },
    row: { display: 'flex', gap: '15px' },
    label: { fontSize: '0.85rem', fontWeight: 'bold', color: '#475569' },
    input: { padding: '12px', borderRadius: '10px', border: '1px solid #CBD5E1', outline: 'none' },
    inputMedecin: { padding: '12px', borderRadius: '10px', border: '2px solid #2980B9', backgroundColor: '#F0F7FF', outline: 'none' },
    submitBtn: { backgroundColor: '#1A5276', color: 'white', padding: '15px', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', fontSize: '1rem', marginTop: '10px' }
};

export default Contact;