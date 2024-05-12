export const shallowEqual = (a: any[], b: any[]) => {
  if (a === b) {
    return true
  }

  if (a.length !== b.length) {
    return false
  }

  return a.every((value, index) => value === b[index])
}
