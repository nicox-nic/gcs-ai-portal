import { describe, expect, it } from 'vitest'

/**
 * ConfirmDialog closes only when onConfirm does not return false.
 * Pure guard logic mirrored from ConfirmDialog.handleConfirm for unit coverage.
 */
function shouldCloseAfterConfirm(result: boolean | void): boolean {
  return result !== false
}

describe('ConfirmDialog required-reason guard', () => {
  it('keeps dialog open when onConfirm returns false', () => {
    expect(shouldCloseAfterConfirm(false)).toBe(false)
  })

  it('closes when onConfirm returns void/undefined', () => {
    expect(shouldCloseAfterConfirm(undefined)).toBe(true)
  })

  it('closes when onConfirm returns true', () => {
    expect(shouldCloseAfterConfirm(true)).toBe(true)
  })
})
