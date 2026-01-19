import { AlertTriangle } from 'lucide-react';
import MainContent from '@/components/layout/MainContent';
import { Card, CardContent } from '@/components/ui/card';

export default function DeliveryIssues() {
    return (
        <MainContent>
            <div className="max-w-7xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-foreground mb-2">Delivery Issues</h1>
                    <p className="text-muted-foreground">Manage discrepancies reported by restaurants</p>
                </div>
                <Card>
                    <CardContent className="py-12 text-center">
                        <AlertTriangle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-foreground mb-2">No open issues</h3>
                        <p className="text-muted-foreground">Reported issues will be listed here</p>
                    </CardContent>
                </Card>
            </div>
        </MainContent>
    );
}
