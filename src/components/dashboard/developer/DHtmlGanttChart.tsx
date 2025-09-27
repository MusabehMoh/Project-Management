import React, { useEffect, useRef, useState } from 'react';
import { Card, CardBody, CardHeader } from '@heroui/card';
import { Button } from '@heroui/button';
import DHTMLXGantt from '@/components/timeline/GanttChart/dhtmlx/DhtmlxGantt';
import { useLanguage } from '@/contexts/LanguageContext';
import { MemberTask, TaskFiltersData, TaskSearchParams } from '@/types/membersTasks';
import { membersTasksService } from '@/services/api/membersTasksService';
import { API_CONFIG } from '@/services/api/client';

interface DHtmlGanttChartProps { 
  height?: string; 
  showToolbar?: boolean;
  initialMemberFilter?: number[]; // Allow initial member filtering
}

const DHtmlGanttChart: React.FC<DHtmlGanttChartProps> = ({
  height = '600px',
  showToolbar = true,
  initialMemberFilter = []
}) => {
  const { language } = useLanguage();
  
  // State for tasks and filters
  const [tasks, setTasks] = useState<MemberTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filter state
  const [filtersData, setFiltersData] = useState<TaskFiltersData | null>(null);

  // Keep a stable reference of the initial member filter so the effect does not re-run due to new array identity
  const initialFilterRef = useRef<string>(JSON.stringify(initialMemberFilter));

  // Fetch filters data on component mount
  useEffect(() => {
    let cancelled = false;
    const fetchFilters = async () => {
      try {
        const response = await membersTasksService.getFiltersData();
        if (!cancelled) {
          if (response.success && response.data) {
            setFiltersData(response.data);
          } else {
            if (API_CONFIG.ENABLE_LOGS) console.warn('Filters fetch returned unexpected shape:', response);
          }
        }
      } catch (err) {
        if (!cancelled) {
          if (API_CONFIG.ENABLE_LOGS) console.warn('Filters fetch failed (non-blocking):', err);
        }
      }
    };
    fetchFilters();
    return () => { cancelled = true; };
  }, []);

  // Fetch tasks based on current filters
  const fetchTasks = async () => {
    setLoading(true);
    setError(null);
    
    try {
      if (API_CONFIG.ENABLE_LOGS) console.log('Fetching tasks...');
      const searchParams: TaskSearchParams = {
        page: 1,
        limit: 100, // Get all tasks for Gantt view
        memberIds: initialMemberFilter.length > 0 ? initialMemberFilter : undefined,
        sortBy: 'startDate',
        sortOrder: 'asc'
      };
      
      if (API_CONFIG.ENABLE_LOGS) console.log('Search params:', searchParams);
      const response = await membersTasksService.getTasks(searchParams);
      if (API_CONFIG.ENABLE_LOGS) console.log('Tasks response:', response);
      
      if (response.success) {
        setTasks(response.data.tasks);
        if (API_CONFIG.ENABLE_LOGS) console.log('Tasks loaded:', response.data.tasks.length);
      } else {
        setError(response.message || 'Failed to fetch tasks');
      }
    } catch (error) {
      if (API_CONFIG.ENABLE_LOGS) console.error('Error fetching tasks:', error);
      setError('Unable to load tasks');
    } finally {
      setLoading(false);
    }
  };

  // Fetch tasks when component mounts OR when the serialized filter actually changes
  useEffect(() => {
    const serialized = JSON.stringify(initialMemberFilter);
    if (serialized !== initialFilterRef.current) {
      initialFilterRef.current = serialized;
    }
    fetchTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialFilterRef.current]);

  // Retry function
  const handleRetry = () => {
    fetchTasks();
  };

  return (
    <Card className='w-full'>
      <CardHeader className='flex justify-between items-center'>
        <div>
          <h3 className='text-lg font-semibold'>
            {language === 'ar' ? 'الجدول الزمني للمشروع' : 'Project Timeline'}
          </h3>
          <p className='text-sm text-default-600'>
            {language === 'ar' ? 'تتبع تقدم المشروع والتبعيات' : 'Track project progress and dependencies'}
          </p>
        </div>
        {!loading && (
          <div className='flex items-center gap-4'>
            <div className='text-sm text-default-600'>
              {language === 'ar' ? `${tasks.length} مهمة` : `${tasks.length} tasks`}
            </div>
            {showToolbar && (
              <Button
                size='sm'
                variant='flat'
                onPress={handleRetry}
                isLoading={loading}
              >
                {language === 'ar' ? 'تحديث' : 'Refresh'}
              </Button>
            )}
          </div>
        )}
      </CardHeader>
      
  <CardBody className='p-0'>
        {error ? (
          <div className='flex items-center justify-center h-full'>
            <div className='text-center'>
              <div className='text-red-500 text-2xl mb-2'>⚠️</div>
              <p className='text-sm text-red-600 mb-4'>{error}</p>
              <Button size='sm' color='primary' onPress={handleRetry}>
                {language === 'ar' ? 'إعادة المحاولة' : 'Retry'}
              </Button>
            </div>
          </div>
        ) : (
          <DHTMLXGantt
            tasks={tasks}
            loading={loading}
            isFullScreen={false}
            height={height}
            onTaskClick={(task) => {
              console.log('Task clicked:', task);
            }}
          />
        )}
      </CardBody>
    </Card>
  );
};

export default DHtmlGanttChart;
