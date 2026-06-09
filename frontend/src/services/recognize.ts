// Photo-based vehicle recognition. Posts the catch photo to the backend, which
// runs a vision model and returns any legible fleet number plus the most likely
// catalog models. The client uses the number when present (authoritative) and
// otherwise pre-selects the visual candidates in the manual picker.
import api from './api'
import type { CategoryKey } from '@/types/game'

export interface RecognizeCandidate {
  shortName: string
  /** Model's self-reported likelihood, 0–1. */
  confidence: number
}

export interface RecognizeResult {
  /** Painted registration digits, or "" if none were legible. */
  fleetNumber: string
  category: CategoryKey
  /** Up to 3 catalog models, most likely first. */
  candidates: RecognizeCandidate[]
}

export const recognizeApi = {
  async recognize(photo: Blob): Promise<RecognizeResult> {
    const form = new FormData()
    form.append('photo', photo, 'catch.jpg')
    const { data } = await api.post<RecognizeResult>('/recognize', form)
    return data
  },
}
