import React, { useState, useEffect } from 'react';
import { db, auth } from './firebase';
import { collection, addDoc, onSnapshot, query, where } from 'firebase/firestore';
import { GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import './App.css';

function App() {
  const [pantalla, setPantalla] = useState('inicio');
  const [materias, setMaterias] = useState([]);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [nuevaMateria, setNuevaMateria] = useState({ nombre: '', parcial: '', final: '' });
  const [guardando, setGuardando] = useState(false);
  const [usuario, setUsuario] = useState(null);
  const [cargandoAuth, setCargandoAuth] = useState(true);

  // Escuchar estado de sesión
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setUsuario(user);
      setCargandoAuth(false);
    });
    return () => unsub();
  }, []);

  // Cargar materias solo del usuario logueado
  useEffect(() => {
    if (!usuario) return;
    const q = query(collection(db, 'materias'), where('uid', '==', usuario.uid));
    const unsub = onSnapshot(q, (snap) => {
      setMaterias(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, [usuario]);

  const loginConGoogle = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const cerrarSesion = async () => {
    await signOut(auth);
    setMaterias([]);
  };

  const agregarMateria = async () => {
    if (!nuevaMateria.nombre || !usuario) return;
    setGuardando(true);
    await addDoc(collection(db, 'materias'), {
      ...nuevaMateria,
      uid: usuario.uid,       // ← vinculada al usuario
      progreso: 0,
      creadoEn: new Date()
    });
    setNuevaMateria({ nombre: '', parcial: '', final: '' });
    setMostrarForm(false);
    setGuardando(false);
  };

  const diasRestantes = (fecha) => {
    if (!fecha) return null;
    const hoy = new Date();
    const f = new Date(fecha);
    const diff = Math.ceil((f - hoy) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const colorDias = (dias) => {
    if (dias <= 7) return { bg: '#FAEEDA', color: '#854F0B' };
    if (dias <= 14) return { bg: '#E1F5EE', color: '#0F6E56' };
    return { bg: '#EEEDFE', color: '#534AB7' };
  };

  // Pantalla de carga inicial
  if (cargandoAuth) {
    return (
      <div style={estilos.contenedor}>
        <div style={estilos.phone}>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888', fontSize: 14 }}>
            Cargando...
          </div>
        </div>
      </div>
    );
  }

  // Pantalla de login
  if (!usuario) {
    return (
      <div style={estilos.contenedor}>
        <div style={estilos.phone}>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 32, gap: 24 }}>
            <div style={{ fontSize: 48 }}>📚</div>
            <div style={{ fontSize: 24, fontWeight: 600, color: '#222', textAlign: 'center' }}>StudyFlow</div>
            <div style={{ fontSize: 14, color: '#888', textAlign: 'center', lineHeight: 1.5 }}>
              Tu compañero de estudio universitario. Organizá tus materias, seguí tu progreso y competí con amigos.
            </div>
            <button style={estilos.btnGoogle} onClick={loginConGoogle}>
              <span style={{ fontSize: 18 }}>G</span>
              Continuar con Google
            </button>
          </div>
        </div>
      </div>
    );
  }

  const nombreCorto = usuario.displayName?.split(' ')[0] || 'vos';

  return (
    <div style={estilos.contenedor}>
      <div style={estilos.phone}>

        {pantalla === 'inicio' && (
          <div style={estilos.contenido}>
            <div style={estilos.header}>
              <div>
                <div style={estilos.saludo}>Hola, {nombreCorto} 👋</div>
                <div style={estilos.titulo}>Mi semana</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <img
                  src={usuario.photoURL}
                  alt="avatar"
                  style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' }}
                  onError={e => { e.target.style.display = 'none'; }}
                />
                <button style={estilos.btnLogout} onClick={cerrarSesion}>Salir</button>
              </div>
            </div>

            <div style={estilos.rachaBox}>
              <div style={estilos.rachaNum}>🔥 1</div>
              <div>
                <div style={estilos.rachaLabel}>día de racha</div>
                <div style={estilos.rachaSub}>¡Empezaste hoy!</div>
              </div>
              <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                <div style={estilos.nivel}>Nivel 1</div>
                <div style={estilos.nivelSub}>Principiante</div>
              </div>
            </div>

            <div style={estilos.xpSection}>
              <div style={estilos.xpRow}><span>XP esta semana</span><span>0 / 500</span></div>
              <div style={estilos.xpTrack}><div style={{ ...estilos.xpFill, width: '0%' }}></div></div>
            </div>

            {materias.length === 0 ? (
              <div style={estilos.todayBlock}>
                <div style={estilos.todayTitle}>Hoy — sin tareas cargadas</div>
                <div style={estilos.taskRow}>
                  <div style={{ ...estilos.taskDot, background: '#534AB7' }}></div>
                  <span style={{ color: '#888', fontSize: 13 }}>Agregá tus materias para ver tus tareas acá</span>
                </div>
              </div>
            ) : (
              <div style={estilos.todayBlock}>
                <div style={estilos.todayTitle}>Tus materias cargadas</div>
                {materias.map(m => (
                  <div key={m.id} style={estilos.taskRow}>
                    <div style={{ ...estilos.taskDot, background: '#534AB7' }}></div>
                    <span style={{ fontSize: 13, color: '#222' }}>{m.nombre}</span>
                    {m.parcial && (() => { const d = diasRestantes(m.parcial); const c = colorDias(d); return d >= 0 ? <span style={{ marginLeft: 'auto', fontSize: 11, background: c.bg, color: c.color, padding: '2px 8px', borderRadius: 99, fontWeight: 500 }}>Parcial en {d}d</span> : null; })()}
                  </div>
                ))}
              </div>
            )}

            <div style={estilos.aiBubble}>
              <div style={estilos.aiIcon}>✨</div>
              <div style={estilos.aiText}>
                {materias.length === 0
                  ? <><strong>Bienvenida a StudyFlow.</strong> Cargá tus materias para que pueda ayudarte a planificar tu semana.</>
                  : <><strong>Vas bien.</strong> Tenés {materias.length} {materias.length === 1 ? 'materia cargada' : 'materias cargadas'}. Recordá actualizar tu progreso regularmente.</>
                }
              </div>
            </div>
          </div>
        )}

        {pantalla === 'materias' && (
          <div style={estilos.contenido}>
            <div style={estilos.header}>
              <div style={estilos.titulo}>Mis materias</div>
              <div style={estilos.addBtn} onClick={() => setMostrarForm(!mostrarForm)}>
                {mostrarForm ? '✕ Cerrar' : '+ Agregar'}
              </div>
            </div>

            {mostrarForm && (
              <div style={estilos.formCard}>
                <div style={estilos.formTitle}>Nueva materia</div>
                <input style={estilos.input} placeholder="Nombre de la materia" value={nuevaMateria.nombre} onChange={e => setNuevaMateria({ ...nuevaMateria, nombre: e.target.value })} />
                <div style={estilos.inputLabel}>Fecha del parcial (opcional)</div>
                <input style={estilos.input} type="date" value={nuevaMateria.parcial} onChange={e => setNuevaMateria({ ...nuevaMateria, parcial: e.target.value })} />
                <div style={estilos.inputLabel}>Fecha del final (opcional)</div>
                <input style={estilos.input} type="date" value={nuevaMateria.final} onChange={e => setNuevaMateria({ ...nuevaMateria, final: e.target.value })} />
                <button style={estilos.btnPrimary} onClick={agregarMateria} disabled={guardando}>
                  {guardando ? 'Guardando...' : 'Guardar materia'}
                </button>
              </div>
            )}

            {materias.length === 0 && !mostrarForm && (
              <div style={estilos.emptyCard}>
                <div style={{ fontSize: 40 }}>📚</div>
                <div style={{ fontSize: 14, color: '#888', marginTop: 8 }}>Todavía no cargaste materias</div>
                <div style={{ fontSize: 12, color: '#aaa', marginTop: 4 }}>Tocá "+ Agregar" para empezar</div>
              </div>
            )}

            {materias.map(m => {
              const diasP = m.parcial ? diasRestantes(m.parcial) : null;
              const diasF = m.final ? diasRestantes(m.final) : null;
              return (
                <div key={m.id} style={estilos.subjectCard}>
                  <div style={estilos.subjectTop}>
                    <div style={estilos.subjectName}>{m.nombre}</div>
                    {diasP !== null && diasP >= 0 && <div style={{ ...estilos.badge, ...colorDias(diasP) }}>Parcial en {diasP}d</div>}
                    {diasF !== null && diasF >= 0 && !diasP && <div style={{ ...estilos.badge, ...colorDias(diasF) }}>Final en {diasF}d</div>}
                  </div>
                  <div style={estilos.progressTrack}><div style={{ ...estilos.progressFill, width: m.progreso + '%' }}></div></div>
                  <div style={estilos.subjectMeta}>{m.progreso}% del programa completado</div>
                </div>
              );
            })}
          </div>
        )}

        {pantalla === 'logros' && (
          <div style={estilos.contenido}>
            <div style={estilos.header}>
              <div style={estilos.titulo}>Logros</div>
              <div style={{ fontSize: 12, color: '#888' }}>0 / 24 desbloqueados</div>
            </div>
            <div style={estilos.emptyCard}>
              <div style={{ fontSize: 40 }}>🔒</div>
              <div style={{ fontSize: 13, color: '#888', marginTop: 6 }}>Estudiá tu primera sesión para desbloquear logros</div>
            </div>
          </div>
        )}

        {pantalla === 'amigos' && (
          <div style={estilos.contenido}>
            <div style={estilos.header}>
              <div style={estilos.titulo}>Ranking</div>
              <div style={estilos.addBtn}>+ Invitar</div>
            </div>
            <div style={estilos.emptyCard}>
              <div style={{ fontSize: 40 }}>👥</div>
              <div style={{ fontSize: 14, color: '#888', marginTop: 8 }}>Invitá amigos para ver el ranking semanal</div>
            </div>
          </div>
        )}

        {pantalla === 'agenda' && (
          <div style={estilos.contenido}>
            <div style={estilos.header}>
              <div style={estilos.titulo}>Agenda</div>
            </div>
            {materias.length === 0 ? (
              <div style={estilos.emptyCard}>
                <div style={{ fontSize: 40 }}>📅</div>
                <div style={{ fontSize: 14, color: '#888', marginTop: 8 }}>Cargá tus materias primero para ver tu agenda</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={estilos.sectionLabel}>Próximas fechas</div>
                {materias.filter(m => m.parcial || m.final).map(m => (
                  <div key={m.id} style={estilos.agendaItem}>
                    <div style={{ ...estilos.taskDot, background: '#534AB7', width: 10, height: 10 }}></div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 500, color: '#222' }}>{m.nombre}</div>
                      {m.parcial && <div style={{ fontSize: 11, color: '#888' }}>Parcial: {new Date(m.parcial).toLocaleDateString('es-AR')}</div>}
                      {m.final && <div style={{ fontSize: 11, color: '#888' }}>Final: {new Date(m.final).toLocaleDateString('es-AR')}</div>}
                    </div>
                    {m.parcial && diasRestantes(m.parcial) >= 0 && (
                      <div style={{ ...estilos.badge, ...colorDias(diasRestantes(m.parcial)) }}>{diasRestantes(m.parcial)}d</div>
                    )}
                  </div>
                ))}
                {materias.filter(m => m.parcial || m.final).length === 0 && (
                  <div style={{ fontSize: 13, color: '#888', textAlign: 'center', marginTop: 20 }}>No cargaste fechas de parciales o finales todavía</div>
                )}
              </div>
            )}
          </div>
        )}

        <div style={estilos.navBar}>
          {[
            { id: 'inicio', icon: '🏠', label: 'Inicio' },
            { id: 'materias', icon: '📖', label: 'Materias' },
            { id: 'logros', icon: '🏆', label: 'Logros' },
            { id: 'amigos', icon: '👥', label: 'Amigos' },
            { id: 'agenda', icon: '📅', label: 'Agenda' },
          ].map(tab => (
            <button
              key={tab.id}
              style={{ ...estilos.navTab, color: pantalla === tab.id ? '#534AB7' : '#888' }}
              onClick={() => setPantalla(tab.id)}
            >
              <span style={{ fontSize: 20 }}>{tab.icon}</span>
              <span style={{ fontSize: 10 }}>{tab.label}</span>
            </button>
          ))}
        </div>

      </div>
    </div>
  );
}

const estilos = {
  contenedor: { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#f0f0f0', padding: 20 },
  phone: { width: 360, background: 'white', borderRadius: 32, overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.15)', display: 'flex', flexDirection: 'column', minHeight: 640 },
  contenido: { flex: 1, overflowY: 'auto', padding: '16px 16px 8px', display: 'flex', flexDirection: 'column', gap: 12 },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  saludo: { fontSize: 12, color: '#888' },
  titulo: { fontSize: 20, fontWeight: 500, color: '#222' },
  rachaBox: { background: '#EEEDFE', borderRadius: 12, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10 },
  rachaNum: { fontSize: 22, fontWeight: 500, color: '#534AB7' },
  rachaLabel: { fontSize: 13, color: '#534AB7', fontWeight: 500 },
  rachaSub: { fontSize: 11, color: '#7F77DD' },
  nivel: { fontSize: 13, fontWeight: 500, color: '#534AB7' },
  nivelSub: { fontSize: 10, color: '#7F77DD' },
  xpSection: { display: 'flex', flexDirection: 'column', gap: 4 },
  xpRow: { display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#888' },
  xpTrack: { height: 6, background: '#eee', borderRadius: 99, overflow: 'hidden' },
  xpFill: { height: '100%', background: '#534AB7', borderRadius: 99 },
  todayBlock: { background: '#f8f8f8', borderRadius: 10, padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 8 },
  todayTitle: { fontSize: 11, fontWeight: 500, color: '#888', textTransform: 'uppercase', letterSpacing: '0.04em' },
  taskRow: { display: 'flex', alignItems: 'center', gap: 10 },
  taskDot: { width: 8, height: 8, borderRadius: '50%', flexShrink: 0 },
  aiBubble: { background: '#EEEDFE', borderRadius: 12, padding: '10px 14px', display: 'flex', gap: 10, alignItems: 'flex-start' },
  aiIcon: { fontSize: 18, flexShrink: 0 },
  aiText: { fontSize: 12, color: '#3C3489', lineHeight: 1.5 },
  addBtn: { fontSize: 12, color: '#534AB7', cursor: 'pointer', fontWeight: 500 },
  sectionLabel: { fontSize: 11, color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 500 },
  emptyCard: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#f8f8f8', borderRadius: 12, padding: 40, textAlign: 'center' },
  formCard: { background: '#f8f8f8', borderRadius: 12, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 8 },
  formTitle: { fontSize: 14, fontWeight: 500, color: '#222', marginBottom: 4 },
  inputLabel: { fontSize: 11, color: '#888', marginTop: 4 },
  input: { padding: '10px 12px', borderRadius: 8, border: '1px solid #ddd', fontSize: 13, color: '#222', background: 'white', outline: 'none', width: '100%', boxSizing: 'border-box' },
  btnPrimary: { background: '#534AB7', color: 'white', border: 'none', borderRadius: 8, padding: '10px 16px', fontSize: 13, fontWeight: 500, cursor: 'pointer', marginTop: 4 },
  btnGoogle: { background: 'white', color: '#222', border: '1.5px solid #ddd', borderRadius: 10, padding: '12px 20px', fontSize: 14, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, width: '100%', justifyContent: 'center' },
  btnLogout: { fontSize: 11, color: '#888', background: 'none', border: '1px solid #ddd', borderRadius: 6, padding: '4px 8px', cursor: 'pointer' },
  subjectCard: { background: 'white', border: '1px solid #eee', borderRadius: 12, padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 6 },
  subjectTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' },
  subjectName: { fontSize: 14, fontWeight: 500, color: '#222' },
  badge: { fontSize: 10, padding: '2px 8px', borderRadius: 99, fontWeight: 500 },
  progressTrack: { height: 4, background: '#eee', borderRadius: 99, overflow: 'hidden' },
  progressFill: { height: '100%', background: '#534AB7', borderRadius: 99 },
  subjectMeta: { fontSize: 11, color: '#888' },
  agendaItem: { display: 'flex', alignItems: 'center', gap: 10, background: '#f8f8f8', borderRadius: 10, padding: '10px 12px' },
  navBar: { display: 'flex', borderTop: '1px solid #eee', background: 'white' },
  navTab: { flex: 1, padding: '8px 4px 6px', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 },
};

export default App;
