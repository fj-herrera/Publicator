import { describe, expect, it } from 'vitest'
import type { AssetTextDraft } from '../../entities/asset-text'
import type { PublicationRelationDraft } from './PublicationRelationDrafts'
import { getAssetEditValidationError } from './gallery-asset-validation'

type PublicationRole = {
  id: number
  publicationId: number
  role: string
}

const textDraft = (overrides: Partial<AssetTextDraft> = {}): AssetTextDraft => ({
  key: 1,
  id: null,
  role: 'alt',
  text: 'Description',
  isRemoved: false,
  ...overrides,
})

const relationDraft = (
  overrides: Partial<PublicationRelationDraft> = {},
): PublicationRelationDraft => ({
  key: 1,
  publicationId: '1',
  role: 'cover',
  ...overrides,
})

const validate = (overrides: {
  assetName?: string
  publicationRoles?: PublicationRole[]
  editedPublicationRoles?: Record<number, string>
  newPublicationRelations?: PublicationRelationDraft[]
  assetTextDrafts?: AssetTextDraft[]
} = {}) => getAssetEditValidationError({
  assetName: ' image.png ',
  publicationRoles: [],
  editedPublicationRoles: {},
  newPublicationRelations: [],
  assetTextDrafts: [],
  ...overrides,
})

describe('getAssetEditValidationError', () => {
  it('validates the asset name and existing publication roles', () => {
    expect(validate({ assetName: '   ' })).toBe('Enter a file name of 1 to 255 characters.')
    expect(validate({ assetName: ` ${'a'.repeat(256)} ` }))
      .toBe('Enter a file name of 1 to 255 characters.')

    const publicationRoles = [{ id: 2, publicationId: 7, role: 'cover' }]
    expect(validate({ publicationRoles, editedPublicationRoles: { 2: '  ' } }))
      .toBe('Every publication association must have a role.')
    expect(validate({
      publicationRoles,
      editedPublicationRoles: { 2: 'r'.repeat(51) },
    })).toBe('Roles can contain up to 50 characters.')
  })

  it('validates new publication relations and active text drafts', () => {
    expect(validate({ newPublicationRelations: [relationDraft({ publicationId: '' })] }))
      .toBe('Choose a publication and a role for each new relation.')
    expect(validate({ newPublicationRelations: [relationDraft({ role: '  ' })] }))
      .toBe('Choose a publication and a role for each new relation.')
    expect(validate({ newPublicationRelations: [relationDraft({ role: 'r'.repeat(51) })] }))
      .toBe('Choose a publication and a role for each new relation.')

    expect(validate({ assetTextDrafts: [textDraft({ role: ' ' })] }))
      .toBe('Every text needs a role and some content.')
    expect(validate({ assetTextDrafts: [textDraft({ text: ' ' })] }))
      .toBe('Every text needs a role and some content.')
    expect(validate({ assetTextDrafts: [textDraft({ role: 'r'.repeat(51) })] }))
      .toBe('Text roles can contain up to 50 characters.')
    expect(validate({ assetTextDrafts: [textDraft({ role: '', text: '', isRemoved: true })] }))
      .toBeNull()
  })

  it('rejects duplicate roles for one publication regardless of case', () => {
    expect(validate({
      publicationRoles: [{ id: 1, publicationId: 7, role: 'cover' }],
      editedPublicationRoles: { 1: ' COVER ' },
      newPublicationRelations: [relationDraft({ publicationId: '7', role: 'Cover' })],
    })).toBe('This publication already has an association with that role.')

    expect(validate({
      publicationRoles: [
        { id: 1, publicationId: 7, role: 'cover' },
        { id: 2, publicationId: 7, role: 'thumbnail' },
      ],
      editedPublicationRoles: { 1: 'Image', 2: ' image ' },
    })).toBe('This publication cannot have duplicate roles for the same asset.')
  })

  it('accepts a valid edit', () => {
    expect(validate({
      publicationRoles: [{ id: 1, publicationId: 7, role: 'cover' }],
      editedPublicationRoles: { 1: 'Main image' },
      newPublicationRelations: [relationDraft({ publicationId: '8', role: 'cover' })],
      assetTextDrafts: [textDraft()],
    })).toBeNull()
  })
})
