import { CheckCircle, Eye, EyeOff, Lock, XCircle } from 'lucide-react'

import { Input } from '@/components/ui/input'

interface PasswordInputProps {
  type: 'student' | 'teacher'
  value: string
  onChange: (value: string) => void
  showPwd: Record<'student' | 'teacher', boolean>
  setShowPwd: React.Dispatch<
    React.SetStateAction<Record<'student' | 'teacher', boolean>>
  >
}

export const PasswordInput: React.FC<PasswordInputProps> = ({
  type,
  value,
  onChange,
  showPwd,
  setShowPwd,
}) => (
  <div className="space-y-2">
    <div className="flex items-center space-x-2">
      {value === '[DÉFINI]' ? (
        <CheckCircle className="text-green-500" size={20} />
      ) : (
        <XCircle className="text-red-500" size={20} />
      )}
      <span>
        {value === '[DÉFINI]'
          ? 'Mot de passe défini'
          : 'Mot de passe non défini'}
      </span>
    </div>
    <div className="relative">
      <Input
        value={value}
        type={showPwd[type] ? 'text' : 'password'}
        placeholder={
          value === '[DÉFINI]' ? 'Mot de passe défini' : 'Nouveau mot de passe'
        }
        className="pl-10 pr-10 bg-gray-100 dark:bg-gray-700 rounded-lg"
        onChange={(e) => onChange(e.target.value)}
      />
      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
      <button
        type="button"
        onClick={() => setShowPwd((prev) => ({ ...prev, [type]: !prev[type] }))}
        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
        aria-label={
          showPwd[type] ? 'Masquer le mot de passe' : 'Afficher le mot de passe'
        }
      >
        {showPwd[type] ? <EyeOff size={20} /> : <Eye size={20} />}
      </button>
    </div>
  </div>
)
