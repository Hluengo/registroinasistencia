import { beforeEach, describe, expect, it, vi } from 'vitest'

const { createSignedUrl } = vi.hoisted(() => ({
  createSignedUrl: vi.fn(),
}))

vi.mock('../services/supabaseClient', () => ({
  supabase: {
    storage: {
      from: () => ({ createSignedUrl }),
    },
  },
}))

import { getSignedFileUrl } from './upload'

describe('getSignedFileUrl', () => {
  beforeEach(() => {
    createSignedUrl.mockReset()
    createSignedUrl.mockResolvedValue({
      data: { signedUrl: 'https://signed.example.com/document' },
      error: null,
    })
  })

  it('signs a historical public Storage URL', async () => {
    const result = await getSignedFileUrl(
      'https://old-project.supabase.co/storage/v1/object/public/documents/absences/file.pdf'
    )

    expect(createSignedUrl).toHaveBeenCalledWith('absences/file.pdf', 3600)
    expect(result).toBe('https://signed.example.com/document')
  })

  it('leaves unrelated external URLs unchanged', async () => {
    const externalUrl = 'https://example.com/document.pdf'

    await expect(getSignedFileUrl(externalUrl)).resolves.toBe(externalUrl)
    expect(createSignedUrl).not.toHaveBeenCalled()
  })
})
