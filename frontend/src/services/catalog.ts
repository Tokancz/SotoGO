// Reference-data API: vehicle catalog + stops.
import api from './api'
import type { ApiStop, CatalogVehicle } from '@/types/game'

export const catalogApi = {
  vehicles: () => api.get<{ vehicles: CatalogVehicle[] }>('/vehicles').then((r) => r.data.vehicles),

  stops: (near?: { lat: number; lng: number; km?: number }) => {
    const params = near ? { near: `${near.lat},${near.lng}`, km: near.km ?? 3 } : {}
    return api.get<{ stops: ApiStop[] }>('/stops', { params }).then((r) => r.data.stops)
  },
}
