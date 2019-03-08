/*
 * based on "Fast Construction of the Vietoris-Rips Complex"
 * by Afra Zomorodian
 */
export function lowerNeighbors(G, u) {
  return G.E
    .filter(([v1, v2]) => (u.id === v1.id || u.id === v2.id) && (v1.id < u.id || v2.id < u.id))
    .map(([v1, v2]) => v1.id === u.id ? v2 : v1)
}

export function intersect(setA, setB) {
  return setA.filter((item) => setB.map(({id}) => id).includes(item.id))
}

function cofaces(G, k, tau, N, V) {
  let newV = V.concat([tau])
  if (tau.length >= k) {
    return newV;
  }
  return N.reduce((acc, v) => {
    const sigma = tau.length ? tau.concat([v]) : [v, tau]
    const M = intersect(N, lowerNeighbors(G, v))
    return cofaces(G, k, sigma, M, acc)
  }, newV)
}

function incrementalVR(G, k) {
  const complex = G.V
    .reduce((acc, p, i) => {
      const N = lowerNeighbors(G, p)
      return cofaces(G, k, p, N, acc)
    }, [])
  return complex
}

function appendSimplex(hash, s) {
  const key = `${s.length ? s.length - 1 : 0}-simplices`
  return hash[key] ?
    Object.assign({}, hash, {[key]: hash[key].concat([s])}) :
    Object.assign({}, hash, {[key]: [s]})
}

export function complex(points, maxK, eta) {
  const G = {V: points, E: graph(points, eta)}
  const vr = incrementalVR(G, maxK)
  const complex = vr.reduce(appendSimplex, {})

  return complex
}

function dist(p1, p2) {
  return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2))
}

function graph(points, eta) {
  // brute force exact
  return points.reduce((pset, p, i, arr) => {
    const pairs = arr
          .reduce((s, pn, ind) => ind === i ? s : dist(p, pn) <= eta ? [pn, ...s] : s, [])
          .filter((n) => !pset.find((pair) => (pair[0].id === n.id || pair[1].id === n.id) && (pair[0].id === p.id || pair[1].id === p.id)))
          .map((n) => [p, n])
    return pset.concat(pairs)
  }, [])
}
