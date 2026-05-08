import React from 'react';
import { useNavigate } from 'react-router-dom';

const Home = () => {
    const navigate = useNavigate();

    return (
        <div style={styles.container}>
            {/* INJECTION DU CSS POUR LE HOVER ET LES ANIMATIONS */}
            <style>
                {`
                .btn-hover:hover {
                    transform: translateY(-3px);
                    box-shadow: 0 8px 20px rgba(42, 111, 151, 0.4) !important;
                    filter: brightness(1.1);
                }
                .card-hover:hover {
                    transform: translateY(-10px);
                    box-shadow: 0 15px 30px rgba(0,0,0,0.1) !important;
                    border-color: #2A6F97 !important;
                }
                .menu-hover:hover {
                    background-color: #FFFFFF !important;
                    color: #2A6F97 !important;
                }
                @keyframes float {
                    0% { transform: translateY(0px); }
                    50% { transform: translateY(-15px); }
                    100% { transform: translateY(0px); }
                }
                .floating {
                    animation: float 4s ease-in-out infinite;
                }
                `}
            </style>

            {/* BARRE DE NAVIGATION */}
            <nav style={styles.navbar}>
                <div style={styles.logo}>
                    <span style={styles.iconLogo}>🏥</span> MaSanté
                </div>
                <div style={styles.segmentedMenu}>
                    <button className="menu-hover" style={styles.menuItem} onClick={() => navigate('/login-medecin')}>👨‍⚕️ Médecin</button>
                    <button className="menu-hover" style={styles.menuItem} onClick={() => navigate('/login-patient')}>🩹 Patient</button>
                    <button className="menu-hover" style={styles.menuItem} onClick={() => navigate('/contact')}>🆘 CONTACT</button>
                </div>
            </nav>

            {/* SECTION HERO - FOND BLEU MÉDICAL */}
            <header style={styles.heroSegment}>
                <div style={styles.heroContent}>
                    <div style={styles.badge}>Plateforme CHU Intégrée</div>
                    <h1 style={styles.mainTitle}>Votre santé,<br/><span style={{color: '#2A6F97'}}>notre priorité.</span></h1>
                    <p style={styles.subtitle}>
                        Gérez vos traitements et communiquez avec votre medecin  en toute sécurité via notre portail intelligent.
                    </p>
                    <div style={styles.ctaGroup}>
                        <button className="btn-hover" style={styles.btnPrimary} onClick={() => navigate('/login-patient')}>
                            Accéder à mon suivi
                        </button>
                        
                    </div>
                </div>
                <div style={styles.heroImage}>
                    <div className="floating" style={styles.abstractCircle}>🛡️</div>
                </div>
            </header>

            {/* SECTION SERVICES */}
            <section style={styles.servicesSegment}>
                <div style={styles.sectionHeader}>
                    <h2 style={styles.sectionTitle}>Nos Services Numériques</h2>
                    <p style={{color: '#64748B'}}>Une technologie au service de votre observance thérapeutique</p>
                </div>

                <div style={styles.grid}>
                    <div className="card-hover" style={styles.segmentCard} onClick={() => navigate('/login-patient')}>
                        <div style={{...styles.cardIcon, backgroundColor: '#E0F2F1', color: '#26A69A'}}>📅</div>
                        <h3>Suivi Quotidien</h3>
                        <p style={styles.cardText}>Recevez des rappels et validez vos prises de médicaments en un clic.</p>
                    </div>

                    <div className="card-hover" style={styles.segmentCard} onClick={() => navigate('/login-medecin')}>
                        <div style={{...styles.cardIcon, backgroundColor: '#E1F5FE', color: '#039BE5'}}>📊</div>
                        <h3>place medecin</h3>
                        <p style={styles.cardText}>pour que le medecin peux voir leur dashboard.</p>
                    </div>

                    <div className="card-hover" style={styles.segmentCard} onClick={() => navigate('/contact')}>
                        <div style={{...styles.cardIcon, backgroundColor: '#FFEBEE', color: '#E53935'}}>📞</div>
                        <h3>Contact Direct</h3>
                        <p style={styles.cardText}>En cas de doute ou pour un RDV, contactez le cabinet médical.</p>
                    </div>
                </div>
            </section>

            {/* FOOTER & SÉCURITÉ */}
            <footer style={styles.footer}>
                <div style={styles.securityBox}>
                    <span>🔒</span> <strong>Confidentialité HDS :</strong> Données chiffrées et sécurisées.
                </div>
                <p>&copy; 2026 MaSanté Connect - Centre Hospitalier Universitaire</p>
            </footer>
        </div>
    );
};

