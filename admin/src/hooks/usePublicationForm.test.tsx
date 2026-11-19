import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { createEmptyFormValues } from '../components/publications/publication-form-utils'
import usePublicationForm from './usePublicationForm'

describe('usePublicationForm', () => {
  it('updates rather than duplicates an already loaded direct asset relation', () => {
    const values = createEmptyFormValues()
    const asset = { id: 8, type: 'image', url: '/image.png', dimensions: null }
    const relation = { id: 42, role: 'cover', publication: { id: 3 }, asset }
    values.assets.directAssets = [relation]
    const { result } = renderHook(() => usePublicationForm(values, {}))

    act(() => result.current.addDirectAsset({ ...relation, asset: { ...asset, name: 'image.png' } }))
    expect(result.current.values.assets.directAssets).toEqual([
      { ...relation, asset: { ...asset, name: 'image.png' } },
    ])
  })
})
