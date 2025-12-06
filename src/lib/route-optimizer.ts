import { Package, Courier, RouteOptimization } from './types'

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

function nearestNeighbor(packages: Package[], startLat = -6.2088, startLon = 106.8456): Package[] {
  const visited = new Set<string>()
  const route: Package[] = []
  let currentLat = startLat
  let currentLon = startLon
  
  while (route.length < packages.length) {
    let nearest: Package | null = null
    let minDistance = Infinity
    
    for (const pkg of packages) {
      if (!visited.has(pkg.id)) {
        const distance = calculateDistance(currentLat, currentLon, pkg.latitude, pkg.longitude)
        if (distance < minDistance) {
          minDistance = distance
          nearest = pkg
        }
      }
    }
    
    if (nearest) {
      route.push(nearest)
      visited.add(nearest.id)
      currentLat = nearest.latitude
      currentLon = nearest.longitude
    }
  }
  
  return route
}

function calculateRouteDistance(packages: Package[], startLat = -6.2088, startLon = 106.8456): number {
  if (packages.length === 0) return 0
  
  let totalDistance = calculateDistance(startLat, startLon, packages[0].latitude, packages[0].longitude)
  
  for (let i = 0; i < packages.length - 1; i++) {
    totalDistance += calculateDistance(
      packages[i].latitude,
      packages[i].longitude,
      packages[i + 1].latitude,
      packages[i + 1].longitude
    )
  }
  
  return totalDistance
}

export function optimizeRoutes(
  packages: Package[],
  couriers: Courier[],
  warehouseLat = -6.2088,
  warehouseLon = 106.8456
): RouteOptimization[] {
  if (packages.length === 0 || couriers.length === 0) return []
  
  const activeCouriers = couriers.filter(c => c.active)
  if (activeCouriers.length === 0) return []
  
  const sortedPackages = [...packages].sort((a, b) => a.weight - b.weight)
  const courierPackages: Map<string, Package[]> = new Map()
  const courierCapacity: Map<string, number> = new Map()
  
  activeCouriers.forEach(courier => {
    courierPackages.set(courier.id, [])
    courierCapacity.set(courier.id, 0)
  })
  
  for (const pkg of sortedPackages) {
    let assignedCourier: string | null = null
    let minLoad = Infinity
    
    for (const courier of activeCouriers) {
      const currentLoad = courierCapacity.get(courier.id) || 0
      if (currentLoad + pkg.weight <= courier.capacity && currentLoad < minLoad) {
        minLoad = currentLoad
        assignedCourier = courier.id
      }
    }
    
    if (assignedCourier) {
      courierPackages.get(assignedCourier)!.push(pkg)
      courierCapacity.set(assignedCourier, minLoad + pkg.weight)
    }
  }
  
  const optimizations: RouteOptimization[] = []
  
  for (const courier of activeCouriers) {
    const pkgs = courierPackages.get(courier.id) || []
    if (pkgs.length > 0) {
      const optimizedRoute = nearestNeighbor(pkgs, warehouseLat, warehouseLon)
      const routeCoords: [number, number][] = [
        [warehouseLat, warehouseLon],
        ...optimizedRoute.map(p => [p.latitude, p.longitude] as [number, number])
      ]
      
      optimizations.push({
        courierId: courier.id,
        courierName: courier.name,
        packages: optimizedRoute,
        totalDistance: calculateRouteDistance(optimizedRoute, warehouseLat, warehouseLon),
        route: routeCoords
      })
    }
  }
  
  return optimizations
}

export function generateBetterRoute(
  currentOptimization: RouteOptimization,
  warehouseLat = -6.2088,
  warehouseLon = 106.8456
): RouteOptimization {
  const packages = [...currentOptimization.packages]
  
  for (let i = 0; i < 10; i++) {
    const idx1 = Math.floor(Math.random() * packages.length)
    const idx2 = Math.floor(Math.random() * packages.length)
    if (idx1 !== idx2) {
      [packages[idx1], packages[idx2]] = [packages[idx2], packages[idx1]]
    }
  }
  
  const distance = calculateRouteDistance(packages, warehouseLat, warehouseLon)
  
  if (distance < currentOptimization.totalDistance) {
    const routeCoords: [number, number][] = [
      [warehouseLat, warehouseLon],
      ...packages.map(p => [p.latitude, p.longitude] as [number, number])
    ]
    
    return {
      ...currentOptimization,
      packages,
      totalDistance: distance,
      route: routeCoords
    }
  }
  
  return currentOptimization
}
