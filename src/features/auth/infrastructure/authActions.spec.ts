import { registerAction } from './authActions';
import { register } from './authServerClient';

vi.mock('./authServerClient');

const CREDENTIALS = {
  email: 'ana@example.com',
  password: 'correct-horse-battery',
};

describe('registerAction', () => {
  it('should register through the server-only client and return its result', async () => {
    vi.mocked(register).mockResolvedValue({ kind: 'emailTaken' });

    const result = await registerAction(CREDENTIALS);

    expect(register).toHaveBeenCalledWith(CREDENTIALS);
    expect(result).toEqual({ kind: 'emailTaken' });
  });
});
