import React, { useMemo, useState, useEffect } from 'react';
import { useAppServices } from '../../services/useAppServices';
import { Card, PageLayout } from '../ui';
import { Archive, CheckCircle, Calendar, Trophy, BookOpen } from 'lucide-react';
import { useFeatures } from '../../providers/FeatureProvider';
import WidgetRenderer from '../admin/WidgetRenderer';
import { dailyLogService } from '../../services/dailyLogService';

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
    isFeatureEnabled // Added to scope just in case
  };

  const renderers = {
    'locker-wins-history': () => (
      <WidgetRenderer widgetId="locker-wins-history" scope={scope}>
        <Card title="AM Bookend (Wins)" icon={Trophy} className="border-t-4 border-corporate-orange">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Date</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Win / Priority</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {winsList.length > 0 ? (
                  winsList.map((win, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                        {win.date || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {win.text || "Untitled Win"}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {win.completed ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <CheckCircle className="w-3 h-3 mr-1" /> Won
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            Pending
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="3" className="px-4 py-8 text-center text-sm text-gray-500 italic">
                      No wins recorded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </WidgetRenderer>
    ),
    'locker-scorecard-history': () => (
      <WidgetRenderer widgetId="locker-scorecard-history" scope={scope}>
        <Card title="Scorecard History" icon={Calendar} className="border-t-4 border-corporate-teal">
           <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Date</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Score</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Result</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {commitmentHistory.length > 0 ? (
                  commitmentHistory.map((entry, index) => {
                    const isPerfect = entry.score && entry.score.includes('/') && entry.score.split('/')[0] === entry.score.split('/')[1];
                    return (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-mono text-gray-600">
                          {entry.date}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-bold text-gray-900">
                          {entry.score}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {isPerfect ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Perfect
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                              Incomplete
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="3" className="px-4 py-8 text-center text-sm text-gray-500 italic">
                      No scorecard history available.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </WidgetRenderer>
    ),
    'locker-latest-reflection': () => (
      <WidgetRenderer widgetId="locker-latest-reflection" scope={scope}>
        <Card title="Reflection History" icon={BookOpen} className="lg:col-span-2 border-t-4 border-corporate-navy">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider w-32">Date</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">What Went Well</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">What Needs Work</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Tomorrow's Focus</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {reflectionHistory.length > 0 ? (
                  reflectionHistory.map((log, index) => (
                    <tr key={log.id || index} className="hover:bg-gray-50 align-top">
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                        {new Date(log.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 min-w-[200px]">
                        {log.reflectionGood || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 min-w-[200px]">
                        {log.reflectionWork || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 min-w-[200px]">
                        {log.reflectionTomorrow || '-'}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="px-4 py-8 text-center text-sm text-gray-500 italic">
                      No reflection history found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {sortedFeatures.map(featureId => (
          <React.Fragment key={featureId}>
            {renderers[featureId] ? renderers[featureId]() : null}
          </React.Fragment>
        ))}
      </div>
    </PageLayout>
  );
};

export default Locker;
