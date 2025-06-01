import { GenderEnum } from '@/types/user'

export type FamilyChildren = {
    id: string,
    name: string,
    firstname: string,
    teachers: {
      id: string,
      name: string,
      firstname: string,
    }[],
    courses: {
      id: string,
      name: string,
      students: {
        _id: string,
        id: string,
        email: string,
        firstname: string,
        lastname: string,
        dateOfBirth: string | undefined,
        gender: GenderEnum | undefined,
        secondaryEmail: string | undefined,
      }[],
    }[],
  }
