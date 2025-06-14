'use client'
import { toast } from "sonner";
import { logger } from "@/lib/logger";
import { socket, Socket } from "@/lib/socket";

import { useAppStore } from "@/stores/app";
import { useAuthStore } from "@/stores/auth";
import { useProject } from "@/stores/project";
import { UserProject } from "@/types/schemas/user-project";

import { useEffect, useContext, useCallback, createContext } from "react";
import { getProject, getProjects, switchProject } from "@/lib/services/project";


const SocketContext = createContext<Socket | null>(null);

export const useSocket = () => {
    const context = useContext(SocketContext);
    if (!context) {
        throw new Error("The hooks must be used within a socket provider.")
    }
    return context
}

export function SocketProvider({ children }: React.PropsWithChildren) {
    const { user } = useAuthStore();
    const { set: setApp } = useAppStore();
    const { active, list, getTeams, set: setProject } = useProject();

    const onConnect = useCallback(() => {
        logger.debug("Websocket connected");
    }, []);

    const onSwitchProject = useCallback(async (id: string) => {
        setApp({ loading: true, overlay: true, loading_message: 'Switching project...' });
        try {
            const { data: list } = await getProjects({ status: 'active', sort: 'createdAt' });
            const { data: active, error } = await switchProject(id);
            if (!active || !list) {
                toast.error(error)
                return
            }
            setProject({ active, list });
        } catch (e) {
            logger.error(e)
        } finally {
            setApp({ loading: false })
        }
    }, []);

    const onUpdateProject = useCallback(async () => {
        try {
            const { data, error } = await getProject();
            if (!data) {
                toast.error(error)
                return
            }
            setProject({ active: data });
        } catch (e) {
            logger.error(e)
        }
    }, []);

    const onUpateTeams = useCallback((isDelete?: boolean) =>
        (data: UserProject) => {
            if (!user || !active) return
            if (data.projectId == active.id) {
                let users = getTeams();

                if (isDelete) {
                    users = users.filter(v => v.id !== data.userId);
                } else {
                    users = users.map(v =>
                        v.id === data.userId ? { ...v, role: data.role } : v
                    );
                }

                const updated = { ...active, users }
                if (data.userId === user.id) {
                    if (isDelete) {
                        window.location.reload();
                        return
                    }
                    updated.role = data.role;
                }

                setProject({ active: updated });
            }
        },
        [active, list, user]
    );

    const onDisconnect = useCallback((reason: string) => {
        logger.debug("Websocket disconnect:", reason);
    }, []);

    useEffect(() => {
        if (socket.connected) onConnect();

        socket.on("connect", onConnect);
        socket.on("project:update", onUpdateProject);
        socket.on("project:switch", onSwitchProject);
        socket.on("disconnect", onDisconnect);

        return () => {
            socket.off("connect", onConnect);
            socket.off("project:update", onUpdateProject);
            socket.off("project:switch", onSwitchProject);
            socket.off("disconnect", onDisconnect);
        };
    }, []);

    useEffect(() => {
        socket.on("access:update", onUpateTeams(false));
        socket.on("access:remove", onUpateTeams(true));

        return () => {
            socket.off("access:update", onUpateTeams(false));
            socket.off("access:remove", onUpateTeams(true));
        }
    }, [active, user]);

    return (
        <SocketContext value={socket}>
            {children}
        </SocketContext>
    )
}