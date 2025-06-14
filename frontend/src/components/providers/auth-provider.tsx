"use client"
import { useEffect } from "react"
import { useAuthStore } from "@/stores/auth"
import { useProject } from "@/stores/project"

import { User } from "@/types/schemas/user"
import { Project } from "@/types/schemas/project"

type Props = {
    user: User
    projects: Project[]
    children: React.ReactNode
}

export function AuthProvider({
    user,
    projects,
    children
}: Props) {
    const { set: setAuth } = useAuthStore();
    const { set: setProject } = useProject();

    useEffect(() => {
        setAuth({ user });
        const active = { ...user.project, role: user.role }
        setProject({ active, list: projects })
    }, [user]);

    return children
}