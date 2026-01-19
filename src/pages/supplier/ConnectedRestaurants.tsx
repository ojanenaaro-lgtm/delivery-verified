import { Users } from 'lucide-react';
import MainContent from '@/components/layout/MainContent';
import { Card, CardContent } from '@/components/ui/card';

export default function ConnectedRestaurants() {
    return (
        <MainContent>
            <div className="max-w-7xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-foreground mb-2">Connected Restaurants</h1>
                    <p className="text-muted-foreground">Manage your relationships with restaurants</p>
                </div>
                <Card>
                    <CardContent className="py-12 text-center">
                        <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-foreground mb-2">No connections yet</h3>
                        <p className="text-muted-foreground">Invite restaurants to connect with you</p>
                    </CardContent>
                </Card>
            </div>
        </MainContent>
    );
}
