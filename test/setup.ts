import { vi } from 'vitest'

vi.mock('react-dom', () => ({
  ...vi.importActual('react-dom'),
  useFormState: () => [{}, () => {}]
}))
