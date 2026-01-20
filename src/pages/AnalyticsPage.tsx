import { AppLayout } from '@/components/layout/AppLayout';
import MainContent from '@/components/layout/MainContent';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { MOCK_DELIVERIES, MOCK_SUPPLIERS } from '@/data/mockData';
import { Download, TrendingUp, TrendingDown, Euro } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Mock chart data
const monthlyData = [
  { month: 'Sep', discrepancies: 3, recovered: 125 },
  { month: 'Oct', discrepancies: 5, recovered: 210 },
  { month: 'Nov', discrepancies: 2, recovered: 85 },
  { month: 'Dec', discrepancies: 7, recovered: 340 },
  { month: 'Jan', discrepancies: 4, recovered: 247 },
];

const supplierData = MOCK_SUPPLIERS.map((s) => ({
  name: s.name,
  accuracy: s.accuracyRate,
  discrepancies: 100 - s.accuracyRate,
}));

const discrepancyTypes = [
  { name: 'Missing Items', value: 45, color: 'hsl(var(--destructive))' },
  { name: 'Partial Delivery', value: 30, color: 'hsl(var(--warning))' },
  { name: 'Wrong Item', value: 15, color: 'hsl(var(--primary))' },
  { name: 'Damaged', value: 10, color: 'hsl(var(--muted-foreground))' },
];

export default function AnalyticsPage() {
  const totalRecovered = MOCK_DELIVERIES.reduce((sum, d) => sum + d.discrepancyValue, 0);
  const averageAccuracy = Math.round(
    MOCK_SUPPLIERS.reduce((sum, s) => sum + s.accuracyRate, 0) / MOCK_SUPPLIERS.length
  );

  return (
    <AppLayout>
      <MainContent>
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
              <p className="text-muted-foreground mt-1">
                Track discrepancies and recovered revenue
              </p>
            </div>
            <Button variant="outline">
              <Download size={18} />
              Export CSV
            </Button>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <div className="bg-card rounded-xl border border-border p-6">
              <div className="flex items-center gap-3 mb-2">
                <Euro className="text-success" size={20} />
                <span className="text-sm text-muted-foreground">Total Recovered</span>
              </div>
              <div className="font-mono text-3xl font-bold text-foreground">
                €{totalRecovered.toFixed(2)}
              </div>
              <div className="flex items-center gap-1 mt-2 text-sm text-success">
                <TrendingUp size={14} />
                <span>+18% from last month</span>
              </div>
            </div>

            <div className="bg-card rounded-xl border border-border p-6">
              <div className="flex items-center gap-3 mb-2">
                <TrendingUp className="text-primary" size={20} />
                <span className="text-sm text-muted-foreground">Average Accuracy</span>
              </div>
              <div className="font-mono text-3xl font-bold text-foreground">
                {averageAccuracy}%
              </div>
              <div className="flex items-center gap-1 mt-2 text-sm text-success">
                <TrendingUp size={14} />
                <span>+2% from last month</span>
              </div>
            </div>

            <div className="bg-card rounded-xl border border-border p-6">
              <div className="flex items-center gap-3 mb-2">
                <TrendingDown className="text-warning" size={20} />
                <span className="text-sm text-muted-foreground">Total Discrepancies</span>
              </div>
              <div className="font-mono text-3xl font-bold text-foreground">
                21
              </div>
              <div className="flex items-center gap-1 mt-2 text-sm text-destructive">
                <TrendingDown size={14} />
                <span>-12% from last month</span>
              </div>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Discrepancies Over Time */}
            <div className="bg-card rounded-xl border border-border p-6">
              <h3 className="font-semibold text-foreground mb-4">Recovered Revenue Over Time</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="recovered"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      dot={{ fill: 'hsl(var(--primary))' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Supplier Accuracy */}
            <div className="bg-card rounded-xl border border-border p-6">
              <h3 className="font-semibold text-foreground mb-4">Accuracy by Supplier</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={supplierData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis type="number" domain={[0, 100]} stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis dataKey="name" type="category" width={80} stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Bar dataKey="accuracy" fill="hsl(var(--success))" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Discrepancy Types */}
          <div className="bg-card rounded-xl border border-border p-6">
            <h3 className="font-semibold text-foreground mb-4">Discrepancy Types</h3>
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="h-64 w-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={discrepancyTypes}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {discrepancyTypes.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 space-y-3">
                {discrepancyTypes.map((type) => (
                  <div key={type.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: type.color }}
                      />
                      <span className="text-sm text-foreground">{type.name}</span>
                    </div>
                    <span className="font-mono text-sm text-muted-foreground">{type.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </MainContent>
    </AppLayout>
  );
}
