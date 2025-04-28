import { type NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'

import { Credentials } from '@/types/models'
import { BaseUser, Student, Teacher, UserRoleEnum } from '@/types/user'

import dbConnect from '@/backend/config/dbConnect'
import { User } from '@/backend/models/user.model'
import bcrypt from 'bcryptjs'

// (Copie tout le contenu de authOptions ici)
export const authOptions: NextAuthOptions = {
  session: {
    strategy: 'jwt',
  },
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'text', placeholder: 'email' },
        password: { label: 'Password', type: 'password' },
        role: { label: 'Role', type: 'text' },
      },
      async authorize(credentials) {
        await dbConnect()
        const { email, password, role } = credentials as Credentials
        // console.log('email', email, 'password', password, 'role', role)
        let user

        if (role === UserRoleEnum.Admin || role === UserRoleEnum.Bureau) {
          // Si le rôle est 'admin', chercher un utilisateur avec le rôle 'admin' ou 'bureau'
          user = await User.findOne({
            email,
            role: { $in: [UserRoleEnum.Admin, UserRoleEnum.Bureau] },
            isActive: true,
          }).select('-password')
        } else {
          // Pour tous les autres rôles, utiliser la recherche originale
          user = await User.findOne({ email, role, isActive: true }).select(
            '-password',
          )
        }

        // console.log('\n\n\nuser in authorize', user)
        if (!user) {
          throw new Error('Aucun utilisateur trouvé avec cet email.')
        }

        // Requête séparée pour vérifier le password
        const passwordCheck = (await User.findOne({ _id: user._id })
          .select('+password') // Le + force l'inclusion du champ password
          .lean()) as BaseUser | null

        if (!passwordCheck?.password) {
          throw new Error("Erreur d'authentification.")
        }

        const isPasswordMatched = await bcrypt.compare(
          password,
          passwordCheck.password,
        )

        if (!isPasswordMatched) {
          throw new Error('Mot de passe incorrect.')
        }

        return user.toObject()
      },
    }),
  ],
  callbacks: {
    async jwt({ user, token }) {
      if (user) {
        token.user = { ...user }
      }
      return token
    },
    async session({ session, token }) {
      if (token?.user) {
        session.user = token.user as BaseUser | Student | Teacher
      }
      return session
    },
  },
  pages: {
    signIn: '/',
  },
  secret: process.env.NEXTAUTH_SECRET,
}
