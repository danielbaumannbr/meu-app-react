import React, { useEffect, useState } from 'react';

// Plano Familiar de Emergência - Single-file React App
// - Tailwind CSS assumed available in the project
// - Designed for PWA / offline-first use (register a simple service worker)
// - Persistence: localStorage (simple, resilient across restarts); can be replaced by IndexedDB/localForage
// - Quick-export/backup: JSON export & import
// - Reminders: app computes next-review date and alerts on open; browsers cannot guarantee background alarms when closed — consider installing as PWA or using native wrapper (Capacitor) for real scheduled notifications.

const EMERGENCY_NUMBERS = [
  { label: 'Defesa Civil', number: '199' },
  { label: 'Bombeiros', number: '193' },
  { label: 'Polícia Militar', number: '190' },
  { label: 'SAMU', number: '192' }
];

const DISASTER_GUIDES = {
  Vendaval: {
    Antes: [
      'Fixar objetos soltos no quintal',
      'Revisar calhas e telhado',
      'Identificar abrigo interno seguro'
    ],
    Durante: [
      'Fechar portas e janelas',
      'Desligar aparelhos elétricos',
      'Abrigar-se em cômodo sem janelas'
    ],
    Depois: [
      'Verificar danos estruturais com segurança',
      'Evitar linhas de energia caídas',
      'Reportar danos à Defesa Civil'
    ]
  },
  Inundação: {
    Antes: [
      'Mover itens em prateleiras altas',
      'Ter rota de fuga por terreno elevado',
      'Preparar kit com água potável e documentos waterproof'
    ],
    Durante: [
      'Não atravessar áreas alagadas a pé ou de carro',
      'Buscar terreno mais alto',
      'Desligar energia se houver risco de contato com água'
    ],
    Depois: [
      'Evitar contato com água contaminada',
      'Documentar danos e acionar seguros/autoridades',
      'Desinfetar locais e alimentos expostos'
    ]
  },
  Granizo: {
    Antes: [
      'Guardar veículos em garagem',
      'Abrir apenas o necessário para ventilação',
      'Proteger plantas e objetos frágeis'
    ],
    Durante: [
      'Evitar mover-se ao ar livre',
      'Abrir portas com cuidado se necessário',
      'Não subir em telhados molhados ou danificados'
    ],
    Depois: [
      'Avaliar danos com cautela',
      'Cuidado com piso escorregadio',
      'Reportar danos a estruturas à Defesa Civil'
    ]
  }
};

const DEFAULT_KIT_ITEMS = [
  'Documentos (em saco plástico fechado)',
  'Remédios (composições e validade)',
  'Água (mínimo 3 dias)',
  'Alimentos não perecíveis (barras de cereal, chocolate)',
  'Rádio (com pilhas)',
  'Lanterna (com pilhas sobressalentes)',
  'Kit de primeiros socorros',
  'Cópias de contatos importantes'
];

const STORAGE_KEY = 'pfe_app_v1';

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    console.error('Falha ao carregar estado:', e);
    return null;
  }
}

function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('Falha ao salvar estado:', e);
  }
}

function isoAddMonths(dateIso, months) {
  const d = new Date(dateIso);
  d.setMonth(d.getMonth() + months);
  return d.toISOString();
}

