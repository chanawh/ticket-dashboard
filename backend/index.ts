console.log('Starting backend...');

// Import dependencies
const express = require('express');
const cors = require('cors');
const nodeFetch = (...args) =>
  import('node-fetch').then(({ default: fetch }) => fetch(...args));

// Initialize app
const app = express();
app.use(cors());
app.use(express.json());

// Set up port and start server
const PORT = 4000;
app.listen(PORT, () => {
  console.log(`Backend API running on port ${PORT}`);
});


// Simulate external ticket/CRM integration using JSONPlaceholder
app.get('/api/demo/tickets', async (req, res) => {
  try {
    const response = await nodeFetch('https://jsonplaceholder.typicode.com/posts');
    const posts = await response.json();
    res.json(posts);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch demo tickets' });
  }
});

app.get('/api/demo/customers', async (req, res) => {
  try {
    const response = await nodeFetch('https://jsonplaceholder.typicode.com/users');
    const users = await response.json();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch demo customers' });
  }
});

// Simulate asset search using GitHub API
app.get('/api/assets/search', async (req, res) => {
  const { q } = req.query;
  if (!q) return res.status(400).json({ error: 'Missing search query' });
  try {
    const response = await nodeFetch(`https://api.github.com/search/repositories?q=${encodeURIComponent(q)}`);
    const data = await response.json();
    res.json(data.items || []);
  } catch (err) {
    res.status(500).json({ error: 'Failed to search assets' });
  }
});

// In-memory ticket store for demo
let tickets = [
  {
    id: 1,
    subject: 'Cannot access GPU instance',
    source: 'email',
    status: 'open',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 3600000).toISOString(),
    messages: [
      { sender: 'user1@customer.com', content: 'I cannot access my GPU instance.', timestamp: new Date(Date.now() - 86400000).toISOString() },
      { sender: 'support', content: 'We are looking into this.', timestamp: new Date(Date.now() - 86000000).toISOString() }
    ],
    customerProfile: {
      name: 'Alice Smith',
      email: 'user1@customer.com',
      company: 'Acme Corp'
    },
    issueHistory: [
      { status: 'open', timestamp: new Date(Date.now() - 86400000).toISOString() },
      { status: 'pending', timestamp: new Date(Date.now() - 86000000).toISOString() }
    ],
    reproductionSteps: '1. Log in to dashboard. 2. Attempt to start GPU instance. 3. Observe error.',
    assignedTeam: null,
    escalationHistory: []
  },
  {
    id: 2,
    subject: 'Billing question',
    source: 'chat',
    status: 'pending',
    createdAt: new Date(Date.now() - 43200000).toISOString(),
    updatedAt: new Date(Date.now() - 1800000).toISOString(),
    messages: [
      { sender: 'user2@customer.com', content: 'Can you explain my last invoice?', timestamp: new Date(Date.now() - 43200000).toISOString() }
    ],
    customerProfile: {
      name: 'Bob Lee',
      email: 'user2@customer.com',
      company: 'Beta Inc.'
    },
    issueHistory: [
      { status: 'open', timestamp: new Date(Date.now() - 43200000).toISOString() },
      { status: 'pending', timestamp: new Date(Date.now() - 1800000).toISOString() }
    ],
    reproductionSteps: 'N/A (billing)',
    assignedTeam: null,
    escalationHistory: []
  },
  {
    id: 3,
    subject: 'Feature request: more storage',
    source: 'community',
    status: 'closed',
    createdAt: new Date(Date.now() - 259200000).toISOString(),
    updatedAt: new Date(Date.now() - 172800000).toISOString(),
    messages: [
      { sender: 'user3@customer.com', content: 'Please add more storage options.', timestamp: new Date(Date.now() - 259200000).toISOString() },
      { sender: 'support', content: 'Thanks for the feedback! We are considering it.', timestamp: new Date(Date.now() - 172800000).toISOString() }
    ],
    customerProfile: {
      name: 'Carol Jones',
      email: 'user3@customer.com',
      company: 'Gamma LLC'
    },
    issueHistory: [
      { status: 'open', timestamp: new Date(Date.now() - 259200000).toISOString() },
      { status: 'closed', timestamp: new Date(Date.now() - 172800000).toISOString() }
    ],
    reproductionSteps: 'N/A (feature request)',
    assignedTeam: null,
    escalationHistory: []
  }
];
// Create or update a ticket (simulate external system integration)
app.post('/api/tickets', (req, res) => {
  const { subject, source, customerProfile, reproductionSteps } = req.body;
  if (!subject || !source || !customerProfile) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  // Check if a ticket for this subject/customer already exists
  let ticket = tickets.find(t => t.subject === subject && t.customerProfile.email === customerProfile.email);
  if (ticket) {
    // Update existing ticket
    ticket.updatedAt = new Date().toISOString();
    ticket.issueHistory.push({ status: ticket.status, timestamp: ticket.updatedAt });
    if (reproductionSteps) ticket.reproductionSteps = reproductionSteps;
    return res.json(ticket);
  }
  // Create new ticket
  const newTicket = {
    id: tickets.length ? Math.max(...tickets.map(t => t.id)) + 1 : 1,
    subject,
    source,
    status: 'open',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    messages: [],
    customerProfile,
    issueHistory: [{ status: 'open', timestamp: new Date().toISOString() }],
    reproductionSteps: reproductionSteps || '',
    assignedTeam: null,
    escalationHistory: []
  };
  tickets.push(newTicket);
  res.status(201).json(newTicket);
});

