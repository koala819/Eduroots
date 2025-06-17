import { z } from 'zod'

import { UserRoleEnum } from '@/types/user'

export const FormSchema = z.object({
  mail: z.string().email('Le format de l\'email est invalide'),
  pwd: z.string().min(8, {
    message: 'Le mot de passe doit contenir 8 caractères minimum.',
  }),
  role: z.nativeEnum(UserRoleEnum, {
    errorMap: () => ({ message: 'Veuillez faire un choix svp.' }),
  }),
  userAgent: z.string().optional(),
})

export type FormValues = z.infer<typeof FormSchema>;
