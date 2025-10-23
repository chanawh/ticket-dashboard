import React, { useEffect, useState } from 'react';
import './App.css';

export type Ticket = {
  id: number;
  subject: string;
  source: 'email' | 'chat' | 'community';
  status: 'open' | 'pending' | 'closed';
  createdAt: string;
  updatedAt: string;
  messages: { sender: string; content: string; timestamp: string }[];
};

const TICKET_SOURCES = ['email', 'chat', 'community'] as const;
const TICKET_STATUSES = ['open', 'pending', 'closed'] as const;

const fetchTickets = async (filter: { source?: string; status?: string }) => {
  let url = 'http://localhost:4000/api/tickets';
  const params = [];
  if (filter.source) params.push(`source=${filter.source}`);
  if (filter.status) params.push(`status=${filter.status}`);
  if (params.length) url += '?' + params.join('&');
  const res = await fetch(url);
  return res.json();
};

function App() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [filterSource, setFilterSource] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [response, setResponse] = useState('');
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    fetchTickets({ source: filterSource, status: filterStatus }).then(setTickets);
  }, [filterSource, filterStatus, refresh]);

  const handleRespond = async () => {
    if (!selectedTicket || !response.trim()) return;
    await fetch(`http://localhost:4000/api/tickets/${selectedTicket.id}/respond`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: response }),
    });
    setResponse('');
    setRefresh(r => r + 1);
  };

  return (
    <div className="dashboard">
      <aside className="sidebar">
        <h2>Tickets</h2>
        <div className="filters">
          <select value={filterSource} onChange={e => setFilterSource(e.target.value)}>
            <option value="">All Sources</option>
            {TICKET_SOURCES.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="">All Statuses</option>
            {TICKET_STATUSES.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <ul className="ticket-list">
          {tickets.map(t => (
            <li
              key={t.id}
              className={selectedTicket?.id === t.id ? 'selected' : ''}
              onClick={() => setSelectedTicket(t)}
            >
              <div><b>{t.subject}</b></div>
              <div className="meta">{t.source} | {t.status}</div>
              <div className="meta">{new Date(t.createdAt).toLocaleString()}</div>
            </li>
          ))}
        </ul>
      </aside>
      <main className="ticket-detail">
        {selectedTicket ? (
          <div>
            <h2>{selectedTicket.subject}</h2>
            <div className="meta">Source: {selectedTicket.source}</div>
            <div className="meta">Status: {selectedTicket.status}</div>
            <div className="meta">Created: {new Date(selectedTicket.createdAt).toLocaleString()}</div>
            <div className="messages">
              {selectedTicket.messages.map((m, i) => (
                <div key={i} className="message">
                  <b>{m.sender}</b> <span className="timestamp">{new Date(m.timestamp).toLocaleString()}</span>
                  <div>{m.content}</div>
                </div>
              ))}
            </div>
            <div className="respond-box">
              <textarea
                value={response}
                onChange={e => setResponse(e.target.value)}
                placeholder="Type your response..."
              />
              <button onClick={handleRespond}>Send Response</button>
            </div>
          </div>
        ) : (
          <div>Select a ticket to view details</div>
        )}
      </main>
    </div>
  );
}

export default App;
