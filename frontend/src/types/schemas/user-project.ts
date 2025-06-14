import { UserRoles } from "@/types/misc"

export interface UserProject {
    userId: string
    projectId: string
    role: UserRoles
}