export enum Permission {
    NONE = 0,
    // Management permissions
    ADMIN = Math.pow(2, 1),
    // Channel permissions
    CONNECT = Math.pow(2, 2),
    VOICE = Math.pow(2, 3),
    VIDEO = Math.pow(2, 4),
    CHAT = Math.pow(2, 5),
    MANAGE_CHANNEL = Math.pow(2, 6),
    // Server permissions
    MANAGE_SERVER = Math.pow(2, 7),
    VIEW_AUDIT_LOG = Math.pow(2, 8),
    CREATE_INVITE = Math.pow(2, 9),
    CHANGE_NICKNAME = Math.pow(2, 10),
    MANAGE_NICKNAMES = Math.pow(2, 11),
    KICK_MEMBER = Math.pow(2, 12),
    BAN_MEMBER = Math.pow(2, 13),
    ADD_FILES = Math.pow(2, 14),
    MANAGE_MESSAGES = Math.pow(2, 15),
    MUTE_MEMBERS = Math.pow(2, 16),
    DEAFEN_MEMBERS = Math.pow(2, 17),
    MOVE_MEMBERS = Math.pow(2, 18),
}

export const hasPermission = (
    permissions: Permission | Permission[],
    value: number,
    type: "and" | "or" = "or",
) => {
    if (permissions === Permission.NONE) return true;
    if (value & Permission.ADMIN) return true;

    if (Array.isArray(permissions)) {
        if (type === "or") {
            return permissions.some((permission) => !!(value & permission));
        } else {
            return permissions.every((permission) => !!(value & permission));
        }
    } else {
        return !!(value & permissions);
    }
};
