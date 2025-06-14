import { toast } from 'sonner';
import { logger } from '@/lib/logger';
import { debounce, isEqual } from 'lodash';
import { useProject } from '@/stores/project';
import { Setting } from '@/types/schemas/setting';
import { changeSetting } from '@/lib/services/project';

import {
    useRef,
    useState,
    useEffect,
    useCallback,
} from 'react';

export function useSettings() {
    const isInitialMount = useRef(true);
    const { active, set: setProject } = useProject();
    const [isLoading, setIsLoading] = useState(false);
    const [localSettings, setLocalSettings] = useState<Partial<Setting>>(
        active?.setting || {}
    );

    const debouncedSaveRef = useRef(
        debounce(async (projectId: string, settings: Partial<Setting>) => {
            setIsLoading(true);
            try {
                const { data, error } = await changeSetting(projectId, settings);

                if (error) {
                    throw new Error(error);
                }

                if (!isEqual(active?.setting, data)) {
                    setProject({ active: { setting: data } });
                }

                logger.debug('Setings update successfully')
            } catch (e: any) {
                toast.error(e?.message || 'Failed to save settings');
                logger.debug('Settings update failed:', e);
                if (active?.setting) setLocalSettings(active?.setting);
            } finally {
                setIsLoading(false);
            }
        }, 1000)
    );

    // clean up on unmount
    useEffect(() => {
        return () => {
            debouncedSaveRef.current.cancel();
        };
    }, []);

    // sync local settings
    useEffect(() => {
        if (isInitialMount.current) {
            isInitialMount.current = false;
            return;
        }
        setLocalSettings(active?.setting || {});
    }, [active?.setting]);

    // trigger save with debounce
    useEffect(() => {
        if (
            active?.id &&
            Object.keys(localSettings).length > 0 &&
            !isEqual(active.setting, localSettings) &&
            active.setting?.id === localSettings.id
        ) {
            debouncedSaveRef.current(active.id, localSettings);
        }
    }, [localSettings, active?.id]);

    const handleSettingChange = useCallback(
        (value: Partial<Setting>) => {
            setLocalSettings(prev => ({ ...prev, ...value }));
        }, []
    );

    return {
        settings: localSettings,
        handleSettingChange,
        isLoading
    };
}