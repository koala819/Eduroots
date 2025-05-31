import {type NextAuthOptions} from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'

import {Credentials} from '@/types/models'
import {BaseUser, Student, Teacher, UserRoleEnum} from '@/types/user'

import dbConnect from '@/backend/config/dbConnect'
import {User} from '@/backend/models/user.model'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { JWT } from 'next-auth/jwt'

// (Copie tout le contenu de authOptions ici)
export const authOptions: NextAuthOptions = {
  session: {
    strategy: 'jwt',
  },
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: {label: 'Email', type: 'text', placeholder: 'email'},
        password: {label: 'Password', type: 'password'},
        role: {label: 'Role', type: 'text'},
      },
      async authorize(credentials) {
        await dbConnect()
        const {email, password, role} = credentials as Credentials
        // console.log('email', email, 'password', password, 'role', role)
        let user

        if (role === UserRoleEnum.Admin || role === UserRoleEnum.Bureau) {
          // Si le rôle est 'admin', chercher un utilisateur avec le rôle 'admin' ou 'bureau'
          user = await User.findOne({
            email,
            role: {$in: [UserRoleEnum.Admin, UserRoleEnum.Bureau]},
            isActive: true,
          }).select('-password')
        } else {
          // Pour tous les autres rôles, utiliser la recherche originale
          user = await User.findOne({email, role, isActive: true}).select('-password')
        }

        // console.log('\n\n\nuser in authorize', user)
        if (!user) {
          throw new Error('Aucun utilisateur trouvé avec cet email.')
        }

        // Requête séparée pour vérifier le password
        const passwordCheck = (await User.findOne({_id: user._id})
          .select('+password') // Le + force l'inclusion du champ password
          .lean()) as BaseUser | null

        if (!passwordCheck?.password) {
          throw new Error("Erreur d'authentification.")
        }

        const isPasswordMatched = await bcrypt.compare(password, passwordCheck.password)

        if (!isPasswordMatched) {
          throw new Error('Mot de passe incorrect.')
        }

        // Génération du JWT custom
        if (!process.env.MY_CUSTOM_JWT_SECRET) {
          throw new Error('MY_CUSTOM_JWT_SECRET is not defined')
        }
        const customToken = jwt.sign(
          {
            id: user._id,
            email: user.email,
            role: user.role,
          },
          process.env.MY_CUSTOM_JWT_SECRET,
          {expiresIn: '1h'},
        )

        return {...user.toObject(), customToken}
      },
    }),
  ],
  callbacks: {
    async jwt({user, token}) {
      if (user) {
        token.user = {...user}

        token.customToken = (user as unknown as { customToken: string }).customToken
        // Decodage token pour récupérer la date d'expiration
        const decoded: any = jwt.decode(token.customToken as string)
        token.customTokenExpires = decoded?.exp ? decoded.exp * 1000 : null
        return token
      }
       if (typeof token.customTokenExpires === 'number' && Date.now() > token.customTokenExpires) {
        const refreshed = await refreshToken(token)
        if (refreshed && 'customToken' in refreshed) {
          token.customToken = refreshed.customToken
          token.customTokenExpires = refreshed.customTokenExpires
        } else {
          // Si le refresh échoue, on garde l'ancien token et on ajoute une erreur
          token.error = 'RefreshAccessTokenError'
        }
      }

      return token
    },
    async session({session, token}) {
      if (token?.user) {
        session.user = token.user as BaseUser | Student | Teacher
        if (session.user) {
          session.user.customToken = token.customToken as string
        }
      }
      return session
    },
  },
  pages: {
    signIn: '/',
  },
  secret: process.env.NEXTAUTH_SECRET,
}


/**
 * Takes a token, and returns a new token with updated
 * `accessToken` and `accessTokenExpires`. If an error occurs,
 * returns the old token and an error property
 */
async function refreshToken(token: JWT) {
  try {
    await dbConnect()
    // On récupère l'utilisateur à partir de l'id stocké dans le token
    const userObj = token.user as {id?:string; _id?:string}
    const userId = userObj.id || userObj._id
    if (!userId) throw new Error('User ID not found')

    const user = await User.findById(userId)
    if (!user) throw new Error('Utilisateur non trouvé')

    // On régénère un nouveau customToken
    if (!process.env.MY_CUSTOM_JWT_SECRET) {
      throw new Error('MY_CUSTOM_JWT_SECRET is not defined')
    }
    const customToken = jwt.sign(
      {
        id: user._id,
        email: user.email,
        role: user.role,
      },
      process.env.MY_CUSTOM_JWT_SECRET,
      { expiresIn: '1h' }
    )
    // On décode pour récupérer la nouvelle date d'expiration
    const decoded: any = jwt.decode(customToken)
    const customTokenExpires = decoded?.exp ? decoded.exp * 1000 : null

    return {
      ...token,
      customToken,
      customTokenExpires,
      user: {
        ...user.toObject(),
        customToken,
      },
    }
  } catch (error) {
    console.error('Error refreshing token:', error)
    return {
      ...token,
      error: 'RefreshAccessTokenError',
    }
  }
}