import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import UndoIcon from '@mui/icons-material/Undo'
import type { AssetTextDraft } from '../../entities/asset-text'
import RoleCombobox from './RoleCombobox'
import './asset-texts-editor.css'

interface AssetTextsEditorProps {
  drafts: AssetTextDraft[]
  roles: string[]
  isEditing: boolean
  onAdd: () => void
  onChange: (key: number, changes: Partial<Pick<AssetTextDraft, 'role' | 'text'>>) => void
  onRemove: (key: number) => void
  onRestore: (key: number) => void
}

function AssetTextsEditor({
  drafts,
  roles,
  isEditing,
  onAdd,
  onChange,
  onRemove,
  onRestore,
}: AssetTextsEditorProps) {
  const visibleDrafts = isEditing ? drafts : drafts.filter((draft) => !draft.isRemoved)

  return (
    <section className="asset-texts">
      <h3>Texts</h3>
      {visibleDrafts.length === 0 && <p className="asset-texts-empty">No texts.</p>}
      {visibleDrafts.length > 0 && (
        <ul className="asset-texts-list">
          {visibleDrafts.map((draft) => (
            <li
              className={`asset-text-row${draft.isRemoved ? ' asset-text-row-removed' : ''}`}
              key={draft.key}
            >
              {isEditing ? (
                <>
                  <RoleCombobox
                    disabled={draft.isRemoved}
                    id={`asset-text-role-${draft.key}`}
                    label="Role of this text"
                    onChange={(role) => onChange(draft.key, { role })}
                    options={roles}
                    value={draft.role}
                  />
                  <textarea
                    aria-label="Text content"
                    className="asset-text-input"
                    disabled={draft.isRemoved}
                    onChange={(event) => onChange(draft.key, { text: event.target.value })}
                    rows={2}
                    value={draft.text}
                  />
                  <button
                    aria-label={draft.isRemoved ? 'Restore text' : 'Remove text'}
                    className="asset-text-action"
                    onClick={() => (draft.isRemoved ? onRestore(draft.key) : onRemove(draft.key))}
                    type="button"
                  >
                    {draft.isRemoved
                      ? <UndoIcon aria-hidden="true" />
                      : <DeleteIcon aria-hidden="true" />}
                  </button>
                </>
              ) : (
                <>
                  <span className="asset-text-role">{draft.role}</span>
                  <p className="asset-text-content">{draft.text}</p>
                </>
              )}
              {draft.error && <p className="asset-text-error" role="alert">{draft.error}</p>}
            </li>
          ))}
        </ul>
      )}
      {isEditing && (
        <button className="asset-text-add" onClick={onAdd} type="button">
          <AddIcon aria-hidden="true" /> Add text
        </button>
      )}
    </section>
  )
}

export default AssetTextsEditor
