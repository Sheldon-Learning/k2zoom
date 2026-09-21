import { useState } from 'react'
import { Check, Gem, Moon, Palette, Sun } from 'lucide-react'
import { useEditorStore } from '../../store/editorStore'
import type { AppTheme } from '../../utils/theme'

const choices = [
  { id: 'light', label: 'Clair', icon: Sun },
  { id: 'dark', label: 'Sombre', icon: Moon },
  { id: 'sapphire', label: 'Bleu saphir', icon: Gem },
] as const

export function ThemeSwitcher() {
  const theme = useEditorStore((state) => state.theme)
  const setTheme = useEditorStore((state) => state.setTheme)
  const [open, setOpen] = useState(false)

  function select(next: AppTheme) {
    setTheme(next)
    setOpen(false)
  }

  return (
    <div className="menu-wrap theme-switcher">
      <button
        className="icon-button theme-trigger"
        aria-label={`Thème : ${choices.find((choice) => choice.id === theme)?.label}. Changer de thème`}
        aria-expanded={open}
        aria-haspopup="menu"
        title="Changer de thème"
        onClick={() => setOpen(!open)}
      >
        <Palette size={18} />
      </button>
      {open && (
        <div
          className="theme-menu"
          role="menu"
          aria-label="Thème de l’application"
        >
          {choices.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              role="menuitemradio"
              aria-checked={theme === id}
              onClick={() => select(id)}
            >
              <span className={`theme-swatch swatch-${id}`}>
                <Icon size={15} />
              </span>
              <span>{label}</span>
              {theme === id && <Check size={15} className="theme-check" />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
