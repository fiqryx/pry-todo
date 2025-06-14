import { User } from "@/types/schemas/user";
import { Issue } from "@/types/schemas/issue";
import { ISSUE_COLOR_MAP, IssueEnum } from "@/types/internal";
import { Activity, ActivityType_Map } from "@/types/schemas/activity";

export const getIssueColorClass = (value: Issue[IssueEnum]) => ISSUE_COLOR_MAP[value] || '';

export function getActivityMessage(activity: Activity, users: User[]) {
    const message = ActivityType_Map[activity.type] ?? 'Updated';

    const isUserKeys = ['assignee', 'reporter'];
    const isComment = ['comment_create', 'comment_update'];
    const onlyKeys = ['description', 'start_date', 'due_date'];

    // comment activity message
    if (isComment.includes(activity.type)) {
        const name = users.find(user => user.id === activity.userId)?.name ?? 'Someone';
        const content = activity.new?.message ?? 'empty';
        return `${name} ${message} "${content}"`;
    }

    // more manualy statment here...

    // compare deps differance changed on activity
    if (typeof activity.old === 'object' && typeof activity.new === 'object') {
        let changedKeys = Object.keys(activity.new).filter(
            key => activity.old?.[key] !== activity.new?.[key]
        );

        const hasDate = changedKeys.some((key) => onlyKeys.includes(key));
        if (hasDate && changedKeys.includes('status')) {
            changedKeys = changedKeys.filter((key) => !onlyKeys.includes(key));
        }

        const changes = changedKeys.map(key => {
            const rawOld = activity.old?.[key];
            const rawNew = activity.new?.[key];

            const label = key.replaceAll('_', ' ');
            const oldValue = typeof rawOld === 'string' ? rawOld.replaceAll('_', ' ') : rawOld;
            const newValue = typeof rawNew === 'string' ? rawNew.replaceAll('_', ' ') : rawNew;

            if (onlyKeys.includes(key)) return label;

            if (isUserKeys.includes(key)) {
                const name = users.find(user => user.id === rawNew)?.name ?? 'unassigned';
                return `${label} to ${name}`;
            }

            return `${label}: "${oldValue}" to "${newValue}"`;
        });

        return `${message} ${changes.join(', ')}`;
    }

    return message;
}