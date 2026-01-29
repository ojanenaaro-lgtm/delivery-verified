import { NotificationBell } from './NotificationBell';
import { ConnectionRequestInbox } from './ConnectionRequestInbox';

export function NotificationCenter() {
    return (
        <div className="flex items-center gap-2">
            <NotificationBell />
            <ConnectionRequestInbox />
        </div>
    );
}
