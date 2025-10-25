import React, { useEffect, useState } from 'react';
import './App.css';

export type Ticket = {
  id: number;
  subject: string;
  source: 'email' | 'chat' | 'community';
  status: 'open' | 'pending' | 'closed' | 'escalated';
  createdAt: string;
  updatedAt: string;
  messages: { sender: string; content: string; timestamp: string }[];
  customerProfile: {
    name: string;
    email: string;
    company: string;
  };
  issueHistory: { status: string; timestamp: string }[];
  reproductionSteps: string;
  assignedTeam?: string | null;
  escalationHistory?: { team: string; escalatedBy: string; timestamp: string }[];
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
  // Demo data state
  const [demoTickets, setDemoTickets] = useState<any[]>([]);
  const [demoCustomers, setDemoCustomers] = useState<any[]>([]);
  // Asset search state
  const [assetQuery, setAssetQuery] = useState('');
  const [assetResults, setAssetResults] = useState<any[]>([]);
  const [assetLoading, setAssetLoading] = useState(false);
  // Escalation UI state
  const [escalationTeam, setEscalationTeam] = useState('');
  const TEAMS = ['Engineering', 'Product'];
  const ESCALATED_BY = 'supportAgent1'; // Replace with actual user if available

  const handleEscalate = async () => {
    if (!selectedTicket || !escalationTeam) return;
    await fetch(`http://localhost:4000/api/tickets/${selectedTicket.id}/escalate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ team: escalationTeam }),
    });
    setEscalationTeam('');
    setRefresh(r => r + 1);
  };

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

  // Demo data handlers
  const loadDemoTickets = async () => {
    const res = await fetch('http://localhost:4000/api/demo/tickets');
    setDemoTickets(await res.json());
  };
  const loadDemoCustomers = async () => {
    const res = await fetch('http://localhost:4000/api/demo/customers');
    setDemoCustomers(await res.json());
  };

  // Asset search handler
  const handleAssetSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setAssetLoading(true);
    setAssetResults([]);
    const res = await fetch(`http://localhost:4000/api/assets/search?q=${encodeURIComponent(assetQuery)}`);
    setAssetResults(await res.json());
    setAssetLoading(false);
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
        <hr />
        <div>
          <button onClick={loadDemoTickets}>Load Demo Tickets</button>
          <button onClick={loadDemoCustomers} style={{ marginLeft: 8 }}>Load Demo Customers</button>
        </div>
        {demoTickets.length > 0 && (
          <div>
            <h3>Demo Tickets</h3>
            <ul>
              {demoTickets.map((t, i) => (
                <li key={t.id || i}><b>{t.title}</b> (userId: {t.userId})</li>
              ))}
            </ul>
          </div>
        )}
        {demoCustomers.length > 0 && (
          <div>
            <h3>Demo Customers</h3>
            <ul>
              {demoCustomers.map((c, i) => (
                <li key={c.id || i}><b>{c.name}</b> ({c.email})</li>
              ))}
            </ul>
          </div>
        )}
      </aside>
      <main className="ticket-detail">
        <form onSubmit={handleAssetSearch} style={{ marginBottom: 16 }}>
          <input
            type="text"
            value={assetQuery}
            onChange={e => setAssetQuery(e.target.value)}
            placeholder="Search system assets (GitHub repos)..."
            style={{ width: '60%', marginRight: 8 }}
          />
          <button type="submit" disabled={assetLoading}>Search</button>
        </form>
        {assetLoading && <div>Searching assets...</div>}
        {assetResults.length > 0 && (
          <div>
            <h3>Asset Search Results</h3>
            <ul>
              {assetResults.map((a, i) => (
                <li key={a.id || i}><a href={a.html_url} target="_blank" rel="noopener noreferrer">{a.full_name}</a></li>
              ))}
            </ul>
          </div>
        )}
        {selectedTicket ? (
          <div>
            <h2>{selectedTicket.subject}</h2>
            <div className="meta">Source: {selectedTicket.source}</div>
            <div className="meta">Status: {selectedTicket.status}</div>
        <div className="meta">Assigned Team: {selectedTicket.assignedTeam ? selectedTicket.assignedTeam : 'None'}</div>
            <div className="meta">Created: {new Date(selectedTicket.createdAt).toLocaleString()}</div>
            <div className="customer-info">
              <h3>Customer Info</h3>
              <div>Name: {selectedTicket.customerProfile.name}</div>
              <div>Email: {selectedTicket.customerProfile.email}</div>
              <div>Company: {selectedTicket.customerProfile.company}</div>
            </div>
            <div className="issue-history">
              <h3>Issue History</h3>
              <ul>
                {selectedTicket.issueHistory.map((h, i) => (
                  <li key={i}>{h.status} at {new Date(h.timestamp).toLocaleString()}</li>
                ))}
              </ul>
            </div>
            <div className="repro-steps">
              <h3>Reproduction Steps</h3>
              <div>{selectedTicket.reproductionSteps}</div>
            </div>
            <div className="escalation-box">
              <h3>Escalate Ticket</h3>
              <select value={escalationTeam} onChange={e => setEscalationTeam(e.target.value)}>
                <option value="">Select team...</option>
                {TEAMS.map(team => (
                  <option key={team} value={team}>{team}</option>
                ))}
              </select>
              <button onClick={handleEscalate} disabled={!escalationTeam}>Escalate</button>
            </div>
            {selectedTicket.escalationHistory && selectedTicket.escalationHistory.length > 0 && (
              <div className="escalation-history">
                <h3>Escalation History</h3>
                <ul>
                  {selectedTicket.escalationHistory.map((h, i) => (
                    <li key={i}>{h.team} by {h.escalatedBy} at {new Date(h.timestamp).toLocaleString()}</li>
                  ))}
                </ul>
              </div>
            )}
            <div className="messages">
              <h3>Messages</h3>
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
