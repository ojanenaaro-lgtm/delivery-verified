import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import {
    AlertTriangle,
    Truck,
    Package,
    CheckCircle,
    XCircle,
    UserPlus,
    Users,
    Bell,
    type LucideIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import {
    useNotifications,
    useMarkNotificationAsRead,
    useMarkAllNotificationsAsRead,
    type Notification,
    type NotificationType,
} from '@/hooks/useNotifications';

const notificationIcons: Record<NotificationType, LucideIcon> = {
    missing_items_report: AlertTriangle,
    outgoing_delivery_created: Truck,
    outgoing_delivery_arrived: Package,
    delivery_confirmed: CheckCircle,
    delivery_disputed: XCircle,
    connection_request: UserPlus,
    connection_accepted: Users,
};

const getNotificationLink = (notification: Notification): string => {
    switch (notification.link_type) {
        case 'report':
            return '/supplier/issues';
        case 'outgoing_delivery':
            return (notification.metadata as { isRestaurant?: boolean })?.isRestaurant
                ? '/deliveries'
                : '/supplier/deliveries';
        case 'delivery':
            return `/deliveries/${notification.link_id}`;
        case 'connection':
            return '/suppliers';
        default:
            return '/dashboard';
    }
};

export function NotificationBell() {
    const navigate = useNavigate();
    const [open, setOpen] = useState(false);
    const { notifications, loading } = useNotifications();
    const { markAsRead } = useMarkNotificationAsRead();
    const { markAllAsRead, loading: markingAllRead } = useMarkAllNotificationsAsRead();

    const unreadCount = notifications.filter((n) => !n.read).length;
    const recentNotifications = notifications.slice(0, 7);

    const handleNotificationClick = async (notification: Notification) => {
        if (!notification.read) {
            await markAsRead(notification.id);
        }
        setOpen(false);
        navigate(getNotificationLink(notification));
    };

    const handleMarkAllRead = async () => {
        await markAllAsRead();
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="relative text-muted-foreground hover:text-foreground"
                >
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <span className="absolute bottom-1 right-1 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-background" />
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent
                align="end"
                className="w-80 p-0"
                sideOffset={8}
            >
                {/* Header */}
                <div className="flex items-center justify-between border-b px-4 py-3">
                    <h3 className="font-semibold text-foreground">Notifications</h3>
                    {unreadCount > 0 && (
                        <Button
                            variant="link"
                            size="sm"
                            className="h-auto p-0 text-xs text-[#009EE0] hover:text-[#0080B8]"
                            onClick={handleMarkAllRead}
                            disabled={markingAllRead}
                        >
                            Mark all read
                        </Button>
                    )}
                </div>

                {/* Notification List */}
                <ScrollArea className="max-h-[320px]">
                    {loading ? (
                        <div className="flex items-center justify-center py-8">
                            <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#009EE0] border-t-transparent" />
                        </div>
                    ) : recentNotifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
                            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#009EE0]/10">
                                <Bell className="h-6 w-6 text-[#009EE0]" />
                            </div>
                            <p className="text-sm text-muted-foreground">No notifications yet</p>
                        </div>
                    ) : (
                        <div className="divide-y">
                            {recentNotifications.map((notification) => {
                                const Icon = notificationIcons[notification.type] || Bell;
                                return (
                                    <button
                                        key={notification.id}
                                        className={cn(
                                            'flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50',
                                            !notification.read && 'bg-[#009EE0]/5'
                                        )}
                                        onClick={() => handleNotificationClick(notification)}
                                    >
                                        <div
                                            className={cn(
                                                'flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full',
                                                notification.read
                                                    ? 'bg-muted text-muted-foreground'
                                                    : 'bg-[#009EE0]/10 text-[#009EE0]'
                                            )}
                                        >
                                            <Icon className="h-4 w-4" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <p
                                                    className={cn(
                                                        'text-sm truncate',
                                                        notification.read
                                                            ? 'text-foreground'
                                                            : 'font-medium text-foreground'
                                                    )}
                                                >
                                                    {notification.title}
                                                </p>
                                                {!notification.read && (
                                                    <span className="h-2 w-2 flex-shrink-0 rounded-full bg-[#009EE0]" />
                                                )}
                                            </div>
                                            <p className="text-xs text-muted-foreground mt-0.5">
                                                {formatDistanceToNow(new Date(notification.created_at), {
                                                    addSuffix: true,
                                                })}
                                            </p>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </ScrollArea>

                {/* Footer */}
                {notifications.length > 7 && (
                    <div className="border-t px-4 py-2">
                        <Button
                            variant="link"
                            size="sm"
                            className="h-auto w-full p-0 text-xs text-[#009EE0] hover:text-[#0080B8]"
                            onClick={() => {
                                setOpen(false);
                                navigate('/notifications');
                            }}
                        >
                            View all
                        </Button>
                    </div>
                )}
            </PopoverContent>
        </Popover>
    );
}
