import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const DashboardMedecin = () => {
    const navigate = useNavigate();
    
    // --- ÉTATS ---
    const [patients, setPatients] = useState([]);
    const [medicaments, setMedicaments] = useState([]);
    const [traitements, setTraitements] = useState([]);
    const [rendezVous, setRendezVous] = useState([]);
    const [message, setMessage] = useState('');
    const [activeTab, setActiveTab] = useState('suivi');

    const medecinId = localStorage.getItem('medecinId') || localStorage.getItem('userId');
    const medecinNom = localStorage.getItem('medecinNom') || localStorage.getItem('userName') || "Docteur";

    const [patientData, setPatientData] = useState({ nom: '', prenom: '', email: '', password: '' });
    const [formData, setFormData] = useState({
        id_patient: '',
        id_medicament: '',
        date_debut: '',
        duree: '',
        heure1: '', qte1: '',
        
        id_medecin: medecinId
    });

    const loadData = useCallback(async () => {
        if (!medecinId) return;
        try {
            const resDep = await axios.get('http://localhost:8000/api/dependencies');
            setPatients(resDep.data.patients);
            setMedicaments(resDep.data.medicaments);

            const resTrait = await axios.get(`http://localhost:8000/api/traitements?id_medecin=${medecinId}`);
            setTraitements(resTrait.data);

            const resRDV = await axios.get('http://localhost:8000/api/contact/rdv');
            const cleanSearchName = medecinNom.replace(/Dr\.\s*/i, '').toLowerCase().trim();
            
            const mesRDV = resRDV.data.filter(r => {
                const nomDansBDD = (r.nom_medecin || r.medecin_nom || "").toLowerCase().trim();
                return nomDansBDD.includes(cleanSearchName);
            });

            setRendezVous(mesRDV);
        } catch (err) { console.error("Erreur chargement", err); }
    }, [medecinId, medecinNom]);

    useEffect(() => {
        if (!medecinId) { navigate('/'); return; }
        loadData();
    }, [medecinId, loadData, navigate]);

    const handlePatientSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.post('http://localhost:8000/api/patients', patientData);
            setMessage("✅ Patient inscrit avec succès !");
            setPatientData({ nom: '', prenom: '', email: '', password: '' });
            loadData();
            setActiveTab('suivi');
        } catch (err) { setMessage("❌ Erreur lors de l'inscription"); }
    };

    const handleDelete = async (id) => {
        if (window.confirm("🗑️ Supprimer définitivement cette prescription ?")) {
            try {
                await axios.delete(`http://localhost:8000/api/traitements/${id}`);
                setMessage("✅ Prescription supprimée");
                loadData();
            } catch (err) { setMessage("❌ Erreur lors de la suppression"); }
        }
    };

    const handleValiderRDV = async (id) => {
        try {
            await axios.put(`http://localhost:8000/api/contact/rdv/${id}/valider`);
            setMessage("✅ RDV Confirmé");
            loadData();
        } catch (err) { setMessage("❌ Erreur validation"); }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.post('http://localhost:8000/api/traitements', formData);
            setMessage("✅ Prescription enregistrée avec succès !");
            setFormData({
                id_patient: '', id_medicament: '', date_debut: '', duree: '',
                heure1: '', qte1: '',
                id_medecin: medecinId
            });
            loadData();
            setActiveTab('suivi');
        } catch (err) { setMessage("❌ Erreur : Vérifiez les champs obligatoires"); }
    };

    return (
        <div style={styles.layout}>
            <style>{`
                .nav-item { transition: all 0.2s; cursor: pointer; }
                .nav-item:hover { background-color: #61A5C2 !important; color: white !important; }
                .btn-delete:hover { transform: scale(1.2); color: #EF4444 !important; }
            `}</style>

            <aside style={styles.sidebar}>
                <div style={styles.brand}><h2>🏥 MaSanté Pro</h2></div>
                <nav style={styles.nav}>
                    <div className="nav-item" style={activeTab === 'suivi' ? styles.navItemActive : styles.navItem} onClick={() => setActiveTab('suivi')}>📊 Observance</div>
                    <div className="nav-item" style={activeTab === 'rdv' ? styles.navItemActive : styles.navItem} onClick={() => setActiveTab('rdv')}>📅 Rendez-vous</div>
                    <div className="nav-item" style={activeTab === 'prescription' ? styles.navItemActive : styles.navItem} onClick={() => setActiveTab('prescription')}>➕ Prescription</div>
                    <div className="nav-item" style={activeTab === 'inscription' ? styles.navItemActive : styles.navItem} onClick={() => setActiveTab('inscription')}>👤 Inscrire Patient</div>
                    <button onClick={() => {localStorage.clear(); navigate('/');}} style={styles.logoutBtn}>Déconnexion</button>
                </nav>
            </aside>

            <main style={styles.main}>
                <header style={styles.header}>
                    <h1 style={{textTransform: 'capitalize'}}>{activeTab.replace('-', ' ')}</h1>
                    {message && <div style={styles.alert}>{message}</div>}
                </header>

                {/* TAB: SUIVI (OBSERVANCE) */}
                {activeTab === 'suivi' && (
                    <div style={styles.card}>
                        <table style={styles.table}>
                            <thead>
                                <tr style={styles.thRow}>
                                    <th style={styles.th}>Patient</th>
                                    <th style={styles.th}>Médicament</th>
                                    <th style={styles.th}>Heure Prévue</th>
                                    <th style={styles.th}>Heure Réelle</th>
                                    <th style={styles.th}>Statut</th>
                                    <th style={styles.th}>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {traitements.map(t => {
                                    const validation = t.scans_du_jour && t.scans_du_jour.length > 0 
                                        ? t.scans_du_jour[0].date_validation 
                                        : null;

                                    return (
                                        <tr key={t.id} style={styles.tr}>
                                            <td style={styles.td}><b>{t.patient_nom} {t.patient_prenom}</b></td>
                                            <td style={styles.td}>{t.medicament_nom}</td>
                                            <td style={styles.td}>{t.heure1 ? t.heure1.substring(0,5) : '-'}</td>
                                        <td style={styles.td}>
                                                {validation ? (
                                                    <span style={{color: '#2A6F97', fontWeight: 'bold'}}>
                                                        🕒 {new Date(new Date(validation).getTime() + (60 * 60 * 1000)).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                ) : <span style={{color: '#999'}}>--:--</span>}
                                            </td>
                                            <td style={styles.td}>
                                                <span style={{
                                                    ...styles.statusBadge, 
                                                    backgroundColor: t.is_valid ? '#2EC4B6' : '#E63946'
                                                }}>
                                                    {t.is_valid ? 'Pris' : 'En attente'}
                                                </span>
                                            </td>
                                            <td style={styles.td}>
                                                <button onClick={() => handleDelete(t.id)} style={{background: 'none', border: 'none', cursor: 'pointer'}}>🗑️</button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* TAB: INSCRIPTION PATIENT */}
                {activeTab === 'inscription' && (
                    <div style={styles.card}>
                        <h3>👤 Nouveau Patient</h3>
                        <form onSubmit={handlePatientSubmit} style={{...styles.grid, marginTop: '20px'}}>
                            <input type="text" placeholder="Nom" style={styles.input} value={patientData.nom} onChange={e => setPatientData({...patientData, nom: e.target.value})} required />
                            <input type="text" placeholder="Prénom" style={styles.input} value={patientData.prenom} onChange={e => setPatientData({...patientData, prenom: e.target.value})} required />
                            <input type="email" placeholder="Email" style={styles.input} value={patientData.email} onChange={e => setPatientData({...patientData, email: e.target.value})} required />
                            <input type="password" placeholder="Mot de passe" style={styles.input} value={patientData.password} onChange={e => setPatientData({...patientData, password: e.target.value})} required />
                            <button type="submit" style={{...styles.submitBtn, gridColumn: 'span 2'}}>Créer le compte</button>
                        </form>
                    </div>
                )}

                {/* TAB: PRESCRIPTION (AMÉLIORÉ AVEC 3 PRISES) */}
                {activeTab === 'prescription' && (
                    <div style={styles.card}>
                        <h3>💊 Nouvelle Prescription</h3>
                        <form onSubmit={handleSubmit} style={{marginTop: '20px'}}>
                            <div style={styles.grid}>
                                <div style={styles.formGroup}>
                                    <label style={styles.label}>Patient *</label>
                                    <select style={styles.input} value={formData.id_patient} onChange={e => setFormData({...formData, id_patient: e.target.value})} required>
                                        <option value="">Choisir Patient</option>
                                        {patients.map(p => <option key={p.id} value={p.id}>{p.nom} {p.prenom}</option>)}
                                    </select>
                                </div>
                                <div style={styles.formGroup}>
                                    <label style={styles.label}>Médicament *</label>
                                    <select style={styles.input} value={formData.id_medicament} onChange={e => setFormData({...formData, id_medicament: e.target.value})} required>
                                        <option value="">Choisir Médicament</option>
                                        {medicaments.map(m => <option key={m.id} value={m.id}>{m.nom}</option>)}
                                    </select>
                                </div>
                                <div style={styles.formGroup}><label style={styles.label}>Date début</label><input type="date" style={styles.input} value={formData.date_debut} onChange={e => setFormData({...formData, date_debut: e.target.value})} required /></div>
                                <div style={styles.formGroup}><label style={styles.label}>Durée (jours)</label><input type="number" style={styles.input} value={formData.duree} onChange={e => setFormData({...formData, duree: e.target.value})} required /></div>
                                
                                <hr style={{gridColumn: 'span 2', width: '100%', margin: '10px 0'}} />
                                
                                {/* Prise 1 */}
                                <div style={styles.formGroup}><label style={styles.label}>Heure 1</label><input type="time" style={styles.input} value={formData.heure1} onChange={e => setFormData({...formData, heure1: e.target.value})} required /></div>
                                <div style={styles.formGroup}><label style={styles.label}>Qté 1</label><input type="number" step="0.5" style={styles.input} value={formData.qte1} onChange={e => setFormData({...formData, qte1: e.target.value})} required /></div>
                                


                                <button type="submit" style={{...styles.submitBtn, gridColumn: 'span 2', marginTop: '20px'}}>🚀 Envoyer l'ordonnance</button>
                            </div>
                        </form>
                    </div>
                )}

                {/* TAB: RENDEZ-VOUS */}
                {activeTab === 'rdv' && (
                    <div style={styles.card}>
                        <table style={styles.table}>
                            <thead>
                                <tr style={styles.thRow}>
                                    <th style={styles.th}>Patient</th>
                                    <th style={styles.th}>Date & Heure</th>
                                    <th style={styles.th}>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rendezVous.length > 0 ? rendezVous.map(r => (
                                    <tr key={r.id} style={styles.tr}>
                                        <td style={styles.td}><b>{r.nom_client || r.nom}</b></td>
                                        <td style={styles.td}>{new Date(r.date_rdv || r.date).toLocaleString('fr-FR')}</td>
                                        <td style={styles.td}>
                                            {r.statut === 'En attente' || !r.statut ? (
                                                <button style={{...styles.submitBtn, backgroundColor: '#10B981'}} onClick={() => handleValiderRDV(r.id)}>Confirmer</button>
                                            ) : <span style={{color: '#10B981', fontWeight: 'bold'}}>✓ Confirmé</span>}
                                        </td>
                                    </tr>
                                )) : (
                                    <tr><td colSpan="4" style={{textAlign:'center', padding:'20px'}}>Aucun rendez-vous trouvé.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </main>
        </div>
    );
};

// --- STYLES ---
const styles = {
    layout: { display: 'flex', minHeight: '100vh', backgroundColor: '#F0F4F8' },
    sidebar: { width: '250px', backgroundColor: '#2A6F97', color: 'white', padding: '20px', position: 'fixed', height: '100vh' },
    brand: { textAlign: 'center', marginBottom: '20px' },
    nav: { display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '30px' },
    navItem: { padding: '12px', borderRadius: '8px' },
    navItemActive: { padding: '12px', backgroundColor: 'white', color: '#2A6F97', fontWeight: 'bold', borderRadius: '8px' },
    main: { marginLeft: '250px', flex: 1, padding: '40px' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' },
    card: { backgroundColor: 'white', padding: '30px', borderRadius: '15px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' },
    grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' },
    formGroup: { display: 'flex', flexDirection: 'column', gap: '5px' },
    label: { fontSize: '0.85rem', fontWeight: 'bold', color: '#4A5568' },
    input: { padding: '12px', borderRadius: '8px', border: '1px solid #DDD', fontSize: '0.9rem' },
    submitBtn: { padding: '10px 15px', backgroundColor: '#2A6F97', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' },
    logoutBtn: { marginTop: '40px', padding: '12px', backgroundColor: '#EF4444', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' },
    table: { width: '100%', borderCollapse: 'collapse' },
    th: { textAlign: 'left', padding: '15px', borderBottom: '2px solid #EEE', color: '#2A6F97' },
    td: { padding: '15px', borderBottom: '1px solid #EEE' },
    statusBadge: { padding: '5px 12px', borderRadius: '20px', color: 'white', fontSize: '0.8rem' },
    alert: { padding: '15px', backgroundColor: '#10B981', color: 'white', borderRadius: '8px' }
};

export default DashboardMedecin;