app.get('/api/tickets', (req, res) => {
  let filtered = tickets;
  if (req.query.source) {
    filtered = filtered.filter(t => t.source === req.query.source);
  }
  if (req.query.status) {
    filtered = filtered.filter(t => t.status === req.query.status);
  }
  res.json(filtered);
});

// Removed the extra "});" that was causing the syntax error.
// Assuming this route is for GET /api/tickets/:id
app.get('/api/tickets/:id', (req, res) => {
  const ticket = tickets.find(t => t.id === Number(req.params.id));
  if (!ticket) return res.status(404).json({ error: 'Not found' });
  res.json(ticket);
});

// Add response to ticket messages
app.post('/api/tickets/:id/respond', (req, res) => {
  const ticket = tickets.find(t => t.id === Number(req.params.id));
  if (!ticket) return res.status(404).json({ error: 'Not found' });
  const { content, sender } = req.body;
  if (!content) return res.status(400).json({ error: 'No response content provided' });
  ticket.messages = ticket.messages || [];
  ticket.messages.push({
    sender: sender || 'support',
    content,
    timestamp: new Date().toISOString()
  });
  ticket.updatedAt = new Date().toISOString();
  res.json(ticket);
});

app.post('/api/tickets/:id/escalate', (req, res) => {
  const ticket = tickets.find(t => t.id === Number(req.params.id));
  if (!ticket) return res.status(404).json({ error: 'Not found' });
  const { team, escalatedBy } = req.body;
  if (!team) return res.status(400).json({ error: 'No team specified' });
  ticket.assignedTeam = team;
  ticket.status = 'escalated';
  ticket.updatedAt = new Date().toISOString();
  // Optional enhancement: track escalation history
  ticket.escalationHistory = ticket.escalationHistory || [];
  ticket.escalationHistory.push({
    team,
    escalatedBy: escalatedBy || 'supportAgent',
    timestamp: new Date().toISOString()
  });
  // Optional enhancement: notify assigned team
  notifyTeam(team, ticket);
  res.json(ticket);
});

function notifyTeam(team, ticket) {
  // TODO: Integrate with email/Slack/other system
  console.log(`Notify ${team}: Ticket #${ticket.id} escalated.`);
}
