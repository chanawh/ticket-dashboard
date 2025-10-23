const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

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
    ]
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
    ]
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
    ]
  }
];

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

app.get('/api/tickets/:id', (req, res) => {
  const ticket = tickets.find(t => t.id === Number(req.params.id));
  if (!ticket) return res.status(404).json({ error: 'Not found' });
  res.json(ticket);
});

app.post('/api/tickets/:id/respond', (req, res) => {
  const ticket = tickets.find(t => t.id === Number(req.params.id));
  if (!ticket) return res.status(404).json({ error: 'Not found' });
  const { content } = req.body;
  if (!content) return res.status(400).json({ error: 'No content' });
  ticket.messages.push({ sender: 'support', content, timestamp: new Date().toISOString() });
  ticket.updatedAt = new Date().toISOString();
  ticket.status = 'pending';
  res.json(ticket);
});

const PORT = 4000;
app.listen(PORT, () => {
  console.log(`Backend API running on port ${PORT}`);
});
