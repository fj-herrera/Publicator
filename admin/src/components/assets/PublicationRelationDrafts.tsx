import AddIcon from '@mui/icons-material/Add'
import CloseIcon from '@mui/icons-material/Close'
import type { PublicationAssetTarget } from '../../entities/asset'
import RoleCombobox from './RoleCombobox'

export interface PublicationRelationDraft {
  key: number
  publicationId: string
  role: string
}

interface PublicationRelationDraftsProps {
  drafts: PublicationRelationDraft[]
  publications: PublicationAssetTarget[]
  roles: string[]
  onAdd: () => void
  onChange: (key: number, changes: Partial<Omit<PublicationRelationDraft, 'key'>>) => void
  onRemove: (key: number) => void
}

function PublicationRelationDrafts({
  drafts,
  publications,
  roles,
  onAdd,
  onChange,
  onRemove,
}: PublicationRelationDraftsProps) {
  return (
    <div className="asset-new-publication-relations">
      {drafts.map((draft) => (
        <div className="asset-new-publication-relation" key={draft.key}>
          <label className="visually-hidden" htmlFor={`new-publication-${draft.key}`}>
            Publication
          </label>
          <select
            id={`new-publication-${draft.key}`}
            onChange={(event) => onChange(draft.key, { publicationId: event.target.value })}
            value={draft.publicationId}
          >
            <option value="">Select publication</option>
            {publications.map((publication) => (
              <option key={publication.id} value={publication.id}>
                {publication.meta.title} / {publication.meta.slug}
              </option>
            ))}
          </select>
          <RoleCombobox
            id={`new-publication-role-${draft.key}`}
            label="Role for new publication relation"
            onChange={(role) => onChange(draft.key, { role })}
            options={roles}
            value={draft.role}
          />
          <button
            aria-label="Cancel new publication relation"
            className="asset-new-publication-remove"
            onClick={() => onRemove(draft.key)}
            type="button"
          >
            <CloseIcon aria-hidden="true" />
          </button>
        </div>
      ))}
      <button className="asset-detail-add-relation" onClick={onAdd} type="button">
        <AddIcon aria-hidden="true" /> Add publication relation
      </button>
    </div>
  )
}

export default PublicationRelationDrafts