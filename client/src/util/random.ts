import { nanoid } from 'nanoid'

// Returns a random string for seeding.
export function generateRandSeed (): string {
  return nanoid()
}
