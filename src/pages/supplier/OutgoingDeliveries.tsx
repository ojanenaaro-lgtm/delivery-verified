import { Truck } from 'lucide-react';
import MainContent from '@/components/layout/MainContent';
import { Card, CardContent } from '@/components/ui/card';

export default function OutgoingDeliveries() {
    return (
        <MainContent>
            <div className="max-w-7xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-foreground mb-2">Outgoing Deliveries</h1>
                    <p className="text-muted-foreground">Track your deliveries to restaurants</p>
                </div>
                <Card>
                    <CardContent className="py-12 text-center">
                        <Truck className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-foreground mb-2">No active deliveries</h3>
                        <p className="text-muted-foreground">Deliveries you create will appear here</p>
                    </CardContent>
                </Card>
            </div>
        </MainContent>
    );
}
