import { UserRoleEnum } from "@/types/supabase/user";

/**
 * Obtient l'URL de redirection en fonction du rôle de l'utilisateur
 * @param role - Le rôle de l'utilisateur
 * @returns L'URL de redirection appropriée
 */
export function getRedirectUrl(role: string | UserRoleEnum): string {
  switch (role) {
    case UserRoleEnum.Admin:
    case UserRoleEnum.Bureau:
      return "/admin";
    case UserRoleEnum.Teacher:
      return "/teacher";
    case UserRoleEnum.Student:
      return "/student";
    default:
      return "/link-account";
  }
}

/**
 * Obtient le nom du rôle pour l'affichage dans les messages
 * @param role - Le rôle de l'utilisateur
 * @returns Le nom du rôle formaté pour l'affichage
 */
export function getRoleName(role: string | UserRoleEnum): string {
  switch (role) {
    case UserRoleEnum.Admin:
    case UserRoleEnum.Bureau:
      return "Bureau";
    case UserRoleEnum.Teacher:
      return "Enseignant";
    case UserRoleEnum.Student:
      return "Famille";
    default:
      return "Accueil";
  }
}