// --- TOUS LES STYLES ---
const styles = {
    container: {
        fontFamily: "'Inter', 'Segoe UI', sans-serif",
        backgroundColor: '#FFFFFF',
        minHeight: '100vh',
        color: '#1A202C',
    },
    navbar: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '20px 8%',
        backgroundColor: '#FFF',
        position: 'sticky',
        top: 0,
        zIndex: 1000,
        borderBottom: '1px solid #E2E8F0',
    },
    logo: {
        fontSize: '1.5rem',
        fontWeight: '800',
        color: '#2A6F97',
        display: 'flex',
        alignItems: 'center',
        gap: '10px'
    },
    iconLogo: { fontSize: '1.8rem' },
    segmentedMenu: {
        display: 'flex',
        backgroundColor: '#EBF8FF',
        padding: '5px',
        borderRadius: '14px',
        gap: '5px',
    },
    menuItem: {
        padding: '10px 22px',
        border: 'none',
        background: 'transparent',
        borderRadius: '10px',
        cursor: 'pointer',
        fontWeight: '600',
        color: '#4A5568',
        transition: 'all 0.3s ease',
        fontSize: '0.9rem',
    },
    heroSegment: {
        padding: '100px 8%',
        background: 'linear-gradient(135deg, #EBF8FF 0%, #C3E8FF 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        overflow: 'hidden',
    },
    heroContent: { maxWidth: '650px' },
    badge: {
        backgroundColor: '#FFFFFF',
        color: '#2A6F97',
        padding: '8px 16px',
        borderRadius: '30px',
        fontSize: '0.85rem',
        fontWeight: '700',
        marginBottom: '20px',
        display: 'inline-block',
        boxShadow: '0 4px 10px rgba(0,0,0,0.05)',
    },
    mainTitle: { fontSize: '3.8rem', fontWeight: '800', lineHeight: '1.1', color: '#1A365D', marginBottom: '24px' },
    subtitle: { fontSize: '1.25rem', color: '#4A5568', lineHeight: '1.6', marginBottom: '35px' },
    ctaGroup: { display: 'flex', gap: '15px' },
    btnPrimary: {
        backgroundColor: '#2A6F97', color: 'white', padding: '18px 35px', border: 'none',
        borderRadius: '14px', fontWeight: 'bold', cursor: 'pointer', fontSize: '1rem',
        transition: 'all 0.3s ease', boxShadow: '0 4px 12px rgba(42, 111, 151, 0.2)'
    },
    btnSecondary: {
        backgroundColor: 'rgba(255,255,255,0.7)', color: '#2A6F97', padding: '18px 35px', border: '2px solid #2A6F97',
        borderRadius: '14px', fontWeight: 'bold', cursor: 'pointer', fontSize: '1rem',
        transition: 'all 0.3s ease', backdropFilter: 'blur(5px)'
    },
    heroImage: { display: 'flex', justifyContent: 'center', alignItems: 'center' },
    abstractCircle: {
        width: '160px', height: '160px', borderRadius: '50%', background: '#FFF',
        display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '4.5rem',
        boxShadow: '0 25px 50px rgba(42, 111, 151, 0.2)'
    },
    servicesSegment: { padding: '100px 8%', textAlign: 'center' },
    sectionHeader: { marginBottom: '60px' },
    sectionTitle: { fontSize: '2.5rem', fontWeight: '800', color: '#1A365D', marginBottom: '10px' },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '35px' },
    segmentCard: {
        padding: '45px', borderRadius: '28px', backgroundColor: '#FFF',
        border: '1px solid #E2E8F0', transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)', 
        cursor: 'pointer', textAlign: 'left',
    },
    cardIcon: {
        width: '60px', height: '60px', borderRadius: '15px', display: 'flex',
        justifyContent: 'center', alignItems: 'center', fontSize: '1.8rem', marginBottom: '25px'
    },
    cardText: { color: '#718096', lineHeight: '1.5' },
    footer: {
        padding: '60px 8% 40px', textAlign: 'center', color: '#A0AEC0',
        fontSize: '0.9rem', backgroundColor: '#F8FAFC', borderTop: '1px solid #E2E8F0'
    },
    securityBox: {
        marginBottom: '20px', color: '#4A5568', display: 'inline-block',
        padding: '10px 20px', borderRadius: '12px', background: '#EBF8FF'
    }
};

export default Home;