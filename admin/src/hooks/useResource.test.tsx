import { act, renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { invalidate } from '../state/resource-invalidation'
import useResource from './useResource'

const deferred = <T,>() => {
  let resolve!: (value: T) => void
  let reject!: (reason: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

describe('useResource', () => {
  it('loads once and reports the loading state only for the first load', async () => {
    const load = vi.fn().mockResolvedValue(['a'])
    const { result } = renderHook(() => useResource('skills', load, 'failed'))

    expect(result.current.isLoading).toBe(true)
    await waitFor(() => expect(result.current.data).toEqual(['a']))
    expect(result.current.isLoading).toBe(false)
    expect(load).toHaveBeenCalledTimes(1)
  })

  it('reloads silently when invalidated, keeping the previous data meanwhile', async () => {
    const second = deferred<string[]>()
    const load = vi.fn().mockResolvedValueOnce(['a']).mockReturnValueOnce(second.promise)
    const { result } = renderHook(() => useResource('skills', load, 'failed'))
    await waitFor(() => expect(result.current.data).toEqual(['a']))

    act(() => invalidate('skills'))

    expect(result.current.isLoading).toBe(false)
    expect(result.current.isRefreshing).toBe(true)
    expect(result.current.data).toEqual(['a'])

    await act(async () => second.resolve(['a', 'b']))
    expect(result.current.data).toEqual(['a', 'b'])
    expect(result.current.isRefreshing).toBe(false)
    expect(load).toHaveBeenCalledTimes(2)
  })

  it('discards a response that is no longer the latest request', async () => {
    const first = deferred<string[]>()
    const second = deferred<string[]>()
    const load = vi.fn().mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise)
    const { result } = renderHook(() => useResource('skills', load, 'failed'))

    act(() => invalidate('skills'))
    await act(async () => second.resolve(['new']))
    await act(async () => first.resolve(['old']))

    expect(result.current.data).toEqual(['new'])
  })

  it('ignores a response that arrives after unmounting', async () => {
    const pending = deferred<string[]>()
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const { unmount } = renderHook(() => useResource('skills', () => pending.promise, 'failed'))

    unmount()
    await act(async () => pending.resolve(['late']))

    expect(error).not.toHaveBeenCalled()
  })

  it('keeps the previous data and reports the error when a reload fails', async () => {
    const load = vi.fn()
      .mockResolvedValueOnce(['a'])
      .mockRejectedValueOnce(new Error('boom'))
      .mockResolvedValueOnce(['a', 'b'])
    const { result } = renderHook(() => useResource('skills', load, 'failed'))
    await waitFor(() => expect(result.current.data).toEqual(['a']))

    act(() => invalidate('skills'))
    await waitFor(() => expect(result.current.error).toBe('boom'))
    expect(result.current.data).toEqual(['a'])

    act(() => invalidate('skills'))
    await waitFor(() => expect(result.current.error).toBe(''))
    expect(result.current.data).toEqual(['a', 'b'])
  })

  it('lets two consumers of the same resource each reload once per invalidation', async () => {
    const load = vi.fn().mockResolvedValue(['a'])
    const first = renderHook(() => useResource('skills', load, 'failed'))
    const second = renderHook(() => useResource('skills', load, 'failed'))
    await waitFor(() => expect(first.result.current.data).toBeDefined())
    await waitFor(() => expect(second.result.current.data).toBeDefined())
    load.mockClear()

    await act(async () => invalidate('skills'))

    expect(load).toHaveBeenCalledTimes(2)
  })

  it('does not reload when nothing was invalidated', async () => {
    const load = vi.fn().mockResolvedValue(['a'])
    const { result } = renderHook(() => useResource('skillGroups', load, 'failed'))
    await waitFor(() => expect(result.current.data).toBeDefined())
    load.mockClear()

    await act(async () => invalidate())

    expect(load).not.toHaveBeenCalled()
  })
})
