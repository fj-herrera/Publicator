import type { Asset } from '../../entities/asset'
import type { PublicationListData } from '../../entities/publication'
import type {
  AssetsValues,
  MainInfoErrors,
  MainInfoValues,
  PublicationContextDraft,
  PublicationFormData,
  PublicationFormErrors,
  PublicationFormSectionId,
  PublicationFormValues,
  SectionErrors,
} from '../../entities/publication-form'
import type { SkillGroup } from '../../entities/skill-group'
import type { PublicationTextRecord } from '../../entities/publication-text'
import type { PublicationTextValues } from '../../entities/publication-text'

// Same limits as CreateMetaDto in the API.
const maxTitleLength = 100
const maxSlugLength = 100

export function slugify(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/[\s-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function validateMainInfo(values: MainInfoValues): MainInfoErrors {
  const errors: MainInfoErrors = {}
  const title = values.title.trim()
  const slug = values.slug.trim()

  if (!title) errors.title = 'Title is required.'
  else if (title.length > maxTitleLength) {
    errors.title = `Title must be ${maxTitleLength} characters or fewer.`
  }

  if (!slug) errors.slug = 'Slug is required.'
  else if (slug.length > maxSlugLength) {
    errors.slug = `Slug must be ${maxSlugLength} characters or fewer.`
  }

  if (values.typeId === null) errors.typeId = 'Type is required.'

  if (values.contexts.length === 0) errors.contexts = 'Select at least one context.'

  return errors
}

export function hasUnsavedTextDraft(values: PublicationTextValues): boolean {
  if (values.editingAssociationId === null) {
    return Boolean(values.textType || values.plainContent || values.markdownContent)
  }

  const original = values.associations.find((item) => item.id === values.editingAssociationId)
  if (!original?.text) return true
  const currentContent = values.format === 'PLAIN' ? values.plainContent : values.markdownContent

  return values.textType !== original.type
    || values.format !== original.text.format
    || currentContent !== original.text.text
}

function validateAssets(values: AssetsValues): SectionErrors {
  if (values.pendingUploads.length > 0) {
    return { pendingUploads: 'Upload, retry, or remove each pending asset before finishing.' }
  }
  if (values.pendingOperations > 0) {
    return { pendingOperations: 'Wait for pending asset operations to finish.' }
  }
  return {}
}

function validateTexts(values: PublicationTextValues): SectionErrors {
  if (values.pendingOperation) {
    return { operation: 'Wait for the current text operation to finish.' }
  }
  return hasUnsavedTextDraft(values)
    ? { editor: 'Save or cancel the current text before finishing.' }
    : {}
}

// Assets and Texts validation arrives with their own phases.
export const sectionValidators: {
  [K in PublicationFormSectionId]: (values: PublicationFormValues) => PublicationFormErrors[K]
} = {
  mainInfo: (values) => validateMainInfo(values.mainInfo),
  assets: (values) => validateAssets(values.assets),
  texts: (values) => validateTexts(values.texts),
}

export function hasErrors(errors: Partial<Record<string, string>>): boolean {
  return Object.keys(errors).length > 0
}

export function createEmptyFormValues(textTypes: string[] = []): PublicationFormValues {
  return {
    mainInfo: {
      title: '',
      slug: '',
      slugEditedManually: false,
      typeId: null,
      clientId: null,
      contexts: [],
      tagIds: [],
      skillGroupIds: [],
      status: 'draft',
    },
    assets: {
      collectionIds: [],
      directAssets: [],
      pendingUploads: [],
      uploadRole: '',
      pendingOperations: 0,
    },
    texts: {
      associations: [],
      typeOptions: textTypes,
      textType: '',
      format: 'PLAIN',
      plainContent: '',
      markdownContent: '',
      editingAssociationId: null,
      pendingOperation: false,
    },
  }
}

// Keeps existing associations and adds new ones with the agreed initial values.
export function syncContextDrafts(
  current: PublicationContextDraft[],
  selectedContextIds: number[],
  lastContextPosition: Record<number, number>,
): PublicationContextDraft[] {
  return selectedContextIds.map((contextId) => (
    current.find((draft) => draft.contextId === contextId) ?? {
      id: null,
      contextId,
      visible: false,
      featured: false,
      position: (lastContextPosition[contextId] ?? 0) + 1,
    }
  ))
}

export function buildPublicationFormData(
  data: PublicationListData,
  skillGroups: Pick<SkillGroup, 'id' | 'name'>[],
  publicationId: number | null,
  assets: Asset[] = [],
  textContents: PublicationTextRecord[] = [],
): PublicationFormData | null {
  const textTypes = [...new Set(textContents.map((item) => item.type))].sort()
  const publicationTexts = publicationId === null
    ? []
    : textContents.filter((item) => item.content.publication?.id === publicationId && item.text !== null)
  const lastContextPosition: Record<number, number> = {}
  data.publicationContexts.forEach(({ context, position }) => {
    lastContextPosition[context.id] = Math.max(lastContextPosition[context.id] ?? 0, position)
  })

  const catalogs = {
    types: data.types,
    clients: data.clients,
    contexts: data.contexts,
    tags: data.tags,
    skillGroups,
    collections: publicationId === null
      ? []
      : data.collections.filter((collection) => collection.publication.id === publicationId),
    publicationRoles: [...new Set(data.publicationAssets.map((item) => item.role))],
    lastContextPosition,
  }

  if (publicationId === null) {
    const initialValues = createEmptyFormValues(textTypes)
    return { publicationId: null, metaId: null, publicationTexts, catalogs, initialValues }
  }

  const publication = data.publications.find((item) => item.id === publicationId)
  if (!publication) return null

  const initialValues = createEmptyFormValues(textTypes)
  const assetsById = new Map(assets.map((asset) => [asset.id, asset]))
  initialValues.mainInfo = {
    title: publication.meta.title,
    slug: publication.meta.slug,
    // The loaded slug follows Title until the administrator edits it.
    slugEditedManually: false,
    typeId: publication.type.id,
    clientId: publication.meta.client?.id ?? null,
    contexts: data.publicationContexts
      .filter((item) => item.publication.id === publicationId)
      .map((item) => ({
        id: item.id,
        contextId: item.context.id,
        visible: item.visible,
        featured: item.featured,
        position: item.position,
      })),
    tagIds: data.publicationTags
      .filter((item) => item.publication.id === publicationId)
      .map((item) => item.tag.id),
    skillGroupIds: data.publicationSkillGroups
      .filter((item) => item.publication.id === publicationId)
      .map((item) => item.skillGroup.id),
    status: publication.meta.status,
  }
  initialValues.assets = {
    collectionIds: data.collections
      .filter((collection) => collection.publication.id === publicationId)
      .map((collection) => collection.id),
    directAssets: data.publicationAssets
      .filter((item) => item.publication.id === publicationId)
      .map((item) => ({
        ...item,
        asset: assetsById.get(item.asset.id) ?? item.asset,
      })),
    pendingUploads: [],
    uploadRole: '',
    pendingOperations: 0,
  }
  initialValues.texts.associations = publicationTexts
  return {
    publicationId,
    metaId: publication.meta.id,
    publicationTexts,
    catalogs,
    initialValues,
  }
}