export default function PFEApp() {
  const [state, setState] = useState(() => {
    const s = loadState();
    if (s) return s;
    const now = new Date().toISOString();
    return {
      family: [],
      routesInternal: [],
      meetingPoints: [],
      externalContacts: [],
      kit: DEFAULT_KIT_ITEMS.map((name) => ({ name, have: false })),
      disasterGuides: DISASTER_GUIDES,
      riskActions: [],
      lastReview: now,
      nextReview: isoAddMonths(now, 6),
      notes: ''
    };
  });

  useEffect(() => saveState(state), [state]);

  // Reminder check on open
  const [showReminder, setShowReminder] = useState(false);
  useEffect(() => {
    const now = new Date();
    const next = new Date(state.nextReview);
    if (now >= next) setShowReminder(true);
  }, []);

  // CRUD helpers
  function addFamilyMember(member) {
    setState((s) => ({ ...s, family: [...s.family, member] }));
  }
  function updateFamilyMember(index, updates) {
    setState((s) => {
      const fam = [...s.family];
      fam[index] = { ...fam[index], ...updates };
      return { ...s, family: fam };
    });
  }
  function removeFamilyMember(index) {
    setState((s) => {
      const fam = [...s.family];
      fam.splice(index, 1);
      return { ...s, family: fam };
    });
  }

  function toggleKitItem(i) {
    setState((s) => {
      const kit = s.kit.map((it, idx) => (idx === i ? { ...it, have: !it.have } : it));
      return { ...s, kit };
    });
  }

  function recordRiskAction(action) {
    setState((s) => ({ ...s, riskActions: [...s.riskActions, action] }));
  }

  function markReviewed() {
    const now = new Date().toISOString();
    setState((s) => ({ ...s, lastReview: now, nextReview: isoAddMonths(now, 6) }));
    setShowReminder(false);
    // Try to request notification permission to allow future reminders while app is open
    if ('Notification' in window && Notification.permission !== 'granted') {
      Notification.requestPermission();
    }
  }

  function exportJSON() {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'pfe_backup.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  function importJSON(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        setState((s) => ({ ...s, ...data }));
        alert('Importação concluída. Verifique os dados e salve.');
      } catch (err) {
        alert('Arquivo inválido.');
      }
    };
    reader.readAsText(file);
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <header className="max-w-4xl mx-auto">
        <h1 className="text-2xl md:text-4xl font-bold">Plano Familiar de Emergência (PFE)</h1>
        <p className="text-sm text-gray-600 mt-1">Offline-first · Revisar a cada 6 meses · Seguir orientações oficiais</p>
      </header>

      <main className="max-w-4xl mx-auto mt-6 grid gap-6 md:grid-cols-3">
        <section className="md:col-span-2 bg-white p-4 rounded-xl shadow-sm">
          <h2 className="font-semibold text-lg">Cadastro da Família</h2>
          <FamilyList
            family={state.family}
            onAdd={addFamilyMember}
            onUpdate={updateFamilyMember}
            onRemove={removeFamilyMember}
          />

          <hr className="my-4" />

          <h2 className="font-semibold text-lg">Rotas Internas</h2>
          <RoutesEditor routes={state.routesInternal} onChange={(routes) => setState(s => ({...s, routesInternal: routes}))} />

          <hr className="my-4" />

          <h2 className="font-semibold text-lg">Pontos de Encontro</h2>
          <MeetingPointsEditor points={state.meetingPoints} onChange={(pts) => setState(s => ({...s, meetingPoints: pts}))} />

          <hr className="my-4" />

          <h2 className="font-semibold text-lg">Contatos de Apoio</h2>
          <ContactsEditor contacts={state.externalContacts} onChange={(c) => setState(s => ({...s, externalContacts: c}))} />

          <hr className="my-4" />

          <h2 className="font-semibold text-lg">Registro de Redução de Risco</h2>
          <RiskActionsEditor actions={state.riskActions} onAdd={recordRiskAction} />

        </section>

        <aside className="bg-white p-4 rounded-xl shadow-sm">
          <div className="flex flex-col gap-4">
            <div>
              <h3 className="font-semibold">Lembrete de Revisão</h3>
              <p className="text-sm text-gray-600">Última revisão: {new Date(state.lastReview).toLocaleDateString()}</p>
              <p className="text-sm text-gray-600">Próxima revisão: {new Date(state.nextReview).toLocaleDateString()}</p>
              {showReminder && (
                <div className="mt-2 p-2 bg-yellow-100 rounded">
                  <p className="text-sm">É hora de revisar e simular seu plano. Marque como revisado quando terminar.</p>
                  <button className="mt-2 px-3 py-1 rounded bg-yellow-500 text-white" onClick={markReviewed}>Marcar como revisado</button>
                </div>
              )}
            </div>

            <div>
              <h3 className="font-semibold">Kit de Emergência</h3>
              <ul className="text-sm space-y-1">
                {state.kit.map((it, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <input id={`kit-${i}`} type="checkbox" checked={it.have} onChange={() => toggleKitItem(i)} />
                    <label htmlFor={`kit-${i}`}>{it.name}</label>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="font-semibold">Ações rápidas</h3>
              <button className="w-full mb-2 p-2 rounded bg-blue-600 text-white" onClick={() => exportJSON()}>Exportar PFE (backup)</button>
              <label className="block">
                <span className="text-sm">Importar backup (pfe_backup.json)</span>
                <input className="mt-1" type="file" accept="application/json" onChange={(e) => importJSON(e.target.files[0])} />
              </label>
            </div>

            <div>
              <h3 className="font-semibold">Emergência</h3>
              <p className="text-sm text-gray-600">Números essenciais (discagem rápida se o dispositivo suportar telefonia)</p>
              <div className="mt-2 grid gap-2">
                {EMERGENCY_NUMBERS.map((n) => (
                  <a key={n.number} className="block text-center p-2 rounded border" href={`tel:${n.number}`}>{n.label} — {n.number}</a>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-semibold">Consulta de Ações (offline)</h3>
              <DisasterGuide guides={state.disasterGuides} />
            </div>

            <div>
              <h3 className="font-semibold">Orientações oficiais</h3>
              <p className="text-sm text-gray-600">Este conteúdo segue orientações oficiais. Evite repassar mensagens não verificadas de redes sociais.</p>
            </div>

          </div>
        </aside>
      </main>

      <footer className="max-w-4xl mx-auto mt-6 text-xs text-gray-500">
        <p>Observação: para notificações programadas em segundo plano e integração com sensores do dispositivo (GPS, SMS) converta para PWA ou use um wrapper nativo (Capacitor / Cordova).</p>
      </footer>
    </div>
  );
}

// ----- Subcomponents -----

function FamilyList({ family, onAdd, onUpdate, onRemove }) {
  const [form, setForm] = useState({ name: '', age: '', relation: '', health: '', phone: '' });
  function submit(e) {
    e.preventDefault();
    if (!form.name) return alert('Informe o nome');
    onAdd(form);
    setForm({ name: '', age: '', relation: '', health: '', phone: '' });
  }
  return (
    <div className="mt-3">
      <form onSubmit={submit} className="grid gap-2 md:grid-cols-2">
        <input className="p-2 border rounded" placeholder="Nome" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
        <input className="p-2 border rounded" placeholder="Idade" value={form.age} onChange={e => setForm({...form, age: e.target.value})} />
        <input className="p-2 border rounded" placeholder="Parentesco" value={form.relation} onChange={e => setForm({...form, relation: e.target.value})} />
        <input className="p-2 border rounded" placeholder="Telefone" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
        <input className="p-2 border rounded md:col-span-2" placeholder="Condição de saúde / necessidades especiais" value={form.health} onChange={e => setForm({...form, health: e.target.value})} />
        <div className="md:col-span-2">
          <button className="px-3 py-2 bg-green-600 text-white rounded">Adicionar membro</button>
        </div>
      </form>

      <ul className="mt-3 space-y-2">
        {family.map((m, i) => (
          <li key={i} className="p-2 border rounded flex justify-between items-start">
            <div>
              <div className="font-semibold">{m.name} — {m.relation} ({m.age})</div>
              <div className="text-sm text-gray-600">Telefone: {m.phone} • Saúde: {m.health}</div>
            </div>
            <div className="flex gap-2">
              <button className="px-2 py-1 border rounded" onClick={() => { const updated = prompt('Editar observação de saúde:', m.health); if (updated !== null) onUpdate(i, { health: updated }); }}>Editar</button>
              <button className="px-2 py-1 border rounded text-red-600" onClick={() => { if (confirm('Remover membro?')) onRemove(i); }}>Remover</button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function RoutesEditor({ routes, onChange }) {
  const [name, setName] = useState('');
  const [steps, setSteps] = useState('');
  function addRoute() {
    if (!name) return alert('Nome da rota é obrigatório');
    const newRoute = { name, steps: steps.split('\n').map(s => s.trim()).filter(Boolean) };
    onChange([...routes, newRoute]);
    setName(''); setSteps('');
  }
  function remove(i) { onChange(routes.filter((_, idx) => idx !== i)); }
  return (
    <div className="mt-2">
      <input className="p-2 border rounded w-full" placeholder="Nome da rota (ex: Saída Sala → Quintal)" value={name} onChange={e => setName(e.target.value)} />
      <textarea className="mt-2 p-2 border rounded w-full" placeholder="Passos / observações (uma por linha)" value={steps} onChange={e => setSteps(e.target.value)} rows={4} />
      <div className="flex gap-2 mt-2">
        <button className="px-3 py-1 bg-indigo-600 text-white rounded" onClick={addRoute}>Salvar rota interna</button>
      </div>

      <ul className="mt-3 space-y-2">
        {routes.map((r, i) => (
          <li key={i} className="p-2 border rounded">
            <div className="font-semibold">{r.name}</div>
            <ol className="text-sm list-decimal ml-5">
              {r.steps.map((s, idx) => <li key={idx}>{s}</li>)}
            </ol>
            <button className="mt-2 text-sm text-red-600" onClick={() => remove(i)}>Remover</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function MeetingPointsEditor({ points, onChange }) {
  const [val, setVal] = useState('');
  function add() { if (!val) return; onChange([...points, val]); setVal(''); }
  function remove(i) { onChange(points.filter((_, idx) => idx !== i)); }
  return (
    <div className="mt-2">
      <input className="p-2 border rounded w-full" placeholder="Ponto de encontro (fora do bairro)" value={val} onChange={e => setVal(e.target.value)} />
      <button className="mt-2 px-3 py-1 bg-indigo-600 text-white rounded" onClick={add}>Adicionar</button>
      <ul className="mt-2 text-sm space-y-1">
        {points.map((p, i) => (
          <li key={i} className="flex justify-between"><span>{p}</span><button className="text-red-600" onClick={() => remove(i)}>Remover</button></li>
        ))}
      </ul>
    </div>
  );
}

function ContactsEditor({ contacts, onChange }) {
  const [c, setC] = useState({ name: '', phone: '', relation: '' });
  function add() { if (!c.name || !c.phone) return alert('Nome e telefone são obrigatórios'); onChange([...contacts, c]); setC({ name: '', phone: '', relation: '' }); }
  function remove(i) { onChange(contacts.filter((_, idx) => idx !== i)); }
  return (
    <div className="mt-2">
      <input className="p-2 border rounded w-full" placeholder="Nome" value={c.name} onChange={e => setC({...c, name: e.target.value})} />
      <input className="mt-2 p-2 border rounded w-full" placeholder="Telefone" value={c.phone} onChange={e => setC({...c, phone: e.target.value})} />
      <input className="mt-2 p-2 border rounded w-full" placeholder="Parentesco / Observação" value={c.relation} onChange={e => setC({...c, relation: e.target.value})} />
      <button className="mt-2 px-3 py-1 bg-green-600 text-white rounded" onClick={add}>Adicionar contato</button>
      <ul className="mt-2 text-sm space-y-1">
        {contacts.map((ct, i) => (
          <li key={i} className="flex justify-between"><div>{ct.name} — {ct.phone} <span className="text-gray-500">({ct.relation})</span></div><div className="flex gap-2"><a className="text-blue-600" href={`tel:${ct.phone}`}>Ligar</a><button className="text-red-600" onClick={() => remove(i)}>Remover</button></div></li>
        ))}
      </ul>
    </div>
  );
}

function RiskActionsEditor({ actions, onAdd }) {
  const [text, setText] = useState('');
  function add() { if (!text) return; const action = { text, date: new Date().toISOString(), by: 'Responsável' }; onAdd(action); setText(''); }
  return (
    <div className="mt-2">
      <textarea className="w-full p-2 border rounded" rows={3} placeholder="Descreva a ação (ex: poda de árvores no quintal)" value={text} onChange={e => setText(e.target.value)} />
      <button className="mt-2 px-3 py-1 bg-indigo-600 text-white rounded" onClick={add}>Registrar ação</button>
      <ul className="mt-2 text-sm space-y-1">
        {actions.map((a, i) => <li key={i}>{new Date(a.date).toLocaleDateString()} — {a.text} <span className="text-gray-500">({a.by})</span></li>)}
      </ul>
    </div>
  );
}

function DisasterGuide({ guides }) {
  const [disaster, setDisaster] = useState(Object.keys(guides)[0]);
  const [phase, setPhase] = useState('Antes');
  return (
    <div className="mt-2">
      <div className="flex gap-2">
        <select className="p-2 border rounded" value={disaster} onChange={e => { setDisaster(e.target.value); setPhase('Antes'); }}>
          {Object.keys(guides).map(k => <option key={k} value={k}>{k}</option>)}
        </select>
        <select className="p-2 border rounded" value={phase} onChange={e => setPhase(e.target.value)}>
          <option>Antes</option>
          <option>Durante</option>
          <option>Depois</option>
        </select>
      </div>
      <ol className="mt-2 list-decimal ml-5 text-sm">
        {(guides[disaster][phase] || []).map((s, i) => <li key={i}>{s}</li>)}
      </ol>
    </div>
  );
}
