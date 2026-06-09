import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useApiResource } from '../hooks/useApiResource';
import { withCountry } from '../lib/api';
import type { Alert, Report, Risk, StatsHistory } from '../types';
import { StatusBlock } from './StatusBlock';

const emptyHistory: StatsHistory = {
  fireTrend: [],
  alertTrend: [],
  riskDistribution: [],
  reportsByType: [],
  riskTrend: [],
};

type AnalyticsProps = {
  countryCode: string;
};

function maxValue(values: number[]) {
  return Math.max(1, ...values);
}

export function Analytics({ countryCode }: AnalyticsProps) {
  const { t } = useTranslation();
  const scopedPath = useMemo(() => (path: string) => withCountry(path, countryCode), [countryCode]);
  const history = useApiResource<StatsHistory>(scopedPath('/api/stats/history?days=7'), emptyHistory);
  const risks = useApiResource<Risk[]>(scopedPath('/api/risk'), []);
  const alerts = useApiResource<Alert[]>(scopedPath('/api/alerts'), []);
  const reports = useApiResource<Report[]>(scopedPath('/api/reports'), []);

  const fireMax = maxValue(history.data.fireTrend.map(item => item.count));
  const reportTypeMax = maxValue(history.data.reportsByType.map(item => item.count));
  const riskRows = risks.data.length > 0 ? risks.data : history.data.riskDistribution;

  return (
    <section className="space-y-5 px-4 py-6 sm:px-6 lg:px-8">
      <div className="text-start">
        <h2 className="section-title">{t('analyticsTitle')}</h2>
        <p className="section-subtitle">{t('analyticsSubtitle')}</p>
      </div>

      <StatusBlock
        error={history.error}
        isLoading={history.isLoading}
        hasData={
          history.data.fireTrend.length > 0 ||
          history.data.riskDistribution.length > 0 ||
          reports.data.length > 0 ||
          alerts.data.length > 0
        }
        onRetry={history.refetch}
      />

      <div className="grid gap-5 xl:grid-cols-2">
        <div className="panel p-5">
          <h3 className="panel-title mb-4">{t('fireTrend')}</h3>
          {history.data.fireTrend.length === 0 ? (
            <p className="text-start text-sm text-muted">{t('noData')}</p>
          ) : (
            <div className="space-y-3">
              {history.data.fireTrend.map(item => (
                <div className="bar-row" key={item.date}>
                  <span>{item.date}</span>
                  <div>
                    <i style={{ inlineSize: `${(item.count / fireMax) * 100}%` }} />
                  </div>
                  <strong>{item.count}</strong>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="panel p-5">
          <h3 className="panel-title mb-4">{t('reportsByType')}</h3>
          {history.data.reportsByType.length === 0 ? (
            <p className="text-start text-sm text-muted">{t('noData')}</p>
          ) : (
            <div className="space-y-3">
              {history.data.reportsByType.map(item => (
                <div className="bar-row" key={item.report_type}>
                  <span>{t(item.report_type)}</span>
                  <div>
                    <i style={{ inlineSize: `${(item.count / reportTypeMax) * 100}%` }} />
                  </div>
                  <strong>{item.count}</strong>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="panel p-5">
          <h3 className="panel-title mb-4">{t('riskDistribution')}</h3>
          {riskRows.length === 0 ? (
            <p className="text-start text-sm text-muted">{t('noData')}</p>
          ) : (
            <div className="space-y-3">
              {riskRows.slice(0, 10).map(item => {
                const score = 'risk_score' in item ? item.risk_score : 0;
                return (
                  <div className="bar-row" key={item.region}>
                    <span>{item.region}</span>
                    <div>
                      <i style={{ inlineSize: `${score}%` }} />
                    </div>
                    <strong>{score}</strong>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="panel p-5">
          <h3 className="panel-title mb-4">{t('latestAlerts')}</h3>
          {alerts.data.length === 0 ? (
            <p className="text-start text-sm text-muted">{t('noData')}</p>
          ) : (
            <ul className="space-y-3 text-start">
              {alerts.data.slice(0, 8).map(alert => (
                <li className="list-row" key={alert.id ?? alert.message}>
                  <strong>{alert.level}</strong>
                  <span>{alert.message}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
