/* Types defined inline below */

const TOKEN = import.meta.env.VITE_ZAMMAD_TOKEN;
const GROUP = import.meta.env.VITE_DEFAULT_GROUP;
const STATE_ID = parseInt(import.meta.env.VITE_DEFAULT_STATE_ID || '2');
const TAGS = import.meta.env.VITE_DEFAULT_TAGS || '';

if (!TOKEN) {
  throw new Error('VITE_ZAMMAD_TOKEN must be set');
}

const headers = {
  'Authorization': `Token token=${TOKEN}`,
  'Content-Type': 'application/json',
};

interface User {
  email: string;
  // Other fields if needed
}

interface MeResponse {
  id: number;
  // Other fields
}

interface TicketResponse {
  id: number;
  // Other fields
}

interface TicketPayload {
  title: string;
  group: string;
  customer_id: string;
  owner_id: number;
  article: {
    body: string;
    type: 'note';
    internal: true;
  };
  state_id: number;
  mentions: number[];
  tags: string;
}

export async function getUsers(): Promise<string[]> {
  const response = await fetch('/zammad-api/api/v1/users', { headers });
  const responseText = await response.text();
  if (!response.ok) {
    console.error('API Error Response (getUsers):', responseText);
    throw new Error(`Failed to fetch users: ${response.status} ${response.statusText} - ${responseText.substring(0, 200)}`);
  }
  try {
    const users: User[] = JSON.parse(responseText);
    const emails = users
      .map(user => user.email)
      .filter(email => email && email.trim() !== '')
      .filter((email, index, self) => self.indexOf(email) === index); // Unique
    return emails;
  } catch (parseError) {
    console.error('JSON Parse Error (getUsers):', responseText.substring(0, 500));
    throw new Error('Invalid JSON response from server');
  }
}

export async function getMe(): Promise<number> {
  const response = await fetch('/zammad-api/api/v1/users/me', { headers });
  const responseText = await response.text();
  if (!response.ok) {
    console.error('API Error Response (getMe):', responseText);
    throw new Error(`Failed to fetch current user: ${response.status} ${response.statusText} - ${responseText.substring(0, 200)}`);
  }
  try {
    const me: MeResponse = JSON.parse(responseText);
    return me.id;
  } catch (parseError) {
    console.error('JSON Parse Error (getMe):', responseText.substring(0, 500));
    throw new Error('Invalid JSON response from server');
  }
}

export async function createTicket(title: string, customerEmail: string, note: string): Promise<TicketResponse> {
  const ownerId = await getMe();
  const customerId = `guess:${customerEmail}`;
  const payload: TicketPayload = {
    title,
    group: GROUP,
    customer_id: customerId,
    owner_id: ownerId,
    article: {
      body: note,
      type: 'note',
      internal: true,
    },
    state_id: STATE_ID,
    mentions: [ownerId],
    tags: TAGS,
  };

  const response = await fetch('/zammad-api/api/v1/tickets', {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });

  const responseText = await response.text();
  if (!response.ok) {
    console.error('API Error Response (createTicket):', responseText);
    throw new Error(`Failed to create ticket: ${response.status} ${response.statusText} - ${responseText.substring(0, 200)}`);
  }
  try {
    const ticket: TicketResponse = JSON.parse(responseText);
    return ticket;
  } catch (parseError) {
    console.error('JSON Parse Error (createTicket):', responseText.substring(0, 500));
    throw new Error('Invalid JSON response from server');
  }
}
