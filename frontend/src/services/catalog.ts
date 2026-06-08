// Reference-data API: vehicle catalog + stops.
import api from './api'
import type { ApiStop, CatalogVehicle, RouteGeometry } from '@/types/game'

export const catalogApi = {
  vehicles: () => api.get<{ vehicles: CatalogVehicle[] }>('/vehicles').then((r) => r.data.vehicles),

  stops: (near?: { lat: number; lng: number; km?: number }) => {
    const params = near ? { near: `${near.lat},${near.lng}`, km: near.km ?? 3 } : {}
    return api.get<{ stops: ApiStop[] }>('/stops', { params }).then((r) => r.data.stops)
  },

  searchStops: (q: string) =>
    api.get<{ stops: ApiStop[] }>('/stops', { params: { q } }).then((r) => r.data.stops),

  routes: (stopId: string) =>
    api.get<{ routes: RouteGeometry[] }>(`/stops/${stopId}/routes`).then((r) => r.data.routes),
}
