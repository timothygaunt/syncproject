import React, { createContext, useContext, useMemo } from 'react';
import type { User, UserGroup, Permission } from '../types';

interface PermissionsContextType {
    currentUser: User | null;
    userGroups: UserGroup[];
    hasPermission: (permission: Permission) => boolean;
}

const PermissionsContext = createContext<PermissionsContextType | undefined>(undefined);

export const PermissionsProvider: React.FC<{
    currentUser: User | null;
    userGroups: UserGroup[];
    children: React.ReactNode;
}> = ({ currentUser, userGroups, children }) => {

    const userPermissions = useMemo(() => {
        if (!currentUser || !userGroups) {
            return new Set<Permission>();
        }

        const permissionsSet = new Set<Permission>();
        const groupMap = new Map(userGroups.map(g => [g.id, g]));

        currentUser.groupIds.forEach(groupId => {
            const group = groupMap.get(groupId);
            if (group) {
                // FIX: Cast group to UserGroup because Map.get() is incorrectly inferred as `unknown`.
                (group as UserGroup).permissions.forEach(permission => {
                    permissionsSet.add(permission);
                });
            }
        });

        return permissionsSet;
    }, [currentUser, userGroups]);

    const hasPermission = (permission: Permission): boolean => {
        return userPermissions.has(permission);
    };

    // FIX: Replaced JSX syntax with React.createElement to avoid parsing issues in a .ts file.
    // This resolves multiple confusing compiler errors related to JSX syntax not being recognized.
    return React.createElement(
        PermissionsContext.Provider,
        { value: { currentUser, userGroups, hasPermission } },
        children
    );
};

export const usePermissions = (): PermissionsContextType => {
    const context = useContext(PermissionsContext);
    if (context === undefined) {
        throw new Error('usePermissions must be used within a PermissionsProvider');
    }
    return context;
};