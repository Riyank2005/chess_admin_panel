import { Button } from '@/components/ui/button';
import { AlertCircle, Database, Users, Gamepad2, FileX, Search } from 'lucide-react';

const iconMap = {
    database: Database,
    users: Users,
    games: Gamepad2,
    file: FileX,
    search: Search,
    default: AlertCircle
};

export const EmptyState = ({
    icon = 'default',
    title,
    description,
    action,
    actionLabel,
    className = ''
}) => {
    const Icon = iconMap[icon] || iconMap.default;

    return (
        <div className={`flex flex-col items-center justify-center py-16 px-6 text-center ${className}`}>
            <div className="h-20 w-20 rounded-full bg-white/5 backdrop-blur-sm flex items-center justify-center mb-6">
                <Icon className="h-10 w-10 text-muted-foreground" />
            </div>

            <h3 className="text-xl font-bold text-foreground mb-2">
                {title || 'No Data Found'}
            </h3>

            <p className="text-muted-foreground max-w-md mb-6">
                {description || 'There is no data to display at the moment.'}
            </p>

            {action && actionLabel && (
                <Button onClick={action} className="prism-btn">
                    {actionLabel}
                </Button>
            )}
        </div>
    );
};

export const NoResults = ({ searchTerm, onClear }) => (
    <EmptyState
        icon="search"
        title="No Results Found"
        description={`No results found for "${searchTerm}". Try adjusting your search or filters.`}
        action={onClear}
        actionLabel="Clear Filters"
    />
);

export const NoUsers = ({ onCreate }) => (
    <EmptyState
        icon="users"
        title="No Users Yet"
        description="You haven't created any users yet. Start by enrolling your first operator."
        action={onCreate}
        actionLabel="Enroll Operator"
    />
);

export const NoGames = ({ onCreate }) => (
    <EmptyState
        icon="games"
        title="No Active Games"
        description="There are no active games at the moment. Games will appear here when players start matches."
        action={onCreate}
        actionLabel="Create Game"
    />
);

export const DatabaseError = ({ onRetry }) => (
    <EmptyState
        icon="database"
        title="Unable to Load Data"
        description="We're having trouble connecting to the database. Please try again."
        action={onRetry}
        actionLabel="Retry"
    />
);

export const PermissionDenied = () => (
    <EmptyState
        icon="file"
        title="Access Denied"
        description="You don't have permission to view this content. Contact your administrator if you believe this is an error."
    />
);
