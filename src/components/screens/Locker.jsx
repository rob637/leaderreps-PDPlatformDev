import React, { useMemo, useState, useEffect } from 'react';
import { useAppServices } from '../../services/useAppServices';
import { Card, PageLayout, NoWidgetsEnabled } from '../ui';
import { Archive, CheckCircle, Calendar, Trophy, BookOpen } from 'lucide-react';
import { useFeatures } from '../../providers/FeatureProvider';
import WidgetRenderer from '../admin/WidgetRenderer';
import { dailyLogService } from '../../services/dailyLogService';
import { useNotifications } from '../../providers/NotificationProvider';
import { Settings, Clock, User, Bell, AlertTriangle } from 'lucide-react';

const LOCKER_FEATURES = [
  'locker-wins-history',
  'locker-scorecard-history',
  'locker-latest-reflection'
];

const Locker = () => {
  const { dailyPracticeData, commitmentData, navigate, db, user } = useAppServices();
  const { isFeatureEnabled, getFeatureOrder } = useFeatures();
  const [reflectionHistory, setReflectionHistory] = useState([]);

  useEffect(() => {
    const fetchHistory = async () => {
      if (user?.uid && db) {
        const history = await dailyLogService.getReflectionHistory(db, user.uid, 30);
        setReflectionHistory(history);
      }
    };
    fetchHistory();
  }, [user, db]);

  // Arena Data
  // Assuming winsList is an array of { text, completed, date } objects
  // If it's not present, default to empty array
  const winsList = dailyPracticeData?.winsList || [];
  
  // Evening Bookend Data
  const eveningBookend = dailyPracticeData?.eveningBookend || {};
  
  // Scorecard Data
  // Updated to read from dailyPracticeData.scorecardHistory instead of commitmentData
  const commitmentHistory = dailyPracticeData?.scorecardHistory || commitmentData?.history || [];

  const scope = {
    winsList,
    eveningBookend,
    commitmentHistory,
    reflectionHistory,
    Card,
    Trophy,
    CheckCircle,
    Calendar,
    BookOpen,
    isFeatureEnabled,
    useNotifications,
    Settings, Clock, User, Bell, AlertTriangle,
    user
  };

  // Reusable Spreadsheet Table Component
  const SpreadsheetTable = ({ headers, data, renderRow, emptyMessage }) => (
    <div className="overflow-x-auto border border-gray-300 rounded-sm">
      <table className="min-w-full border-collapse text-sm">
        <thead>
          <tr className="bg-gray-100">
            {headers.map((header, idx) => (
              <th key={idx} className="border border-gray-300 px-3 py-2 text-left font-bold text-gray-700 uppercase tracking-wider whitespace-nowrap">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white">
          {data && data.length > 0 ? (
            data.map((item, idx) => renderRow(item, idx))
          ) : (
            <tr>
              <td colSpan={headers.length} className="border border-gray-300 px-3 py-8 text-center text-gray-500 italic">
                {emptyMessage}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );

  const renderers = {
    'locker-wins-history': () => (
      <WidgetRenderer widgetId="locker-wins-history" scope={scope}>
        <Card title="AM Bookend (Wins)" icon={Trophy} className="border-t-4 border-corporate-orange">
          <SpreadsheetTable 
            headers={['Date', 'Win / Priority', 'Status']}
            data={winsList}
            emptyMessage="No wins recorded yet."
            renderRow={(win, index) => (
              <tr key={index} className="hover:bg-blue-50 transition-colors">
                <td className="border border-gray-300 px-3 py-2 whitespace-nowrap font-mono text-gray-600">
                  {win.date || '-'}
                </td>
                <td className="border border-gray-300 px-3 py-2 font-medium text-gray-900">
                  {win.text || "Untitled Win"}
                </td>
                <td className="border border-gray-300 px-3 py-2 whitespace-nowrap text-center">
                  {win.completed ? (
                    <span className="font-bold text-green-700">WON</span>
                  ) : (
                    <span className="text-gray-400">PENDING</span>
                  )}
                </td>
              </tr>
            )}
          />
        </Card>
      </WidgetRenderer>
    ),
    'locker-scorecard-history': () => (
      <WidgetRenderer widgetId="locker-scorecard-history" scope={scope}>
        <Card title="Scorecard History" icon={Calendar} className="border-t-4 border-corporate-teal">
          <SpreadsheetTable 
            headers={['Date', 'Score', 'Result']}
            data={commitmentHistory}
            emptyMessage="No scorecard history available."
            renderRow={(entry, index) => {
              const isPerfect = entry.score && entry.score.includes('/') && entry.score.split('/')[0] === entry.score.split('/')[1];
              return (
                <tr key={index} className="hover:bg-blue-50 transition-colors">
                  <td className="border border-gray-300 px-3 py-2 whitespace-nowrap font-mono text-gray-600">
                    {entry.date}
                  </td>
                  <td className="border border-gray-300 px-3 py-2 whitespace-nowrap font-mono font-bold text-gray-900 text-center">
                    {entry.score}
                  </td>
                  <td className="border border-gray-300 px-3 py-2 whitespace-nowrap text-center">
                    {isPerfect ? (
                      <span className="font-bold text-green-700">PERFECT</span>
                    ) : (
                      <span className="text-orange-600">INCOMPLETE</span>
                    )}
                  </td>
                </tr>
              );
            }}
          />
        </Card>
      </WidgetRenderer>
    ),
    'locker-latest-reflection': () => (
      <WidgetRenderer widgetId="locker-latest-reflection" scope={scope}>
        <Card title="Reflection History" icon={BookOpen} className="lg:col-span-2 border-t-4 border-corporate-navy">
          <SpreadsheetTable 
            headers={['Date', 'What Went Well', 'What Needs Work', 'Tomorrow\'s Focus']}
            data={reflectionHistory}
            emptyMessage="No reflection history found."
            renderRow={(log, index) => (
              <tr key={log.id || index} className="hover:bg-blue-50 transition-colors align-top">
                <td className="border border-gray-300 px-3 py-2 whitespace-nowrap font-mono text-gray-600">
                  {new Date(log.date).toLocaleDateString(undefined, { month: 'numeric', day: 'numeric', year: '2-digit' })}
                </td>
                <td className="border border-gray-300 px-3 py-2 text-gray-800 min-w-[200px]">
                  {log.reflectionGood || '-'}
                </td>
                <td className="border border-gray-300 px-3 py-2 text-gray-800 min-w-[200px]">
                  {log.reflectionWork || '-'}
                </td>
                <td className="border border-gray-300 px-3 py-2 text-gray-800 min-w-[200px]">
                  {log.reflectionTomorrow || '-'}
                </td>
              </tr>
            )}
          />
        </Card>
      </WidgetRenderer>
    )
  };

  const sortedFeatures = useMemo(() => {
    return LOCKER_FEATURES
      .filter(id => isFeatureEnabled(id))
      .sort((a, b) => {
        const orderA = getFeatureOrder(a);
        const orderB = getFeatureOrder(b);
        if (orderA === orderB) return LOCKER_FEATURES.indexOf(a) - LOCKER_FEATURES.indexOf(b);
        return orderA - orderB;
      });
  }, [isFeatureEnabled, getFeatureOrder]);

  return (
    <PageLayout
      title="The Locker"
      subtitle="Your repository of completed reps, wins, and reflections."
      icon={Archive}
      navigate={navigate}
      backTo="dashboard"
      accentColor="teal"
    >
      <WidgetRenderer widgetId="locker-controller" scope={scope} />
      <WidgetRenderer widgetId="locker-reminders" scope={scope} />
      {sortedFeatures.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {sortedFeatures.map(featureId => (
            <React.Fragment key={featureId}>
              {renderers[featureId] ? renderers[featureId]() : null}
            </React.Fragment>
          ))}
        </div>
      ) : (
        (!isFeatureEnabled('locker-reminders') && !isFeatureEnabled('locker-controller')) && (
          <NoWidgetsEnabled moduleName="Your Locker" />
        )
      )}
    </PageLayout>
  );
};

export default Locker;
