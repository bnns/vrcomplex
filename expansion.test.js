import {intersect, lowerNeighbors, complex} from './expansion'

const p1 = {id: 1, x: 0, y: 0}
const p2 = {id: 2, x: 2, y: 2}
const p3 = {id: 3, x: 3, y: 3}
const p4 = {id: 4, x: 4, y: 4}

test('intersection of two lists with ids', () => {
  const setA = [p1, p2, p3]
  const setB = [p2, p3, p4]
  expect(intersect(setA, setB)).toEqual([p2, p3]);
});

test('lower neighbors should be a list of neighbors with smaller ids', () => {
  const G = {V: [p1, p2, p3], E: [[p1, p2], [p2, p3], [p1, p3]]}
  expect(lowerNeighbors(G, p3)).toEqual(expect.arrayContaining([p1, p2]));
})

test('VR complex of dimension 2', () => {
  const points = [p1, p2, p3, p4]
  const vrComplex = complex(points, 2, 30)
  expect(vrComplex['0-simplices']).toHaveLength(4)
  expect(vrComplex['1-simplices']).toHaveLength(6)
})

test('VR complex of dimension 3', () => {
  const points = [p1, p2, p3, p4]
  const vrComplex = complex(points, 3, 30)
  expect(vrComplex['0-simplices']).toHaveLength(4)
  expect(vrComplex['1-simplices']).toHaveLength(6)
  expect(vrComplex['2-simplices']).toHaveLength(4)
})

test('VR complex of dimension 4', () => {
  const points = [p1, p2, p3, p4]
  const vrComplex = complex(points, 4, 30)
  expect(vrComplex['3-simplices']).toHaveLength(1)
})
