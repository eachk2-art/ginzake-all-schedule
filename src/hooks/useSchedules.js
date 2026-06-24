import { useState, useEffect, useCallback } from 'react';
import * as api from '../lib/api';
import { toDateStr, addDays, today } from '../lib/dateUtils';

export function useSchedules(rangeStart, rangeEnd) {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // 表示範囲より前後1週間余裕を持って取得
      const from = toDateStr(addDays(rangeStart || today(), -7));
      const to   = toDateStr(addDays(rangeEnd   || today(),  7));
      const data = await api.fetchSchedules({ dateFrom: from, dateTo: to });
      setSchedules(data.schedules || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [rangeStart, rangeEnd]);

  useEffect(() => { load(); }, [load]);

  return { schedules, loading, error, reload: load };
}

export function useMasters() {
  const [masters, setMasters] = useState({ producers: [], markets: [] });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    api.fetchMasters()
      .then(data => setMasters(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return { masters, loading };
}

export function useAllSchedules() {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.fetchSchedules();
      setSchedules(data.schedules || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return { schedules, loading, error, reload: load };
}
