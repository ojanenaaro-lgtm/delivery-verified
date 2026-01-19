import { BarChart3 } from 'lucide-react';
import MainContent from '@/components/layout/MainContent';
import { Card, CardContent } from '@/components/ui/card';

export default function SupplierAnalytics() {
    return (
        <MainContent>
            <div className="max-w-7xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-foreground mb-2">Analytics</h1>
                    <p className="text-muted-foreground">Insights into your performance</p>
                </div>
                <Card>
                    <CardContent className="py-12 text-center">
                        <BarChart3 className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-foreground mb-2">No data available</h3>
                        <p className="text-muted-foreground">Analytics will appear once you have activity</p>
                    </CardContent>
                </Card>
            </div>
        </MainContent>
    );
}
