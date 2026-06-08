// In-app bug reporter → backend creates a GitHub issue.
import api from './api'

export const reportApi = {
  send: (description: string, title?: string) =>
    api.post<{ url: string; number: number }>('/report', { description, title }).then((r) => r.data),
}
