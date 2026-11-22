import {
  createServer,
  type IncomingMessage,
  type ServerResponse,
} from 'node:http';

export const NUMO_API_MOCK_PORT = 3998;
export const NUMO_API_MOCK_URL = `http://localhost:${NUMO_API_MOCK_PORT}`;

export type MockReply = Readonly<{
  status: number;
  json?: unknown;
  headers?: Record<string, string>;
}>;

export type ReceivedCall = Readonly<{
  method: string;
  path: string;
  body: unknown;
}>;

type Responder = MockReply | (() => Promise<MockReply>);

const UNREACHABLE = Symbol('unreachable');
const UNMOCKED_STATUS = 500;

// Stands in for numo-api while the e2e Next.js server runs with
// NUMO_API_URL pointing here: Playwright's page.route() only sees the
// browser's requests, not the server's.
export class NumoApiMock {
  private readonly server = createServer(
    (request, response) => void this.handle(request, response),
  );
  private responders = new Map<string, Responder | typeof UNREACHABLE>();
  private receivedCalls: ReceivedCall[] = [];
  private unmockedRoutes: string[] = [];

  get calls(): readonly ReceivedCall[] {
    return this.receivedCalls;
  }

  get unmockedCalls(): readonly string[] {
    return this.unmockedRoutes;
  }

  // `route` is "<METHOD> <path>", e.g. "POST /auth/register".
  respond(route: string, responder: Responder): void {
    this.responders.set(route, responder);
  }

  goDown(route: string): void {
    this.responders.set(route, UNREACHABLE);
  }

  reset(): void {
    this.responders = new Map();
    this.receivedCalls = [];
    this.unmockedRoutes = [];
  }

  start(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.server.once('error', reject);
      this.server.listen(NUMO_API_MOCK_PORT, resolve);
    });
  }

  stop(): Promise<void> {
    this.server.closeAllConnections();
    return new Promise((resolve, reject) =>
      this.server.close((error) => (error ? reject(error) : resolve())),
    );
  }

  private async handle(
    request: IncomingMessage,
    response: ServerResponse,
  ): Promise<void> {
    const call = await readCall(request);
    this.receivedCalls.push(call);
    const route = `${call.method} ${call.path}`;
    const responder = this.responders.get(route);
    if (responder === UNREACHABLE) {
      request.socket.destroy();
      return;
    }
    if (responder === undefined) {
      this.unmockedRoutes.push(route);
      sendReply(response, { status: UNMOCKED_STATUS });
      return;
    }
    sendReply(response, await toReply(responder));
  }
}

async function readCall(request: IncomingMessage): Promise<ReceivedCall> {
  const chunks: Buffer[] = [];
  for await (const chunk of request) {
    chunks.push(Buffer.from(chunk));
  }
  const text = Buffer.concat(chunks).toString('utf8');
  return {
    method: request.method ?? '',
    path: request.url ?? '',
    body: text === '' ? undefined : JSON.parse(text),
  };
}

function toReply(responder: Responder): Promise<MockReply> {
  return typeof responder === 'function'
    ? responder()
    : Promise.resolve(responder);
}

function sendReply(response: ServerResponse, reply: MockReply): void {
  const contentType =
    reply.json === undefined ? {} : { 'Content-Type': 'application/json' };
  response.writeHead(reply.status, { ...contentType, ...reply.headers });
  response.end(
    reply.json === undefined ? undefined : JSON.stringify(reply.json),
  );
}
