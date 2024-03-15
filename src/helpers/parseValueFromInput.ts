export const parseValueFromInput = (
  input: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
) => {
  if (
    input instanceof HTMLSelectElement ||
    input instanceof HTMLTextAreaElement
  ) {
    return input.value
  }

  if (input.type === 'checkbox') {
    return input.checked
  }

  if (input.type === 'number') {
    const number = parseFloat(input.value || '0')
    return isNaN(number) ? null : number
  }

  if (input.type === 'file') {
    return input.files?.[0] ?? null
  }

  if (input.type === 'radio') {
    return input.checked ? input.value : null
  }

  if (input.type === 'date') {
    return input.valueAsDate?.toISOString() ?? null
  }

  return input.value
}
