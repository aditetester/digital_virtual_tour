export type AnalyticsData = {
  totalViews: string;
  avgDuration: string;
  viewsTrend: string;
  durationTrend: string;
  viewsOverTime: number[];
  trafficSources: { source: string; percentage: number; color: string }[];
  topCountries: { country: string; views: number }[];
};

export class AnalyticsStorage {
  private static data: AnalyticsData = {
    totalViews: '12,458',
    avgDuration: '4m 32s',
    viewsTrend: '+23%',
    durationTrend: '+12%',
    viewsOverTime: [45, 70, 55, 80, 60, 90, 75],
    trafficSources: [
      { source: 'Direct', percentage: 45, color: '#6366F1' },
      { source: 'Social Media', percentage: 30, color: '#3B82F6' },
      { source: 'Email', percentage: 15, color: '#10B981' },
      { source: 'Other', percentage: 10, color: '#6B7280' },
    ],
    topCountries: [
      { country: 'United States', views: 4520 },
      { country: 'United Kingdom', views: 2890 },
      { country: 'Germany', views: 1760 },
      { country: 'France', views: 1450 },
      { country: 'Canada', views: 890 },
    ],
  };

  static getData(): AnalyticsData {
    return this.data;
  }
}
