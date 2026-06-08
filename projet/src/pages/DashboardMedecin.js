import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const DashboardMedecin = () => {
    const navigate = useNavigate();

    const [patients, setPatients] = useState([]);
    const [medicaments, setMedicaments] = useState([]);
    const [traitements, setTraitements] = useState([]);
    const [rendezVous, setRendezVous] = useState([]);
    const [message, setMessage] = useState('');
    const [activeTab, setActiveTab] = useState('suivi');

    const [selectedTraitement, setSelectedTraitement] = useState(null);
    const [historique, setHistorique] = useState([]);
    const [loadingHistorique, setLoadingHistorique] = useState(false);

    const medecinId = localStorage.getItem('medecinId') || localStorage.getItem('userId');
    const medecinNom = localStorage.getItem('medecinNom') || localStorage.getItem('userName') || "Docteur";

    const [patientData, setPatientData] = useState({ nom: '', prenom: '', email: '', password: '' });
    const [formData, setFormData] = useState({
        id_patient: '', id_medicament: '', date_debut: '', duree: '',
        heure1: '', qte1: '', id_medecin: medecinId
    });

    // ── CHARGEMENT ───────────────────────────────────────────────────────────
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

    // ── HISTORIQUE ───────────────────────────────────────────────────────────
    const openHistorique = useCallback(async (traitement) => {
        setSelectedTraitement(traitement);
        setLoadingHistorique(true);
        setHistorique([]);

        let serverData = {};
        try {
            const res = await axios.get(
                `http://localhost:8000/api/traitements/historique/${traitement.id}`
            );
            (res.data || []).forEach(jour => {
                const dateStr = new Date(jour.date).toISOString().split('T')[0];
                serverData[dateStr] = jour.prises || [];
            });
        } catch { /* génération locale */ }

        const rawDate = (traitement.date_debut || '').split('T')[0];
        const [y, m, d] = rawDate.split('-').map(Number);
        const dateDebut = new Date(y, m - 1, d);
        dateDebut.setHours(0, 0, 0, 0);

        const dateFin = new Date(y, m - 1, d);
        dateFin.setDate(dateFin.getDate() + Number(traitement.duree) - 1);
        dateFin.setHours(23, 59, 59, 999);

        const finEffective = new Date(Math.min(dateFin.getTime(), new Date().getTime()));
        finEffective.setHours(23, 59, 59, 999);

        const jours = [];
        const cursor = new Date(dateDebut);

        while (cursor <= finEffective) {
            const cy = cursor.getFullYear();
            const cm = String(cursor.getMonth() + 1).padStart(2, '0');
            const cd = String(cursor.getDate()).padStart(2, '0');
            const dateStr = `${cy}-${cm}-${cd}`;

            const todayY = new Date().getFullYear();
            const todayM = String(new Date().getMonth() + 1).padStart(2, '0');
            const todayD = String(new Date().getDate()).padStart(2, '0');
            const todayStr = `${todayY}-${todayM}-${todayD}`;
            const isToday = dateStr === todayStr;

            const prises = [1, 2, 3]
                .filter(i => {
                    const h = traitement[`heure${i}`];
                    return h && h !== "00:00:00" && h !== "00:00";
                })
                .map(i => {
                    const heure = traitement[`heure${i}`].substring(0, 5);
                    const priseLabel = `Prise ${i}`;
                    const datePriseComplete = new Date(`${dateStr}T${heure}:00`);
                    const passee = datePriseComplete < new Date();

                    const serverPrises = serverData[dateStr] || [];
                    const serverMatch = serverPrises.find(p =>
                        String(p.prise_numero).toLowerCase() === priseLabel.toLowerCase()
                    );
                    const valideeServeur = serverMatch?.validee || false;
                    const valideeAujourdhui = isToday && traitement.is_valid === true;

                    let heureValidation = null;
                    if (isToday && traitement.scans_du_jour?.length > 0) {
                        const raw = traitement.scans_du_jour[0].date_validation;
                        heureValidation = new Date(new Date(raw).getTime() + 60 * 60 * 1000)
                            .toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
                    } else if (serverMatch?.heure_validation) {
                        heureValidation = serverMatch.heure_validation;
                    }

                    return {
                        heure,
                        qte: traitement[`qte${i}`],
                        unite: traitement.unite_med || '',
                        validee: valideeServeur || valideeAujourdhui,
                        heureValidation,
                        passee
                    };
                });

            if (prises.some(p => p.passee)) {
                jours.push({ date: dateStr, prises, isToday });
            }

            cursor.setDate(cursor.getDate() + 1);
        }

        jours.sort((a, b) => new Date(b.date) - new Date(a.date));
        setHistorique(jours);
        setLoadingHistorique(false);
    }, []);

    // ── STATS ────────────────────────────────────────────────────────────────
    const getObservanceStats = (jours) => {
        const total = jours.reduce((acc, j) => acc + j.prises.length, 0);
        const validees = jours.reduce((acc, j) => acc + j.prises.filter(p => p.validee).length, 0);
        const pct = total > 0 ? Math.round((validees / total) * 100) : 0;
        return { total, validees, manquees: total - validees, pct };
    };

    // ── ACTIONS ──────────────────────────────────────────────────────────────
    const handlePatientSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.post('http://localhost:8000/api/patients', patientData);
            setMessage("✅ Patient inscrit avec succès !");
            setPatientData({ nom: '', prenom: '', email: '', password: '' });
            loadData();
            setActiveTab('suivi');
        } catch { setMessage("❌ Erreur lors de l'inscription"); }
    };

    const handleDelete = async (id) => {
        if (window.confirm("🗑️ Supprimer définitivement cette prescription ?")) {
            try {
                await axios.delete(`http://localhost:8000/api/traitements/${id}`);
                setMessage("✅ Prescription supprimée");
                loadData();
            } catch { setMessage("❌ Erreur lors de la suppression"); }
        }
    };

    const handleValiderRDV = async (id) => {
        try {
            await axios.put(`http://localhost:8000/api/contact/rdv/${id}/valider`);
            setMessage("✅ RDV Confirmé");
            loadData();
        } catch { setMessage("❌ Erreur validation"); }
    };

    const handleSupprimerRDV = async (id) => {
        if (window.confirm("🗑️ Voulez-vous vraiment supprimer ce rendez-vous ?")) {
            try {
                await axios.delete(`http://localhost:8000/api/contact/rdv/${id}`);
                setMessage("✅ Rendez-vous supprimé");
                loadData();
            } catch { setMessage("❌ Erreur lors de la suppression du RDV"); }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.post('http://localhost:8000/api/traitements', formData);
            setMessage("✅ Prescription enregistrée avec succès !");
            setFormData({ id_patient: '', id_medicament: '', date_debut: '', duree: '', heure1: '', qte1: '', id_medecin: medecinId });
            loadData();
            setActiveTab('suivi');
        } catch { setMessage("❌ Erreur : Vérifiez les champs obligatoires"); }
    };

    // ── RENDER ───────────────────────────────────────────────────────────────
    return (
        <div style={styles.layout}>
            <style>{`
                .nav-item { transition: all 0.2s; cursor: pointer; }
                .nav-item:hover { background-color: #61A5C2 !important; color: white !important; }
                .tr-hover:hover { background-color: #f0f7ff !important; cursor: pointer; }
            `}</style>

            {/* ══ MODAL HISTORIQUE ════════════════════════════════════════════ */}
            {selectedTraitement && (
                <div style={styles.overlay} onClick={() => setSelectedTraitement(null)}>
                    <div style={styles.histModal} onClick={e => e.stopPropagation()}>
                        <div style={styles.histHeader}>
                            <div>
                                <h3 style={{ margin: 0, color: '#2c3e50' }}>
                                    💊 {selectedTraitement.medicament_nom}
                                </h3>
                                <p style={{ margin: '5px 0 0', color: '#7f8c8d', fontSize: '0.85rem' }}>
                                    👤 {selectedTraitement.patient_nom} {selectedTraitement.patient_prenom}
                                    &nbsp;·&nbsp;
                                    Début : {(() => {
                                        const [yy, mm, dd] = (selectedTraitement.date_debut || '').split('T')[0].split('-');
                                        return new Date(Number(yy), Number(mm) - 1, Number(dd))
                                            .toLocaleDateString('fr-FR');
                                    })()}
                                    &nbsp;·&nbsp;
                                    {selectedTraitement.duree} jour{selectedTraitement.duree > 1 ? 's' : ''}
                                </p>
                            </div>
                            <button onClick={() => setSelectedTraitement(null)} style={styles.btnClose}>✕</button>
                        </div>

                        {!loadingHistorique && historique.length > 0 && (() => {
                            const { validees, manquees, pct } = getObservanceStats(historique);
                            return (
                                <>
                                    <div style={styles.statsRow}>
                                        <div style={styles.statBox}>
                                            <span style={styles.statNum}>{historique.length}</span>
                                            <span style={styles.statLabel}>Jours</span>
                                        </div>
                                        <div style={styles.statBox}>
                                            <span style={{ ...styles.statNum, color: '#27ae60' }}>{validees}</span>
                                            <span style={styles.statLabel}>Validées</span>
                                        </div>
                                        <div style={styles.statBox}>
                                            <span style={{ ...styles.statNum, color: '#e74c3c' }}>{manquees}</span>
                                            <span style={styles.statLabel}>Manquées</span>
                                        </div>
                                        <div style={styles.statBox}>
                                            <span style={{
                                                ...styles.statNum,
                                                color: pct >= 80 ? '#27ae60' : pct >= 50 ? '#e67e22' : '#e74c3c'
                                            }}>{pct}%</span>
                                            <span style={styles.statLabel}>Observance</span>
                                        </div>
                                    </div>
                                    <div style={{ padding: '0 25px 12px' }}>
                                        <div style={styles.progressBar}>
                                            <div style={{
                                                ...styles.progressFill,
                                                width: `${pct}%`,
                                                background: pct >= 80 ? '#27ae60' : pct >= 50 ? '#e67e22' : '#e74c3c'
                                            }} />
                                        </div>
                                    </div>
                                </>
                            );
                        })()}

                        <div style={styles.histBody}>
                            {loadingHistorique ? (
                                <p style={{ textAlign: 'center', color: '#7f8c8d', padding: '40px 0' }}>
                                    ⏳ Chargement...
                                </p>
                            ) : historique.length === 0 ? (
                                <p style={{ textAlign: 'center', color: '#7f8c8d', padding: '40px 0' }}>
                                    Aucune prise enregistrée.
                                </p>
                            ) : (
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead>
                                        <tr style={{ background: '#f8f9fa' }}>
                                            <th style={styles.hth}>Date</th>
                                            <th style={styles.hth}>Heure prévue</th>
                                            <th style={styles.hth}>Validation</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {historique.map((jour, idx) =>
                                            jour.prises.map((p, j) => (
                                                <tr key={`${idx}-${j}`} style={{
                                                    borderBottom: '1px solid #f0f2f5',
                                                    background: j % 2 === 0 ? '#fff' : '#fafafa'
                                                }}>
                                                    <td style={styles.htd}>
                                                        {jour.isToday
                                                            ? <b>Aujourd'hui</b>
                                                            : new Date(jour.date + 'T12:00:00').toLocaleDateString('fr-FR', {
                                                                weekday: 'short', day: 'numeric', month: 'short', year: 'numeric'
                                                            })
                                                        }
                                                    </td>
                                                    <td style={styles.htd}>{p.heure}</td>
                                                    <td style={styles.htd}>
                                                        {p.validee
                                                            ? <span style={{ color: '#27ae60', fontWeight: 'bold' }}>
                                                                {p.heureValidation ? `✅ ${p.heureValidation}` : '✅'}
                                                              </span>
                                                            : <span style={{ color: '#e74c3c', fontWeight: 'bold', fontSize: '1.1rem' }}>✗</span>
                                                        }
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ══ SIDEBAR ═════════════════════════════════════════════════════ */}
            <aside style={styles.sidebar}>
                <div style={styles.brand}><h2>🏥 MaSanté Pro</h2></div>
                <nav style={styles.nav}>
                    {[
                        { key: 'suivi',       label: '📊 Observance' },
                        { key: 'rdv',         label: '📅 Rendez-vous' },
                        { key: 'prescription',label: '➕ Prescription' },
                        { key: 'inscription', label: '👤 Inscrire Patient' },
                    ].map(item => (
                        <div
                            key={item.key}
                            className="nav-item"
                            style={activeTab === item.key ? styles.navItemActive : styles.navItem}
                            onClick={() => setActiveTab(item.key)}
                        >
                            {item.label}
                        </div>
                    ))}
                    <button onClick={() => { localStorage.clear(); navigate('/'); }} style={styles.logoutBtn}>
                        Déconnexion
                    </button>
                </nav>
            </aside>

            {/* ══ MAIN ════════════════════════════════════════════════════════ */}
            <main style={styles.main}>
                <header style={styles.header}>
                    <h1 style={{ textTransform: 'capitalize' }}>{activeTab.replace('-', ' ')}</h1>
                    {message && <div style={styles.alert}>{message}</div>}
                </header>

                {/* ── TAB SUIVI ─────────────────────────────────────────────── */}
                {activeTab === 'suivi' && (
                    <div style={styles.card}>
                        <p style={{ color: '#7f8c8d', fontSize: '0.85rem', marginBottom: '20px', marginTop: 0 }}>
                            💡 Cliquez sur une ligne pour voir l'historique complet
                        </p>
                        <table style={styles.table}>
                            <thead>
                                <tr style={{ background: '#f8fafc' }}>
                                    <th style={styles.th}>Patient</th>
                                    <th style={styles.th}>Médicament</th>
                                    <th style={styles.th}>Début</th>
                                    <th style={styles.th}>Durée</th>
                                    <th style={styles.th}>Heure prévue</th>
                                    <th style={styles.th}>Heure réelle</th>
                                    <th style={styles.th}>Statut</th>
                                    <th style={styles.th}>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {traitements.length === 0 ? (
                                    <tr>
                                        <td colSpan="8" style={{ textAlign: 'center', padding: '30px', color: '#7f8c8d' }}>
                                            Aucun traitement enregistré.
                                        </td>
                                    </tr>
                                ) : traitements.map(t => {
                                    const validation = t.scans_du_jour?.length > 0
                                        ? t.scans_du_jour[0].date_validation : null;

                                    const [ty, tm, td] = (t.date_debut || '').split('T')[0].split('-').map(Number);
                                    const dateFin = new Date(ty, tm - 1, td);
                                    dateFin.setDate(dateFin.getDate() + Number(t.duree) - 1);
                                    const joursRestants = Math.ceil((dateFin - new Date()) / (1000 * 60 * 60 * 24));

                                    return (
                                        <tr
                                            key={t.id}
                                            className="tr-hover"
                                            style={styles.tr}
                                            onClick={() => openHistorique(t)}
                                        >
                                            <td style={styles.td}>
                                                <b>{t.patient_nom} {t.patient_prenom}</b>
                                            </td>
                                            <td style={styles.td}>{t.medicament_nom}</td>
                                            <td style={styles.td}>
                                                {new Date(ty, tm - 1, td).toLocaleDateString('fr-FR')}
                                            </td>
                                            <td style={styles.td}>
                                                <span style={{
                                                    fontSize: '0.82rem', fontWeight: 'bold',
                                                    color: joursRestants <= 0 ? '#7f8c8d'
                                                         : joursRestants <= 3 ? '#e67e22' : '#2A6F97'
                                                }}>
                                                    {joursRestants <= 0 ? 'Terminé' : `${joursRestants}j restants`}
                                                </span>
                                            </td>
                                            <td style={styles.td}>{t.heure1 ? t.heure1.substring(0, 5) : '-'}</td>
                                            <td style={styles.td}>
                                                {validation
                                                    ? <span style={{ color: '#2A6F97', fontWeight: 'bold' }}>
                                                        🕒 {new Date(new Date(validation).getTime() + 60 * 60 * 1000)
                                                            .toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                                      </span>
                                                    : <span style={{ color: '#999' }}>--:--</span>
                                                }
                                            </td>
                                            <td style={styles.td}>
                                                <span style={{
                                                    ...styles.statusBadge,
                                                    backgroundColor: t.is_valid ? '#2EC4B6' : '#E63946'
                                                }}>
                                                    {t.is_valid ? '✅ Pris' : '⏳ En attente'}
                                                </span>
                                            </td>
                                            <td style={styles.td}>
                                                <button
                                                    onClick={e => { e.stopPropagation(); handleDelete(t.id); }}
                                                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.1rem' }}
                                                    title="Supprimer"
                                                >🗑️</button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* ── TAB RENDEZ-VOUS ───────────────────────────────────────── */}
                {activeTab === 'rdv' && (
                    <div style={styles.card}>
                        <table style={styles.table}>
                            <thead>
                                <tr style={{ background: '#f8fafc' }}>
                                    <th style={styles.th}>Patient</th>
                                    <th style={styles.th}>Date & Heure</th>
                                    <th style={styles.th}>Statut</th>
                                    <th style={styles.th}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rendezVous.length === 0 ? (
                                    <tr>
                                        <td colSpan="4" style={{ textAlign: 'center', padding: '30px', color: '#7f8c8d' }}>
                                            Aucun rendez-vous pour le moment.
                                        </td>
                                    </tr>
                                ) : rendezVous.map(r => (
                                    <tr key={r.id} style={styles.tr}>
                                        <td style={styles.td}><b>{r.nom_client}</b></td>
                                        <td style={styles.td}>
                                            {new Date(r.date_rdv).toLocaleDateString('fr-FR', {
                                                day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
                                            })}
                                        </td>
                                        <td style={styles.td}>
                                            <span style={{
                                                ...styles.statusBadge,
                                                backgroundColor: r.statut === 'Confirmé' ? '#27ae60' : '#f39c12'
                                            }}>
                                                {r.statut}
                                            </span>
                                        </td>
                                        <td style={styles.td}>
                                            {r.statut !== 'Confirmé' && (
                                                <button 
                                                    onClick={() => handleValiderRDV(r.id)}
                                                    style={styles.actionBtnValider}
                                                >
                                                    Valider
                                                </button>
                                            )}
                                            <button 
                                                onClick={() => handleSupprimerRDV(r.id)}
                                                style={styles.actionBtnSupprimer}
                                            >
                                                Supprimer
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* ── TAB INSCRIPTION ───────────────────────────────────────── */}
                {activeTab === 'inscription' && (
                    <div style={styles.card}>
                        <h3>👤 Nouveau Patient</h3>
                        <form onSubmit={handlePatientSubmit} style={{ ...styles.grid, marginTop: '20px' }}>
                            <input type="text" placeholder="Nom" style={styles.input} value={patientData.nom} onChange={e => setPatientData({ ...patientData, nom: e.target.value })} required />
                            <input type="text" placeholder="Prénom" style={styles.input} value={patientData.prenom} onChange={e => setPatientData({ ...patientData, prenom: e.target.value })} required />
                            <input type="email" placeholder="Email" style={styles.input} value={patientData.email} onChange={e => setPatientData({ ...patientData, email: e.target.value })} required />
                            <input type="password" placeholder="Mot de passe" style={styles.input} value={patientData.password} onChange={e => setPatientData({ ...patientData, password: e.target.value })} required />
                            <button type="submit" style={{ ...styles.submitBtn, gridColumn: 'span 2' }}>Créer le compte</button>
                        </form>
                    </div>
                )}

                {/* ── TAB PRESCRIPTION ──────────────────────────────────────── */}
                {activeTab === 'prescription' && (
                    <div style={styles.card}>
                        <h3>💊 Nouvelle Prescription</h3>
                        <form onSubmit={handleSubmit} style={{ marginTop: '20px' }}>
                            <div style={styles.grid}>
                                <div style={styles.formGroup}>
                                    <label style={styles.label}>Patient *</label>
                                    <select style={styles.input} value={formData.id_patient} onChange={e => setFormData({ ...formData, id_patient: e.target.value })} required>
                                        <option value="">Choisir Patient</option>
                                        {patients.map(p => <option key={p.id} value={p.id}>{p.nom} {p.prenom}</option>)}
                                    </select>
                                </div>
                                <div style={styles.formGroup}>
                                    <label style={styles.label}>Médicament *</label>
                                    <select style={styles.input} value={formData.id_medicament} onChange={e => setFormData({ ...formData, id_medicament: e.target.value })} required>
                                        <option value="">Choisir Médicament</option>
                                        {medicaments.map(m => <option key={m.id} value={m.id}>{m.nom}</option>)}
                                    </select>
                                </div>
                                <div style={styles.formGroup}>
                                    <label style={styles.label}>Date début *</label>
                                    <input type="date" style={styles.input} value={formData.date_debut} onChange={e => setFormData({ ...formData, date_debut: e.target.value })} required />
                                </div>
                                <div style={styles.formGroup}>
                                    <label style={styles.label}>Durée (jours) *</label>
                                    <input type="number" style={styles.input} value={formData.duree} onChange={e => setFormData({ ...formData, duree: e.target.value })} required />
                                </div>
                                <div style={styles.formGroup}>
                                    <label style={styles.label}>Heure de prise *</label>
                                    <input type="time" style={styles.input} value={formData.heure1} onChange={e => setFormData({ ...formData, heure1: e.target.value })} required />
                                </div>
                                <div style={styles.formGroup}>
                                    <label style={styles.label}>Quantité *</label>
                                    <input type="number" style={styles.input} value={formData.qte1} onChange={e => setFormData({ ...formData, qte1: e.target.value })} required />
                                </div>
                            </div>
                            <button type="submit" style={{ ...styles.submitBtn, marginTop: '20px' }}>Enregistrer la prescription</button>
                        </form>
                    </div>
                )}
            </main>
        </div>
    );
};

// ── STYLES INLINE ────────────────────────────────────────────────────────────
const styles = {
    layout: { display: 'flex', minHeight: '100vh', backgroundColor: '#f4f6f9', fontFamily: 'Segoe UI, sans-serif' },
    sidebar: { width: '260px', backgroundColor: '#013A63', color: 'white', padding: '20px', display: 'flex', flexDirection: 'column' },
    brand: { textAlign: 'center', borderBottom: '1px solid #01497c', paddingBottom: '10px', marginBottom: '20px' },
    nav: { display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 },
    navItem: { padding: '12px 15px', borderRadius: '6px', color: '#e0e0e0', fontSize: '0.95rem' },
    navItemActive: { padding: '12px 15px', borderRadius: '6px', color: 'white', backgroundColor: '#2A6F97', fontWeight: 'bold' },
    logoutBtn: { marginTop: 'auto', backgroundColor: '#e63946', color: 'white', border: 'none', padding: '12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' },
    main: { flex: 1, padding: '30px', display: 'flex', flexDirection: 'column', gap: '20px' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e0e0e0', paddingBottom: '15px' },
    alert: { padding: '10px 20px', backgroundColor: '#e2f0d9', color: '#385723', borderRadius: '6px', fontWeight: 'bold' },
    card: { backgroundColor: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' },
    table: { width: '100%', borderCollapse: 'collapse', textAlign: 'left' },
    th: { padding: '14px', borderBottom: '2px solid #e2e8f0', color: '#4a5568', fontWeight: '600' },
    tr: { borderBottom: '1px solid #e2e8f0', transition: 'background 0.2s' },
    td: { padding: '14px', color: '#2d3748', verticalAlign: 'middle' },
    statusBadge: { padding: '5px 12px', borderRadius: '20px', color: 'white', fontSize: '0.8rem', fontWeight: 'bold' },
    grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' },
    formGroup: { display: 'flex', flexDirection: 'column', gap: '6px' },
    label: { fontSize: '0.9rem', fontWeight: 'bold', color: '#4a5568' },
    input: { padding: '10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '1rem' },
    submitBtn: { backgroundColor: '#2A6F97', color: 'white', border: 'none', padding: '12px 25px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1rem' },
    actionBtnValider: { backgroundColor: '#27ae60', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', marginRight: '8px', fontWeight: 'bold' },
    actionBtnSupprimer: { backgroundColor: '#e74c3c', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' },
    overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
    histModal: { backgroundColor: 'white', width: '550px', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.15)', display: 'flex', flexDirection: 'column', maxHeight: '85vh' },
    histHeader: { padding: '20px 25px', borderBottom: '1px solid #eef2f5', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' },
    btnClose: { background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: '#95a5a6' },
    statsRow: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', padding: '20px 25px 10px' },
    statBox: { backgroundColor: '#f8f9fa', padding: '12px', borderRadius: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center' },
    statNum: { fontSize: '1.3rem', fontWeight: 'bold', color: '#2c3e50' },
    statLabel: { fontSize: '0.75rem', color: '#7f8c8d', marginTop: '4px' },
    progressBar: { width: '100%', height: '6px', backgroundColor: '#f0f2f5', borderRadius: '3px', overflow: 'hidden' },
    progressFill: { height: '100%', transition: 'width 0.3s ease' },
    histBody: { padding: '10px 25px 25px', overflowY: 'auto', flex: 1 },
    hth: { padding: '10px', textAlign: 'left', color: '#7f8c8d', fontSize: '0.85rem', fontWeight: '600', borderBottom: '1px solid #eef2f5' },
    htd: { padding: '12px 10px', color: '#2c3e50', fontSize: '0.9rem' }
};

export default DashboardMedecin;