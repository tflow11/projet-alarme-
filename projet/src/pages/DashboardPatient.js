import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Html5QrcodeScanner } from "html5-qrcode";

// ─── PERSISTANCE LOCALE ───────────────────────────────────────────────────────
const STORAGE_KEY_PREFIX = 'prises_validees_';
const getStorageKey = (patientId) => `${STORAGE_KEY_PREFIX}${patientId}`;

const loadLocalValidations = (patientId) => {
    try {
        const raw = localStorage.getItem(getStorageKey(patientId));
        return raw ? JSON.parse(raw) : [];
    } catch { return []; }
};

const saveLocalValidations = (patientId, validations) => {
    try {
        localStorage.setItem(getStorageKey(patientId), JSON.stringify(validations));
    } catch {}
};

const DashboardPatient = () => {
    const [traitements, setTraitements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isAlarming, setIsAlarming] = useState(false);
    const [showScanner, setShowScanner] = useState(false);
    const [currentPrise, setCurrentPrise] = useState(null);
    const [audio] = useState(new Audio('/alarme.mp3'));
    const [isAudioUnlocked, setIsAudioUnlocked] = useState(false);
    const [prisesValidees, setPrisesValidees] = useState([]);
    const [alarmedPrises, setAlarmedPrises] = useState(new Set());
    const [showManualValidate, setShowManualValidate] = useState(null);

    const navigate = useNavigate();
    const patientId = localStorage.getItem('patientId');
    const patientNom = localStorage.getItem('patientNom');

    // ─── CALCUL DATE FIN ─────────────────────────────────────────────────────
    const getDateFin = (traitement) => {
        if (!traitement.date_debut || !traitement.duree) return new Date();
        const d = new Date(traitement.date_debut);
        d.setDate(d.getDate() + Number(traitement.duree) - 1);
        return d;
    };

    // ─── CHARGEMENT DONNÉES ──────────────────────────────────────────────────
    const fetchTraitements = useCallback(async () => {
        if (!patientId) return;
        try {
            const res = await axios.get(`http://localhost:8000/api/traitements/patient/${patientId}`);

            const serverValidations = res.data.prises_du_jour || [];
            const localValidations = loadLocalValidations(patientId);

            const merged = [...serverValidations];
            localValidations.forEach(lv => {
                const exists = merged.some(sv =>
                    String(sv.id_traitement) === String(lv.id_traitement) &&
                    String(sv.prise_numero).toLowerCase() === String(lv.prise_numero).toLowerCase()
                );
                if (!exists) merged.push(lv);
            });

            setPrisesValidees(merged);
            saveLocalValidations(patientId, merged);

            const rawData = Array.isArray(res.data.traitements)
                ? res.data.traitements
                : (Array.isArray(res.data) ? res.data : []);

            setTraitements(rawData.map(t => ({
                ...t,
                stock_restant: Number(t.stock_restant || 0)
            })));
        } catch (err) {
            const localValidations = loadLocalValidations(patientId);
            setPrisesValidees(localValidations);
            console.error("Erreur chargement:", err);
        } finally {
            setLoading(false);
        }
    }, [patientId]);

    // ─── VÉRIFICATION STATUT ─────────────────────────────────────────────────
    const checkValidationStatus = useCallback((traitementId, numPrise) => {
        if (!prisesValidees?.length) return false;
        const todayStr = new Date().toISOString().split('T')[0];
        const targetLabel = `prise ${numPrise}`;
        const simpleLabel = String(numPrise);

        return prisesValidees.some(p => {
            const sameId = String(p.id_traitement) === String(traitementId);
            const val = String(p.prise_numero).toLowerCase().trim();
            const sameNum = val === targetLabel || val === simpleLabel;
            const sameDay = !p.date || p.date.startsWith(todayStr);
            return sameId && sameNum && sameDay;
        });
    }, [prisesValidees]);

    useEffect(() => {
        if (!patientId) {
            navigate('/login-patient');
            return;
        }
        fetchTraitements();
    }, [patientId, navigate, fetchTraitements]);

    // ─── ARRÊT ALARME ────────────────────────────────────────────────────────
    const stopperAlarme = useCallback(() => {
        setIsAlarming(false);
        setShowScanner(false);
        setCurrentPrise(null);
        audio.pause();
        audio.currentTime = 0;
    }, [audio]);

    // ─── LOGIQUE ALARME ──────────────────────────────────────────────────────
    useEffect(() => {
        const checkAlarms = () => {
            const maintenant = new Date();
            traitements.forEach(t => {
                [1, 2, 3].forEach(i => {
                    const hStr = t[`heure${i}`]?.substring(0, 5);
                    if (!hStr || hStr === "00:00") return;

                    const dateDebut = new Date(t.date_debut);
                    dateDebut.setHours(0, 0, 0, 0);
                    const dateFin = getDateFin(t);
                    dateFin.setHours(23, 59, 59, 999);

                    if (maintenant < dateDebut || maintenant > dateFin) return;

                    const [h, m] = hStr.split(':');
                    const datePrise = new Date();
                    datePrise.setHours(parseInt(h), parseInt(m), 0, 0);
                    const dateLimite = new Date(datePrise.getTime() + 5 * 60000);

                    const dejaFait = checkValidationStatus(t.id, i);
                    const estDansLeTemps = maintenant >= datePrise && maintenant <= dateLimite;
                    const priseKey = `${t.id}-${i}-${hStr}`;

                    if (estDansLeTemps && !dejaFait && !alarmedPrises.has(priseKey) && !isAlarming) {
                        setAlarmedPrises(prev => new Set([...prev, priseKey]));
                        setCurrentPrise({
                            id: t.id,
                            num: `Prise ${i}`,
                            nom: t.medicament_nom,
                            qte: t[`qte${i}`],
                            unite: t.unite_med,
                            limite: dateLimite
                        });
                        setIsAlarming(true);
                        if (isAudioUnlocked) {
                            audio.loop = true;
                            audio.play().catch(() => {});
                        }
                    }

                    if (isAlarming && currentPrise?.id === t.id && currentPrise?.num === `Prise ${i}`) {
                        if (dejaFait || maintenant > dateLimite) stopperAlarme();
                    }
                });
            });
        };

        const interval = setInterval(checkAlarms, 3000);
        return () => clearInterval(interval);
    }, [traitements, audio, isAudioUnlocked, checkValidationStatus, isAlarming, currentPrise, stopperAlarme, alarmedPrises]);

    // ─── SCANNER QR ──────────────────────────────────────────────────────────
    useEffect(() => {
        let scanner = null;
        if (showScanner && currentPrise) {
            scanner = new Html5QrcodeScanner("reader", { fps: 10, qrbox: 250 });
            scanner.render(async (text) => {
                try {
                    await axios.post('http://localhost:8000/api/traitements/valider', {
                        id_traitement: currentPrise.id,
                        prise_numero: currentPrise.num,
                        code_scanne: text
                    });
                    validerPriseLocalement(currentPrise.id, currentPrise.num);
                    if (scanner) scanner.clear().catch(() => {});
                    stopperAlarme();
                    alert("✅ Médicament validé !");
                } catch (err) {
                    console.error("Erreur validation:", err);
                    alert("❌ Code QR incorrect ou erreur.");
                }
            }, () => {});
        }
        return () => { if (scanner) scanner.clear().catch(() => {}); };
    }, [showScanner, currentPrise, stopperAlarme]);

    // ─── VALIDATION LOCALE ───────────────────────────────────────────────────
    const validerPriseLocalement = useCallback((idTraitement, numPrise) => {
        const todayStr = new Date().toISOString().split('T')[0];
        const nouvelleValidation = {
            id_traitement: idTraitement,
            prise_numero: numPrise,
            date: todayStr
        };
        setPrisesValidees(prev => {
            const updated = [...prev, nouvelleValidation];
            saveLocalValidations(patientId, updated);
            return updated;
        });
        fetchTraitements();
    }, [patientId, fetchTraitements]);

    // ─── VALIDATION MANUELLE ─────────────────────────────────────────────────
    const validerManuellement = useCallback(async (traitement, numPrise) => {
        const priseNum = `Prise ${numPrise}`;
        try {
            await axios.post('http://localhost:8000/api/traitements/valider', {
                id_traitement: traitement.id,
                prise_numero: priseNum,
                code_scanne: 'MANUEL'
            });
        } catch {}
        validerPriseLocalement(traitement.id, priseNum);
        setShowManualValidate(null);
    }, [validerPriseLocalement]);

    // ─── STATUT D'UNE PRISE ──────────────────────────────────────────────────
    const getPriseStatus = useCallback((traitement, numPrise) => {
        const hStr = traitement[`heure${numPrise}`]?.substring(0, 5);
        if (!hStr || hStr === "00:00") return null;

        const [h, m] = hStr.split(':');
        const datePrise = new Date();
        datePrise.setHours(parseInt(h), parseInt(m), 0, 0);
        const dateLimite = new Date(datePrise.getTime() + 5 * 60000);
        const maintenant = new Date();

        const valide = checkValidationStatus(traitement.id, numPrise);
        if (valide) return 'valide';
        if (maintenant > dateLimite) return 'manquee_validable';
        if (maintenant >= datePrise) return 'en_cours';
        return 'en_attente';
    }, [checkValidationStatus]);

    if (loading) return <div style={styles.loader}>Chargement de votre espace santé...</div>;

    return (
        <div style={styles.page}>
            {/* Overlay Alarme */}
            {isAlarming && (
                <div style={styles.overlay}>
                    <div style={styles.alarmBox}>
                        <div style={styles.pulse}>🔔</div>
                        <h2 style={{ color: '#2c3e50' }}>C'EST L'HEURE !</h2>
                        <h3 style={{ color: '#2980b9' }}>{currentPrise?.nom}</h3>
                        <p>Dose : <b>{currentPrise?.qte} {currentPrise?.unite}</b></p>

                        {new Date() <= currentPrise?.limite ? (
                            !showScanner ? (
                                <button onClick={() => setShowScanner(true)} style={styles.btnScan}>
                                    📷 SCANNER LA BOUTEILLE
                                </button>
                            ) : (
                                <div id="reader" style={styles.scanner}></div>
                            )
                        ) : (
                            <div style={styles.errorMsg}>⚠️ Temps limite dépassé.</div>
                        )}

                        <button onClick={stopperAlarme} style={styles.btnIgnore}>Ignorer</button>
                    </div>
                </div>
            )}

            {/* Modal Validation Manuelle */}
            {showManualValidate && (
                <div style={styles.overlay}>
                    <div style={styles.alarmBox}>
                        <div style={{ fontSize: '3rem', marginBottom: '10px' }}>💊</div>
                        <h3 style={{ color: '#2c3e50' }}>Confirmer la prise</h3>
                        <p style={{ color: '#7f8c8d', marginBottom: '5px' }}>
                            <b>{showManualValidate.nom}</b>
                        </p>
                        <p style={{ color: '#7f8c8d' }}>{showManualValidate.label}</p>
                        <div style={styles.warningBox}>
                            ⚠️ Le délai de scan est dépassé.<br />
                            Vous pouvez confirmer manuellement.
                        </div>
                        <button
                            onClick={() => validerManuellement(showManualValidate.traitement, showManualValidate.num)}
                            style={{ ...styles.btnScan, background: '#27ae60', marginTop: '15px' }}
                        >
                            ✅ Confirmer la prise
                        </button>
                        <button onClick={() => setShowManualValidate(null)} style={styles.btnIgnore}>
                            Annuler
                        </button>
                    </div>
                </div>
            )}

            {/* Navbar */}
            <nav style={styles.nav}>
                <h2 style={{ margin: 0, color: '#2A6F97' }}>MaSanté 🏥</h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <span style={{ color: '#7f8c8d' }}>{patientNom}</span>
                    <button
                        onClick={() => { localStorage.clear(); navigate('/'); }}
                        style={styles.btnLogout}
                    >
                        Quitter
                    </button>
                </div>
            </nav>

            {/* Contenu Principal */}
            <div style={styles.container}>
                <header style={{ marginBottom: '30px' }}>
                    <h1 style={{ margin: 0 }}>Vos traitements du jour</h1>
                    <p style={{ color: '#7f8c8d', marginTop: '8px', fontSize: '0.9rem' }}>
                        Gérez vos prises quotidiennes
                    </p>
                </header>

                <div style={styles.grid}>
                    {traitements.map(t => {
                        const dateFin = getDateFin(t);
                        const joursRestants = Math.ceil((dateFin - new Date()) / (1000 * 60 * 60 * 24));

                        return (
                            <div
                                key={t.id}
                                style={styles.card}
                                onMouseEnter={e => {
                                    e.currentTarget.style.transform = 'translateY(-3px)';
                                    e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.1)';
                                }}
                                onMouseLeave={e => {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,0,0,0.05)';
                                }}
                            >
                                <div style={styles.cardHeader}>
                                    <div>
                                        <h3 style={{ margin: 0, color: '#2c3e50' }}>{t.medicament_nom}</h3>
                                        <p style={{ margin: '3px 0 0', fontSize: '0.8rem', color: '#7f8c8d' }}>
                                            Depuis le {new Date(t.date_debut).toLocaleDateString('fr-FR')}
                                            &nbsp;·&nbsp;
                                            {joursRestants > 0
                                                ? `${joursRestants} jour${joursRestants > 1 ? 's' : ''} restant${joursRestants > 1 ? 's' : ''}`
                                                : 'Terminé'
                                            }
                                        </p>
                                    </div>
                                    <span style={{
                                        padding: '4px 10px',
                                        borderRadius: '20px',
                                        fontSize: '0.8rem',
                                        backgroundColor: t.stock_restant < 5 ? '#fdeded' : '#e8f5e9',
                                        color: t.stock_restant < 5 ? '#e74c3c' : '#2ecc71',
                                        fontWeight: 'bold'
                                    }}>
                                        Stock: {t.stock_restant}
                                    </span>
                                </div>

                                <div style={styles.listPrises}>
                                    {[1, 2, 3].map(i => {
                                        const h = t[`heure${i}`];
                                        if (!h || h === "00:00:00" || h === "00:00") return null;
                                        const status = getPriseStatus(t, i);
                                        if (!status) return null;

                                        const cfg = {
                                            valide: { bg: '#e8f5e9', border: '#2ecc71', label: '✅ VALIDÉ', color: '#27ae60' },
                                            en_cours: { bg: '#fff3cd', border: '#f39c12', label: '🔔 EN COURS', color: '#e67e22' },
                                            manquee_validable: { bg: '#fdecea', border: '#e74c3c', label: '⚠️ VALIDER', color: '#e74c3c' },
                                            en_attente: { bg: '#f8f9fa', border: '#bdc3c7', label: '⏳ EN ATTENTE', color: '#7f8c8d' },
                                        }[status];

                                        return (
                                            <div
                                                key={i}
                                                style={{
                                                    ...styles.priseRow,
                                                    backgroundColor: cfg.bg,
                                                    borderLeft: `5px solid ${cfg.border}`,
                                                    cursor: status === 'manquee_validable' ? 'pointer' : 'default'
                                                }}
                                                onClick={status === 'manquee_validable' ? (e) => {
                                                    e.stopPropagation();
                                                    setShowManualValidate({
                                                        traitement: t,
                                                        num: i,
                                                        label: `Prise ${i}`,
                                                        nom: t.medicament_nom
                                                    });
                                                } : undefined}
                                            >
                                                <div>
                                                    <div style={{ fontWeight: 'bold' }}>{h.substring(0, 5)}</div>
                                                    <div style={{ fontSize: '0.85rem', color: '#7f8c8d' }}>
                                                        {t[`qte${i}`]} {t.unite_med}
                                                    </div>
                                                </div>
                                                <span style={{ color: cfg.color, fontWeight: 'bold', fontSize: '0.85rem' }}>
                                                    {cfg.label}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Bouton activation audio */}
            {!isAudioUnlocked && (
                <button 
                    onClick={() => {
                        setIsAudioUnlocked(true);
                        audio.play().then(() => audio.pause()).catch(() => {});
                    }} 
                    style={styles.audioPrompt}
                >
                    🔊 Activer les alertes sonores
                </button>
            )}
        </div>
    );
};

// ─── STYLES ───────────────────────────────────────────────────────────────────
const styles = {
    page:       { backgroundColor: '#f0f2f5', minHeight: '100vh', fontFamily: 'Segoe UI, sans-serif' },
    nav:        { display: 'flex', justifyContent: 'space-between', padding: '15px 5%', background: '#fff', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', alignItems: 'center' },
    container:  { padding: '30px 5%', maxWidth: '1200px', margin: '0 auto' },
    grid:       { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '25px' },
    card:       { background: '#fff', borderRadius: '15px', padding: '20px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', transition: 'transform 0.2s, box-shadow 0.2s' },
    cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', borderBottom: '1px solid #f0f2f5', paddingBottom: '12px' },
    listPrises: { display: 'flex', flexDirection: 'column', gap: '12px' },
    priseRow:   { display: 'flex', justifyContent: 'space-between', padding: '12px', borderRadius: '10px', alignItems: 'center' },
    overlay:    { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' },
    alarmBox:   { background: '#fff', padding: '40px', borderRadius: '25px', textAlign: 'center', width: '90%', maxWidth: '450px' },
    warningBox: { color: '#e67e22', background: '#fef9e7', padding: '12px', borderRadius: '8px', fontSize: '0.85rem', lineHeight: '1.5' },
    btnScan:    { background: '#2980b9', color: '#fff', border: 'none', padding: '15px', borderRadius: '10px', width: '100%', cursor: 'pointer', fontWeight: 'bold', fontSize: '1rem' },
    btnIgnore:  { background: 'none', border: 'none', color: '#95a5a6', marginTop: '20px', cursor: 'pointer', display: 'block', width: '100%', fontSize: '0.9rem' },
    btnLogout:  { background: '#e74c3c', color: '#fff', border: 'none', padding: '8px 15px', borderRadius: '8px', cursor: 'pointer' },
    errorMsg:   { color: '#e74c3c', background: '#fdeded', padding: '15px', borderRadius: '8px' },
    audioPrompt:{ position: 'fixed', bottom: 30, right: 30, padding: '15px 25px', borderRadius: '50px', background: '#2c3e50', color: '#fff', border: 'none', cursor: 'pointer' },
    pulse:      { fontSize: '4rem', marginBottom: '10px' },
    loader:     { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontSize: '1.1rem', color: '#7f8c8d' },
    scanner:    { marginTop: '20px', borderRadius: '15px', overflow: 'hidden', border: '2px solid #2980b9' },
};

export default DashboardPatient;